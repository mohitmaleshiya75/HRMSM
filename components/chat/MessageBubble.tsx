// features/chat/components/MessageBubble.tsx
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Image, Modal, StyleSheet,
  ScrollView, Linking, Alert, Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  Message, Employee, Id,
  empName, empAvatar, empInitials, senderId,
  msgId, msgText, fmtTime, fmtSize, cdnUrl, canEdit,
  parseSystemMessage, QUICK_EMOJI, EMOJI_LIST, isMineMsg,
} from './chatTypes';
import { Colors } from './Colors';
import Avatar from './Avatar';

function Tick({ status, isMine }: { status?: string; isMine: boolean }) {
  if (!isMine) return null;
  if (status === 'sending') return <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>⟳</Text>;
  
  const isDouble = status === 'seen' || status === 'delivered';
  const color = status === 'seen' ? "#93c5fd" : "rgba(255,255,255,0.7)";

  return (
    <View style={{ flexDirection: 'row' }}>
      <Feather name="check" size={13} color={color} />
      {isDouble && <Feather name="check" size={13} color={color} style={{ marginLeft: -8 }} />}
    </View>
  );
}

interface MessageActionMenuProps {
  visible: boolean;
  msg: Message;
  isMine: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onReact: (emoji: string) => void;
  onReply: () => void;
  onForward: () => void;
  onCopy: () => void;
  onPin: () => void;
  onShowReceipts: () => void;
  onShowHistory: () => void;
}

