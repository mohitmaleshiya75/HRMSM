let mediaDevices: any;
let RTCView: any;
let _PC: any, _SDP: any, _ICE: any, _MS: any;

console.log('[Calls:BOOT] ═══ Module loading — top of file ═══');
try {
  const webrtc = require('react-native-webrtc');
  mediaDevices = webrtc.mediaDevices;
  RTCView      = webrtc.RTCView;
  _PC          = webrtc.RTCPeerConnection;
  _SDP         = webrtc.RTCSessionDescription;
  _ICE         = webrtc.RTCIceCandidate;
  _MS          = webrtc.MediaStream;
  console.log('[Calls:BOOT] WebRTC loaded OK');
} catch (e: any) {
  console.error('[Calls:BOOT] react-native-webrtc FAILED:', e?.message);
}

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
  BackHandler, ScrollView, AppState, type AppStateStatus,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

let Peer: any = null;
try {
  const peerModule = require('peerjs');
  Peer = peerModule.default ?? peerModule.Peer ?? peerModule;
  console.log('[Calls:BOOT] peerjs loaded. Type:', typeof Peer);
} catch (e: any) {
  console.error('[Calls:BOOT] peerjs FAILED:', e?.message);
}

import type { MediaConnection, DataConnection } from 'peerjs';

let InCallManager: any = null;
try {
  InCallManager = require('react-native-incall-manager').default;
} catch (e: any) {
  console.error('[Calls:BOOT] react-native-incall-manager FAILED:', e?.message);
}

let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
} catch {}

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
  // FIX: newPeer now carries the full current roster so every recipient can
  //      connect to everyone they don't know yet (not just the new joiner).
  | { type: 'newPeer';      peer: GroupPeerInfo; allPeers: GroupPeerInfo[] }
  | { type: 'peerList';     peers: GroupPeerInfo[] }
  | { type: 'peerLeft';     peerId: string }
  | { type: 'hostTransfer'; newHostPeerId: string }
  | { type: 'kick';         peerId: string }
  | { type: 'decline' };

interface CallMetadata {
  mode?: CallMode;
  fromName?: string;
  fromUserId?: number;
  isGroup?: boolean;
  // Full peer list known at call-time so the callee can mesh-connect to everyone
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

// ─── Push notification helpers ────────────────────────────────────────────────
async function registerForPushNotifications(): Promise<string | null> {
  if (!Notifications) return null;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;
    const token = await Notifications.getDevicePushTokenAsync().catch(() => null);
    return token?.data ?? null;
  } catch (e: any) {
    console.warn('[Calls:PUSH] registerForPushNotifications failed:', e?.message);
    return null;
  }
}

