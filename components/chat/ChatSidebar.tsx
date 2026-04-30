// features/chat/components/ChatSidebar.tsx
import { Feather } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated, Dimensions,
  FlatList,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View,
} from 'react-native';
import Avatar from './Avatar';
import {
  Employee,
  Id,
  Room,
  empId, empName, empRole,
  fmtTime, msgText,
  roomIcon,
  roomId, roomName,
} from './chatTypes';
import { Colors } from './Colors';

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
  employees, rooms, meId, selectedRoomId, loading,
  unreadMap, mutedRooms, visible, onClose, onSelect, onCreateGroup, onRefresh,
  inline = false,
}: ChatSidebarProps) {
  const [tab, setTab] = useState<'chats' | 'people'>('chats');
  const [q, setQ] = useState('');
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;

  useEffect(() => {
    if (inline) return;
    Animated.spring(slideAnim, {
      toValue: visible ? 0 : -SIDEBAR_WIDTH,
      useNativeDriver: Platform.OS !== 'web',
      bounciness: 0,
      speed: 20,
    }).start();
  }, [visible, inline]);

  const filteredRooms = useMemo(() => {
    if (!q) return rooms;
    return rooms.filter(r => roomName(r, meId).toLowerCase().includes(q.toLowerCase()));
  }, [rooms, q, meId]);

  const filteredEmps = useMemo(() => employees.filter(e =>
    String(empId(e)) !== String(meId) &&
    (empName(e).toLowerCase().includes(q.toLowerCase()) ||
      empRole(e).toLowerCase().includes(q.toLowerCase()))
  ), [employees, q, meId]);

  const totalUnread = Object.values(unreadMap).reduce((a, b) => a + b, 0);

  const interior = (
    <>
          <StatusBar backgroundColor={Colors.headerBg} barStyle="light-content" />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <Feather name="message-square" size={20} color={Colors.white} />
                <Text style={styles.headerTitle}>Messages</Text>
                {totalUnread > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{totalUnread > 99 ? '99+' : totalUnread}</Text>
                  </View>
                )}
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity onPress={onRefresh} style={styles.iconBtn}>
                  <Feather name="rotate-cw" size={16} color={Colors.white} />
                </TouchableOpacity>
                <TouchableOpacity onPress={onCreateGroup} style={styles.groupBtn}>
                  <Feather name="plus" size={13} color={Colors.white} />
                  <Text style={styles.groupBtnText}>Group</Text>
                </TouchableOpacity>
                {!inline && (
                  <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
                    <Feather name="x" size={18} color={Colors.white} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.searchRow}>
              <Feather name="search" size={14} color={Colors.white} style={styles.searchIcon} />
              <TextInput
                value={q}
                onChangeText={setQ}
                placeholder="Search…"
                placeholderTextColor="rgba(255,255,255,0.6)"
                style={styles.searchInput}
              />
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            {(['chats', 'people'] as const).map(t => (
              <TouchableOpacity
                key={t}
                onPress={() => setTab(t)}
                style={[styles.tab, tab === t && styles.tabActive]}
              >
                {t === 'chats' ? (
                  <Feather name="hash" size={13} color={tab === t ? Colors.primary : Colors.textSecondary} />
                ) : (
                  <Feather name="users" size={13} color={tab === t ? Colors.primary : Colors.textSecondary} />
                )}
                <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                  {t === 'chats' ? 'Chats' : 'People'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* List */}
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={[styles.loadingText, { marginTop: 12 }]}>Loading…</Text>
            </View>
          ) : tab === 'chats' ? (
            <FlatList
              style={{ flex: 1,marginBottom: 20 }}
              data={filteredRooms}
              keyExtractor={r => String(roomId(r) ?? Math.random())}
              renderItem={({ item: r }) => {
                const rid = String(roomId(r) ?? '');
                const unread = unreadMap[rid] || 0;
                const last = r.last_message;
                const active = rid === String(selectedRoomId ?? '');
                const muted = mutedRooms.has(rid);
                return (
                  <TouchableOpacity
                    style={[styles.roomItem, active && styles.roomItemActive]}
                    onPress={() => { onSelect(r); onClose(); }}
                  >
                    <View style={styles.avatarWrap}>
                      <Avatar src={roomIcon(r, meId)} initials={roomName(r, meId).slice(0, 2).toUpperCase()} size="md" />
                      {r.room_type === 'group' && (
                        <View style={styles.groupBadge}><Feather name="users" size={8} color={Colors.white} /></View>
                      )}
                    </View>
                    <View style={styles.roomInfo}>
                      <View style={styles.roomRow}>
                        <View style={styles.roomNameRow}>
                          <Text style={styles.roomName} numberOfLines={1}>{roomName(r, meId)}</Text>
                          {muted && <Feather name="bell-off" size={10} color={Colors.textLight} />}
                        </View>
                        <Text style={styles.roomTime}>{fmtTime(r.updated_at as string)}</Text>
                      </View>
                      <View style={styles.roomRow}>
                        <Text style={styles.roomPreview} numberOfLines={1}>
                          {last?.is_deleted ? '🗑 Deleted'
                            : last?.message_type === 'image' ? '📷 Photo'
                              : last?.message_type === 'file' ? '📎 File'
                                : last?.message_type === 'audio' ? '🎵 Audio'
                                  : last?.message_type === 'video' ? '🎬 Video'
                                    : last ? (msgText(last) || '…') : 'No messages yet'}
                        </Text>
                        {unread > 0 && (
                          <View style={[styles.unreadBadge, muted && styles.unreadBadgeMuted]}>
                            <Text style={styles.unreadText}>{unread > 99 ? '99+' : unread}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.center}>
                  <Text style={styles.emptyText}>{q ? `No results for "${q}"` : 'No conversations yet.'}</Text>
                </View>
              }
            />
          ) : (
            <FlatList
              style={{ flex: 1 }}
              data={filteredEmps}
              keyExtractor={e => String(empId(e) ?? Math.random())}
              renderItem={({ item: e }) => {
                const online = e.online_status?.is_online === true;
                return (
                  <TouchableOpacity
                    style={styles.roomItem}
                    onPress={() => { onSelect(e); onClose(); }}
                  >
                    <Avatar src={e.avatar as string} initials={empName(e).slice(0, 2).toUpperCase()} size="md" online={online} />
                    <View style={styles.empInfo}>
                      <Text style={styles.empName} numberOfLines={1}>{empName(e)}</Text>
                      <Text style={styles.empRole} numberOfLines={1}>{empRole(e) || 'Team Member'}</Text>
                    </View>
                    <View style={[styles.onlineDot, { backgroundColor: online ? Colors.online : Colors.offline }]} />
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.center}>
                  <Text style={styles.emptyText}>{q ? `No results for "${q}"` : 'No employees found.'}</Text>
                </View>
              }
            />
          )}
    </>
  );

  if (inline) {
    return (
      <View style={[styles.sidebar, styles.sidebarInline]}>
        {interior}
      </View>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
          {interior}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row' },
  backdrop: { flex: 1, backgroundColor: Colors.overlay },
  sidebar: { flex: 1, width: SIDEBAR_WIDTH, backgroundColor: Colors.white, flexDirection: 'column' },
  sidebarInline: { width: '100%', flex: 1 },
  header: { backgroundColor: Colors.headerBg, paddingTop: 40, paddingBottom: 12, paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { color: Colors.white, fontWeight: '700', fontSize: 17, marginLeft: 8 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconBtn: { padding: 6 },
  groupBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  groupBtnText: { color: Colors.white, fontSize: 12, fontWeight: '600' },
  badge: { backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  badgeText: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 2 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: Colors.white, fontSize: 14 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  tabTextActive: { color: Colors.primary, fontWeight: '700' },
  roomItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: Colors.border, gap: 12 },
  roomItemActive: { backgroundColor: Colors.primarySurface },
  avatarWrap: { position: 'relative' },
  groupBadge: { position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  roomInfo: { flex: 1, minWidth: 0 },
  roomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 2 },
  roomNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 },
  roomName: { fontSize: 14, fontWeight: '600', color: Colors.text, flex: 1 },
  roomTime: { fontSize: 10, color: Colors.textLight },
  roomPreview: { fontSize: 12, color: Colors.textSecondary, flex: 1 },
  unreadBadge: { backgroundColor: Colors.primary, minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
  unreadBadgeMuted: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.textLight },
  unreadText: { color: Colors.white, fontSize: 10, fontWeight: '700' },
  empInfo: { flex: 1, minWidth: 0 },
  empName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  empRole: { fontSize: 12, color: Colors.textSecondary },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText: { color: Colors.textSecondary, fontSize: 14 },
  emptyText: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center' },
});