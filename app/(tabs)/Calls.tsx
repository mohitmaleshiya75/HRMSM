/**
 * Calls.tsx — React Native Audio / Video Calling
 * Requires a custom dev build (expo run:android / expo run:ios)
 * Will NOT work in Expo Go.
 */

// ─────────────────────── WebRTC globals (must run first) ─────────────────────
let mediaDevices: any;
let RTCView: any;
let _PC: any, _SDP: any, _ICE: any, _MS: any;

try {
  const webrtc = require('react-native-webrtc');
  mediaDevices = webrtc.mediaDevices;
  RTCView      = webrtc.RTCView;
  _PC          = webrtc.RTCPeerConnection;
  _SDP         = webrtc.RTCSessionDescription;
  _ICE         = webrtc.RTCIceCandidate;
  _MS          = webrtc.MediaStream;
} catch (e) {
  console.warn('[Calls] react-native-webrtc not available. Run: expo run:android or expo run:ios');
}

// Polyfill for peerjs — MUST happen before 'peerjs' is imported
(function patchWebRTCGlobals() {
  if (typeof global === 'undefined') return;
  const g = global as Record<string, unknown>;
  if (_PC  && !g.RTCPeerConnection)     g.RTCPeerConnection     = _PC;
  if (_SDP && !g.RTCSessionDescription) g.RTCSessionDescription = _SDP;
  if (_ICE && !g.RTCIceCandidate)       g.RTCIceCandidate       = _ICE;
  if (_MS  && !g.MediaStream)           g.MediaStream           = _MS;
})();

// ─────────────────────────────────────────────────────────────────────────────

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  TextInput, Alert, Platform, Dimensions, SafeAreaView,
  ActivityIndicator, Modal, Vibration, StatusBar,
  BackHandler, ScrollView,
  AppState, type AppStateStatus,
} from 'react-native';
import Peer from 'peerjs';
import type { MediaConnection, DataConnection } from 'peerjs';
import InCallManager from 'react-native-incall-manager';
import useCurrentUser from '@/features/auth/hooks/useCurrentUser';
import { useEmployeeHierarchy, type Employee } from '@/services/call';

// ─── Config ───────────────────────────────────────────────────────────────────
const PEER_HOST = process.env.EXPO_PUBLIC_PEER_HOST ?? '0.peerjs.com';
const PEER_PORT = Number(process.env.EXPO_PUBLIC_PEER_PORT ?? 443);
const PEER_PATH = process.env.EXPO_PUBLIC_PEER_PATH ?? '/';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:global.stun.twilio.com:3478' },
];

const { width: SW, height: SH } = Dimensions.get('window');

const COLORS = [
  '#3b5bdb','#7048e8','#d6336c','#0c8599',
  '#2f9e44','#e67700','#c92a2a','#862e9c',
];

// ─── Types ────────────────────────────────────────────────────────────────────
type CallMode   = 'audio' | 'video';
type AppView    = 'home' | 'employees' | 'call';
type NetQuality = 'good' | 'fair' | 'poor' | 'unknown';

interface GroupPeerInfo { peerId: string; userId: number; name: string; }

interface Participant {
  id: string;
  userId: number;
  name: string;
  connection: MediaConnection;
  dataConnection?: DataConnection;
  stream: any | null;
  muted: boolean;
  videoOff: boolean;
  netQuality: NetQuality;
  isScreenSharing: boolean;
}

type MetadataMessage =
  | { type: 'mute';         value: boolean }
  | { type: 'videoOff';     value: boolean }
  | { type: 'screenShare';  value: boolean }
  | { type: 'newPeer';      peer: GroupPeerInfo; existingPeers: GroupPeerInfo[] }
  | { type: 'peerLeft';     peerId: string }
  | { type: 'hostTransfer'; newHostPeerId: string }
  | { type: 'kick';         peerId: string }
  | { type: 'decline' };

interface CallMetadata {
  mode?: CallMode;
  fromName?: string;
  fromUserId?: number;
  isGroup?: boolean;
  existingPeers?: GroupPeerInfo[];
  initiatorPeerId?: string;
}

interface IncomingCallInfo {
  name: string;
  userId: number;
  mode: CallMode;
  conn: MediaConnection;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (name: string) =>
  name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

const avatarColor = (name: string) => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
};