function MessageActionMenu({
  visible, msg, isMine, onClose, onEdit, onDelete, onReact,
  onReply, onForward, onCopy, onPin, onShowReceipts, onShowHistory,
}: MessageActionMenuProps) {
  const [showAllEmoji, setShowAllEmoji] = useState(false);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.actionOverlay} onPress={onClose}>
        <View style={styles.actionMenu}>
          {/* Quick emoji */}
          <View style={styles.quickEmoji}>
            {QUICK_EMOJI.map(e => (
              <TouchableOpacity key={e} style={styles.emojiBtn} onPress={() => { onReact(e); onClose(); }}>
                <Text style={styles.emojiText}>{e}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.emojiBtn} onPress={() => setShowAllEmoji(true)}>
              <Feather name="smile" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.separator} />

          {/* Actions */}
          {[
            { icon: <Feather name="corner-up-left" size={16} color={Colors.text} />, label: 'Reply', action: () => { onReply(); onClose(); } },
            { icon: <Feather name="corner-up-right" size={16} color={Colors.text} />, label: 'Forward', action: () => { onForward(); onClose(); } },
            { icon: <Feather name="copy" size={16} color={Colors.text} />, label: 'Copy', action: () => { onCopy(); onClose(); } },
            { icon: <Feather name="bookmark" size={16} color={Colors.text} />, label: msg.is_pinned ? 'Unpin' : 'Pin', action: () => { onPin(); onClose(); } },
            ...(isMine && canEdit(msg) ? [{ icon: <Feather name="edit-2" size={16} color={Colors.text} />, label: 'Edit', action: () => { onEdit(); onClose(); } }] : []),
            ...(isMine ? [{ icon: <Feather name="eye" size={16} color={Colors.text} />, label: 'Read By', action: () => { onShowReceipts(); onClose(); } }] : []),
            { icon: <Feather name="clock" size={16} color={Colors.text} />, label: 'History', action: () => { onShowHistory(); onClose(); } },
            ...(isMine ? [{ icon: <Feather name="trash-2" size={16} color={Colors.error} />, label: 'Delete', action: () => { onDelete(); onClose(); }, danger: true }] : []),
          ].map((item, i) => (
            <TouchableOpacity key={i} style={styles.actionItem} onPress={item.action}>
              {item.icon}
              <Text style={[styles.actionLabel, item.danger && { color: Colors.error }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* All emoji picker */}
        {showAllEmoji && (
          <Pressable style={styles.emojiOverlay} onPress={() => setShowAllEmoji(false)}>
            <View style={styles.emojiPicker}>
              <ScrollView>
                <View style={styles.emojiGrid}>
                  {EMOJI_LIST.map((e, i) => (
                    <TouchableOpacity key={i} style={styles.emojiGridBtn} onPress={() => { onReact(e); onClose(); setShowAllEmoji(false); }}>
                      <Text style={styles.emojiText}>{e}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </Pressable>
        )}
      </Pressable>
    </Modal>
  );
}

interface MessageBubbleProps {
  msg: Message;
  isMine: boolean;
  isSelected: boolean;
  selectMode: boolean;
  onEdit: (m: Message) => void;
  onDelete: (m: Message) => void;
  onReact: (m: Message, emoji: string) => void;
  onForward: (m: Message) => void;
  onReply: (m: Message) => void;
  onShowReceipts: (m: Message) => void;
  onShowHistory: (m: Message) => void;
  onImageClick: (url: string) => void;
  onSelect: (m: Message) => void;
  onPin: (m: Message) => void;
  onCopy: (m: Message) => void;
}

export default function MessageBubble({
  msg, isMine, isSelected, selectMode,
  onEdit, onDelete, onReact, onForward, onReply,
  onShowReceipts, onShowHistory, onImageClick, onSelect, onPin, onCopy,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const text = msgText(msg);

  if (msg.message_type === 'system') {
    return (
      <View style={styles.systemRow}>
        <Text style={styles.systemMsg}>{parseSystemMessage(text)}</Text>
      </View>
    );
  }

  if (msg.is_deleted) {
    return (
      <View style={[styles.row, isMine && styles.rowMine]}>
        <View style={styles.deletedBubble}>
          <Feather name="trash-2" size={11} color={Colors.textSecondary} />
          <Text style={styles.deletedText}>This message was deleted</Text>
        </View>
      </View>
    );
  }

  const rxGroups = (msg.reactions || []).reduce((acc, r) => {
    const e = r.emoji || '';
    if (!acc[e]) acc[e] = { emoji: e, count: 0, users: [] };
    acc[e].count++; acc[e].users.push(empName(r.employee));
    return acc;
  }, {} as Record<string, { emoji: string; count: number; users: string[] }>);

  return (
    <>
      <MessageActionMenu
        visible={showActions}
        msg={msg}
        isMine={isMine}
        onClose={() => setShowActions(false)}
        onEdit={() => onEdit(msg)}
        onDelete={() => onDelete(msg)}
        onReact={e => onReact(msg, e)}
        onReply={() => onReply(msg)}
        onForward={() => onForward(msg)}
        onCopy={() => onCopy(msg)}
        onPin={() => onPin(msg)}
        onShowReceipts={() => onShowReceipts(msg)}
        onShowHistory={() => onShowHistory(msg)}
      />

      <View style={[styles.msgContainer, isSelected && styles.msgSelected]}>
        {selectMode && (
          <TouchableOpacity onPress={() => onSelect(msg)} style={styles.checkWrap}>
            <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
              {isSelected && <Feather name="check" size={11} color={Colors.white} />}
            </View>
          </TouchableOpacity>
        )}

        <View style={[styles.row, isMine && styles.rowMine]}>
          {!isMine && (
            <Avatar src={empAvatar(msg.sender)} initials={empInitials(msg.sender)} size="sm" />
          )}

          <TouchableOpacity
            activeOpacity={0.85}
            onLongPress={selectMode ? undefined : () => setShowActions(true)}
            onPress={selectMode ? () => onSelect(msg) : undefined}
            style={[styles.bubbleWrap, { maxWidth: '80%' }]}
          >
            {msg.is_pinned && (
              <View style={[styles.pinnedRow, isMine && { justifyContent: 'flex-end' }]}>
                <Feather name="bookmark" size={10} color={isMine ? 'rgba(255,255,255,0.8)' : Colors.primary} />
                <Text style={styles.pinnedText}>Pinned</Text>
              </View>
            )}

            {msg.reply_to && (
              <View style={[styles.replyPreview, isMine ? styles.replyPreviewMine : styles.replyPreviewOther]}>
                <Text style={styles.replyName}>{empName(msg.reply_to.sender)}</Text>
                <Text style={styles.replyContent} numberOfLines={1}>
                  {msg.reply_to.message_type !== 'text' ? `📎 ${msg.reply_to.message_type}` : msgText(msg.reply_to)}
                </Text>
              </View>
            )}

            <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
              {!isMine && (
                <Text style={styles.senderName}>{empName(msg.sender)}</Text>
              )}

              {msg.file_url && msg.message_type === 'image' && (
                <TouchableOpacity onPress={() => onImageClick(msg.file_url!)}>
                  <Image
                    source={{ uri: cdnUrl(msg.file_url, 320) }}
                    style={styles.imageMsg}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              )}

              {msg.file_url && msg.message_type === 'file' && (
                <TouchableOpacity
                  style={[styles.filePreview, isMine ? styles.filePreviewMine : styles.filePreviewOther]}
                  onPress={() => Linking.openURL(msg.file_url!)}
                >
                  <Feather name="file" size={20} color={isMine ? Colors.white : Colors.primary} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.fileName, isMine && { color: Colors.white }]} numberOfLines={1}>{msg.file_name || 'File'}</Text>
                    <Text style={[styles.fileSize, isMine && { color: 'rgba(255,255,255,0.7)' }]}>{fmtSize(msg.file_size)}</Text>
                  </View>
                  <Feather name="download" size={14} color={isMine ? Colors.white : Colors.primary} />
                </TouchableOpacity>
              )}

              {text && (
                <Text style={[styles.msgText, isMine && styles.msgTextMine]}>{text}</Text>
              )}

              <View style={styles.metaRow}>
                {msg.is_forwarded && <Text style={[styles.metaTag, isMine && { color: 'rgba(255,255,255,0.6)' }]}>↪ Fwd</Text>}
                {msg.is_edited && <Text style={[styles.metaTag, isMine && { color: 'rgba(255,255,255,0.6)' }]}>edited</Text>}
                {msg.isPending && <Text style={[styles.metaTag, isMine && { color: 'rgba(255,255,255,0.6)' }]}>Sending…</Text>}
                <Text style={[styles.timestamp, isMine && { color: 'rgba(255,255,255,0.7)' }]}>{fmtTime(msg.created_at || msg.timestamp || msg.sent_at)}</Text>
                <Tick status={msg.isPending ? 'sending' : (msg.tick_status || msg.status)} isMine={isMine} />
              </View>
            </View>

            {Object.keys(rxGroups).length > 0 && (
              <View style={[styles.reactions, isMine && { justifyContent: 'flex-end' }]}>
                {Object.values(rxGroups).map(({ emoji, count }) => (
                  <TouchableOpacity key={emoji} style={styles.reaction} onPress={() => onReact(msg, emoji)}>
                    <Text style={styles.reactionEmoji}>{emoji}</Text>
                    {count > 1 && <Text style={styles.reactionCount}>{count}</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  msgContainer: { marginVertical: 1 },
  msgSelected: { backgroundColor: Colors.primarySurface },
  row: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, gap: 6 },
  rowMine: { justifyContent: 'flex-end' },
  bubbleWrap: {},
  bubble: { borderRadius: 20, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 8, marginBottom: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  bubbleMine: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: '#F0F0F0', borderBottomLeftRadius: 4 },
  senderName: { fontSize: 12, fontWeight: '700', color: Colors.primary, marginBottom: 2 },
  imageMsg: { width: 240, height: 240, borderRadius: 12, marginBottom: 4 },
  filePreview: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 10, marginBottom: 4 },
  filePreviewMine: { backgroundColor: 'rgba(0,0,0,0.15)' },
  filePreviewOther: { backgroundColor: Colors.primarySurface },
  fileName: { fontSize: 13, fontWeight: '600', color: Colors.text },
  fileSize: { fontSize: 11, color: Colors.textSecondary },
  msgText: { fontSize: 15, color: Colors.bubbleInText, lineHeight: 21 },
  msgTextMine: { color: Colors.bubbleOutText },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 3 },
  metaTag: { fontSize: 10, color: Colors.textLight, fontStyle: 'italic' },
  timestamp: { fontSize: 10, color: Colors.textSecondary },
  pinnedRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 3 },
  pinnedText: { fontSize: 10, color: Colors.textLight },
  replyPreview: { borderRadius: 8, padding: 8, marginBottom: 4, borderLeftWidth: 3 },
  replyPreviewMine: { backgroundColor: 'rgba(0,0,0,0.15)', borderLeftColor: 'rgba(255,255,255,0.6)' },
  replyPreviewOther: { backgroundColor: Colors.primarySurface, borderLeftColor: Colors.primary },
  replyName: { fontSize: 11, fontWeight: '700', color: Colors.primary, marginBottom: 1 },
  replyContent: { fontSize: 12, color: Colors.textSecondary },
  reactions: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 3, marginHorizontal: 4 },
  reaction: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primarySurface, borderWidth: 1, borderColor: Colors.primaryBorder, borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2, gap: 2 },
  reactionEmoji: { fontSize: 14 },
  reactionCount: { fontSize: 11, color: Colors.text },
  checkWrap: { paddingHorizontal: 4, justifyContent: 'center' },
  checkbox: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: Colors.primary },
  deletedBubble: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Colors.surface, borderRadius: 12, marginHorizontal: 12 },
  deletedText: { fontSize: 13, color: Colors.textSecondary, fontStyle: 'italic' },
  systemRow: { alignItems: 'center', marginVertical: 8, paddingHorizontal: 24 },
  systemMsg: { backgroundColor: Colors.systemMsg, fontSize: 12, color: Colors.textSecondary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, textAlign: 'center' },
  actionOverlay: { flex: 1, backgroundColor: Colors.overlay, alignItems: 'center', justifyContent: 'center' },
  actionMenu: { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 24, width: 280, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 16, overflow: 'hidden' },
  quickEmoji: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: 12, paddingHorizontal: 8 },
  emojiBtn: { padding: 6 },
  emojiText: { fontSize: 22 },
  separator: { height: 1, backgroundColor: Colors.border },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  actionLabel: { fontSize: 15, color: Colors.text },
  emojiOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  emojiPicker: { backgroundColor: Colors.white, borderRadius: 16, padding: 12, width: 300, maxHeight: 300 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  emojiGridBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});