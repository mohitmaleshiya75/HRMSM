// features/chat/components/DetailPanel.tsx
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, ScrollView,
  StyleSheet, Alert, TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  Room, Employee, Id,
  empId, empName, empRole, empAvatar, empInitials,
  roomName, roomIcon,
} from './chatTypes';
import { Colors } from './Colors';
import Avatar from './Avatar';

interface DetailPanelProps {
  visible: boolean;
  room: Room;
  meId: Id | null;
  isAdmin: boolean;
  isMuted: boolean;
  onClose: () => void;
  onAddParticipants: () => void;
  onRemoveParticipant: (e: Employee) => void;
  onChangeRole: (e: Employee, role: string) => void;
  onLeave: () => void;
  onMuteToggle: () => void;
  onClearChat: () => void;
  onUpdateGroup: (d: { name?: string; description?: string }) => void;
  onRejoin: (e: Employee) => void;
}

export default function DetailPanel({
  visible, room, meId, isAdmin, isMuted, onClose,
  onAddParticipants, onRemoveParticipant, onChangeRole,
  onLeave, onMuteToggle, onClearChat, onUpdateGroup, onRejoin,
}: DetailPanelProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState((room.name as string) || '');
  const [desc, setDesc] = useState((room.description as string) || '');
  const active = (room.room_participants || []).filter(p => p.is_active);
  const inactive = (room.room_participants || []).filter(p => !p.is_active);

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{room.room_type === 'group' ? 'Group Info' : 'Contact Info'}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <Avatar
              src={roomIcon(room, meId)}
              initials={roomName(room, meId).slice(0, 2).toUpperCase()}
              size="xl"
            />
            {editing ? (
              <View style={styles.editForm}>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  style={styles.editInput}
                  placeholder="Group name"
                  placeholderTextColor={Colors.textLight}
                />
                <TextInput
                  value={desc}
                  onChangeText={setDesc}
                  style={[styles.editInput, { minHeight: 60 }]}
                  placeholder="Description"
                  placeholderTextColor={Colors.textLight}
                  multiline
                />
                <View style={styles.editButtons}>
                  <TouchableOpacity onPress={() => setEditing(false)} style={styles.cancelBtn}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => { onUpdateGroup({ name, description: desc }); setEditing(false); }}
                    style={styles.saveBtn}
                  >
                    <Text style={styles.saveBtnText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <Text style={styles.roomName}>{roomName(room, meId)}</Text>
                {room.description && <Text style={styles.roomDesc}>{room.description as string}</Text>}
                <Text style={styles.roomType}>{room.room_type} chat</Text>
                {isAdmin && room.room_type === 'group' && (
                  <TouchableOpacity onPress={() => setEditing(true)} style={styles.editBtn}>
                    <Feather name="edit-2" size={12} color={Colors.primary} />
                    <Text style={styles.editBtnText}>Edit group</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>

          {/* Quick actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity onPress={onMuteToggle} style={styles.quickAction}>
              {isMuted ? (
                <Feather name="bell" size={22} color={Colors.primary} />
              ) : (
                <Feather name="bell-off" size={22} color={Colors.textSecondary} />
              )}
              <Text style={styles.quickActionText}>{isMuted ? 'Unmute' : 'Mute'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => Alert.alert('Clear Chat', 'Clear all messages?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear', style: 'destructive', onPress: onClearChat },
              ])}
              style={styles.quickAction}
            >
              <Feather name="trash-2" size={22} color={Colors.error} />
              <Text style={[styles.quickActionText, { color: Colors.error }]}>Clear Chat</Text>
            </TouchableOpacity>
            {room.room_type === 'group' && (
              <TouchableOpacity
                onPress={() => Alert.alert('Leave Group', 'Leave this group?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Leave', style: 'destructive', onPress: onLeave },
                ])}
                style={styles.quickAction}
              >
                <Feather name="users" size={22} color={Colors.error} />
                <Text style={[styles.quickActionText, { color: Colors.error }]}>Leave</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Members */}
          {room.room_type === 'group' && (
            <View style={styles.membersSection}>
              <View style={styles.membersHeader}>
                <Text style={styles.membersTitle}>{active.length} Members</Text>
                {isAdmin && (
                  <TouchableOpacity onPress={onAddParticipants} style={styles.addBtn}>
                    <Feather name="user-plus" size={13} color={Colors.white} />
                    <Text style={styles.addBtnText}>Add</Text>
                  </TouchableOpacity>
                )}
              </View>
              {active.map((p, i) => (
                <View key={i} style={styles.memberRow}>
                  <Avatar src={empAvatar(p.employee)} initials={empInitials(p.employee)} size="md" online={p.employee?.online_status?.is_online} />
                  <View style={styles.memberInfo}>
                    <View style={styles.memberNameRow}>
                      <Text style={styles.memberName}>{empName(p.employee)}</Text>
                      {String(empId(p.employee)) === String(meId) && <Text style={styles.youTag}>(you)</Text>}
                      {p.role === 'admin' && <Feather name="shield" size={12} color={Colors.primary} />}
                    </View>
                    <Text style={styles.memberRole}>{empRole(p.employee)}</Text>
                  </View>
                  {isAdmin && String(empId(p.employee)) !== String(meId) && (
                    <View style={styles.memberActions}>
                      <TouchableOpacity
                        onPress={() => onChangeRole(p.employee!, p.role === 'admin' ? 'member' : 'admin')}
                        style={styles.memberActionBtn}
                      >
                        <Feather name="award" size={13} color={Colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => Alert.alert('Remove', `Remove ${empName(p.employee)}?`, [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Remove', style: 'destructive', onPress: () => onRemoveParticipant(p.employee!) },
                        ])}
                        style={styles.memberActionBtn}
                      >
                        <Feather name="minus" size={13} color={Colors.error} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}

              {isAdmin && inactive.length > 0 && (
                <>
                  <Text style={styles.leftTitle}>Left Members</Text>
                  {inactive.map((p, i) => (
                    <View key={i} style={[styles.memberRow, { opacity: 0.6 }]}>
                      <Avatar src={empAvatar(p.employee)} initials={empInitials(p.employee)} size="md" />
                      <Text style={[styles.memberName, { flex: 1 }]}>{empName(p.employee)}</Text>
                      <TouchableOpacity onPress={() => onRejoin(p.employee!)} style={styles.rejoinBtn}>
                        <Feather name="user-plus" size={12} color={Colors.white} />
                        <Text style={styles.rejoinBtnText}>Re-add</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: { backgroundColor: Colors.headerBg, paddingTop: 48, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: Colors.white, fontWeight: '700', fontSize: 18 },
  closeBtn: { padding: 8 },
  content: { paddingBottom: 40 },
  avatarSection: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 24 },
  roomName: { fontSize: 22, fontWeight: '700', color: Colors.text, marginTop: 16, textAlign: 'center' },
  roomDesc: { fontSize: 14, color: Colors.textSecondary, marginTop: 6, textAlign: 'center' },
  roomType: { fontSize: 12, color: Colors.textLight, marginTop: 4, textTransform: 'capitalize' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  editBtnText: { color: Colors.primary, fontSize: 13 },
  editForm: { width: '100%', marginTop: 12, gap: 8 },
  editInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: Colors.text, textAlign: 'center' },
  editButtons: { flexDirection: 'row', gap: 8 },
  cancelBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, color: Colors.textSecondary },
  saveBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center' },
  saveBtnText: { fontSize: 14, color: Colors.white, fontWeight: '700' },
  quickActions: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 20, borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.border, marginHorizontal: 16 },
  quickAction: { alignItems: 'center', gap: 6 },
  quickActionText: { fontSize: 12, color: Colors.textSecondary },
  membersSection: { padding: 16 },
  membersHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  membersTitle: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  addBtnText: { color: Colors.white, fontSize: 12, fontWeight: '600' },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: Colors.border, gap: 10 },
  memberInfo: { flex: 1, minWidth: 0 },
  memberNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  memberName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  youTag: { fontSize: 11, color: Colors.textLight },
  memberRole: { fontSize: 12, color: Colors.textSecondary },
  memberActions: { flexDirection: 'row', gap: 4 },
  memberActionBtn: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  leftTitle: { fontSize: 12, fontWeight: '700', color: Colors.textLight, textTransform: 'uppercase', marginTop: 16, marginBottom: 8 },
  rejoinBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
  rejoinBtnText: { color: Colors.white, fontSize: 11, fontWeight: '600' },
});