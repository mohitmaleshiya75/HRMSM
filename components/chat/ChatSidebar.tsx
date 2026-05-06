// // features/chat/components/ChatSidebar.tsx
// import { Feather } from '@expo/vector-icons';
// import React, { useEffect, useMemo, useRef, useState } from 'react';
// import {
//   ActivityIndicator,
//   Animated, Dimensions,
//   FlatList,
//   Modal,
//   Platform,
//   StatusBar,
//   StyleSheet,
//   Text, TextInput, TouchableOpacity,
//   View,
// } from 'react-native';
// import Avatar from './Avatar';
// import {
//   Employee,
//   Id,
//   Room,
//   empId, empName, empRole,
//   fmtTime, msgText,
//   roomIcon,
//   roomId, roomName,
// } from './chatTypes';
// import { Colors } from './Colors';

// const { width: SCREEN_WIDTH } = Dimensions.get('window');
// const SIDEBAR_WIDTH = Math.min(320, SCREEN_WIDTH * 0.85);

// interface ChatSidebarProps {
//   employees: Employee[];
//   rooms: Room[];
//   meId: Id | null;
//   selectedRoomId: Id | null;
//   loading: boolean;
//   unreadMap: Record<string, number>;
//   mutedRooms: Set<string>;
//   visible: boolean;
//   onClose: () => void;
//   onSelect: (t: Employee | Room) => void;
//   onCreateGroup: () => void;
//   onRefresh: () => void;
//   inline?: boolean;
// }

// export default function ChatSidebar({
//   employees, rooms, meId, selectedRoomId, loading,
//   unreadMap, mutedRooms, visible, onClose, onSelect, onCreateGroup, onRefresh,
//   inline = false,
// }: ChatSidebarProps) {
//   const [tab, setTab] = useState<'chats' | 'people'>('chats');
//   const [q, setQ] = useState('');
//   const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;

//   useEffect(() => {
//     if (inline) return;
//     Animated.spring(slideAnim, {
//       toValue: visible ? 0 : -SIDEBAR_WIDTH,
//       useNativeDriver: Platform.OS !== 'web',
//       bounciness: 0,
//       speed: 20,
//     }).start();
//   }, [visible, inline]);

//   const filteredRooms = useMemo(() => {
//     if (!q) return rooms;
//     return rooms.filter(r => roomName(r, meId).toLowerCase().includes(q.toLowerCase()));
//   }, [rooms, q, meId]);

//   const filteredEmps = useMemo(() => employees.filter(e =>
//     String(empId(e)) !== String(meId) &&
//     (empName(e).toLowerCase().includes(q.toLowerCase()) ||
//       empRole(e).toLowerCase().includes(q.toLowerCase()))
//   ), [employees, q, meId]);

//   const totalUnread = Object.values(unreadMap).reduce((a, b) => a + b, 0);

//   const interior = (
//     <>
//           <StatusBar backgroundColor={Colors.headerBg} barStyle="light-content" />

//           {/* Header */}
//           <View style={styles.header}>
//             <View style={styles.headerRow}>
//               <View style={styles.headerLeft}>
//                 <Feather name="message-square" size={20} color={Colors.white} />
//                 <Text style={styles.headerTitle}>Messages</Text>
//                 {totalUnread > 0 && (
//                   <View style={styles.badge}>
//                     <Text style={styles.badgeText}>{totalUnread > 99 ? '99+' : totalUnread}</Text>
//                   </View>
//                 )}
//               </View>
//               <View style={styles.headerActions}>
//                 <TouchableOpacity onPress={onRefresh} style={styles.iconBtn}>
//                   <Feather name="rotate-cw" size={16} color={Colors.white} />
//                 </TouchableOpacity>
//                 <TouchableOpacity onPress={onCreateGroup} style={styles.groupBtn}>
//                   <Feather name="plus" size={13} color={Colors.white} />
//                   <Text style={styles.groupBtnText}>Group</Text>
//                 </TouchableOpacity>
//                 {!inline && (
//                   <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
//                     <Feather name="x" size={18} color={Colors.white} />
//                   </TouchableOpacity>
//                 )}
//               </View>
//             </View>

