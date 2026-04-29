// features/chat/chatTypes.ts
import { User } from '@/features/auth/types';
import { Alert } from 'react-native';

export type Id = string | number;
export type WSStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export type CurrentUser = User;
export type Employee = {
  id?: Id; employee_id?: Id; user_id?: Id; pk?: Id;
  full_name?: string; name?: string; employee_name?: string;
  first_name?: string; last_name?: string;
  designation?: string; role?: string; position?: string; job_title?: string;
  department_name?: string; department?: string;
  avatar?: string; profile_picture?: string; profile_image?: string; profile_image_url?: string;
  online_status?: { is_online?: boolean; last_seen?: string; last_seen_human?: string };
  user?: { id?: Id; full_name?: string; username?: string; name?: string };
  [key: string]: unknown;
};

export type RoomParticipant = {
  id?: Id; employee?: Employee; role?: 'admin' | 'member';
  joined_at?: string; is_active?: boolean; is_muted?: boolean;
  last_read_message?: Id;
};

export type Room = {
  id?: Id; room_id?: Id; room_type?: 'direct' | 'group';
  name?: string; description?: string; group_icon?: string;
  display_name?: string; display_icon?: string;
  created_by?: Employee;
  participants?: Employee[];
  room_participants?: RoomParticipant[];
  last_message?: Message | null;
  unread_count?: number;
  pinned_message?: Message | null;
  created_at?: string; updated_at?: string;
  [key: string]: unknown;
};

export type Message = {
  id?: Id; msg_id?: Id; message_id?: Id;
  room?: Id;
  content?: string; text?: string; message?: string; body?: string;
  message_type?: 'text' | 'image' | 'file' | 'audio' | 'video' | 'system';
  sender?: Employee; sender_id?: Id;
  reply_to?: Message | null;
  is_forwarded?: boolean; is_edited?: boolean; edited_at?: string;
  is_deleted?: boolean; is_pinned?: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'seen';
  tick_status?: string;
  file?: string; file_url?: string; file_name?: string; file_size?: number;
  thumbnail?: string; thumbnail_url?: string; duration?: number;
  reactions?: Reaction[];
  receipts?: Receipt[];
  created_at?: string; updated_at?: string; timestamp?: string; sent_at?: string;
  isPending?: boolean;
  [key: string]: unknown;
};

export type Reaction = { id?: Id; emoji?: string; employee?: Employee; count?: number };
export type Receipt = { id?: Id; recipient?: Employee; status?: string; timestamp?: string };
export type Notification = {
  id?: Id; sender?: Employee; room?: Room; message?: Message;
  notification_type?: string; is_read?: boolean; created_at?: string;
};

// Config
export const SERVER_BASE = process.env.EXPO_PUBLIC_SERVER_BACKEND_URL || "http://localhost:8000";
export const ACCOUNTS_API = `${SERVER_BASE}/accounts`;
export const WS_BASE = SERVER_BASE.replace('https://', 'wss://').replace('http://', 'ws://') + '/ws/chat';
export const CLOUDINARY_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_PRESET || 'ml_default';
export const CLOUDINARY_CLOUD = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD || 'your_cloud_name';
export const EDIT_TIME_LIMIT_MS = 15 * 60 * 1000;
export const MAX_MESSAGE_LENGTH = 1000;

// ID / Name helpers
export const empId = (e?: Employee | CurrentUser | null): Id | null =>
  (e as Employee)?.id ?? (e as Employee)?.employee_id ?? (e as Employee)?.user_id ?? (e as Employee)?.pk ?? null;

export const empName = (e?: Employee | CurrentUser | null): string => {
  if (!e) return 'User';
  const n = (e as Employee).full_name || (e as Employee).name || (e as Employee).employee_name ||
    (e as CurrentUser)?.first_name || e?.first_name ||
    [e?.first_name, e?.last_name].filter(Boolean).join(' ').trim() ||
    ((e as Employee)?.user as Employee)?.full_name ||
    ((e as Employee)?.user as Employee)?.username ||
    (e as Employee).username;
  return (n as string) || `User #${String(empId(e) ?? '?')}`;
};

export const empRole = (e?: Employee | CurrentUser | null) =>
  (  e?.role || e?.position || e?.department || '') as string;

export const empAvatar = (e?: Employee | CurrentUser | null): string | null =>
  ((e as CurrentUser)?.profile_image_url || (e as CurrentUser)?.profile_image ||
    (e as Employee)?.avatar || (e as Employee)?.profile_picture) as string | null || null;

export const empInitials = (e?: Employee | CurrentUser | null) => {
  const p = empName(e).split(' ');
  return ((p[0]?.[0] || 'U') + (p[1]?.[0] || '')).toUpperCase();
};

export const roomId = (r?: Room | null): Id | null => r?.id ?? r?.room_id ?? null;

export const roomName = (r?: Room | null, meId?: Id | null): string => {
  if (!r) return 'Chat';
  if (r.display_name) return r.display_name as string;
  if (r.name && r.room_type === 'group') return r.name as string;
  if (r.room_type === 'direct') {
    const o = (r.participants || []).find(p => String(empId(p)) !== String(meId));
    if (o) return empName(o);
    const rp = (r.room_participants || []).find(p => String(empId(p.employee)) !== String(meId));
    if (rp?.employee) return empName(rp.employee);
  }
  return r.name as string || `Room #${roomId(r)}`;
};