async function showIncomingCallNotification(callerName: string, mode: CallMode) {
  if (!Notifications) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Incoming ${mode === 'video' ? 'Video' : 'Voice'} Call`,
        body: `${callerName} is calling you`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority?.MAX ?? 'max',
        vibrate: [0, 500, 200, 500],
        categoryIdentifier: 'incoming_call',
        data: { type: 'incoming_call', callerName, mode },
      },
      trigger: null,
    });
  } catch (e: any) {
    console.warn('[Calls:PUSH] showIncomingCallNotification failed:', e?.message);
  }
}

async function dismissCallNotification() {
  if (!Notifications) return;
  try { await Notifications.dismissAllNotificationsAsync(); } catch {}
}

// ─── Error Boundary ───────────────────────────────────────────────────────────
class CallsErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: string | null; errorInfo: string | null }
> {
  state = { error: null, errorInfo: null };
  static getDerivedStateFromError(e: Error) {
    return { error: e?.message ?? String(e), errorInfo: null };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ errorInfo: info?.componentStack ?? null });
  }
  render() {
    if (this.state.error) {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#080810', padding: 24, justifyContent: 'center' }}>
          <Text style={{ color: '#ed4245', fontSize: 18, fontWeight: '800', marginBottom: 12 }}>
            Calls Crashed
          </Text>
          <Text style={{ color: '#ff9999', fontSize: 12, marginBottom: 16 }}>
            {this.state.error}
          </Text>
          {this.state.errorInfo && (
            <ScrollView style={{ maxHeight: 200 }}>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>
                {this.state.errorInfo}
              </Text>
            </ScrollView>
          )}
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

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
  label, iconName, onPress, active = false, danger = false, large = false, disabled = false,
}: {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  active?: boolean; danger?: boolean; large?: boolean; disabled?: boolean;
}) {
  const bg        = danger ? '#ed4245' : active ? 'rgba(88,101,242,0.35)' : 'rgba(255,255,255,0.12)';
  const sz        = large ? 58 : 48;
  const iconSize  = large ? 24 : 20;
  const iconColor = danger ? '#fff' : active ? '#818cf8' : '#fff';
  return (
    <TouchableOpacity style={s.ctrlWrap} onPress={onPress} disabled={disabled} activeOpacity={0.75}>
      <View style={[s.ctrlBtn, { width: sz, height: sz, borderRadius: sz / 2, backgroundColor: bg, opacity: disabled ? 0.4 : 1 }]}>
        <Ionicons name={iconName} size={iconSize} color={iconColor} />
      </View>
      <Text style={s.ctrlLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Unavailable screen ───────────────────────────────────────────────────────
function UnavailableScreen({ reason }: { reason: string }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#080810', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <Ionicons name="phone-portrait-outline" size={52} color="rgba(255,255,255,0.3)" />
      <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff', marginTop: 16, marginBottom: 8, textAlign: 'center' }}>
        Dev Build Required
      </Text>
      <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 22 }}>
        Calls require native WebRTC modules.{'\n\n'}
        Reason: {reason}{'\n\n'}
        Run:{'\n'}expo run:android  /  expo run:ios
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
          <View style={s.incomingIconRow}>
            <Ionicons
              name={incoming.mode === 'video' ? 'videocam' : 'call'}
              size={18}
              color="#818cf8"
            />
            <Text style={s.incomingLabel}>
              {incoming.mode === 'video' ? 'Incoming Video Call' : 'Incoming Voice Call'}
            </Text>
          </View>
          <Avatar name={incoming.name} size={84} />
          <Text style={s.incomingName}>{incoming.name}</Text>
          <Text style={s.incomingHint}>Tap Accept or Decline</Text>
          <View style={s.incomingActions}>
            <TouchableOpacity style={[s.incomingBtn, s.declineBtn]} onPress={onDecline} activeOpacity={0.8}>
              <Ionicons name="call" size={22} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
              <Text style={s.incomingBtnText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.incomingBtn, s.acceptBtn]} onPress={onAccept} activeOpacity={0.8}>
              <Ionicons name="call" size={22} color="#fff" />
              <Text style={s.incomingBtnText}>Accept</Text>
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
      style={[s.videoTile, { width: tileWidth, height: tileHeight }, isSpotlit && s.videoTileSpotlit]}
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
        {isSpotlit && (
          <View style={s.pinBadge}><Text style={s.pinBadgeTxt}>PIN</Text></View>
        )}
        {isSharing && (
          <View style={[s.pinBadge, { backgroundColor: '#5865f2' }]}>
            <Text style={s.pinBadgeTxt}>SCREEN</Text>
          </View>
        )}
      </View>
      {!isLocal && amInitiator && onRemove && (
        <TouchableOpacity style={s.tileRemoveBtn} onPress={onRemove}>
          <Ionicons name="close" size={12} color="#fff" />
        </TouchableOpacity>
      )}
      <View style={s.tileOverlay}>
        <Text style={s.tileName} numberOfLines={1}>{isLocal ? 'You' : name}</Text>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {muted    && <View style={s.tileIconRed}><Ionicons name="mic-off"      size={9} color="#fff" /></View>}
          {videoOff && <View style={s.tileIconRed}><Ionicons name="videocam-off" size={9} color="#fff" /></View>}
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
      {muted && <Ionicons name="mic-off" size={12} color="#ed4245" />}
      {amInitiator && onRemove && (
        <TouchableOpacity style={s.audioRemove} onPress={onRemove}>
          <Ionicons name="close" size={12} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Main Calls Component
// ─────────────────────────────────────────────────────────────────────────────
export default function Calls() {
  if (!RTCView)       return <UnavailableScreen reason="RTCView is null (react-native-webrtc not loaded)" />;
  if (!mediaDevices)  return <UnavailableScreen reason="mediaDevices is null" />;
  if (!Peer)          return <UnavailableScreen reason="Peer is null (peerjs failed to load)" />;
  return (
    <CallsErrorBoundary>
      <CallsInner />
    </CallsErrorBoundary>
  );
}

// ─── Inner component ──────────────────────────────────────────────────────────
function CallsInner() {
  const { data: currentUser } = useCurrentUser();
  const { employees: allEmployees, isLoading: empLoading } = useEmployeeHierarchy();

  const myName = useMemo(() => {
    const u = currentUser as Record<string, unknown> | undefined;
    return ((u?.full_name ?? u?.name ??
      `${u?.first_name ?? ''} ${u?.last_name ?? ''}`.trim() ?? 'Me') as string);
  }, [currentUser]);

  const myId     = String((currentUser as Record<string, unknown> | undefined)?.id ?? '');
  const myPeerId = `u-${myId}`;

  // Keep a stable ref so callbacks never capture a stale value
  const myPeerIdRef = useRef(myPeerId);
  const myNameRef   = useRef(myName);
  const myIdRef     = useRef(myId);
  useEffect(() => { myPeerIdRef.current = myPeerId; }, [myPeerId]);
  useEffect(() => { myNameRef.current   = myName;   }, [myName]);
  useEffect(() => { myIdRef.current     = myId;     }, [myId]);

  const callPeople = useMemo(
    () => allEmployees.filter(e => String(e.id) !== myId),
    [allEmployees, myId],
  );

  const [view,     setView]     = useState<AppView>('home');
  const [callMode, setCallMode] = useState<CallMode>('audio');

  const [peer,      setPeer]      = useState<any | null>(null);
  const [peerReady, setPeerReady] = useState(false);
  const peerRef = useRef<any | null>(null);

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
  const acceptingRef       = useRef(false);
  const resetCallStateRef  = useRef<() => void>(() => {});
  // FIX: use a ref for setupMediaConnection and connectMissingGroupPeers so
  //      the peer.on('call') listener always calls the latest version without
  //      needing to re-register the listener on every render.
  const setupMediaConnRef       = useRef<(c: MediaConnection, pid: string, uid: number, name: string, out: boolean) => void>(() => {});
  const connectMissingPeersRef  = useRef<(peers: GroupPeerInfo[], initiator?: string | null) => void>(() => {});

  useEffect(() => { micMutedRef.current        = micMuted;        }, [micMuted]);
  useEffect(() => { cameraOffRef.current       = cameraOff;       }, [cameraOff]);
  useEffect(() => { callModeRef.current        = callMode;        }, [callMode]);
  useEffect(() => { inCallRef.current          = inCall;          }, [inCall]);
  useEffect(() => { initiatorPeerIdRef.current = initiatorPeerId; }, [initiatorPeerId]);

  const amInitiator = initiatorPeerId === myPeerId;

  // ── Push notification setup ───────────────────────────────────────────────
  useEffect(() => {
    registerForPushNotifications().then(token => {
      if (token) console.log('[Calls:PUSH] Push token:', token);
    });
  }, []);

  // ── Peer init ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!myId || myId === 'undefined') return;
    if (peerRef.current) return;
    if (!Peer) return;

    console.log('[Calls:PEER] Creating Peer:', myPeerId);
    try {
      const p = new Peer(myPeerId, {
        host: PEER_HOST, port: PEER_PORT, path: PEER_PATH,
        secure: PEER_PORT === 443,
        config: { iceServers: ICE_SERVERS },
        debug: 1,
      });

      p.on('open', (id: string) => {
        console.log('[Calls:PEER] Peer open. ID:', id);
        setPeerReady(true);
      });
      p.on('disconnected', () => {
        console.warn('[Calls:PEER] Peer disconnected. Reconnecting…');
        setPeerReady(false);
        try { p.reconnect(); } catch {}
      });
      p.on('error', (err: any) => {
        const errType = err?.type ?? 'unknown';
        console.error('[Calls:PEER] Peer error type:', errType, '|', err?.message);

        if (errType === 'peer-unavailable') {
          // FIX: PeerJS formats the message as "Could not connect to peer <id>"
          const msg      = err?.message ?? '';
          const match    = msg.match(/peer\s+(u-[\w-]+)/i);
          const failedPid = match?.[1] ?? null;
          console.warn('[Calls:PEER] peer-unavailable for:', failedPid);

          ringVibration.stop();
          if (failedPid) {
            // Remove the pending slot so the UI doesn't show a stuck "Connecting…" tile
            if (participantsRef.current.has(failedPid)) {
              participantsRef.current.delete(failedPid);
              activeConnsRef.current.delete(failedPid);
              setParticipants(Array.from(participantsRef.current.values()));
            }
            setStatus(`${failedPid.replace('u-', 'User ')} is not available`);
          } else {
            setStatus('User is not available right now');
          }
          // Only tear down if we have nobody else
          if (participantsRef.current.size === 0 && !inCallRef.current) {
            resetCallStateRef.current();
          }
          return;
        }

        setPeerReady(false);
      });
      p.on('close', () => {
        console.warn('[Calls:PEER] Peer closed');
        setPeerReady(false);
      });

      peerRef.current = p;
      setPeer(p);
    } catch (e: any) {
      console.error('[Calls:PEER] Exception creating Peer:', e?.message);
    }

    return () => {
      try { peerRef.current?.destroy(); } catch {}
      peerRef.current = null;
    };
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
    console.log('[Calls:MEDIA] getMedia() mode:', mode);

    if (localStreamRef.current) {
      const existingVideo = localStreamRef.current.getVideoTracks().length > 0;
      const needVideo     = mode === 'video';
      if (existingVideo === needVideo) {
        console.log('[Calls:MEDIA] Reusing existing stream');
        return localStreamRef.current;
      }
      localStreamRef.current.getTracks().forEach((t: any) => t.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }

    const constraints: Record<string, unknown> = {
      audio: { echoCancellation: true, noiseSuppression: noiseSup, autoGainControl: true },
      video: mode === 'video'
        ? { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 }, facingMode: 'user' }
        : false,
    };

    try {
      const stream = await mediaDevices.getUserMedia(constraints)
        .catch(async (e: any) => {
          console.warn('[Calls:MEDIA] Full constraints failed:', e?.message, '— retrying basic');
          return mediaDevices.getUserMedia({ audio: true, video: mode === 'video' });
        });

      console.log('[Calls:MEDIA] Stream obtained. Audio:', stream.getAudioTracks().length,
        'Video:', stream.getVideoTracks().length);
      localStreamRef.current = stream;
      setLocalStream(stream);

      stream.getAudioTracks().forEach((t: any) => { t.enabled = !micMutedRef.current; });
      if (mode === 'video') {
        stream.getVideoTracks().forEach((t: any) => { t.enabled = !cameraOffRef.current; });
      }
      return stream;
    } catch (e: any) {
      console.error('[Calls:MEDIA] getUserMedia FAILED:', e?.message);
      throw e;
    }
  }, [noiseSup]);

  // ── Broadcast ─────────────────────────────────────────────────────────────
  const broadcastToAll = useCallback((msg: MetadataMessage) => {
    participantsRef.current.forEach(p => {
      if (p.dataConnection?.open) {
        try { p.dataConnection.send(msg); } catch {}
      }
    });
  }, []);

  useEffect(() => { if (inCall) broadcastToAll({ type: 'mute',     value: micMuted });  }, [micMuted,  inCall, broadcastToAll]);
  useEffect(() => { if (inCall && callMode === 'video') broadcastToAll({ type: 'videoOff', value: cameraOff }); }, [cameraOff, inCall, callMode, broadcastToAll]);

  // FIX: getCurrentGroupPeers now reads from refs so it always returns the live
  //      roster even inside stale closures.
  const getCurrentGroupPeers = useCallback((): GroupPeerInfo[] => {
    const peers: GroupPeerInfo[] = [];
    if (myIdRef.current) {
      peers.push({ peerId: myPeerIdRef.current, userId: Number(myIdRef.current), name: myNameRef.current });
    }
    participantsRef.current.forEach(p => {
      peers.push({ peerId: p.id, userId: p.userId, name: p.name });
    });
    return peers;
  }, []); // no deps — reads only from refs

  // FIX: connectMissingGroupPeers is now stored in a ref so the peer.on('call')
  //      listener always calls the latest version.
  const connectMissingGroupPeers = useCallback((
    peers: GroupPeerInfo[],
    callInitiator?: string | null,
  ) => {
    const p      = peerRef.current;
    const stream = localStreamRef.current;
    if (!p || !stream) {
      console.warn('[Calls:MESH] connectMissingGroupPeers: no peer or no stream yet');
      return;
    }

    // De-duplicate the supplied list, skip self and already-connected peers
    const seen = new Set<string>();
    peers.forEach(peerInfo => {
      if (!peerInfo.peerId || peerInfo.peerId === myPeerIdRef.current) return;
      if (seen.has(peerInfo.peerId)) return;
      seen.add(peerInfo.peerId);

      if (activeConnsRef.current.has(peerInfo.peerId)) return; // already wired up

      console.log('[Calls:MESH] Connecting to missing peer:', peerInfo.peerId);
      const conn = p.call(peerInfo.peerId, stream, {
        metadata: {
          mode:            callModeRef.current,
          fromName:        myNameRef.current,
          fromUserId:      Number(myIdRef.current),
          isGroup:         true,
          // Tell the callee about everyone we know so they can mesh too
          existingPeers:   getCurrentGroupPeers().filter(ep => ep.peerId !== peerInfo.peerId),
          initiatorPeerId: callInitiator ?? initiatorPeerIdRef.current ?? myPeerIdRef.current,
        } as CallMetadata,
      });
      setupMediaConnRef.current(conn, peerInfo.peerId, peerInfo.userId, peerInfo.name, true);
    });
  }, [getCurrentGroupPeers]); // stable — only refs inside

  // Keep the ref fresh
  useEffect(() => { connectMissingPeersRef.current = connectMissingGroupPeers; }, [connectMissingGroupPeers]);

  // ── Cleanup participant ───────────────────────────────────────────────────
  const cleanupParticipant = useCallback((pid: string, wasDeclined: boolean) => {
    console.log('[Calls:CLEANUP] cleanupParticipant:', pid);
    activeConnsRef.current.delete(pid);
    participantsRef.current.delete(pid);
    streamReceivedRef.current.delete(pid);
    setParticipants(Array.from(participantsRef.current.values()));
    setSpotlightId(prev => prev === pid ? null : prev);

    if (participantsRef.current.size === 0) {
      resetCallStateRef.current();
      setStatus(wasDeclined ? 'Call declined' : 'Call ended');
    } else if (initiatorPeerIdRef.current === pid) {
      // FIX: host transfer — pick first remaining participant, prefer self
      const remaining  = Array.from(participantsRef.current.values());
      const selfIsNext = true; // we are always "remaining" from our own perspective
      const newHostId  = selfIsNext ? myPeerIdRef.current : remaining[0]?.id;
      if (newHostId) {
        setInitiatorPeerId(newHostId);
        initiatorPeerIdRef.current = newHostId;
        // Inform others if we became the new host
        if (newHostId === myPeerIdRef.current) {
          broadcastToAll({ type: 'hostTransfer', newHostPeerId: myPeerIdRef.current });
        }
      }
    }
  }, [broadcastToAll]);

  // ── Setup data connection ─────────────────────────────────────────────────
  const setupDataConnection = useCallback((dataConn: DataConnection, pid: string) => {
    dataConn.on('open', () => {
      if (!dataConn.open) return;
      // FIX: send full peer roster immediately on data channel open so the
      //      remote side can mesh-connect to everyone it hasn't met yet.
      try {
        dataConn.send({ type: 'mute',     value: micMutedRef.current  } as MetadataMessage);
        dataConn.send({ type: 'videoOff', value: cameraOffRef.current } as MetadataMessage);
        dataConn.send({ type: 'peerList', peers: getCurrentGroupPeers() } as MetadataMessage);
      } catch (e: any) {
        console.warn('[Calls:DATA] Failed to send initial state to:', pid, e?.message);
      }
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
        if (kickedPid === myPeerIdRef.current) {
          resetCallStateRef.current();
          setStatus('You were removed from the call');
        } else if (participantsRef.current.has(kickedPid)) {
          const kicked = participantsRef.current.get(kickedPid);
          if (kicked) {
            try { kicked.connection.close(); }     catch {}
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
            else           setSpotlightId(prev => prev === pid ? null : prev);
            return { ...p, isScreenSharing: msg.value };
          }
          return p;
        }));
        return;
      }

      // FIX: newPeer now carries the full allPeers list — connect to anyone missing
      if (msg.type === 'newPeer') {
        connectMissingPeersRef.current(msg.allPeers, initiatorPeerIdRef.current);
        return;
      }

      if (msg.type === 'peerList') {
        // FIX: use the ref so we always call the latest implementation
        connectMissingPeersRef.current(msg.peers, initiatorPeerIdRef.current);
      }
    });

    dataConn.on('close', () => {
      setParticipants(prev => prev.map(p =>
        p.id === pid ? { ...p, dataConnection: undefined } : p,
      ));
    });
    dataConn.on('error', (e: any) => {
      console.error('[Calls:DATA] Error for:', pid, e?.message);
    });
  }, [cleanupParticipant, getCurrentGroupPeers]);

  // ── Reset call state ──────────────────────────────────────────────────────
  const resetCallState = useCallback(() => {
    console.log('[Calls:RESET] resetCallState()');
    acceptingRef.current = false;
    ringVibration.stop();
    dismissCallNotification();
    setInCall(false);
    inCallRef.current = false;
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
    initiatorPeerIdRef.current = null;
    setAddSearch('');
    setAddPanelOpen(false);
    try { InCallManager?.stop(); InCallManager?.setKeepScreenOn(false); } catch {}
    console.log('[Calls:RESET] Done');
  }, [stopTimer]);

  useEffect(() => { resetCallStateRef.current = resetCallState; }, [resetCallState]);

  // ── Setup MediaConnection ─────────────────────────────────────────────────
  const setupMediaConnection = useCallback((
    conn: MediaConnection, pid: string, userId: number, name: string, isOutgoing: boolean,
  ) => {
    console.log('[Calls:CONN] setupMediaConnection pid:', pid, '| name:', name, '| outgoing:', isOutgoing);

    if (activeConnsRef.current.has(pid)) {
      console.warn('[Calls:CONN] Already connected to:', pid, '— skipping duplicate');
      return;
    }
    activeConnsRef.current.set(pid, conn);

    const participant: Participant = {
      id: pid, userId, name, connection: conn,
      stream: null, muted: false, videoOff: false, netQuality: 'unknown', isScreenSharing: false,
    };
    participantsRef.current.set(pid, participant);
    setParticipants(Array.from(participantsRef.current.values()));

    // FIX: both sides open a data channel — outgoing side calls peer.connect(),
    //      incoming side is handled by the peer.on('connection') listener.
    //      This ensures the data channel exists regardless of who called whom.
    if (peerRef.current && isOutgoing) {
      try {
        const dataConn = peerRef.current.connect(pid, { reliable: true });
        participant.dataConnection = dataConn;
        participantsRef.current.set(pid, participant);
        setParticipants(Array.from(participantsRef.current.values()));
        setupDataConnection(dataConn, pid);
      } catch (e: any) {
        console.error('[Calls:CONN] Data channel failed:', e?.message);
      }
    }

    conn.on('stream', (remoteStream: any) => {
      console.log('[Calls:CONN] Remote stream from:', pid,
        '| audio:', remoteStream.getAudioTracks().length,
        '| video:', remoteStream.getVideoTracks().length);
      streamReceivedRef.current.add(pid);
      const existing = participantsRef.current.get(pid);
      if (existing) {
        existing.stream = remoteStream;
        participantsRef.current.set(pid, existing);
        setParticipants(Array.from(participantsRef.current.values()));
      }
      setStatus('Connected');
      ringVibration.stop();
      if (!timerRef.current) startTimer();

      // FIX: After stream arrives, broadcast our full peer list to the new
      //      participant via the data channel so they can catch up on everyone.
      const dc = participantsRef.current.get(pid)?.dataConnection;
      if (dc?.open) {
        try { dc.send({ type: 'peerList', peers: getCurrentGroupPeers() } as MetadataMessage); } catch {}
      }
    });

    conn.on('close', () => {
      const wasDeclined = !streamReceivedRef.current.has(pid);
      console.log('[Calls:CONN] Closed:', pid, '| wasDeclined:', wasDeclined);
      if (wasDeclined && isOutgoing) setStatus('Call declined');
      cleanupParticipant(pid, wasDeclined && isOutgoing);
    });

    conn.on('error', (err: any) => {
      console.error('[Calls:CONN] Error:', pid, err?.message);
      cleanupParticipant(pid, false);
    });
  }, [setupDataConnection, cleanupParticipant, startTimer, getCurrentGroupPeers]);

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
      const pid      = dataConn.peer;
      const existing = participantsRef.current.get(pid);

      if (existing) {
        // FIX: always attach the data connection even if we already have a
        //      media connection for this peer (the outgoing side may not have
        //      opened a data channel yet for the incoming direction).
        if (!existing.dataConnection || !existing.dataConnection.open) {
          existing.dataConnection = dataConn;
          participantsRef.current.set(pid, existing);
          setParticipants(Array.from(participantsRef.current.values()));
          setupDataConnection(dataConn, pid);
        }
        return;
      }

      // Unknown peer opened a data channel (e.g. for decline signalling)
      setupDataConnection(dataConn, pid);
    };
    peer.on('connection', onDataConn);
    return () => { peer.off('connection', onDataConn); };
  }, [peer, setupDataConnection]);

  // ── Incoming MEDIA call listener ──────────────────────────────────────────
  // FIX: This effect now only depends on `peer` — all callbacks go through refs
  //      so the listener is never torn down and re-registered mid-call, which
  //      was causing race conditions and missed mesh connections.
  useEffect(() => {
    if (!peer) return;

    const onCall = (call: MediaConnection) => {
      const meta           = (call.metadata ?? {}) as CallMetadata;
      const mode: CallMode = meta.mode === 'video' ? 'video' : 'audio';
      const name           = meta.fromName  || call.peer;
      const userId         = meta.fromUserId ?? 0;
      const callInitiator  = meta.initiatorPeerId ?? call.peer;

      console.log('[Calls:INCOMING] From:', call.peer, '| name:', name,
        '| mode:', mode, '| isGroup:', meta.isGroup,
        '| existingPeers:', meta.existingPeers?.length ?? 0);

      // ── Auto-answer if we're already in a call (group mesh) ──────────────
      if (localStreamRef.current && inCallRef.current && meta.isGroup) {
        console.log('[Calls:INCOMING] Auto-answering group peer:', call.peer);

        if (!initiatorPeerIdRef.current) {
          setInitiatorPeerId(callInitiator);
          initiatorPeerIdRef.current = callInitiator;
        }
        call.answer(localStreamRef.current);
        setupMediaConnRef.current(call, call.peer, userId, name, false);

        // FIX: connect to all other peers in the call that we haven't met
        if (meta.existingPeers && meta.existingPeers.length > 0) {
          // Slight delay so our own participant entry is registered first
          setTimeout(() => {
            connectMissingPeersRef.current(meta.existingPeers!, callInitiator);
          }, 200);
        }
        return;
      }

      // ── Show incoming call UI (not yet in a call) ─────────────────────────
      // FIX: if we're already in a call but it's NOT marked isGroup, still
      //      auto-answer rather than showing a confusing second incoming modal.
      if (localStreamRef.current && inCallRef.current) {
        call.answer(localStreamRef.current);
        setupMediaConnRef.current(call, call.peer, userId, name, false);
        if (meta.existingPeers) {
          setTimeout(() => {
            connectMissingPeersRef.current(meta.existingPeers!, callInitiator);
          }, 200);
        }
        return;
      }

      setIncoming({ name, userId, mode, conn: call });
      ringVibration.start();
      showIncomingCallNotification(name, mode);

      call.on('close', () => {
        setIncoming(prev => prev?.conn === call ? null : prev);
        ringVibration.stop();
        dismissCallNotification();
      });
      call.on('error', (e: any) => {
        console.error('[Calls:INCOMING] Error:', e?.message);
        setIncoming(prev => prev?.conn === call ? null : prev);
        ringVibration.stop();
        dismissCallNotification();
      });
    };

    peer.on('call', onCall);
    return () => { peer.off('call', onCall); };
  }, [peer]); // FIX: only re-register when the Peer object itself changes

  // ── Accept / Decline ──────────────────────────────────────────────────────
  const acceptIncoming = useCallback(async () => {
    if (!incoming || acceptingRef.current) return;
    acceptingRef.current = true;
    ringVibration.stop();
    dismissCallNotification();

    const { conn, mode, name, userId } = incoming;
    const meta          = (conn.metadata ?? {}) as CallMetadata;
    const callInitiator = meta.initiatorPeerId ?? conn.peer;

    setIncoming(null);

    try {
      console.log('[Calls:ACCEPT] Getting media for mode:', mode);
      const stream = await getMedia(mode);

      if (!peerRef.current) {
        console.error('[Calls:ACCEPT] Peer is null after getUserMedia — aborting');
        stream.getTracks().forEach((t: any) => t.stop());
        acceptingRef.current = false;
        return;
      }

      console.log('[Calls:ACCEPT] Answering call from:', conn.peer);
      conn.answer(stream);

      if (!inCallRef.current) {
        setInCall(true);
        inCallRef.current = true;
        setCallMode(mode);
        callModeRef.current = mode;
        setInitiatorPeerId(callInitiator);
        initiatorPeerIdRef.current = callInitiator;
        setView('call');
        try { InCallManager?.start({ media: mode }); InCallManager?.setKeepScreenOn(true); } catch {}
      }

      setupMediaConnRef.current(conn, conn.peer, userId, name, false);

      // FIX: connect to all existing peers AFTER the stream is confirmed set
      //      by passing it through getMedia and storing in localStreamRef.
      if (meta.existingPeers && meta.existingPeers.length > 0) {
        setTimeout(() => {
          connectMissingPeersRef.current(meta.existingPeers!, callInitiator);
        }, 300);
      }

      acceptingRef.current = false;
    } catch (e: any) {
      console.error('[Calls:ACCEPT] Failed:', e?.message);
      setStatus('Permission denied — allow mic/camera and retry');
      acceptingRef.current = false;
      resetCallState();
    }
  }, [incoming, getMedia, resetCallState]);

  const declineIncoming = useCallback(() => {
    if (!incoming) return;
    ringVibration.stop();
    dismissCallNotification();
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
    try { InCallManager?.setSpeakerphoneOn(next); } catch {}
  }, [speakerOn]);

  const toggleNoiseSup = useCallback(async () => {
    const next = !noiseSup;
    setNoiseSup(next);
    if (!inCall || !localStreamRef.current) return;
    try {
      const ns  = await mediaDevices.getUserMedia({
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
    } catch (e: any) {
      console.error('[Calls:CTRL] toggleNoiseSup failed:', e?.message);
    }
  }, [noiseSup, inCall]);

  const endCall = useCallback(() => {
    console.log('[Calls:END] endCall()');
    broadcastToAll({ type: 'peerLeft', peerId: myPeerIdRef.current });
    // Notify any pending (ringing) peers that we've hung up
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
  }, [broadcastToAll, resetCallState]);

  const removeParticipant = useCallback((pid: string) => {
    // Tell everyone (including the kicked peer) before tearing down
    broadcastToAll({ type: 'kick', peerId: pid });
    const p = participantsRef.current.get(pid);
    if (p?.dataConnection?.open) {
      try { p.dataConnection.send({ type: 'kick', peerId: pid } as MetadataMessage); } catch {}
    }
    if (p) {
      try { p.connection.close();       } catch {}
      try { p.dataConnection?.close();  } catch {}
    }
    activeConnsRef.current.delete(pid);
    participantsRef.current.delete(pid);
    streamReceivedRef.current.delete(pid);
    setParticipants(Array.from(participantsRef.current.values()));
    setSpotlightId(prev => prev === pid ? null : prev);
  }, [broadcastToAll]);

  const callEmployee = useCallback(async (emp: Employee) => {
    console.log('[Calls:CALL] callEmployee:', emp.id, emp.full_name);
    if (!peerRef.current || !peerReady) {
      Alert.alert('Not connected', 'Peer service not ready. Please wait a moment and retry.');
      return;
    }
    const targetPeerId = `u-${emp.id}`;
    if (targetPeerId === myPeerIdRef.current) { setStatus("Can't call yourself"); return; }

    try {
      setStatus(`Calling ${emp.full_name}…`);
      ringVibration.start();
      const stream = await getMedia(callMode);

      if (!peerRef.current) {
        stream.getTracks().forEach((t: any) => t.stop());
        ringVibration.stop();
        setStatus('Connection lost');
        return;
      }

      setInitiatorPeerId(myPeerIdRef.current);
      initiatorPeerIdRef.current = myPeerIdRef.current;
      setInCall(true);
      inCallRef.current = true;
      setView('call');
      try { InCallManager?.start({ media: callMode }); InCallManager?.setKeepScreenOn(true); } catch {}

      const conn = peerRef.current.call(targetPeerId, stream, {
        metadata: {
          mode:            callMode,
          fromName:        myNameRef.current,
          fromUserId:      Number(myIdRef.current),
          initiatorPeerId: myPeerIdRef.current,
        } as CallMetadata,
      });
      setupMediaConnection(conn, targetPeerId, emp.id, emp.full_name, true);
    } catch (e: any) {
      console.error('[Calls:CALL] Failed:', e?.message);
      ringVibration.stop();
      setStatus('Permission denied — allow mic/camera and retry');
      resetCallState();
    }
  }, [peerReady, callMode, getMedia, setupMediaConnection, resetCallState]);

  const startGroupCall = useCallback(async () => {
    if (!peerRef.current || !peerReady || selectedIds.size === 0) return;
    try {
      setStatus('Starting group call…');
      ringVibration.start();
      const stream  = await getMedia(callMode);
      const targets = callPeople.filter(e => selectedIds.has(e.id));

      if (!peerRef.current) {
        stream.getTracks().forEach((t: any) => t.stop());
        ringVibration.stop();
        setStatus('Connection lost');
        return;
      }

      setInitiatorPeerId(myPeerIdRef.current);
      initiatorPeerIdRef.current = myPeerIdRef.current;
      setInCall(true);
      inCallRef.current = true;
      setView('call');
      setGroupMode(false);
      setSelectedIds(new Set());
      try { InCallManager?.start({ media: callMode }); InCallManager?.setKeepScreenOn(true); } catch {}

      // FIX: build the full existingPeers list (self + ALL other targets) so
      //      each invitee knows about every other person in the call.
      const allTargetPeers: GroupPeerInfo[] = [
        { peerId: myPeerIdRef.current, userId: Number(myIdRef.current), name: myNameRef.current },
        ...targets.map(t => ({ peerId: `u-${t.id}`, userId: t.id, name: t.full_name })),
      ];

      for (const emp of targets) {
        const tpid = `u-${emp.id}`;
        const conn = peerRef.current!.call(tpid, stream, {
          metadata: {
            mode:            callMode,
            fromName:        myNameRef.current,
            fromUserId:      Number(myIdRef.current),
            isGroup:         true,
            // Send everyone so callee can mesh-connect to all of them
            existingPeers:   allTargetPeers.filter(p => p.peerId !== tpid),
            initiatorPeerId: myPeerIdRef.current,
          } as CallMetadata,
        });
        setupMediaConnection(conn, tpid, emp.id, emp.full_name, true);
      }
    } catch (e: any) {
      console.error('[Calls:GROUP] Failed:', e?.message);
      ringVibration.stop();
      setStatus('Permission denied');
      resetCallState();
    }
  }, [peerReady, selectedIds, callMode, callPeople, getMedia, setupMediaConnection, resetCallState]);

  const addToCall = useCallback(async (emp: Employee) => {
    if (!peerRef.current || !localStreamRef.current) return;
    const tpid = `u-${emp.id}`;
    if (activeConnsRef.current.has(tpid)) return;

    // FIX: existingPeers = self + all current participants (not including new joiner)
    const existingPeers: GroupPeerInfo[] = getCurrentGroupPeers();

    const conn = peerRef.current.call(tpid, localStreamRef.current, {
      metadata: {
        mode:            callModeRef.current,
        fromName:        myNameRef.current,
        fromUserId:      Number(myIdRef.current),
        isGroup:         true,
        existingPeers,   // new joiner learns about everyone
        initiatorPeerId: initiatorPeerIdRef.current ?? myPeerIdRef.current,
      } as CallMetadata,
    });
    setupMediaConnRef.current(conn, tpid, emp.id, emp.full_name, true);

    // FIX: tell every existing participant about the new joiner AND the full
    //      roster (allPeers) so they can connect to the new person too.
    const allPeers: GroupPeerInfo[] = [
      ...existingPeers,
      { peerId: tpid, userId: emp.id, name: emp.full_name },
    ];
    broadcastToAll({ type: 'newPeer', peer: { peerId: tpid, userId: emp.id, name: emp.full_name }, allPeers });
  }, [getCurrentGroupPeers, broadcastToAll]);

  // ── Android back handler ──────────────────────────────────────────────────
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (view === 'call') {
        Alert.alert('Leave call?', 'Do you want to end the call?', [
          { text: 'Stay',  style: 'cancel' },
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
      console.log('[Calls:APP] AppState:', state);
    });
    return () => sub.remove();
  }, []);

  // ── Notification tap handler ──────────────────────────────────────────────
  useEffect(() => {
    if (!Notifications) return;
    const sub = Notifications.addNotificationResponseReceivedListener((response: any) => {
      const data = response.notification.request.content.data;
      if (data?.type === 'incoming_call') {
        console.log('[Calls:PUSH] Notification tapped — caller:', data.callerName);
      }
    });
    return () => sub.remove();
  }, []);

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

  // ── Grid layout ───────────────────────────────────────────────────────────
  const totalTiles = participants.length + 1;
  const gridCols   = totalTiles <= 1 ? 1 : totalTiles <= 4 ? 2 : 3;
  const tileW      = SW / gridCols;
  const tileH      = tileW * (9 / 16);
  const gridHeight = Math.ceil(totalTiles / gridCols) * tileH;

  const spotlitParticipant = spotlightId && spotlightId !== 'me'
    ? participants.find(p => p.id === spotlightId) ?? null
    : null;
  const spotlitIsLocal = spotlightId === 'me';

  // ── Render HOME ───────────────────────────────────────────────────────────
  const renderHome = () => (
    <SafeAreaView style={s.homeRoot}>
      <StatusBar barStyle="light-content" />
      <Text style={s.homeTitle}>Calls</Text>
      <Text style={s.homeSubtitle}>Connect with your team</Text>
      <View style={s.homeCards}>
        <TouchableOpacity
          style={[s.homeCard, { backgroundColor: '#1a3a6b' }]}
          activeOpacity={0.85}
          onPress={() => { setCallMode('audio'); setSearch(''); setView('employees'); }}
        >
          <View style={s.homeCardIconWrap}>
            <Ionicons name="call" size={32} color="#60a5fa" />
          </View>
          <Text style={s.homeCardTitle}>Voice Call</Text>
          <Text style={s.homeCardSub}>High-quality audio with noise suppression</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.homeCard, { backgroundColor: '#2d1b5e' }]}
          activeOpacity={0.85}
          onPress={() => { setCallMode('video'); setSearch(''); setView('employees'); }}
        >
          <View style={s.homeCardIconWrap}>
            <Ionicons name="videocam" size={32} color="#a78bfa" />
          </View>
          <Text style={s.homeCardTitle}>Video Call</Text>
          <Text style={s.homeCardSub}>Face-to-face HD video with group support</Text>
        </TouchableOpacity>
      </View>
      <View style={s.homePeerBadge}>
        <View style={[s.homePeerDot, { backgroundColor: peerReady ? '#3ba55d' : '#e67700' }]} />
        <Text style={s.homePeerTxt}>
          {peerReady ? `Online · ${myPeerId}` : 'Connecting to peer service…'}
        </Text>
      </View>
      {status !== 'Ready' && (
        <View style={s.statusBanner}>
          <Ionicons name="information-circle-outline" size={14} color="#818cf8" />
          <Text style={s.statusBannerTxt}>{status}</Text>
        </View>
      )}
    </SafeAreaView>
  );

  // ── Render EMPLOYEES ──────────────────────────────────────────────────────
  const renderEmployees = () => (
    <SafeAreaView style={s.empRoot}>
      <StatusBar barStyle="light-content" />
      <View style={s.empHeader}>
        <TouchableOpacity
          onPress={() => { setView('home'); setGroupMode(false); setSelectedIds(new Set()); }}
          style={s.empBack}
        >
          <Ionicons name="chevron-back" size={22} color="#818cf8" />
          <Text style={s.empBackTxt}>Back</Text>
        </TouchableOpacity>
        <Text style={s.empHeaderTitle}>
          {callMode === 'audio' ? 'Voice Call' : 'Video Call'}
        </Text>
        <TouchableOpacity
          style={[s.groupToggle, groupMode && s.groupToggleActive]}
          onPress={() => { setGroupMode(g => !g); setSelectedIds(new Set()); }}
        >
          <Ionicons name="people" size={14} color={groupMode ? '#818cf8' : 'rgba(255,255,255,0.5)'} />
          <Text style={[s.groupToggleTxt, groupMode && { color: '#818cf8' }]}>Group</Text>
        </TouchableOpacity>
      </View>

      {groupMode && (
        <View style={s.groupBar}>
          <Text style={s.groupBarTxt}>{selectedIds.size} selected</Text>
          <TouchableOpacity
            style={[s.groupStartBtn, (selectedIds.size === 0 || !peerReady) && { opacity: 0.4 }]}
            onPress={startGroupCall}
            disabled={selectedIds.size === 0 || !peerReady}
          >
            <Text style={s.groupStartBtnTxt}>Start Group Call</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={s.searchWrap}>
        <Ionicons name="search" size={16} color="rgba(255,255,255,0.4)" />
        <TextInput
          style={s.searchInput}
          placeholder="Search people…"
          placeholderTextColor="rgba(255,255,255,0.35)"
          value={search}
          onChangeText={setSearch}
        />
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
              <TouchableOpacity
                style={s.empItem}
                activeOpacity={0.75}
                onPress={() => {
                  if (groupMode) {
                    setSelectedIds(prev => {
                      const n = new Set(prev);
                      n.has(emp.id) ? n.delete(emp.id) : n.add(emp.id);
                      return n;
                    });
                  }
                }}
              >
                {groupMode && (
                  <View style={[s.checkbox, isSelected && s.checkboxChecked]}>
                    {isSelected && <Ionicons name="checkmark" size={13} color="#fff" />}
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
                  <TouchableOpacity
                    style={[s.callBtnSm, !peerReady && { opacity: 0.4 }]}
                    disabled={!peerReady}
                    onPress={() => callEmployee(emp)}
                  >
                    <Ionicons name="call" size={18} color="#fff" />
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

      {/* Header */}
      <SafeAreaView style={s.callHeader}>
        <View style={s.callHeaderInner}>
          <View style={s.callDot} />
          <View style={{ flex: 1 }}>
            <Text style={s.callHeaderTitle} numberOfLines={1}>
              {participants.length >= 1
                ? `Group · ${participants.length + 1} people`
                : (participants[0]?.name ?? 'Connecting…')}
              {amInitiator ? '  ★' : ''}
            </Text>
            <Text style={s.callHeaderSub}>
              {callDuration > 0 ? fmt(callDuration) : 'Connecting…'}  ·  {status}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setAddPanelOpen(v => !v)} style={s.addBtn}>
            <Ionicons name={addPanelOpen ? 'close' : 'person-add'} size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Video / Audio area */}
      <View style={{ flex: 1 }}>
        {callMode === 'video' ? (
          spotlightId ? (
            <View style={{ flex: 1 }}>
              <View style={{ flex: 1 }}>
                {spotlitIsLocal ? (
                  <VideoTile
                    stream={localStream} name={myName} isLocal videoOff={cameraOff}
                    muted={micMuted} netQuality="good" isSpotlit isSharing={false}
                    onPress={() => setSpotlightId(null)} amInitiator={amInitiator}
                    frontCamera={frontCamera} tileWidth={SW} tileHeight={SH * 0.6}
                  />
                ) : spotlitParticipant ? (
                  <VideoTile
                    stream={spotlitParticipant.stream} name={spotlitParticipant.name}
                    isLocal={false} videoOff={spotlitParticipant.videoOff}
                    muted={spotlitParticipant.muted} netQuality={spotlitParticipant.netQuality}
                    isSpotlit isSharing={spotlitParticipant.isScreenSharing}
                    onPress={() => setSpotlightId(null)}
                    onRemove={() => removeParticipant(spotlitParticipant.id)}
                    amInitiator={amInitiator} frontCamera={frontCamera}
                    tileWidth={SW} tileHeight={SH * 0.6}
                  />
                ) : null}
              </View>
              {/* Thumbnail strip */}
              <ScrollView
                horizontal
                style={s.strip}
                contentContainerStyle={{ gap: 6, padding: 8 }}
                showsHorizontalScrollIndicator={false}
              >
                {spotlightId !== 'me' && (
                  <TouchableOpacity style={s.stripTile} onPress={() => setSpotlightId('me')}>
                    {localStream && !cameraOff && RTCView ? (
                      <RTCView
                        streamURL={localStream.toURL()}
                        style={StyleSheet.absoluteFillObject}
                        objectFit="cover"
                        mirror={frontCamera}
                        zOrder={0}
                      />
                    ) : (
                      <Avatar name={myName} size={30} />
                    )}
                    <View style={s.tileOverlay}>
                      <Text style={[s.tileName, { fontSize: 9 }]}>You</Text>
                    </View>
                  </TouchableOpacity>
                )}
                {participants.filter(p => p.id !== spotlightId).map(p => (
                  <TouchableOpacity key={p.id} style={s.stripTile} onPress={() => setSpotlightId(p.id)}>
                    {p.stream && !p.videoOff && RTCView ? (
                      <RTCView
                        streamURL={p.stream.toURL()}
                        style={StyleSheet.absoluteFillObject}
                        objectFit="cover"
                        zOrder={1}
                      />
                    ) : (
                      <Avatar name={p.name} size={30} />
                    )}
                    <View style={s.tileOverlay}>
                      <Text style={[s.tileName, { fontSize: 9 }]} numberOfLines={1}>{p.name}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={s.spotlightHint}>
                <Ionicons name="information-circle-outline" size={12} color="rgba(255,255,255,0.4)" />
                <Text style={s.spotlightHintTxt}>Tap main video to exit spotlight</Text>
              </View>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ minHeight: Math.max(gridHeight, SH * 0.52) }}>
              {totalTiles > 1 && (
                <View style={s.spotlightHint}>
                  <Ionicons name="expand-outline" size={12} color="rgba(255,255,255,0.4)" />
                  <Text style={s.spotlightHintTxt}>Tap any tile to go fullscreen</Text>
                </View>
              )}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                <VideoTile
                  stream={localStream} name={myName} isLocal videoOff={cameraOff}
                  muted={micMuted} netQuality="good" isSpotlit={false}
                  onPress={() => setSpotlightId('me')}
                  amInitiator={amInitiator} frontCamera={frontCamera}
                  tileWidth={tileW} tileHeight={tileH}
                />
                {participants.map(p => (
                  <VideoTile
                    key={p.id} stream={p.stream} name={p.name} isLocal={false}
                    videoOff={p.videoOff} muted={p.muted} netQuality={p.netQuality}
                    isSpotlit={false} isSharing={p.isScreenSharing}
                    onPress={() => setSpotlightId(p.id)}
                    onRemove={() => removeParticipant(p.id)}
                    amInitiator={amInitiator} frontCamera={frontCamera}
                    tileWidth={tileW} tileHeight={tileH}
                  />
                ))}
              </View>
            </ScrollView>
          )
        ) : (
          // Audio view
          <View style={s.audioStage}>
            <ScrollView contentContainerStyle={s.audioGrid}>
              <AudioCircle
                name={`You${amInitiator ? ' ★' : ''}`}
                muted={micMuted}
                active={!micMuted}
                amInitiator={false}
              />
              {participants.map(p => (
                <AudioCircle
                  key={p.id} name={p.name} muted={p.muted} active={!p.muted}
                  amInitiator={amInitiator} onRemove={() => removeParticipant(p.id)}
                />
              ))}
            </ScrollView>
            <Text style={s.audioDuration}>{callDuration > 0 ? fmt(callDuration) : 'Connecting…'}</Text>
            {participants.length > 0 && (
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 8, justifyContent: 'center' }}>
                {participants.map(p => (
                  <View key={p.id} style={{ alignItems: 'center', gap: 2 }}>
                    <NetBadge quality={p.netQuality} />
                    <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }} numberOfLines={1}>
                      {p.name.split(' ')[0]}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>

      {/* Controls */}
      <SafeAreaView style={s.controlsBar}>
        <View style={s.controls}>
          <CtrlBtn
            label={micMuted ? 'Unmute' : 'Mute'}
            iconName={micMuted ? 'mic-off' : 'mic'}
            onPress={toggleMic}
            active={micMuted}
          />
          {callMode === 'video' && (
            <CtrlBtn
              label={cameraOff ? 'Cam On' : 'Cam Off'}
              iconName={cameraOff ? 'videocam-off' : 'videocam'}
              onPress={toggleCamera}
              active={cameraOff}
            />
          )}
          {callMode === 'video' && (
            <CtrlBtn label="Flip" iconName="camera-reverse" onPress={flipCamera} />
          )}
          <CtrlBtn
            label={speakerOn ? 'Earpiece' : 'Speaker'}
            iconName={speakerOn ? 'volume-high' : 'volume-medium'}
            onPress={toggleSpeaker}
            active={speakerOn}
          />
          <CtrlBtn
            label={noiseSup ? 'Noise On' : 'Noise Off'}
            iconName="options"
            onPress={toggleNoiseSup}
            active={noiseSup}
          />
          <CtrlBtn
            label="End"
            iconName="call"
            danger
            large
            onPress={() => {
              Alert.alert('End call', 'Are you sure you want to end the call?', [
                { text: 'Cancel',   style: 'cancel' },
                { text: 'End Call', style: 'destructive', onPress: endCall },
              ]);
            }}
          />
        </View>
      </SafeAreaView>

      {/* Add people panel */}
      {addPanelOpen && (
        <View style={s.addPanel}>
          <Text style={s.addPanelTitle}>Add to call  ({participants.length + 1} in call)</Text>
          <View style={s.searchWrap}>
            <Ionicons name="search" size={14} color="rgba(255,255,255,0.4)" />
            <TextInput
              style={[s.searchInput, { fontSize: 12 }]}
              placeholder="Search people to add…"
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={addSearch}
              onChangeText={setAddSearch}
            />
          </View>
          <FlatList
            data={filteredForAdd.slice(0, 10)}
            keyExtractor={e => String(e.id)}
            style={{ maxHeight: 220 }}
            ListEmptyComponent={<Text style={[s.emptyTxt, { padding: 12 }]}>No people found</Text>}
            renderItem={({ item: emp }) => {
              const epid     = `u-${emp.id}`;
              const isOnCall = activeConnPids.has(epid);
              return (
                <View style={[s.empItem, { paddingVertical: 7 }]}>
                  <Avatar name={emp.full_name} size={32} />
                  <View style={s.empInfo}>
                    <Text style={[s.empName, { fontSize: 12 }]}>{emp.full_name}</Text>
                    {emp.position && (
                      <Text style={[s.empSub, { fontSize: 10 }]} numberOfLines={1}>{emp.position}</Text>
                    )}
                  </View>
                  {isOnCall ? (
                    <View style={s.onCallBadge}>
                      <Text style={s.onCallBadgeTxt}>On call</Text>
                    </View>
                  ) : (
                    <TouchableOpacity style={s.addBtnSm} onPress={() => addToCall(emp)}>
                      <Ionicons name="person-add" size={14} color="#fff" />
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
      {incoming && !acceptingRef.current && (
        <IncomingCallModal
          incoming={incoming}
          onAccept={acceptIncoming}
          onDecline={declineIncoming}
        />
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
  homeTitle:         { fontSize: 30, fontWeight: '800', color: '#fff', marginTop: 16, letterSpacing: -0.5 },
  homeSubtitle:      { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 28, marginTop: 4 },
  homeCards:         { gap: 14 },
  homeCard:          {
    borderRadius: 18, padding: 22, gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  homeCardIconWrap:  { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  homeCardTitle:     { fontSize: 20, fontWeight: '700', color: '#fff' },
  homeCardSub:       { fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 18 },
  homePeerBadge:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  homePeerDot:       { width: 8, height: 8, borderRadius: 4 },
  homePeerTxt:       { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  statusBanner:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, backgroundColor: 'rgba(88,101,242,0.1)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(88,101,242,0.2)' },
  statusBannerTxt:   { fontSize: 12, color: 'rgba(255,255,255,0.55)', flex: 1 },

  empRoot:           { flex: 1, backgroundColor: '#080810', paddingTop: 25 },
  empHeader:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)', gap: 8 },
  empBack:           { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 4 },
  empBackTxt:        { fontSize: 15, color: '#818cf8', fontWeight: '600' },
  empHeaderTitle:    { flex: 1, fontSize: 15, fontWeight: '700', color: '#fff', textAlign: 'center' },
  groupToggle:       { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  groupToggleActive: { borderColor: '#818cf8', backgroundColor: 'rgba(88,101,242,0.15)' },
  groupToggleTxt:    { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  groupBar:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: 'rgba(88,101,242,0.08)', borderBottomWidth: 1, borderBottomColor: 'rgba(88,101,242,0.2)' },
  groupBarTxt:       { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  groupStartBtn:     { backgroundColor: '#5865f2', borderRadius: 9, paddingHorizontal: 16, paddingVertical: 8 },
  groupStartBtnTxt:  { fontSize: 13, fontWeight: '700', color: '#fff' },
  searchWrap:        { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 10 : 4 },
  searchIcon:        { fontSize: 14 },
  searchInput:       { flex: 1, color: '#fff', fontSize: 14 },
  empItem:           { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  empInfo:           { flex: 1 },
  empName:           { fontSize: 14, fontWeight: '600', color: '#fff' },
  empSub:            { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  callBtnSm:         { width: 38, height: 38, borderRadius: 19, backgroundColor: '#2f9e44', alignItems: 'center', justifyContent: 'center' },
  checkbox:          { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked:   { backgroundColor: '#5865f2', borderColor: '#5865f2' },
  emptyTxt:          { textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14, marginTop: 40 },

  callRoot:          { flex: 1, backgroundColor: '#050507' },
  callHeader:        { backgroundColor: 'rgba(0,0,0,0.65)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  callHeaderInner:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10 },
  callDot:           { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3ba55d' },
  callHeaderTitle:   { fontSize: 14, fontWeight: '700', color: '#fff' },
  callHeaderSub:     { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 },
  addBtn:            { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },

  videoTile:         { backgroundColor: '#0d0d12', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center' },
  videoTileSpotlit:  { borderWidth: 2, borderColor: '#5865f2' },
  camOffFill:        { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0d0d12' },
  camOffText:        { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  tileBadges:        { position: 'absolute', top: 8, right: 8, flexDirection: 'row', gap: 6, alignItems: 'center', zIndex: 2 },
  pinBadge:          { backgroundColor: '#5865f2', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  pinBadgeTxt:       { fontSize: 9, fontWeight: '800', color: '#fff' },
  tileRemoveBtn:     { position: 'absolute', top: 8, left: 8, zIndex: 5, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(237,66,69,0.85)', alignItems: 'center', justifyContent: 'center' },
  tileOverlay:       { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 8, paddingVertical: 5, backgroundColor: 'rgba(0,0,0,0.55)', flexDirection: 'row', alignItems: 'center', gap: 4, zIndex: 2 },
  tileName:          { fontSize: 11, fontWeight: '600', color: '#fff', flex: 1 },
  tileIconRed:       { width: 16, height: 16, borderRadius: 3, backgroundColor: 'rgba(237,66,69,0.8)', alignItems: 'center', justifyContent: 'center' },

  strip:             { backgroundColor: '#0a0a0f', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', flexShrink: 0, maxHeight: 108 },
  stripTile:         { width: 148, height: 88, borderRadius: 8, overflow: 'hidden', backgroundColor: '#0d0d12', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  spotlightHint:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: 'rgba(0,0,0,0.4)' },
  spotlightHintTxt:  { fontSize: 10, color: 'rgba(255,255,255,0.35)' },

  audioStage:        { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#080810', paddingVertical: 24 },
  audioGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 20, justifyContent: 'center', paddingHorizontal: 20 },
  audioCircle:       { alignItems: 'center', gap: 8, width: 100, position: 'relative' },
  audioRing:         { borderRadius: 44, padding: 4, borderWidth: 2, borderColor: 'transparent' },
  audioRingActive:   { borderColor: '#3ba55d', shadowColor: '#3ba55d', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 10, elevation: 6 },
  audioName:         { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.7)', textAlign: 'center', maxWidth: 90 },
  audioRemove:       { position: 'absolute', top: -4, right: -4, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(237,66,69,0.9)', alignItems: 'center', justifyContent: 'center', zIndex: 5 },
  audioDuration:     { marginTop: 20, fontSize: 20, color: 'rgba(255,255,255,0.5)', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', letterSpacing: 2 },

  controlsBar:       { backgroundColor: 'rgba(5,5,7,0.97)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  controls:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 14, gap: 8, flexWrap: 'wrap' },
  ctrlWrap:          { alignItems: 'center', gap: 5 },
  ctrlBtn:           { alignItems: 'center', justifyContent: 'center' },
  ctrlIcon:          { fontSize: 20, color: '#fff' },
  ctrlLabel:         { fontSize: 9, color: 'rgba(255,255,255,0.45)', textAlign: 'center' },

  addPanel:          { position: 'absolute', bottom: 90, left: 0, right: 0, backgroundColor: '#11111a', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingTop: 12, maxHeight: SH * 0.55, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 12 },
  addPanelTitle:     { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', paddingHorizontal: 16, marginBottom: 4 },
  addBtnSm:          { width: 32, height: 32, borderRadius: 16, backgroundColor: '#5865f2', alignItems: 'center', justifyContent: 'center' },
  onCallBadge:       { backgroundColor: 'rgba(59,165,93,0.12)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(59,165,93,0.3)', paddingHorizontal: 8, paddingVertical: 3 },
  onCallBadgeTxt:    { fontSize: 10, fontWeight: '700', color: '#3ba55d' },

  incomingBg:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.82)', alignItems: 'center', justifyContent: 'center' },
  incomingCard:      { backgroundColor: '#14141e', borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', padding: 32, width: SW * 0.85, alignItems: 'center', gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.7, shadowRadius: 24, elevation: 20 },
  incomingIconRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  incomingLabel:     { fontSize: 13, fontWeight: '600', color: '#818cf8' },
  incomingName:      { fontSize: 24, fontWeight: '800', color: '#fff', textAlign: 'center' },
  incomingHint:      { fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 10 },
  incomingActions:   { flexDirection: 'row', gap: 14, width: '100%', marginTop: 6 },
  incomingBtn:       { flex: 1, borderRadius: 40, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  acceptBtn:         { backgroundColor: '#2f9e44' },
  declineBtn:        { backgroundColor: '#ed4245' },
  incomingBtnText:   { fontSize: 15, fontWeight: '700', color: '#fff' },
});