//             <View style={styles.searchRow}>
//               <Feather name="search" size={14} color={Colors.white} style={styles.searchIcon} />
//               <TextInput
//                 value={q}
//                 onChangeText={setQ}
//                 placeholder="Search…"
//                 placeholderTextColor="rgba(255,255,255,0.6)"
//                 style={styles.searchInput}
//               />
//             </View>
//           </View>

//           {/* Tabs */}
//           <View style={styles.tabs}>
//             {(['chats', 'people'] as const).map(t => (
//               <TouchableOpacity
//                 key={t}
//                 onPress={() => setTab(t)}
//                 style={[styles.tab, tab === t && styles.tabActive]}
//               >
//                 {t === 'chats' ? (
//                   <Feather name="hash" size={13} color={tab === t ? Colors.primary : Colors.textSecondary} />
//                 ) : (
//                   <Feather name="users" size={13} color={tab === t ? Colors.primary : Colors.textSecondary} />
//                 )}
//                 <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
//                   {t === 'chats' ? 'Chats' : 'People'}
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </View>

//           {/* List */}
//           {loading ? (
//             <View style={styles.center}>
//               <ActivityIndicator size="large" color={Colors.primary} />
//               <Text style={[styles.loadingText, { marginTop: 12 }]}>Loading…</Text>
//             </View>
//           ) : tab === 'chats' ? (
//             <FlatList
//               style={{ flex: 1,marginBottom: 20 }}
//               data={filteredRooms}
//               keyExtractor={r => String(roomId(r) ?? Math.random())}
//               renderItem={({ item: r }) => {
//                 const rid = String(roomId(r) ?? '');
//                 const unread = unreadMap[rid] || 0;
//                 const last = r.last_message;
//                 const active = rid === String(selectedRoomId ?? '');
//                 const muted = mutedRooms.has(rid);
//                 return (
//                   <TouchableOpacity
//                     style={[styles.roomItem, active && styles.roomItemActive]}
//                     onPress={() => { onSelect(r); onClose(); }}
//                   >
//                     <View style={styles.avatarWrap}>
//                       <Avatar src={roomIcon(r, meId)} initials={roomName(r, meId).slice(0, 2).toUpperCase()} size="md" />
//                       {r.room_type === 'group' && (
//                         <View style={styles.groupBadge}><Feather name="users" size={8} color={Colors.white} /></View>
//                       )}
//                     </View>
//                     <View style={styles.roomInfo}>
//                       <View style={styles.roomRow}>
//                         <View style={styles.roomNameRow}>
//                           <Text style={styles.roomName} numberOfLines={1}>{roomName(r, meId)}</Text>
//                           {muted && <Feather name="bell-off" size={10} color={Colors.textLight} />}
//                         </View>
//                         <Text style={styles.roomTime}>{fmtTime(r.updated_at as string)}</Text>
//                       </View>
//                       <View style={styles.roomRow}>
//                         <Text style={styles.roomPreview} numberOfLines={1}>
//                           {last?.is_deleted ? '🗑 Deleted'
//                             : last?.message_type === 'image' ? '📷 Photo'
//                               : last?.message_type === 'file' ? '📎 File'
//                                 : last?.message_type === 'audio' ? '🎵 Audio'
//                                   : last?.message_type === 'video' ? '🎬 Video'
//                                     : last ? (msgText(last) || '…') : 'No messages yet'}
//                         </Text>
//                         {unread > 0 && (
//                           <View style={[styles.unreadBadge, muted && styles.unreadBadgeMuted]}>
//                             <Text style={styles.unreadText}>{unread > 99 ? '99+' : unread}</Text>
//                           </View>
//                         )}
//                       </View>
//                     </View>
//                   </TouchableOpacity>
//                 );
//               }}
//               ListEmptyComponent={
//                 <View style={styles.center}>
//                   <Text style={styles.emptyText}>{q ? `No results for "${q}"` : 'No conversations yet.'}</Text>
//                 </View>
//               }
//             />
//           ) : (
//             <FlatList
//               style={{ flex: 1 }}
//               data={filteredEmps}
//               keyExtractor={e => String(empId(e) ?? Math.random())}
//               renderItem={({ item: e }) => {
//                 const online = e.online_status?.is_online === true;
//                 return (
//                   <TouchableOpacity
//                     style={styles.roomItem}
//                     onPress={() => { onSelect(e); onClose(); }}
//                   >
//                     <Avatar src={e.avatar as string} initials={empName(e).slice(0, 2).toUpperCase()} size="md" online={online} />
//                     <View style={styles.empInfo}>
//                       <Text style={styles.empName} numberOfLines={1}>{empName(e)}</Text>
//                       <Text style={styles.empRole} numberOfLines={1}>{empRole(e) || 'Team Member'}</Text>
//                     </View>
//                     <View style={[styles.onlineDot, { backgroundColor: online ? Colors.online : Colors.offline }]} />
//                   </TouchableOpacity>
//                 );
//               }}
//               ListEmptyComponent={
//                 <View style={styles.center}>
//                   <Text style={styles.emptyText}>{q ? `No results for "${q}"` : 'No employees found.'}</Text>
//                 </View>
//               }
//             />
//           )}
//     </>
//   );