const fmt = (s: number) =>
  `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

// ─── Vibration ring ───────────────────────────────────────────────────────────
const ringVibration = {
  start: () => Vibration.vibrate([0, 700, 500, 700, 500, 700], true),
  stop:  () => Vibration.cancel(),
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  return (
    <View style={[s.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: avatarColor(name) }]}>
      <Text style={[s.avatarTxt, { fontSize: size * 0.36 }]}>{getInitials(name)}</Text>
    </View>
  );
}

// ─── NetBadge ─────────────────────────────────────────────────────────────────
function NetBadge({ quality }: { quality: NetQuality }) {
  const bars  = quality === 'good' ? 3 : quality === 'fair' ? 2 : quality === 'poor' ? 1 : 0;
  const color = quality === 'good' ? '#3ba55d' : quality === 'fair' ? '#e67700' : '#ed4245';
  return (
    <View style={{ flexDirection: 'row', gap: 2, alignItems: 'flex-end', height: 14 }}>
      {[1, 2, 3].map(n => (
        <View key={n} style={{
          width: 3, height: n * 4 + 2, borderRadius: 2,
          backgroundColor: n <= bars ? color : 'rgba(255,255,255,0.18)',
        }} />
      ))}
    </View>
  );
}

// ─── CtrlBtn ──────────────────────────────────────────────────────────────────
function CtrlBtn({
  label, icon, onPress, active = false, danger = false, large = false, disabled = false,
}: {
  label: string; icon: string; onPress: () => void;
  active?: boolean; danger?: boolean; large?: boolean; disabled?: boolean;
}) {
  const bg = danger ? '#ed4245' : active ? 'rgba(88,101,242,0.28)' : 'rgba(255,255,255,0.1)';
  const sz = large ? 58 : 46;
  return (
    <TouchableOpacity style={s.ctrlWrap} onPress={onPress} disabled={disabled} activeOpacity={0.75}>
      <View style={[s.ctrlBtn, { width: sz, height: sz, borderRadius: sz / 2, backgroundColor: bg, opacity: disabled ? 0.4 : 1 }]}>
        <Text style={[s.ctrlIcon, danger && { color: '#fff' }, active && { color: '#818cf8' }]}>{icon}</Text>
      </View>
      <Text style={s.ctrlLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Unavailable screen (shown when WebRTC not loaded) ────────────────────────
function UnavailableScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#080810', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>📵</Text>
      <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 8, textAlign: 'center' }}>
        Dev Build Required
      </Text>
      <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 22 }}>
        Calls require native WebRTC modules which are not available in Expo Go.{'\n\n'}
        Run:{'\n'}
        <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', color: '#818cf8' }}>
          expo run:android{'\n'}expo run:ios
        </Text>
      </Text>
    </SafeAreaView>
  );
}

// ─── Incoming call modal ──────────────────────────────────────────────────────
function IncomingCallModal({ incoming, onAccept, onDecline }: {
  incoming: IncomingCallInfo;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <Modal transparent animationType="fade" visible statusBarTranslucent>
      <View style={s.incomingBg}>
        <View style={s.incomingCard}>
          <Text style={s.incomingLabel}>
            {incoming.mode === 'video' ? '📹 Incoming Video Call' : '🎙️ Incoming Voice Call'}
          </Text>
          <Avatar name={incoming.name} size={80} />
          <Text style={s.incomingName}>{incoming.name}</Text>
          <Text style={s.incomingHint}>Press Accept or Decline</Text>
          <View style={s.incomingActions}>
            <TouchableOpacity style={[s.incomingBtn, s.declineBtn]} onPress={onDecline} activeOpacity={0.8}>
              <Text style={s.incomingBtnText}>📵  Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.incomingBtn, s.acceptBtn]} onPress={onAccept} activeOpacity={0.8}>
              <Text style={s.incomingBtnText}>📞  Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Video tile ───────────────────────────────────────────────────────────────
function VideoTile({
  stream, name, isLocal, videoOff, muted, netQuality,
  isSpotlit, isSharing, onPress, onRemove, amInitiator, frontCamera,
  tileWidth, tileHeight,
}: {
  stream: any | null; name: string; isLocal: boolean; videoOff: boolean;
  muted: boolean; netQuality: NetQuality; isSpotlit: boolean; isSharing?: boolean;
  onPress: () => void; onRemove?: () => void; amInitiator: boolean; frontCamera: boolean;
  tileWidth: number; tileHeight: number;
}) {
  const showVideo = stream && !videoOff && RTCView;
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[s.videoTile, { width: tileWidth, height: tileHeight },
        isSpotlit && s.videoTileSpotlit]}
    >
      {showVideo ? (
        <RTCView
          streamURL={stream.toURL()}
          style={StyleSheet.absoluteFillObject}
          objectFit={isSharing ? 'contain' : 'cover'}
          zOrder={isLocal ? 0 : 1}
          mirror={isLocal && frontCamera}
        />
      ) : (
        <View style={s.camOffFill}>
          <Avatar name={name} size={52} />
          <Text style={s.camOffText}>{!stream ? 'Connecting…' : 'Camera off'}</Text>
        </View>
      )}

      <View style={s.tileBadges}>
        <NetBadge quality={netQuality} />
        {isSpotlit && <View style={s.pinBadge}><Text style={s.pinBadgeTxt}>PIN</Text></View>}
        {isSharing && <View style={[s.pinBadge, { backgroundColor: '#5865f2' }]}><Text style={s.pinBadgeTxt}>SCREEN</Text></View>}
      </View>

      {!isLocal && amInitiator && onRemove && (
        <TouchableOpacity style={s.tileRemoveBtn} onPress={onRemove}>
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>✕</Text>
        </TouchableOpacity>
      )}

      <View style={s.tileOverlay}>
        <Text style={s.tileName} numberOfLines={1}>{isLocal ? 'You' : name}</Text>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {muted    && <View style={s.tileIconRed}><Text style={{ fontSize: 9, color: '#fff' }}>🔇</Text></View>}
          {videoOff && <View style={s.tileIconRed}><Text style={{ fontSize: 9, color: '#fff' }}>📷</Text></View>}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Audio participant circle ─────────────────────────────────────────────────
function AudioCircle({
  name, muted, active, onRemove, amInitiator,
}: {
  name: string; muted: boolean; active: boolean; onRemove?: () => void; amInitiator: boolean;
}) {
  return (
    <View style={s.audioCircle}>
      <View style={[s.audioRing, active && s.audioRingActive]}>
        <Avatar name={name} size={72} />
      </View>
      <Text style={s.audioName} numberOfLines={1}>{name}</Text>
      {muted && <Text style={{ fontSize: 10, color: '#ed4245' }}>🔇</Text>}
      {amInitiator && onRemove && (
        <TouchableOpacity style={s.audioRemove} onPress={onRemove}>
          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Main Calls Component
// ─────────────────────────────────────────────────────────────────────────────
export default function Calls() {
  // Guard — show friendly screen if native modules missing
  if (!RTCView || !mediaDevices) {
    return <UnavailableScreen />;
  }

  return <CallsInner />;
}

// ─── Inner component (only renders when WebRTC is available) ──────────────────
function CallsInner() {
  const { data: currentUser } = useCurrentUser();
  const { employees: allEmployees, isLoading: empLoading } = useEmployeeHierarchy();

  const myName = useMemo(() => {
    const u = currentUser as Record<string, unknown> | undefined;
    return (u?.full_name ?? u?.name ??
      `${u?.first_name ?? ''} ${u?.last_name ?? ''}`.trim() ?? 'Me') as string;
  }, [currentUser]);

  const myId     = String((currentUser as Record<string, unknown> | undefined)?.id ?? '');
  const myPeerId = `u-${myId}`;

  const callPeople = useMemo(
    () => allEmployees.filter(e => String(e.id) !== myId),
    [allEmployees, myId],
  );

  const [view,     setView]    = useState<AppView>('home');
  const [callMode, setCallMode] = useState<CallMode>('audio');

  const [peer,      setPeer]      = useState<Peer | null>(null);
  const [peerReady, setPeerReady] = useState(false);
  const peerRef = useRef<Peer | null>(null);

  const [search,    setSearch]    = useState('');
  const [addSearch, setAddSearch] = useState('');

  const [groupMode,   setGroupMode]   = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const [inCall,          setInCall]          = useState(false);
  const [participants,    setParticipants]    = useState<Participant[]>([]);
  const [localStream,     setLocalStream]     = useState<any | null>(null);
  const [micMuted,        setMicMuted]        = useState(false);
  const [cameraOff,       setCameraOff]       = useState(false);
  const [speakerOn,       setSpeakerOn]       = useState(false);
  const [frontCamera,     setFrontCamera]     = useState(true);
  const [noiseSup,        setNoiseSup]        = useState(true);
  const [callDuration,    setCallDuration]    = useState(0);
  const [status,          setStatus]          = useState('Ready');
  const [initiatorPeerId, setInitiatorPeerId] = useState<string | null>(null);
  const [spotlightId,     setSpotlightId]     = useState<string | null>(null);
  const [incoming,        setIncoming]        = useState<IncomingCallInfo | null>(null);
  const [addPanelOpen,    setAddPanelOpen]    = useState(false);

  const localStreamRef     = useRef<any | null>(null);
  const participantsRef    = useRef<Map<string, Participant>>(new Map());
  const activeConnsRef     = useRef<Map<string, MediaConnection>>(new Map());
  const streamReceivedRef  = useRef<Set<string>>(new Set());
  const timerRef           = useRef<ReturnType<typeof setInterval> | null>(null);
  const micMutedRef        = useRef(false);
  const cameraOffRef       = useRef(false);
  const callModeRef        = useRef<CallMode>('audio');
  const inCallRef          = useRef(false);
  const initiatorPeerIdRef = useRef<string | null>(null);
  const resetCallStateRef  = useRef<() => void>(() => {});
  const setupMediaConnRef = useRef<(c: MediaConnection, pid: string, uid: number, name: string, out: boolean) => void>(() => {});

  useEffect(() => { micMutedRef.current       = micMuted;       }, [micMuted]);
  useEffect(() => { cameraOffRef.current      = cameraOff;      }, [cameraOff]);
  useEffect(() => { callModeRef.current       = callMode;       }, [callMode]);
  useEffect(() => { inCallRef.current         = inCall;         }, [inCall]);
  useEffect(() => { initiatorPeerIdRef.current = initiatorPeerId; }, [initiatorPeerId]);

  const amInitiator = initiatorPeerId === myPeerId;

  // ── Peer init ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!myId || myId === 'undefined' || peerRef.current) return;
    const p = new Peer(myPeerId, {
      host: PEER_HOST, port: PEER_PORT, path: PEER_PATH,
      secure: PEER_PORT === 443,
      config: { iceServers: ICE_SERVERS },
    });
    p.on('open',        () => { setPeerReady(true); });
    p.on('disconnected', () => { setPeerReady(false); try { p.reconnect(); } catch {} });
    p.on('error',   (err: Error) => { console.warn('[Peer]', err.message); setPeerReady(false); });
    p.on('close',       () => { setPeerReady(false); });
    peerRef.current = p;
    setPeer(p);
    return () => { try { p.destroy(); } catch {} peerRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myId]);

  // ── Timer ─────────────────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    setCallDuration(0);
    timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setCallDuration(0);
  }, []);

  // ── Get local media ───────────────────────────────────────────────────────
  const getMedia = useCallback(async (mode: CallMode): Promise<any> => {
    const constraints: Record<string, unknown> = {
      audio: { echoCancellation: true, noiseSuppression: noiseSup, autoGainControl: true },
      video: mode === 'video'
        ? { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 }, facingMode: 'user' }
        : false,
    };
    const stream = await mediaDevices.getUserMedia(constraints)
      .catch(() => mediaDevices.getUserMedia({ audio: true, video: mode === 'video' }));
    localStreamRef.current = stream;
    setLocalStream(stream);
    stream.getAudioTracks().forEach((t: any) => { t.enabled = !micMutedRef.current; });
    if (mode === 'video') stream.getVideoTracks().forEach((t: any) => { t.enabled = !cameraOffRef.current; });
    return stream;
  }, [noiseSup]);

  // ── Broadcast ─────────────────────────────────────────────────────────────
  const broadcastToAll = useCallback((msg: MetadataMessage) => {
    participantsRef.current.forEach(p => {
      if (p.dataConnection?.open) { try { p.dataConnection.send(msg); } catch {} }
    });
  }, []);

  useEffect(() => { if (inCall) broadcastToAll({ type: 'mute', value: micMuted }); }, [micMuted, inCall, broadcastToAll]);
  useEffect(() => { if (inCall && callMode === 'video') broadcastToAll({ type: 'videoOff', value: cameraOff }); }, [cameraOff, inCall, callMode, broadcastToAll]);

  // ── Cleanup participant ───────────────────────────────────────────────────
  const cleanupParticipant = useCallback((pid: string, wasDeclined: boolean) => {
    activeConnsRef.current.delete(pid);
    participantsRef.current.delete(pid);
    streamReceivedRef.current.delete(pid);
    setParticipants(Array.from(participantsRef.current.values()));
    setSpotlightId(prev => prev === pid ? null : prev);

    if (participantsRef.current.size === 0) {
      resetCallStateRef.current();
      setStatus(wasDeclined ? 'Call declined' : 'Call ended');
    } else if (initiatorPeerIdRef.current === pid) {
      const remaining = Array.from(participantsRef.current.values());
      const newHost   = remaining[0];
      if (newHost) {
        setInitiatorPeerId(newHost.id);
        initiatorPeerIdRef.current = newHost.id;
        if (newHost.id === myPeerId) broadcastToAll({ type: 'hostTransfer', newHostPeerId: myPeerId });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myPeerId, broadcastToAll]);

  // ── Setup data connection ─────────────────────────────────────────────────
  const setupDataConnection = useCallback((dataConn: DataConnection, pid: string) => {
    dataConn.on('open', () => {
      if (!dataConn.open) return;
      try {
        dataConn.send({ type: 'mute',     value: micMutedRef.current  } as MetadataMessage);
        dataConn.send({ type: 'videoOff', value: cameraOffRef.current } as MetadataMessage);
      } catch {}
    });

    dataConn.on('data', (data: unknown) => {
      const msg = data as MetadataMessage;

      if (msg.type === 'decline') {
        ringVibration.stop();
        const wasDeclined = !streamReceivedRef.current.has(pid);
        if (wasDeclined) setStatus('Call declined');
        cleanupParticipant(pid, wasDeclined);
        return;
      }
      if (msg.type === 'peerLeft') {
        if (participantsRef.current.has(msg.peerId)) cleanupParticipant(msg.peerId, false);
        return;
      }
      if (msg.type === 'hostTransfer') {
        setInitiatorPeerId(msg.newHostPeerId);
        initiatorPeerIdRef.current = msg.newHostPeerId;
        return;
      }
      if (msg.type === 'kick') {
        const { peerId: kickedPid } = msg;
        if (kickedPid === myPeerId) {
          resetCallStateRef.current();
          setStatus('You were removed from the call');
        } else if (participantsRef.current.has(kickedPid)) {
          const kicked = participantsRef.current.get(kickedPid);
          if (kicked) {
            try { kicked.connection.close(); } catch {}
            try { kicked.dataConnection?.close(); } catch {}
          }
          cleanupParticipant(kickedPid, false);
        }
        return;
      }
      if (msg.type === 'mute' || msg.type === 'videoOff' || msg.type === 'screenShare') {
        setParticipants(prev => prev.map(p => {
          if (p.id !== pid) return p;
          if (msg.type === 'mute')        return { ...p, muted: msg.value };
          if (msg.type === 'videoOff')    return { ...p, videoOff: msg.value };
          if (msg.type === 'screenShare') {
            if (msg.value) setSpotlightId(pid);
            else setSpotlightId(prev => prev === pid ? null : prev);
            return { ...p, isScreenSharing: msg.value };
          }
          return p;
        }));
      }
      if (msg.type === 'newPeer') {
        const { peer: np } = msg;
        const p = peerRef.current;
        if (np.peerId !== myPeerId && !activeConnsRef.current.has(np.peerId) && p && localStreamRef.current) {
          const conn = p.call(np.peerId, localStreamRef.current, {
            metadata: {
              mode: callModeRef.current, fromName: myName, fromUserId: Number(myId),
              isGroup: true, existingPeers: [], initiatorPeerId: initiatorPeerIdRef.current ?? myPeerId,
            } as CallMetadata,
          });
          setupMediaConnRef.current(conn, np.peerId, np.userId, np.name, true);
        }
      }
    });

    dataConn.on('close', () => {
      setParticipants(prev => prev.map(p => p.id === pid ? { ...p, dataConnection: undefined } : p));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myPeerId, myName, myId, cleanupParticipant]);

  // ── Reset call state ──────────────────────────────────────────────────────
  const resetCallState = useCallback(() => {
    ringVibration.stop();
    setInCall(false);
    localStreamRef.current?.getTracks().forEach((t: any) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    stopTimer();
    activeConnsRef.current.forEach(c => { try { c.close(); } catch {} });
    activeConnsRef.current.clear();
    participantsRef.current.forEach(p => { try { p.dataConnection?.close(); } catch {} });
    participantsRef.current.clear();
    streamReceivedRef.current.clear();
    setParticipants([]);
    setMicMuted(false);
    setCameraOff(false);
    setSpeakerOn(false);
    setSpotlightId(null);
    setStatus('Ready');
    setIncoming(null);
    setInitiatorPeerId(null);
    setAddSearch('');
    setAddPanelOpen(false);
    try { InCallManager.stop(); InCallManager.setKeepScreenOn(false); } catch {}
  }, [stopTimer]);

  useEffect(() => { resetCallStateRef.current = resetCallState; }, [resetCallState]);

  // ── Setup MediaConnection ─────────────────────────────────────────────────
  const setupMediaConnection = useCallback((
    conn: MediaConnection, pid: string, userId: number, name: string, isOutgoing: boolean,
  ) => {
    if (activeConnsRef.current.has(pid)) return;
    activeConnsRef.current.set(pid, conn);

    const participant: Participant = {
      id: pid, userId, name, connection: conn,
      stream: null, muted: false, videoOff: false, netQuality: 'unknown', isScreenSharing: false,
    };
    participantsRef.current.set(pid, participant);
    setParticipants(Array.from(participantsRef.current.values()));

    if (peerRef.current && isOutgoing) {
      const dataConn = peerRef.current.connect(pid, { reliable: true });
      participant.dataConnection = dataConn;
      participantsRef.current.set(pid, participant);
      setParticipants(Array.from(participantsRef.current.values()));
      setupDataConnection(dataConn, pid);
    }

    conn.on('stream', (remoteStream: any) => {
      streamReceivedRef.current.add(pid);
      const p = participantsRef.current.get(pid);
      if (p) {
        p.stream = remoteStream;
        participantsRef.current.set(pid, p);
        setParticipants(Array.from(participantsRef.current.values()));
      }
      setStatus('Connected');
      if (!timerRef.current) startTimer();
    });

    conn.on('close', () => {
      const wasDeclined = !streamReceivedRef.current.has(pid);
      if (wasDeclined && isOutgoing) setStatus('Call declined');
      cleanupParticipant(pid, wasDeclined && isOutgoing);
    });

    conn.on('error', (err: Error) => {
      console.warn('[MediaConn]', pid, err.message);
      cleanupParticipant(pid, false);
    });
  }, [setupDataConnection, cleanupParticipant, startTimer]);

  useEffect(() => { setupMediaConnRef.current = setupMediaConnection; }, [setupMediaConnection]);

  // ── Network quality polling ───────────────────────────────────────────────
  useEffect(() => {
    if (!inCall) return;
    const poll = setInterval(async () => {
      for (const [pid, conn] of activeConnsRef.current) {
        try {
          const stats = await conn.peerConnection.getStats();
          let rtt = -1;
          (stats as Map<string, any>).forEach((r: any) => {
            if (r.type === 'candidate-pair' && r.state === 'succeeded' && r.currentRoundTripTime != null)
              rtt = r.currentRoundTripTime * 1000;
          });
          const q: NetQuality = rtt < 0 ? 'unknown' : rtt < 150 ? 'good' : rtt < 400 ? 'fair' : 'poor';
          setParticipants(prev => prev.map(p => p.id === pid ? { ...p, netQuality: q } : p));
        } catch {}
      }
    }, 5000);
    return () => clearInterval(poll);
  }, [inCall]);

  // ── Incoming DATA connection listener ─────────────────────────────────────
  useEffect(() => {
    if (!peer) return;
    const onDataConn = (dataConn: DataConnection) => {
      const existing = participantsRef.current.get(dataConn.peer);
      if (existing && !existing.dataConnection) {
        existing.dataConnection = dataConn;
        participantsRef.current.set(existing.id, existing);
        setParticipants(Array.from(participantsRef.current.values()));
        setupDataConnection(dataConn, existing.id);
        return;
      }
      dataConn.on('data', (data: unknown) => {
        const msg = data as MetadataMessage;
        if (msg.type === 'decline') {
          const pid = dataConn.peer;
          const wasDeclined = !streamReceivedRef.current.has(pid);
          if (wasDeclined) setStatus('Call declined');
          cleanupParticipant(pid, wasDeclined);
          return;
        }
        if (msg.type === 'peerLeft') {
          if (participantsRef.current.has(msg.peerId)) cleanupParticipant(msg.peerId, false);
          return;
        }
        if (msg.type === 'hostTransfer') {
          setInitiatorPeerId(msg.newHostPeerId);
          initiatorPeerIdRef.current = msg.newHostPeerId;
          return;
        }
        if (msg.type === 'kick') {
          const { peerId: kickedPid } = msg;
          if (kickedPid === myPeerId) {
            resetCallStateRef.current();
            setStatus('You were removed from the call');
          } else if (participantsRef.current.has(kickedPid)) {
            const kicked = participantsRef.current.get(kickedPid);
            if (kicked) {
              try { kicked.connection.close(); } catch {}
              try { kicked.dataConnection?.close(); } catch {}
            }
            cleanupParticipant(kickedPid, false);
          }
          return;
        }
        if (msg.type === 'newPeer') {
          const { peer: np } = msg;
          if (np.peerId !== myPeerId && !activeConnsRef.current.has(np.peerId) && peerRef.current && localStreamRef.current) {
            const conn = peerRef.current.call(np.peerId, localStreamRef.current, {
              metadata: {
                mode: callModeRef.current, fromName: myName, fromUserId: Number(myId),
                isGroup: true, existingPeers: [], initiatorPeerId: initiatorPeerIdRef.current ?? myPeerId,
              } as CallMetadata,
            });
            setupMediaConnRef.current(conn, np.peerId, np.userId, np.name, true);
          }
        }
      });
    };
    peer.on('connection', onDataConn);
    return () => { peer.off('connection', onDataConn); };
  }, [peer, setupDataConnection, myPeerId, myName, myId, cleanupParticipant]);

  // ── Incoming MEDIA call listener ──────────────────────────────────────────
  useEffect(() => {
    if (!peer) return;
    const onCall = (call: MediaConnection) => {
      const meta           = (call.metadata ?? {}) as CallMetadata;
      const mode: CallMode = meta.mode === 'video' ? 'video' : 'audio';
      const name           = meta.fromName || call.peer;
      const userId         = meta.fromUserId ?? 0;
      const callInitiator  = meta.initiatorPeerId ?? call.peer;

      if (localStreamRef.current && meta.isGroup) {
        if (!initiatorPeerIdRef.current) {
          setInitiatorPeerId(callInitiator);
          initiatorPeerIdRef.current = callInitiator;
        }
        call.answer(localStreamRef.current);
        setupMediaConnRef.current(call, call.peer, userId, name, false);
        if (meta.existingPeers && peerRef.current) {
          meta.existingPeers.forEach(({ peerId: ep, userId: eu, name: en }) => {
            if (ep !== myPeerId && !activeConnsRef.current.has(ep)) {
              const nc = peerRef.current!.call(ep, localStreamRef.current!, {
                metadata: {
                  mode: callModeRef.current, fromName: myName, fromUserId: Number(myId),
                  isGroup: true, existingPeers: [], initiatorPeerId: callInitiator,
                } as CallMetadata,
              });
              setupMediaConnRef.current(nc, ep, eu, en, true);
            }
          });
        }
        return;
      }

      setIncoming({ name, userId, mode, conn: call });
      ringVibration.start();
      call.on('close', () => { setIncoming(prev => prev?.conn === call ? null : prev); ringVibration.stop(); });
      call.on('error', () => { setIncoming(prev => prev?.conn === call ? null : prev); ringVibration.stop(); });
    };
    peer.on('call', onCall);
    return () => { peer.off('call', onCall); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peer, myPeerId, myName, myId]);

  // ── Accept / Decline ──────────────────────────────────────────────────────
  const acceptIncoming = useCallback(async () => {
    if (!incoming) return;
    ringVibration.stop();
    const { conn, mode, name, userId } = incoming;
    const meta          = (conn.metadata ?? {}) as CallMetadata;
    const callInitiator = meta.initiatorPeerId ?? conn.peer;
    try {
      const stream = localStreamRef.current ?? await getMedia(mode);
      conn.answer(stream);
      if (!inCallRef.current) {
        setInCall(true); setCallMode(mode);
        setInitiatorPeerId(callInitiator); initiatorPeerIdRef.current = callInitiator;
        setView('call');
        try { InCallManager.start({ media: mode }); InCallManager.setKeepScreenOn(true); } catch {}
      }
      setupMediaConnRef.current(conn, conn.peer, userId, name, false);
      if (meta.existingPeers && peerRef.current) {
        meta.existingPeers.forEach(({ peerId: ep, userId: eu, name: en }) => {
          if (ep !== myPeerId && !activeConnsRef.current.has(ep)) {
            const nc = peerRef.current!.call(ep, stream, {
              metadata: {
                mode, fromName: myName, fromUserId: Number(myId),
                isGroup: true, existingPeers: [], initiatorPeerId: callInitiator,
              } as CallMetadata,
            });
            setupMediaConnRef.current(nc, ep, eu, en, true);
          }
        });
      }
    } catch {
      setStatus('Permission denied');
      resetCallState();
    }
    setIncoming(null);
  }, [incoming, getMedia, myPeerId, myName, myId, resetCallState]);

  const declineIncoming = useCallback(() => {
    ringVibration.stop();
    if (!incoming) return;
    const activePeer = peerRef.current;
    if (activePeer) {
      try {
        const dc = activePeer.connect(incoming.conn.peer, { reliable: true });
        dc.on('open', () => {
          try { dc.send({ type: 'decline' }); } catch {}
          setTimeout(() => { try { dc.close(); } catch {} }, 2000);
        });
        dc.on('error', () => {});
      } catch {}
    }
    try { incoming.conn.close(); } catch {}
    setIncoming(null);
  }, [incoming]);

  // ── Controls ──────────────────────────────────────────────────────────────
  const toggleMic = useCallback(() => {
    const next = !micMuted;
    setMicMuted(next);
    localStreamRef.current?.getAudioTracks().forEach((t: any) => { t.enabled = !next; });
  }, [micMuted]);

  const toggleCamera = useCallback(() => {
    const next = !cameraOff;
    setCameraOff(next);
    localStreamRef.current?.getVideoTracks().forEach((t: any) => { t.enabled = !next; });
    broadcastToAll({ type: 'videoOff', value: next });
  }, [cameraOff, broadcastToAll]);

  const flipCamera = useCallback(() => {
    const vt = localStreamRef.current?.getVideoTracks()[0];
    if (vt) { (vt as any)._switchCamera?.(); setFrontCamera(f => !f); }
  }, []);

  const toggleSpeaker = useCallback(() => {
    const next = !speakerOn;
    setSpeakerOn(next);
    try { InCallManager.setSpeakerphoneOn(next); } catch {}
  }, [speakerOn]);

  const toggleNoiseSup = useCallback(async () => {
    const next = !noiseSup;
    setNoiseSup(next);
    if (!inCall || !localStreamRef.current) return;
    try {
      const ns = await mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: next, autoGainControl: true },
      });
      const [nt] = ns.getAudioTracks();
      localStreamRef.current.getAudioTracks().forEach((t: any) => {
        t.stop(); localStreamRef.current!.removeTrack(t);
      });
      localStreamRef.current.addTrack(nt);
      nt.enabled = !micMutedRef.current;
      activeConnsRef.current.forEach(conn => {
        try {
          const sender = conn.peerConnection.getSenders().find((s: any) => s.track?.kind === 'audio');
          if (sender) sender.replaceTrack(nt);
        } catch {}
      });
    } catch {}
  }, [noiseSup, inCall]);

  const endCall = useCallback(() => {
    broadcastToAll({ type: 'peerLeft', peerId: myPeerId });
    activeConnsRef.current.forEach((conn, pid) => {
      if (!streamReceivedRef.current.has(pid) && peerRef.current) {
        try {
          const dc = peerRef.current.connect(pid, { reliable: true });
          dc.on('open', () => {
            try { dc.send({ type: 'decline' }); } catch {}
            setTimeout(() => { try { dc.close(); } catch {} }, 2000);
          });
          dc.on('error', () => {});
        } catch {}
      }
    });
    resetCallState();
    setStatus('Call ended');
    setView('home');
  }, [broadcastToAll, myPeerId, resetCallState]);

  const removeParticipant = useCallback((pid: string) => {
    broadcastToAll({ type: 'kick', peerId: pid });
    const p = participantsRef.current.get(pid);
    if (p?.dataConnection?.open) {
      try { p.dataConnection.send({ type: 'kick', peerId: pid } as MetadataMessage); } catch {}
    }
    if (p) {
      try { p.connection.close(); } catch {}
      try { p.dataConnection?.close(); } catch {}
    }
    activeConnsRef.current.delete(pid);
    participantsRef.current.delete(pid);
    streamReceivedRef.current.delete(pid);
    setParticipants(Array.from(participantsRef.current.values()));
    setSpotlightId(prev => prev === pid ? null : prev);
  }, [broadcastToAll]);

  const callEmployee = useCallback(async (emp: Employee) => {
    if (!peerRef.current || !peerReady) {
      Alert.alert('Not connected', 'Peer service not ready. Please try again.');
      return;
    }
    const targetPeerId = `u-${emp.id}`;
    if (targetPeerId === myPeerId) { setStatus("Can't call yourself"); return; }
    try {
      setStatus(`Calling ${emp.full_name}…`);
      ringVibration.start();
      const stream = await getMedia(callMode);
      setInitiatorPeerId(myPeerId); initiatorPeerIdRef.current = myPeerId;
      const conn = peerRef.current.call(targetPeerId, stream, {
        metadata: {
          mode: callMode, fromName: myName, fromUserId: Number(myId), initiatorPeerId: myPeerId,
        } as CallMetadata,
      });
      setInCall(true); setView('call');
      try { InCallManager.start({ media: callMode }); InCallManager.setKeepScreenOn(true); } catch {}
      setupMediaConnection(conn, targetPeerId, emp.id, emp.full_name, true);
    } catch {
      ringVibration.stop();
      setStatus('Permission denied — allow mic/camera and retry');
      resetCallState();
    }
  }, [peerReady, callMode, myPeerId, myName, myId, getMedia, setupMediaConnection, resetCallState]);

  const startGroupCall = useCallback(async () => {
    if (!peerRef.current || !peerReady || selectedIds.size === 0) return;
    try {
      setStatus('Starting group call…');
      ringVibration.start();
      const stream  = await getMedia(callMode);
      const targets = callPeople.filter(e => selectedIds.has(e.id));
      setInitiatorPeerId(myPeerId); initiatorPeerIdRef.current = myPeerId;
      setInCall(true); setView('call'); setGroupMode(false); setSelectedIds(new Set());
      try { InCallManager.start({ media: callMode }); InCallManager.setKeepScreenOn(true); } catch {}
      for (const emp of targets) {
        const tpid = `u-${emp.id}`;
        const existingPeers: GroupPeerInfo[] = [
          { peerId: myPeerId, userId: Number(myId), name: myName },
          ...targets.filter(t => t.id !== emp.id).map(t => ({ peerId: `u-${t.id}`, userId: t.id, name: t.full_name })),
        ];
        const conn = peerRef.current!.call(tpid, stream, {
          metadata: {
            mode: callMode, fromName: myName, fromUserId: Number(myId),
            isGroup: true, existingPeers, initiatorPeerId: myPeerId,
          } as CallMetadata,
        });
        setupMediaConnection(conn, tpid, emp.id, emp.full_name, true);
      }
    } catch {
      ringVibration.stop(); setStatus('Permission denied'); resetCallState();
    }
  }, [peerReady, selectedIds, callMode, callPeople, myPeerId, myId, myName, getMedia, setupMediaConnection, resetCallState]);

  const addToCall = useCallback(async (emp: Employee) => {
    if (!peerRef.current || !localStreamRef.current) return;
    const tpid = `u-${emp.id}`;
    if (activeConnsRef.current.has(tpid)) return;
    const existingPeers: GroupPeerInfo[] = [
      { peerId: myPeerId, userId: Number(myId), name: myName },
      ...Array.from(participantsRef.current.values()).map(p => ({ peerId: p.id, userId: p.userId, name: p.name })),
    ];
    const conn = peerRef.current.call(tpid, localStreamRef.current, {
      metadata: {
        mode: callMode, fromName: myName, fromUserId: Number(myId),
        isGroup: true, existingPeers, initiatorPeerId: initiatorPeerIdRef.current ?? myPeerId,
      } as CallMetadata,
    });
    setupMediaConnection(conn, tpid, emp.id, emp.full_name, true);
    broadcastToAll({ type: 'newPeer', peer: { peerId: tpid, userId: emp.id, name: emp.full_name }, existingPeers });
  }, [callMode, myPeerId, myId, myName, setupMediaConnection, broadcastToAll]);

  // ── Android back handler ──────────────────────────────────────────────────
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (view === 'call') {
        Alert.alert('Leave call?', 'Do you want to end the call?', [
          { text: 'Stay', style: 'cancel' },
          { text: 'Leave', style: 'destructive', onPress: endCall },
        ]);
        return true;
      }
      if (view !== 'home') { setView('home'); return true; }
      return false;
    });
    return () => sub.remove();
  }, [view, endCall]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'background' && incoming) declineIncoming();
    });
    return () => sub.remove();
  }, [incoming, declineIncoming]);

  // ── Filtered lists ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return callPeople;
    return callPeople.filter(e =>
      e.full_name?.toLowerCase().includes(q) ||
      e.position?.toLowerCase().includes(q) ||
      e.department_name?.toLowerCase().includes(q),
    );
  }, [callPeople, search]);

  const filteredForAdd = useMemo(() => {
    const q = addSearch.toLowerCase().trim();
    if (!q) return callPeople;
    return callPeople.filter(e =>
      e.full_name?.toLowerCase().includes(q) ||
      e.position?.toLowerCase().includes(q) ||
      e.department_name?.toLowerCase().includes(q),
    );
  }, [callPeople, addSearch]);

  const activeConnPids = useMemo(
    () => new Set(Array.from(activeConnsRef.current.keys())),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [participants],
  );

  const totalTiles = participants.length + 1;
  const gridCols   = totalTiles <= 1 ? 1 : totalTiles <= 4 ? 2 : 3;
  const tileW      = SW / gridCols;
  const gridHeight = Math.ceil(totalTiles / gridCols) * (tileW * (9 / 16));

  const spotlitParticipant = spotlightId && spotlightId !== 'me'
    ? participants.find(p => p.id === spotlightId) ?? null
    : null;
  const spotlitIsLocal = spotlightId === 'me';

  // ── Render HOME ───────────────────────────────────────────────────────────
  const renderHome = () => (
    <SafeAreaView style={s.homeRoot}>
      <StatusBar barStyle="light-content" />
      <Text style={s.homeTitle}>Calls</Text>
      <Text style={s.homeSubtitle}>Choose how you want to connect</Text>
      <View style={s.homeCards}>
        <TouchableOpacity style={[s.homeCard, { backgroundColor: '#1d4ed8' }]} activeOpacity={0.85}
          onPress={() => { setCallMode('audio'); setSearch(''); setView('employees'); }}>
          <Text style={s.homeCardIcon}>🎙️</Text>
          <Text style={s.homeCardTitle}>Voice Call</Text>
          <Text style={s.homeCardSub}>High-quality audio with noise suppression</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.homeCard, { backgroundColor: '#7e22ce' }]} activeOpacity={0.85}
          onPress={() => { setCallMode('video'); setSearch(''); setView('employees'); }}>
          <Text style={s.homeCardIcon}>📹</Text>
          <Text style={s.homeCardTitle}>Video Call</Text>
          <Text style={s.homeCardSub}>Face-to-face HD video with group support</Text>
        </TouchableOpacity>
      </View>
      <View style={s.homePeerBadge}>
        <View style={[s.homePeerDot, { backgroundColor: peerReady ? '#3ba55d' : '#e67700' }]} />
        <Text style={s.homePeerTxt}>{peerReady ? `Online · ${myPeerId}` : 'Connecting to peer service…'}</Text>
      </View>
    </SafeAreaView>
  );

  // ── Render EMPLOYEES ──────────────────────────────────────────────────────
  const renderEmployees = () => (
    <SafeAreaView style={s.empRoot}>
      <StatusBar barStyle="light-content" />
      <View style={s.empHeader}>
        <TouchableOpacity onPress={() => { setView('home'); setGroupMode(false); setSelectedIds(new Set()); }} style={s.empBack}>
          <Text style={s.empBackTxt}>‹  Back</Text>
        </TouchableOpacity>
        <Text style={s.empHeaderTitle}>
          {callMode === 'audio' ? '🎙️' : '📹'}  {callMode === 'audio' ? 'Voice' : 'Video'} Call
        </Text>
        <TouchableOpacity style={[s.groupToggle, groupMode && s.groupToggleActive]}
          onPress={() => { setGroupMode(g => !g); setSelectedIds(new Set()); }}>
          <Text style={[s.groupToggleTxt, groupMode && { color: '#818cf8' }]}>👥  Group</Text>
        </TouchableOpacity>
      </View>

      {groupMode && (
        <View style={s.groupBar}>
          <Text style={s.groupBarTxt}>{selectedIds.size} selected</Text>
          <TouchableOpacity style={[s.groupStartBtn, (selectedIds.size === 0 || !peerReady) && { opacity: 0.4 }]}
            onPress={startGroupCall} disabled={selectedIds.size === 0 || !peerReady}>
            <Text style={s.groupStartBtnTxt}>Start Group Call</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={s.searchWrap}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput style={s.searchInput} placeholder="Search people…"
          placeholderTextColor="rgba(255,255,255,0.35)" value={search} onChangeText={setSearch} />
      </View>

      {empLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#5865f2" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={e => String(e.id)}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={<Text style={s.emptyTxt}>No people found.</Text>}
          renderItem={({ item: emp }) => {
            const isSelected = selectedIds.has(emp.id);
            return (
              <TouchableOpacity style={s.empItem} activeOpacity={0.75}
                onPress={() => {
                  if (groupMode) {
                    setSelectedIds(prev => {
                      const n = new Set(prev);
                      n.has(emp.id) ? n.delete(emp.id) : n.add(emp.id);
                      return n;
                    });
                  }
                }}>
                {groupMode && (
                  <View style={[s.checkbox, isSelected && s.checkboxChecked]}>
                    {isSelected && <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>✓</Text>}
                  </View>
                )}
                <Avatar name={emp.full_name} size={42} />
                <View style={s.empInfo}>
                  <Text style={s.empName}>{emp.full_name}</Text>
                  <Text style={s.empSub} numberOfLines={1}>
                    {emp.position ?? 'Employee'}{emp.department_name ? `  ·  ${emp.department_name}` : ''}
                  </Text>
                </View>
                {!groupMode && (
                  <TouchableOpacity style={[s.callBtnSm, !peerReady && { opacity: 0.4 }]}
                    disabled={!peerReady} onPress={() => callEmployee(emp)}>
                    <Text style={{ fontSize: 16 }}>📞</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );

  // ── Render CALL ───────────────────────────────────────────────────────────
  const renderCall = () => (
    <View style={s.callRoot}>
      <StatusBar barStyle="light-content" hidden />

      <SafeAreaView style={s.callHeader}>
        <View style={s.callHeaderInner}>
          <View style={s.callDot} />
          <View style={{ flex: 1 }}>
            <Text style={s.callHeaderTitle} numberOfLines={1}>
              {participants.length >= 1
                ? `Group  ·  ${participants.length + 1} people`
                : (participants[0]?.name ?? 'Connecting…')}
              {amInitiator ? '  👑' : ''}
            </Text>
            <Text style={s.callHeaderSub}>
              {callDuration > 0 ? fmt(callDuration) : 'Connecting…'}  ·  {status}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setAddPanelOpen(v => !v)} style={s.addBtn}>
            <Text style={{ fontSize: 18 }}>{addPanelOpen ? '✕' : '➕'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View style={{ flex: 1 }}>
        {callMode === 'video' ? (
          spotlightId ? (
            <View style={{ flex: 1 }}>
              <View style={{ flex: 1 }}>
                {spotlitIsLocal ? (
                  <VideoTile stream={localStream} name={myName} isLocal videoOff={cameraOff}
                    muted={micMuted} netQuality="good" isSpotlit isSharing={false}
                    onPress={() => setSpotlightId(null)} amInitiator={amInitiator}
                    frontCamera={frontCamera} tileWidth={SW} tileHeight={SH * 0.62} />
                ) : spotlitParticipant ? (
                  <VideoTile stream={spotlitParticipant.stream} name={spotlitParticipant.name}
                    isLocal={false} videoOff={spotlitParticipant.videoOff}
                    muted={spotlitParticipant.muted} netQuality={spotlitParticipant.netQuality}
                    isSpotlit isSharing={spotlitParticipant.isScreenSharing}
                    onPress={() => setSpotlightId(null)}
                    onRemove={() => removeParticipant(spotlitParticipant.id)}
                    amInitiator={amInitiator} frontCamera={frontCamera}
                    tileWidth={SW} tileHeight={SH * 0.62} />
                ) : null}
              </View>
              <ScrollView horizontal style={s.strip} contentContainerStyle={{ gap: 4, padding: 6 }}>
                {spotlightId !== 'me' && (
                  <TouchableOpacity style={s.stripTile} onPress={() => setSpotlightId('me')}>
                    {localStream && !cameraOff && RTCView ? (
                      <RTCView streamURL={localStream.toURL()} style={StyleSheet.absoluteFillObject}
                        objectFit="cover" mirror={frontCamera} zOrder={0} />
                    ) : <Avatar name={myName} size={30} />}
                    <View style={s.tileOverlay}>
                      <Text style={[s.tileName, { fontSize: 9 }]}>You</Text>
                    </View>
                  </TouchableOpacity>
                )}
                {participants.filter(p => p.id !== spotlightId).map(p => (
                  <TouchableOpacity key={p.id} style={s.stripTile} onPress={() => setSpotlightId(p.id)}>
                    {p.stream && !p.videoOff && RTCView ? (
                      <RTCView streamURL={p.stream.toURL()} style={StyleSheet.absoluteFillObject}
                        objectFit="cover" zOrder={1} />
                    ) : <Avatar name={p.name} size={30} />}
                    <View style={s.tileOverlay}>
                      <Text style={[s.tileName, { fontSize: 9 }]} numberOfLines={1}>{p.name}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ height: Math.max(gridHeight, SH * 0.55) }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                <VideoTile stream={localStream} name={myName} isLocal videoOff={cameraOff}
                  muted={micMuted} netQuality="good" isSpotlit={spotlightId === 'me'}
                  onPress={() => setSpotlightId(id => id === 'me' ? null : 'me')}
                  amInitiator={amInitiator} frontCamera={frontCamera}
                  tileWidth={tileW} tileHeight={tileW * (9 / 16)} />
                {participants.map(p => (
                  <VideoTile key={p.id} stream={p.stream} name={p.name} isLocal={false}
                    videoOff={p.videoOff} muted={p.muted} netQuality={p.netQuality}
                    isSpotlit={spotlightId === p.id} isSharing={p.isScreenSharing}
                    onPress={() => setSpotlightId(id => id === p.id ? null : p.id)}
                    onRemove={() => removeParticipant(p.id)}
                    amInitiator={amInitiator} frontCamera={frontCamera}
                    tileWidth={tileW} tileHeight={tileW * (9 / 16)} />
                ))}
              </View>
            </ScrollView>
          )
        ) : (
          <View style={s.audioStage}>
            <ScrollView contentContainerStyle={s.audioGrid}>
              <AudioCircle name={`You${amInitiator ? ' 👑' : ''}`} muted={micMuted} active={!micMuted} amInitiator={false} />
              {participants.map(p => (
                <AudioCircle key={p.id} name={p.name} muted={p.muted} active={!p.muted}
                  amInitiator={amInitiator} onRemove={() => removeParticipant(p.id)} />
              ))}
            </ScrollView>
            <Text style={s.audioDuration}>{callDuration > 0 ? fmt(callDuration) : 'Connecting…'}</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, justifyContent: 'center', paddingHorizontal: 20 }}>
              {participants.map(p => (
                <View key={p.id} style={{ alignItems: 'center', gap: 2 }}>
                  <NetBadge quality={p.netQuality} />
                  <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }} numberOfLines={1}>{p.name.split(' ')[0]}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      <SafeAreaView style={s.controlsBar}>
        <View style={s.controls}>
          <CtrlBtn label={micMuted ? 'Unmute' : 'Mute'} icon={micMuted ? '🔇' : '🎙️'} onPress={toggleMic} active={micMuted} />
          {callMode === 'video' && (
            <CtrlBtn label={cameraOff ? 'Cam On' : 'Cam Off'} icon={cameraOff ? '📷' : '📹'} onPress={toggleCamera} active={cameraOff} />
          )}
          {callMode === 'video' && <CtrlBtn label="Flip" icon="🔄" onPress={flipCamera} />}
          <CtrlBtn label={speakerOn ? 'Earpiece' : 'Speaker'} icon={speakerOn ? '🔊' : '🔈'} onPress={toggleSpeaker} active={speakerOn} />
          <CtrlBtn label={noiseSup ? 'Noise Off' : 'Noise On'} icon="🎚️" onPress={toggleNoiseSup} active={noiseSup} />
          <CtrlBtn label="End" icon="📵" danger large onPress={() => {
            Alert.alert('End call', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'End', style: 'destructive', onPress: endCall },
            ]);
          }} />
        </View>
      </SafeAreaView>

      {addPanelOpen && (
        <View style={s.addPanel}>
          <Text style={s.addPanelTitle}>Add to call  ({participants.length + 1} in call)</Text>
          <View style={s.searchWrap}>
            <Text style={s.searchIcon}>🔍</Text>
            <TextInput style={[s.searchInput, { fontSize: 12 }]} placeholder="Search people to add…"
              placeholderTextColor="rgba(255,255,255,0.35)" value={addSearch} onChangeText={setAddSearch} />
          </View>
          <FlatList
            data={filteredForAdd.slice(0, 10)}
            keyExtractor={e => String(e.id)}
            style={{ maxHeight: 220 }}
            ListEmptyComponent={<Text style={[s.emptyTxt, { padding: 12 }]}>No people found</Text>}
            renderItem={({ item: emp }) => {
              const epid    = `u-${emp.id}`;
              const isOnCall = activeConnPids.has(epid);
              return (
                <View style={[s.empItem, { paddingVertical: 7 }]}>
                  <Avatar name={emp.full_name} size={32} />
                  <View style={s.empInfo}>
                    <Text style={[s.empName, { fontSize: 12 }]}>{emp.full_name}</Text>
                    {emp.position && <Text style={[s.empSub, { fontSize: 10 }]} numberOfLines={1}>{emp.position}</Text>}
                  </View>
                  {isOnCall ? (
                    <View style={s.onCallBadge}><Text style={s.onCallBadgeTxt}>On call</Text></View>
                  ) : (
                    <TouchableOpacity style={s.addBtnSm} onPress={() => addToCall(emp)}>
                      <Text style={{ fontSize: 14 }}>➕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            }}
          />
        </View>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#080810' }}>
      {view === 'home'      && renderHome()}
      {view === 'employees' && renderEmployees()}
      {view === 'call'      && renderCall()}
      {incoming && (
        <IncomingCallModal incoming={incoming} onAccept={acceptIncoming} onDecline={declineIncoming} />
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Styles
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  avatar:            { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarTxt:         { color: '#fff', fontWeight: '700', letterSpacing: 0.5 },
  homeRoot:          { flex: 1, backgroundColor: '#080810', paddingHorizontal: 20, paddingTop: 20 },
  homeTitle:         { fontSize: 32, fontWeight: '800', color: '#fff', marginTop: 20, letterSpacing: -0.5 },
  homeSubtitle:      { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 36, marginTop: 6 },
  homeCards:         { gap: 16 },
  homeCard:          { borderRadius: 20, padding: 24, gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  homeCardIcon:      { fontSize: 36, marginBottom: 4 },
  homeCardTitle:     { fontSize: 22, fontWeight: '700', color: '#fff' },
  homeCardSub:       { fontSize: 13, color: 'rgba(255,255,255,0.65)' },
  homePeerBadge:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 28, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  homePeerDot:       { width: 8, height: 8, borderRadius: 4 },
  homePeerTxt:       { fontSize: 11, color: 'rgba(255,255,255,0.45)', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  empRoot:           { flex: 1, backgroundColor: '#080810' },
  empHeader:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)', gap: 10 },
  empBack:           { paddingVertical: 4, paddingRight: 8 },
  empBackTxt:        { fontSize: 16, color: '#818cf8', fontWeight: '600' },
  empHeaderTitle:    { flex: 1, fontSize: 16, fontWeight: '700', color: '#fff', textAlign: 'center' },
  groupToggle:       { borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  groupToggleActive: { borderColor: '#818cf8', backgroundColor: 'rgba(88,101,242,0.15)' },
  groupToggleTxt:    { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  groupBar:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: 'rgba(88,101,242,0.1)', borderBottomWidth: 1, borderBottomColor: 'rgba(88,101,242,0.2)' },
  groupBarTxt:       { fontSize: 13, color: 'rgba(255,255,255,0.55)' },
  groupStartBtn:     { backgroundColor: '#5865f2', borderRadius: 9, paddingHorizontal: 16, paddingVertical: 8 },
  groupStartBtnTxt:  { fontSize: 13, fontWeight: '700', color: '#fff' },
  searchWrap:        { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 12, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 10 : 2 },
  searchIcon:        { fontSize: 14 },
  searchInput:       { flex: 1, color: '#fff', fontSize: 14 },
  empItem:           { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  empInfo:           { flex: 1 },
  empName:           { fontSize: 14, fontWeight: '600', color: '#fff' },
  empSub:            { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  callBtnSm:         { width: 36, height: 36, borderRadius: 18, backgroundColor: '#2f9e44', alignItems: 'center', justifyContent: 'center' },
  checkbox:          { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked:   { backgroundColor: '#5865f2', borderColor: '#5865f2' },
  emptyTxt:          { textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 14, marginTop: 40 },
  callRoot:          { flex: 1, backgroundColor: '#050507' },
  callHeader:        { backgroundColor: 'rgba(0,0,0,0.6)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  callHeaderInner:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10 },
  callDot:           { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3ba55d' },
  callHeaderTitle:   { fontSize: 14, fontWeight: '700', color: '#fff' },
  callHeaderSub:     { fontSize: 11, color: 'rgba(255,255,255,0.45)' },
  addBtn:            { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  videoTile:         { backgroundColor: '#0d0d10', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center' },
  videoTileSpotlit:  { borderWidth: 2, borderColor: '#5865f2' },
  camOffFill:        { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0d0d10' },
  camOffText:        { fontSize: 11, color: 'rgba(255,255,255,0.45)' },
  tileBadges:        { position: 'absolute', top: 8, right: 8, flexDirection: 'row', gap: 6, alignItems: 'center', zIndex: 2 },
  pinBadge:          { backgroundColor: '#5865f2', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  pinBadgeTxt:       { fontSize: 9, fontWeight: '800', color: '#fff' },
  tileRemoveBtn:     { position: 'absolute', top: 8, left: 8, zIndex: 5, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(237,66,69,0.85)', alignItems: 'center', justifyContent: 'center' },
  tileOverlay:       { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 8, paddingVertical: 6, backgroundColor: 'rgba(0,0,0,0.55)', flexDirection: 'row', alignItems: 'center', gap: 4, zIndex: 2 },
  tileName:          { fontSize: 11, fontWeight: '600', color: '#fff', flex: 1 },
  tileIconRed:       { width: 16, height: 16, borderRadius: 3, backgroundColor: 'rgba(237,66,69,0.8)', alignItems: 'center', justifyContent: 'center' },
  strip:             { backgroundColor: '#0a0a0f', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', flexShrink: 0, maxHeight: 102 },
  stripTile:         { width: 140, height: 90, borderRadius: 6, overflow: 'hidden', backgroundColor: '#0d0d10', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  audioStage:        { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#080810', paddingVertical: 24 },
  audioGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 20, justifyContent: 'center', paddingHorizontal: 20 },
  audioCircle:       { alignItems: 'center', gap: 8, width: 100, position: 'relative' },
  audioRing:         { borderRadius: 44, padding: 4, borderWidth: 2, borderColor: 'transparent' },
  audioRingActive:   { borderColor: '#3ba55d', shadowColor: '#3ba55d', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 10, elevation: 6 },
  audioName:         { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.7)', textAlign: 'center', maxWidth: 90 },
  audioRemove:       { position: 'absolute', top: -4, right: -4, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(237,66,69,0.9)', alignItems: 'center', justifyContent: 'center', zIndex: 5 },
  audioDuration:     { marginTop: 20, fontSize: 18, color: 'rgba(255,255,255,0.55)', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', letterSpacing: 1 },
  controlsBar:       { backgroundColor: 'rgba(5,5,7,0.95)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)' },
  controls:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 14, gap: 8, flexWrap: 'wrap' },
  ctrlWrap:          { alignItems: 'center', gap: 4 },
  ctrlBtn:           { alignItems: 'center', justifyContent: 'center' },
  ctrlIcon:          { fontSize: 20, color: '#fff' },
  ctrlLabel:         { fontSize: 9, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
  addPanel:          { position: 'absolute', bottom: 90, left: 0, right: 0, backgroundColor: '#12121a', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingTop: 12, maxHeight: SH * 0.55, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 12 },
  addPanelTitle:     { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: 16, marginBottom: 4 },
  addBtnSm:          { width: 32, height: 32, borderRadius: 16, backgroundColor: '#5865f2', alignItems: 'center', justifyContent: 'center' },
  onCallBadge:       { backgroundColor: 'rgba(59,165,93,0.15)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(59,165,93,0.35)', paddingHorizontal: 8, paddingVertical: 3 },
  onCallBadgeTxt:    { fontSize: 10, fontWeight: '700', color: '#3ba55d' },
  incomingBg:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', alignItems: 'center', justifyContent: 'center' },
  incomingCard:      { backgroundColor: '#16161f', borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 32, width: SW * 0.85, alignItems: 'center', gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.7, shadowRadius: 24, elevation: 20 },
  incomingLabel:     { fontSize: 13, fontWeight: '600', color: '#818cf8', marginBottom: 8 },
  incomingName:      { fontSize: 24, fontWeight: '800', color: '#fff', textAlign: 'center' },
  incomingHint:      { fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 12 },
  incomingActions:   { flexDirection: 'row', gap: 14, width: '100%', marginTop: 4 },
  incomingBtn:       { flex: 1, borderRadius: 40, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  acceptBtn:         { backgroundColor: '#3ba55d' },
  declineBtn:        { backgroundColor: '#ed4245' },
  incomingBtnText:   { fontSize: 15, fontWeight: '700', color: '#fff' },
});