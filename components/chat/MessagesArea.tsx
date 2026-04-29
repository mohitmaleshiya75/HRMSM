// features/chat/components/MessagesArea.tsx
import { Feather } from '@expo/vector-icons';
import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Id, isMineMsg, Message, msgId, senderId } from './chatTypes';
import { Colors } from './Colors';
import MessageBubble from './MessageBubble';

interface MessagesAreaProps {
  groupedMsgs: { date: string; messages: Message[] }[];
  loadingMsgs: boolean;
  searchResults: Message[] | null;
  meId: Id | null;
  selectedMsgs: Set<string>;
  selectMode: boolean;
  showScrollBtn: boolean;
  unreadBottom: number;
  onScrollToBottom: () => void;
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
  flatListRef?: React.RefObject<FlatList<any> | null>;
  onScroll?: (event: any) => void;
}

export default function MessagesArea({
  groupedMsgs,
  loadingMsgs,
  searchResults,
  meId,
  selectedMsgs,
  selectMode,
  showScrollBtn,
  unreadBottom,
  onScrollToBottom,
  onEdit,
  onDelete,
  onReact,
  onForward,
  onReply,
  onShowReceipts,
  onShowHistory,
  onImageClick,
  onSelect,
  onPin,
  onCopy,
  flatListRef,
  onScroll,
}: MessagesAreaProps) {
  const flatData: (
    | { type: 'date'; date: string }
    | { type: 'msg'; msg: Message; prevMsg: Message | null }
  )[] = [];

  groupedMsgs.forEach(({ date, messages }) => {
  messages.forEach((msg, idx) => {
    flatData.push({
      type: 'msg',
      msg,
      prevMsg: idx > 0 ? messages[idx - 1] : null,
    });
  });
  flatData.push({ type: 'date', date });
});

  const renderItem = useCallback(
    ({ item }: { item: typeof flatData[0] }) => {
      if (item.type === 'date') {
        return (
          <View style={styles.dateSep}>
            <Text style={styles.dateText}>{item.date}</Text>
          </View>
        );
      }

      const { msg, prevMsg } = item;
      const mine = isMineMsg(msg, meId);
      const sameUser = prevMsg && String(senderId(prevMsg)) === String(senderId(msg));
      const mid = String(msgId(msg) ?? '');

      return (
        <View style={{ marginTop: sameUser ? 1 : 8 }}>
          <MessageBubble
            msg={msg}
            isMine={mine}
            isSelected={selectedMsgs.has(mid)}
            selectMode={selectMode}
            onEdit={onEdit}
            onDelete={onDelete}
            onReact={onReact}
            onForward={onForward}
            onReply={onReply}
            onShowReceipts={onShowReceipts}
            onShowHistory={onShowHistory}
            onImageClick={onImageClick}
            onSelect={onSelect}
            onPin={onPin}
            onCopy={onCopy}
          />
        </View>
      );
    },
    [
      meId,
      selectedMsgs,
      selectMode,
      onEdit,
      onDelete,
      onReact,
      onForward,
      onReply,
      onShowReceipts,
      onShowHistory,
      onImageClick,
      onSelect,
      onPin,
      onCopy,
    ]
  );

  if (loadingMsgs) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading messages…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        style={styles.list}
        inverted
        data={flatData}
        renderItem={renderItem}
       keyExtractor={(item) =>
  item.type === 'date'
    ? `date-${item.date}`
    : `msg-${msgId((item as any).msg)}`
}
        contentContainerStyle={styles.listContent}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>
              {searchResults !== null
                ? 'No results found.'
                : 'No messages yet. Say hello! 👋'}
            </Text>
          </View>
        }
      />

      {showScrollBtn && (
        <TouchableOpacity style={styles.scrollBtn} onPress={onScrollToBottom}>
          <Feather name="chevron-down" size={22} color={Colors.white} />
          {unreadBottom > 0 && (
            <View style={styles.scrollBadge}>
              <Text style={styles.scrollBadgeText}>
                {unreadBottom > 9 ? '9+' : unreadBottom}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingVertical: 12,
    paddingBottom: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    minHeight: 200,
  },
  loadingText: {
    marginTop: 12,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  emptyText: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  dateSep: {
    alignItems: 'center',
    marginVertical: 12,
  },
  dateText: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  scrollBtn: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  scrollBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBadgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '700',
  },
});