//   if (inline) {
//     return (
//       <View style={[styles.sidebar, styles.sidebarInline]}>
//         {interior}
//       </View>
//     );
//   }

//   return (
//     <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
//       <View style={styles.overlay}>
//         <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
//         <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
//           {interior}
//         </Animated.View>
//       </View>
//     </Modal>
//   );
// }

// const styles = StyleSheet.create({
//   overlay: { flex: 1, flexDirection: 'row' },
//   backdrop: { flex: 1, backgroundColor: Colors.overlay },
//   sidebar: { flex: 1, width: SIDEBAR_WIDTH, backgroundColor: Colors.white, flexDirection: 'column' },
//   sidebarInline: { width: '100%', flex: 1 },
//   header: { backgroundColor: Colors.headerBg, paddingTop: 40, paddingBottom: 12, paddingHorizontal: 16 },
//   headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
//   headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
//   headerTitle: { color: Colors.white, fontWeight: '700', fontSize: 17, marginLeft: 8 },
//   headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
//   iconBtn: { padding: 6 },
//   groupBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
//   groupBtnText: { color: Colors.white, fontSize: 12, fontWeight: '600' },
//   badge: { backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
//   badgeText: { color: Colors.white, fontSize: 11, fontWeight: '700' },
//   searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 2 },
//   searchIcon: { marginRight: 8 },
//   searchInput: { flex: 1, color: Colors.white, fontSize: 14 },
//   tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border },
//   tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
//   tabActive: { borderBottomColor: Colors.primary },
//   tabText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
//   tabTextActive: { color: Colors.primary, fontWeight: '700' },
//   roomItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: Colors.border, gap: 12 },
//   roomItemActive: { backgroundColor: Colors.primarySurface },
//   avatarWrap: { position: 'relative' },
//   groupBadge: { position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
//   roomInfo: { flex: 1, minWidth: 0 },
//   roomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 2 },
//   roomNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 },
//   roomName: { fontSize: 14, fontWeight: '600', color: Colors.text, flex: 1 },
//   roomTime: { fontSize: 10, color: Colors.textLight },
//   roomPreview: { fontSize: 12, color: Colors.textSecondary, flex: 1 },
//   unreadBadge: { backgroundColor: Colors.primary, minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
//   unreadBadgeMuted: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.textLight },
//   unreadText: { color: Colors.white, fontSize: 10, fontWeight: '700' },
//   empInfo: { flex: 1, minWidth: 0 },
//   empName: { fontSize: 14, fontWeight: '600', color: Colors.text },
//   empRole: { fontSize: 12, color: Colors.textSecondary },
//   onlineDot: { width: 8, height: 8, borderRadius: 4 },
//   center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
//   loadingText: { color: Colors.textSecondary, fontSize: 14 },
//   emptyText: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center' },
// });
// features/chat/components/ChatSidebar.tsx
import { Feather } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Avatar from './Avatar';
import {
  Employee,
  Id,
  Room,
  empId,
  empName,
  empRole,
  fmtTime,
  msgText,
  roomIcon,
  roomId,
  roomName,
} from './chatTypes';