export const roomIcon = (r?: Room | null, meId?: Id | null): string | null => {
  if (!r) return null;
  if (r.display_icon) return r.display_icon as string;
  if (r.room_type === 'group' && r.group_icon) return r.group_icon as string;
  if (r.room_type === 'direct') {
    const o = (r.participants || []).find(p => String(empId(p)) !== String(meId));
    if (o) return empAvatar(o);
    const rp = (r.room_participants || []).find(p => String(empId(p.employee)) !== String(meId));
    if (rp?.employee) return empAvatar(rp.employee);
  }
  return null;
};

export const msgId = (m?: Message | null): Id | null => m?.id ?? m?.msg_id ?? m?.message_id ?? null;
export const msgText = (m?: Message | null) => m?.content ?? m?.text ?? m?.message ?? m?.body ?? '';

export const senderId = (m?: Message | null): Id | null => {
  if (!m) return null;
  if (m.sender) {
    const sid = (m.sender as Employee).id ?? (m.sender as Employee).employee_id ??
      (m.sender as Employee).user_id ?? (m.sender as Employee).pk;
    if (sid != null) return sid;
  }
  return m.sender_id ?? null;
};

export const isMineMsg = (msg: Message, meId: Id | null): boolean => {
  if (meId == null) return false;
  const sid = senderId(msg);
  if (sid != null) return String(sid) === String(meId);
  if (msg.sender) {
    const s = msg.sender as Employee;
    for (const f of [s.id, s.employee_id, s.user_id, s.pk]) {
      if (f != null && String(f) === String(meId)) return true;
    }
  }
  return false;
};

export const fmtTime = (v?: string | null) => {
  if (!v) return '';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const fmtDate = (v?: string | null) => {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d.getTime())) return '';
  const today = new Date(); const yest = new Date(today); yest.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yest.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
};

export const fmtSize = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

export const fmtSecs = (s: number) =>
  `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

export const msgTs = (m: Message) => m.created_at || m.timestamp || m.sent_at;

export const canEdit = (m: Message) => {
  const ts = msgTs(m);
  return ts ? Date.now() - new Date(ts).getTime() < EDIT_TIME_LIMIT_MS : false;
};

export const normalizeList = <T,>(data: unknown): T[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  const r = (data as { results?: T[] }).results;
  return Array.isArray(r) ? r : [];
};

export const flattenEmployees = (node: unknown): Employee[] => {
  if (!node) return [];
  if (Array.isArray(node)) return node.flatMap(flattenEmployees);
  if (typeof node === 'object' && node !== null) {
    const obj = node as Record<string, unknown>;
    if (Array.isArray(obj.results)) return flattenEmployees(obj.results);
    const kids = obj.children || obj.subordinates || obj.reports || obj.teams || obj.employees || [];
    const self = obj.id || obj.employee_id ? [obj as Employee] : [];
    return [...self, ...flattenEmployees(kids)];
  }
  return [];
};

export const cdnUrl = (url: string, w?: number) => {
  if (!url || !url.includes('cloudinary.com')) return url;
  const p = url.split('/upload/');
  if (p.length !== 2) return url;
  const t = ['f_auto', 'q_auto', ...(w ? [`w_${w}`] : [])].join(',');
  return `${p[0]}/upload/${t}/${p[1]}`;
};

export const parseSystemMessage = (raw: string): string => {
  if (!raw) return raw;
  if (raw.includes('created the group')) {
    const match = raw.match(/created the group "([^"]+)"/);
    return match ? `Group "${match[1]}" was created` : 'Group was created';
  }
  if (raw.includes('added')) return 'New member added to the group';
  if (raw.includes('removed')) return 'A member was removed from the group';
  if (raw.includes('left')) return 'A member left the group';
  const base64Regex = /^[A-Za-z0-9+/=_\-]{30,}/;
  if (base64Regex.test(raw.replace(/\s/g, ''))) return 'Group activity';
  return raw;
};

export const confirmAction = (msg: string, onConfirm: () => void) => {
  Alert.alert('Confirm', msg, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'OK', onPress: onConfirm, style: 'destructive' },
  ]);
};

export async function uploadToCloudinary(
  fileUri: string, fileName: string, fileType: string,
  onPct?: (p: number) => void,
): Promise<{ secure_url: string; original_filename: string; bytes: number }> {
  const fd = new FormData();
  fd.append('file', { uri: fileUri, name: fileName, type: fileType } as unknown as Blob);
  fd.append('upload_preset', CLOUDINARY_PRESET);
  fd.append('folder', 'chat_media');
  const rtype = fileType.startsWith('video') ? 'video' : fileType.startsWith('image') ? 'image' : 'raw';

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/${rtype}/upload`);
    xhr.upload.onprogress = e => { if (e.lengthComputable && onPct) onPct(Math.round(e.loaded / e.total * 100)); };
    xhr.onload = () => xhr.status === 200 ? resolve(JSON.parse(xhr.responseText)) : reject(new Error('Upload failed'));
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(fd);
  });
}

export const QUICK_EMOJI = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🎉', '🔥'];

export const EMOJI_LIST = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😍', '🥰', '😘',
  '😋', '😛', '😜', '🤪', '🤑', '🤗', '🤔', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '😔',
  '😪', '😴', '😷', '🤒', '🤕', '🥵', '🥶', '😵', '🤯', '🤠', '🥳', '🤩', '👍', '👎', '👌',
  '✌️', '🤞', '🤟', '🤘', '👏', '🙌', '🤝', '🙏', '💪', '❤️', '🧡', '💛', '💚', '💙', '💜',
  '🖤', '💔', '💕', '💞', '💓', '💗', '💖', '💯', '🎉', '🎊', '🎈', '🏆', '🥇', '🎵', '🎶',
  '🔥', '⭐', '✨', '💫', '🌈', '🍕', '🍔', '☕', '🧋', '⚽', '🏀', '🎮', '🎲', '👋', '✋',
];