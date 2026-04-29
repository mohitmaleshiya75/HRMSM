// features/chat/components/ChatModals.tsx
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Modal, Platform, ScrollView,
    StyleSheet,
    Text, TextInput, TouchableOpacity,
    View
} from 'react-native';


import Avatar from './Avatar';
import {
    Employee,
    Id,
    Receipt,
    Room,
    empAvatar,
    empId,
    empInitials,
    empName, empRole,
    fmtTime,
    roomIcon,
    roomId, roomName
} from './chatTypes';
import { Colors } from './Colors';

// ─── Base Modal ────────────────────────────────────────────────────────────────
function BaseModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={20} color="black" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.sheetContent} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Add Participants ──────────────────────────────────────────────────────────
interface AddParticipantsModalProps {
  visible: boolean;
  employees: Employee[];
  meId: Id | null;
  existingIds: Set<string>;
  onClose: () => void;
  onAdd: (ids: Id[]) => void;
}

export function AddParticipantsModal({ visible, employees, meId, existingIds, onClose, onAdd }: AddParticipantsModalProps) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(new Set<string>());
  if (!visible) return null;

  const filtered = employees.filter(e =>
    String(empId(e)) !== String(meId) &&
    !existingIds.has(String(empId(e))) &&
    empName(e).toLowerCase().includes(q.toLowerCase())
  );

  const toggle = (id: string) => {
    const s = new Set(sel);
    s.has(id) ? s.delete(id) : s.add(id);
    setSel(s);
  };

  return (
    <BaseModal title="Add Participants" onClose={onClose}>
      <View style={styles.searchRow}>
        <Feather name="search" size={14} color={Colors.textLight} />
        <TextInput value={q} onChangeText={setQ} placeholder="Search…" placeholderTextColor={Colors.textLight} style={styles.searchInput} autoFocus />
      </View>
      {filtered.map(e => {
        const id = String(empId(e) ?? '');
        return (
          <TouchableOpacity key={id} style={styles.empRow} onPress={() => toggle(id)}>
            <View style={[styles.checkBox, sel.has(id) && styles.checkBoxChecked]}>
              {sel.has(id) && <Feather name="check" size={12} color={Colors.white} />}
            </View>
            <Avatar src={empAvatar(e)} initials={empInitials(e)} size="sm" online={e.online_status?.is_online} />
            <View style={styles.empInfo}>
              <Text style={styles.empName}>{empName(e)}</Text>
              <Text style={styles.empRole}>{empRole(e)}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity
        disabled={sel.size === 0}
        onPress={() => { onAdd([...sel]); onClose(); setSel(new Set()); }}
        style={[styles.submitBtn, sel.size === 0 && styles.submitBtnDisabled]}
      >
        <Text style={styles.submitBtnText}>Add {sel.size > 0 ? `(${sel.size})` : ''}</Text>
      </TouchableOpacity>
    </BaseModal>
  );
}

// ─── Forward Message ──────────────────────────────────────────────────────────
interface ForwardModalProps {
  visible: boolean;
  rooms: Room[];
  currentRoomId: Id | null;
  meId: Id | null;
  onClose: () => void;
  onForward: (roomIds: Id[]) => void;
}

export function ForwardModal({ visible, rooms, currentRoomId, meId, onClose, onForward }: ForwardModalProps) {
  const [sel, setSel] = useState(new Set<string>());
  if (!visible) return null;

  const toggle = (id: string) => {
    const s = new Set(sel);
    s.has(id) ? s.delete(id) : s.add(id);
    setSel(s);
  };

  const filtered = rooms.filter(r => String(roomId(r)) !== String(currentRoomId));

  return (
    <BaseModal title="Forward Message" onClose={onClose}>
      {filtered.map(r => {
        const id = String(roomId(r) ?? '');
        return (
          <TouchableOpacity key={id} style={styles.empRow} onPress={() => toggle(id)}>
            <View style={[styles.checkBox, sel.has(id) && styles.checkBoxChecked]}>
              {sel.has(id) && <Feather name="check" size={12} color={Colors.white} />}
            </View>
            <Avatar src={roomIcon(r, meId)} initials={roomName(r, meId).slice(0, 2).toUpperCase()} size="sm" />
            <Text style={styles.empName}>{roomName(r, meId)}</Text>
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity
        disabled={sel.size === 0}
        onPress={() => { onForward([...sel]); onClose(); setSel(new Set()); }}
        style={[styles.submitBtn, styles.forwardBtn, sel.size === 0 && styles.submitBtnDisabled]}
      >
        <Feather name="corner-down-right" size={16} color={Colors.white} />
        <Text style={styles.submitBtnText}>Forward to {sel.size > 0 ? `${sel.size} chat${sel.size > 1 ? 's' : ''}` : '…'}</Text>
      </TouchableOpacity>
    </BaseModal>
  );
}

// ─── Read Receipts ────────────────────────────────────────────────────────────
interface ReceiptsModalProps {
  visible: boolean;
  receipts: Receipt[];
  onClose: () => void;
}

export function ReceiptsModal({ visible, receipts, onClose }: ReceiptsModalProps) {
  if (!visible) return null;
  return (
    <BaseModal title="Read By" onClose={onClose}>
      {receipts.length === 0 ? (
        <Text style={styles.emptyText}>No receipts yet.</Text>
      ) : receipts.map((r, i) => (
        <View key={i} style={styles.receiptRow}>
          <Avatar src={empAvatar(r.recipient)} initials={empInitials(r.recipient)} size="sm" />
          <View style={styles.empInfo}>
            <Text style={styles.empName}>{empName(r.recipient)}</Text>
            <View style={styles.statusRow}>
              <Feather name="check" size={12} color="#3b82f6" />
              {r.status === 'seen' && (
                <Feather name="check" size={12} color="#3b82f6" style={{ marginLeft: -4 }} />
              )}
              <Text style={styles.empRole}>{r.status}</Text>
            </View>
          </View>
          <Text style={styles.receiptTime}>{fmtTime(r.timestamp)}</Text>
        </View>
      ))}
    </BaseModal>
  );
}

// ─── Edit History ─────────────────────────────────────────────────────────────
interface HistoryModalProps {
  visible: boolean;
  history: { id?: Id; old_content?: string; edited_at?: string; edited_by?: Employee }[];
  onClose: () => void;
}

export function HistoryModal({ visible, history, onClose }: HistoryModalProps) {
  if (!visible) return null;
  return (
    <BaseModal title="Edit History" onClose={onClose}>
      {history.length === 0 ? (
        <Text style={styles.emptyText}>No edit history.</Text>
      ) : history.map((h, i) => (
        <View key={i} style={styles.historyItem}>
          <View style={styles.historyMeta}>
            <Feather name="clock" size={11} color={Colors.textLight} />
            <Text style={styles.historyMetaText}>{empName(h.edited_by)} · {fmtTime(h.edited_at)}</Text>
          </View>
          <Text style={styles.historyContent}>{h.old_content}</Text>
        </View>
      ))}
    </BaseModal>
  );
}

// ─── Create Group ─────────────────────────────────────────────────────────────
interface CreateGroupModalProps {
  visible: boolean;
  employees: Employee[];
  meId: Id | null;
  onClose: () => void;
  onSubmit: (d: { name: string; description: string; participant_ids: Id[] }) => void;
}

export function CreateGroupModal({ visible, employees, meId, onClose, onSubmit }: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(new Set<string>());
  if (!visible) return null;

  const filtered = employees.filter(e =>
    String(empId(e)) !== String(meId) &&
    empName(e).toLowerCase().includes(q.toLowerCase())
  );

  const toggle = (id: string) => {
    const s = new Set(sel);
    s.has(id) ? s.delete(id) : s.add(id);
    setSel(s);
  };

  return (
    <BaseModal title="Create Group" onClose={onClose}>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Group name *"
        placeholderTextColor={Colors.textLight}
        style={styles.textInput}
      />
      <TextInput
        value={desc}
        onChangeText={setDesc}
        placeholder="Description (optional)"
        placeholderTextColor={Colors.textLight}
        style={[styles.textInput, { minHeight: 60 }]}
        multiline
      />
      <View style={styles.searchRow}>
       <Feather name="search" size={14} color={Colors.textLight} />
        <TextInput value={q} onChangeText={setQ} placeholder="Search participants…" placeholderTextColor={Colors.textLight} style={styles.searchInput} />
      </View>
      <Text style={styles.selCount}>{sel.size} selected</Text>
      {filtered.map(e => {
        const id = String(empId(e) ?? '');
        return (
          <TouchableOpacity key={id} style={styles.empRow} onPress={() => toggle(id)}>
            <View style={[styles.checkBox, sel.has(id) && styles.checkBoxChecked]}>
              {sel.has(id) && <Feather name="check" size={12} color={Colors.white} />}
            </View>
            <Avatar src={empAvatar(e)} initials={empInitials(e)} size="sm" online={e.online_status?.is_online} />
            <View style={styles.empInfo}>
              <Text style={styles.empName}>{empName(e)}</Text>
              <Text style={styles.empRole}>{empRole(e)}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity
        disabled={!name.trim() || sel.size === 0}
        onPress={() => { onSubmit({ name, description: desc, participant_ids: [...sel] }); setSel(new Set()); setName(''); setDesc(''); }}
        style={[styles.submitBtn, (!name.trim() || sel.size === 0) && styles.submitBtnDisabled]}
      >
        <Text style={styles.submitBtnText}>Create Group</Text>
      </TouchableOpacity>
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: Colors.overlay },
  backdrop: { flex: 1 },
  sheet: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', minHeight: 300 },
  sheetHandle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginTop: 10 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  closeBtn: { padding: 4 },
  sheetContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text },
  empRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  checkBox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  checkBoxChecked: { backgroundColor: Colors.primary },
  empInfo: { flex: 1, minWidth: 0 },
  empName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  empRole: { fontSize: 12, color: Colors.textSecondary },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, marginTop: 20 , marginBottom: Platform.OS === 'ios' ? 0 : 20 },
  submitBtnDisabled: { opacity: 0.4 },
  forwardBtn: { backgroundColor: Colors.primary },
  submitBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: Colors.textSecondary, fontSize: 14, paddingVertical: 24 },
  receiptRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  receiptTime: { fontSize: 11, color: Colors.textLight },
  historyItem: { backgroundColor: Colors.primarySurface, borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: Colors.primaryBorder },
  historyMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  historyMetaText: { fontSize: 11, color: Colors.textLight },
  historyContent: { fontSize: 14, color: Colors.text },
  textInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: Colors.text, marginBottom: 10 },
  selCount: { fontSize: 12, color: Colors.textSecondary, marginBottom: 8 },
});