// ─── Theme ───────────────────────────────────────────────────────────────────
const T = {
  bg: '#ffffff',
  fg: '#0f172a',
  card: '#ffffff',
  primary: '#16a34a',
  primaryLight: '#dcfce7',
  primaryDark: '#15803d',
  secondary: '#f1f5f9',
  muted: '#f1f5f9',
  mutedFg: '#6b7280',
  border: '#e5e7eb',
  white: '#ffffff',
  online: '#22c55e',
  offline: '#d1d5db',
  error: '#ef4444',
  overlay: 'rgba(15,23,42,0.45)',
  headerGradientStart: '#15803d',
  headerGradientEnd: '#16a34a',
  // Subtle green tint for active rows
  activeSurface: '#f0fdf4',
  activeBorder: '#bbf7d0',
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(320, SCREEN_WIDTH * 0.85);

interface ChatSidebarProps {
  employees: Employee[];
  rooms: Room[];
  meId: Id | null;
  selectedRoomId: Id | null;
  loading: boolean;
  unreadMap: Record<string, number>;
  mutedRooms: Set<string>;
  visible: boolean;
  onClose: () => void;
  onSelect: (t: Employee | Room) => void;
  onCreateGroup: () => void;
  onRefresh: () => void;
  inline?: boolean;
}

export default function ChatSidebar({
  employees,
  rooms,
  meId,
  selectedRoomId,
  loading,
  unreadMap,
  mutedRooms,
  visible,
  onClose,
  onSelect,
  onCreateGroup,
  onRefresh,
  inline = false,
}: ChatSidebarProps) {
  const [tab, setTab] = useState<'chats' | 'people'>('chats');
  const [q, setQ] = useState('');
  const [focused, setFocused] = useState(false);
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;

  useEffect(() => {
    if (inline) return;
    Animated.spring(slideAnim, {
      toValue: visible ? 0 : -SIDEBAR_WIDTH,
      useNativeDriver: Platform.OS !== 'web',
      bounciness: 4,
      speed: 18,
    }).start();
  }, [visible, inline]);

  const filteredRooms = useMemo(() => {
    if (!q) return rooms;
    return rooms.filter(r =>
      roomName(r, meId).toLowerCase().includes(q.toLowerCase()),
    );
  }, [rooms, q, meId]);

  const filteredEmps = useMemo(
    () =>
      employees.filter(
        e =>
          String(empId(e)) !== String(meId) &&
          (empName(e).toLowerCase().includes(q.toLowerCase()) ||
            empRole(e).toLowerCase().includes(q.toLowerCase())),
      ),
    [employees, q, meId],
  );

  const totalUnread = Object.values(unreadMap).reduce((a, b) => a + b, 0);

  // ── Room row ──────────────────────────────────────────────────────────────
  const RoomRow = ({ r }: { r: Room }) => {
    const rid = String(roomId(r) ?? '');
    const unread = unreadMap[rid] || 0;
    const last = r.last_message;
    const active = rid === String(selectedRoomId ?? '');
    const muted = mutedRooms.has(rid);

    const preview = last?.is_deleted
      ? '🗑 Deleted'
      : last?.message_type === 'image'
        ? '📷 Photo'
        : last?.message_type === 'file'
          ? '📎 File'
          : last?.message_type === 'audio'
            ? '🎵 Audio'
            : last?.message_type === 'video'
              ? '🎬 Video'
              : last
                ? msgText(last) || '…'
                : 'Start the conversation';

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={[styles.roomItem, active && styles.roomItemActive]}
        onPress={() => {
          onSelect(r);
          onClose();
        }}>
        {/* Left accent for active */}
        {active && <View style={styles.activeAccent} />}

        <View style={styles.avatarWrap}>
          <Avatar
            src={roomIcon(r, meId)}
            initials={roomName(r, meId).slice(0, 2).toUpperCase()}
            size="md"
          />
          {r.room_type === 'group' && (
            <View style={styles.groupBadge}>
              <Feather name="users" size={7} color={T.white} />
            </View>
          )}
        </View>

        <View style={styles.roomInfo}>
          <View style={styles.roomRow}>
            <View style={styles.roomNameRow}>
              <Text
                style={[styles.roomName, active && styles.roomNameActive]}
                numberOfLines={1}>
                {roomName(r, meId)}
              </Text>
              {muted && (
                <Feather name="bell-off" size={10} color={T.mutedFg} />
              )}
            </View>
            <Text style={styles.roomTime}>{fmtTime(r.updated_at as string)}</Text>
          </View>
          <View style={styles.roomRow}>
            <Text
              style={[styles.roomPreview, unread > 0 && styles.roomPreviewBold]}
              numberOfLines={1}>
              {preview}
            </Text>
            {unread > 0 && (
              <View style={[styles.unreadBadge, muted && styles.unreadBadgeMuted]}>
                <Text style={styles.unreadText}>
                  {unread > 99 ? '99+' : unread}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Employee row ──────────────────────────────────────────────────────────
  const EmpRow = ({ e }: { e: Employee }) => {
    const online = e.online_status?.is_online === true;
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.roomItem}
        onPress={() => {
          onSelect(e);
          onClose();
        }}>
        <View style={styles.avatarWrap}>
          <Avatar
            src={e.avatar as string}
            initials={empName(e).slice(0, 2).toUpperCase()}
            size="md"
            online={online}
          />
          <View
            style={[
              styles.onlineRing,
              { borderColor: online ? T.online : T.offline },
            ]}
          />
        </View>
        <View style={styles.empInfo}>
          <Text style={styles.empName} numberOfLines={1}>
            {empName(e)}
          </Text>
          <View style={styles.empStatusRow}>
            <View
              style={[
                styles.onlineDot,
                { backgroundColor: online ? T.online : T.offline },
              ]}
            />
            <Text style={styles.empRole} numberOfLines={1}>
              {online ? 'Online' : empRole(e) || 'Team Member'}
            </Text>
          </View>
        </View>
        <Feather name="chevron-right" size={14} color={T.border} />
      </TouchableOpacity>
    );
  };

  // ── Interior ──────────────────────────────────────────────────────────────
  const interior = (
    <>
      <StatusBar backgroundColor={T.headerGradientStart} barStyle="light-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Feather name="message-square" size={16} color={T.white} />
            </View>
            <Text style={styles.headerTitle}>Messages</Text>
            {totalUnread > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {totalUnread > 99 ? '99+' : totalUnread}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={onRefresh} style={styles.iconBtn}>
              <Feather name="rotate-cw" size={15} color="rgba(255,255,255,0.85)" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onCreateGroup} style={styles.groupBtn}>
              <Feather name="plus" size={12} color={T.white} />
              <Text style={styles.groupBtnText}>New Group</Text>
            </TouchableOpacity>
            {!inline && (
              <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
                <Feather name="x" size={17} color="rgba(255,255,255,0.85)" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Search */}
        <View style={[styles.searchRow, focused && styles.searchRowFocused]}>
          <Feather
            name="search"
            size={14}
            color={focused ? T.white : 'rgba(255,255,255,0.65)'}
            style={styles.searchIcon}
          />
          <TextInput
            value={q}
            onChangeText={setQ}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search people or chats…"
            placeholderTextColor="rgba(255,255,255,0.5)"
            style={styles.searchInput}
          />
          {q.length > 0 && (
            <TouchableOpacity onPress={() => setQ('')}>
              <Feather name="x-circle" size={14} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Tabs ── */}
      <View style={styles.tabs}>
        {(['chats', 'people'] as const).map(t => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tab, tab === t && styles.tabActive]}
            activeOpacity={0.7}>
            <Feather
              name={t === 'chats' ? 'hash' : 'users'}
              size={13}
              color={tab === t ? T.primary : T.mutedFg}
            />
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'chats' ? 'Chats' : 'People'}
            </Text>
            {t === 'chats' && totalUnread > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>
                  {totalUnread > 9 ? '9+' : totalUnread}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* ── List ── */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={T.primary} />
          <Text style={styles.loadingText}>Loading conversations…</Text>
        </View>
      ) : tab === 'chats' ? (
        <FlatList
          style={styles.list}
          data={filteredRooms}
          keyExtractor={r => String(roomId(r) ?? Math.random())}
          renderItem={({ item: r }) => <RoomRow r={r} />}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            filteredRooms.length > 0 ? (
              <View style={styles.listHeader}>
                <Text style={styles.listHeaderText}>
                  {q
                    ? `${filteredRooms.length} result${filteredRooms.length !== 1 ? 's' : ''}`
                    : `${filteredRooms.length} conversation${filteredRooms.length !== 1 ? 's' : ''}`}
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <View style={styles.emptyIconWrap}>
                <Feather name="message-circle" size={28} color={T.primary} />
              </View>
              <Text style={styles.emptyTitle}>
                {q ? 'No results found' : 'No conversations yet'}
              </Text>
              <Text style={styles.emptyText}>
                {q
                  ? `Nothing matches "${q}"`
                  : 'Start chatting by selecting a person'}
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          style={styles.list}
          data={filteredEmps}
          keyExtractor={e => String(empId(e) ?? Math.random())}
          renderItem={({ item: e }) => <EmpRow e={e} />}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            filteredEmps.length > 0 ? (
              <View style={styles.listHeader}>
                <Text style={styles.listHeaderText}>
                  {filteredEmps.filter(e => e.online_status?.is_online).length} online
                  {' · '}
                  {filteredEmps.length} total
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <View style={styles.emptyIconWrap}>
                <Feather name="users" size={28} color={T.primary} />
              </View>
              <Text style={styles.emptyTitle}>
                {q ? 'No results found' : 'No team members'}
              </Text>
              <Text style={styles.emptyText}>
                {q ? `Nothing matches "${q}"` : 'Your team will appear here'}
              </Text>
            </View>
          }
        />
      )}
    </>
  );

  if (inline) {
    return <View style={[styles.sidebar, styles.sidebarInline]}>{interior}</View>;
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <Animated.View
          style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
          {interior}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row' },
  backdrop: { flex: 1, backgroundColor: T.overlay },
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: T.bg,
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  sidebarInline: { width: '100%', flex: 1 },

  // ── Header
  header: {
    backgroundColor: T.primary,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: T.white,
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  groupBtnText: { color: T.white, fontSize: 12, fontWeight: '600' },
  badge: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 22,
    alignItems: 'center',
  },
  badgeText: { color: '#78350f', fontSize: 11, fontWeight: '800' },

  // ── Search
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  searchRowFocused: {
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderColor: 'rgba(255,255,255,0.4)',
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: T.white, fontSize: 14, fontWeight: '400' },

  // ── Tabs
  tabs: {
    flexDirection: 'row',
    backgroundColor: T.bg,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 13,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: T.primary },
  tabText: { fontSize: 13, color: T.mutedFg, fontWeight: '500' },
  tabTextActive: { color: T.primary, fontWeight: '700' },
  tabBadge: {
    backgroundColor: T.primary,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: { color: T.white, fontSize: 9, fontWeight: '800' },

  // ── List
  list: { flex: 1 },
  listHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  listHeaderText: {
    fontSize: 11,
    color: T.mutedFg,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  // ── Room item
  roomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: T.border,
    gap: 12,
    backgroundColor: T.bg,
  },
  roomItemActive: {
    backgroundColor: T.activeSurface,
    borderBottomColor: T.activeBorder,
  },
  activeAccent: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    backgroundColor: T.primary,
    borderRadius: 2,
  },
  avatarWrap: { position: 'relative' },
  groupBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: T.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: T.bg,
  },
  onlineRing: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 2,
    backgroundColor: T.bg,
  },

  roomInfo: { flex: 1, minWidth: 0 },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 3,
  },
  roomNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    minWidth: 0,
  },
  roomName: { fontSize: 14, fontWeight: '600', color: T.fg, flex: 1 },
  roomNameActive: { color: T.primaryDark },
  roomTime: { fontSize: 10, color: T.mutedFg, fontWeight: '400' },
  roomPreview: { fontSize: 12.5, color: T.mutedFg, flex: 1 },
  roomPreviewBold: { color: '#374151', fontWeight: '500' },

  unreadBadge: {
    backgroundColor: T.primary,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeMuted: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: T.mutedFg,
  },
  unreadText: { color: T.white, fontSize: 10, fontWeight: '800' },

  // ── Employee item
  empInfo: { flex: 1, minWidth: 0 },
  empName: { fontSize: 14, fontWeight: '600', color: T.fg, marginBottom: 2 },
  empStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  empRole: { fontSize: 12, color: T.mutedFg },
  onlineDot: { width: 7, height: 7, borderRadius: 4 },

  // ── States
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: T.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: T.fg,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: T.mutedFg,
    textAlign: 'center',
    lineHeight: 19,
  },
  loadingText: { color: T.mutedFg, fontSize: 13, marginTop: 12, fontWeight: '500' },
});