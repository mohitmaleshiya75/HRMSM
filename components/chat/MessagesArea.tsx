// // features/chat/components/MessagesArea.tsx
// import { Feather } from '@expo/vector-icons';
// import React, { useCallback } from 'react';
// import {
//   ActivityIndicator,
//   FlatList,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from 'react-native';
// import { Id, isMineMsg, Message, msgId, senderId } from './chatTypes';
// import { Colors } from './Colors';
// import MessageBubble from './MessageBubble';

// interface MessagesAreaProps {
//   groupedMsgs: { date: string; messages: Message[] }[];
//   loadingMsgs: boolean;
//   searchResults: Message[] | null;
//   meId: Id | null;
//   selectedMsgs: Set<string>;
//   selectMode: boolean;
//   showScrollBtn: boolean;
//   unreadBottom: number;
//   onScrollToBottom: () => void;
//   onEdit: (m: Message) => void;
//   onDelete: (m: Message) => void;
//   onReact: (m: Message, emoji: string) => void;
//   onForward: (m: Message) => void;
//   onReply: (m: Message) => void;
//   onShowReceipts: (m: Message) => void;
//   onShowHistory: (m: Message) => void;
//   onImageClick: (url: string) => void;
//   onSelect: (m: Message) => void;
//   onPin: (m: Message) => void;
//   onCopy: (m: Message) => void;
//   flatListRef?: React.RefObject<FlatList<any> | null>;
//   onScroll?: (event: any) => void;
// }

// export default function MessagesArea({
//   groupedMsgs,
//   loadingMsgs,
//   searchResults,
//   meId,
//   selectedMsgs,
//   selectMode,
//   showScrollBtn,
//   unreadBottom,
//   onScrollToBottom,
//   onEdit,
//   onDelete,
//   onReact,
//   onForward,
//   onReply,
//   onShowReceipts,
//   onShowHistory,
//   onImageClick,
//   onSelect,
//   onPin,
//   onCopy,
//   flatListRef,
//   onScroll,
// }: MessagesAreaProps) {
//   const flatData: (
//     | { type: 'date'; date: string }
//     | { type: 'msg'; msg: Message; prevMsg: Message | null }
//   )[] = [];

//   groupedMsgs.forEach(({ date, messages }) => {
//   messages.forEach((msg, idx) => {
//     flatData.push({
//       type: 'msg',
//       msg,
//       prevMsg: idx > 0 ? messages[idx - 1] : null,
//     });
//   });
//   flatData.push({ type: 'date', date });
// });

//   const renderItem = useCallback(
//     ({ item }: { item: typeof flatData[0] }) => {
//       if (item.type === 'date') {
//         return (
//           <View style={styles.dateSep}>
//             <Text style={styles.dateText}>{item.date}</Text>
//           </View>
//         );
//       }

//       const { msg, prevMsg } = item;
//       const mine = isMineMsg(msg, meId);
//       const sameUser = prevMsg && String(senderId(prevMsg)) === String(senderId(msg));
//       const mid = String(msgId(msg) ?? '');

//       return (
//         <View style={{ marginTop: sameUser ? 1 : 8 }}>
//           <MessageBubble
//             msg={msg}
//             isMine={mine}
//             isSelected={selectedMsgs.has(mid)}
//             selectMode={selectMode}
//             onEdit={onEdit}
//             onDelete={onDelete}
//             onReact={onReact}
//             onForward={onForward}
//             onReply={onReply}
//             onShowReceipts={onShowReceipts}
//             onShowHistory={onShowHistory}
//             onImageClick={onImageClick}
//             onSelect={onSelect}
//             onPin={onPin}
//             onCopy={onCopy}
//           />
//         </View>
//       );
//     },
//     [
//       meId,
//       selectedMsgs,
//       selectMode,
//       onEdit,
//       onDelete,
//       onReact,
//       onForward,
//       onReply,
//       onShowReceipts,
//       onShowHistory,
//       onImageClick,
//       onSelect,
//       onPin,
//       onCopy,
//     ]
//   );

//   if (loadingMsgs) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color={Colors.primary} />
//         <Text style={styles.loadingText}>Loading messages…</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <FlatList
//         ref={flatListRef}
//         style={styles.list}
//         inverted
//         data={flatData}
//         renderItem={renderItem}
//        keyExtractor={(item) =>
//   item.type === 'date'
//     ? `date-${item.date}`
//     : `msg-${msgId((item as any).msg)}`
// }
//         contentContainerStyle={styles.listContent}
//         onScroll={onScroll}
//         scrollEventThrottle={16}
//         keyboardShouldPersistTaps="handled"
//         showsVerticalScrollIndicator={false}
//         ListEmptyComponent={
//           <View style={styles.center}>
//             <Text style={styles.emptyText}>
//               {searchResults !== null
//                 ? 'No results found.'
//                 : 'No messages yet. Say hello! 👋'}
//             </Text>
//           </View>
//         }
//       />

//       {showScrollBtn && (
//         <TouchableOpacity style={styles.scrollBtn} onPress={onScrollToBottom}>
//           <Feather name="chevron-down" size={22} color={Colors.white} />
//           {unreadBottom > 0 && (
//             <View style={styles.scrollBadge}>
//               <Text style={styles.scrollBadgeText}>
//                 {unreadBottom > 9 ? '9+' : unreadBottom}
//               </Text>
//             </View>
//           )}
//         </TouchableOpacity>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   list: {
//     flex: 1,
//   },
//   listContent: {
//     flexGrow: 1,
//     paddingVertical: 12,
//     paddingBottom: 16,
//   },
//   center: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 32,
//     minHeight: 200,
//   },
//   loadingText: {
//     marginTop: 12,
//     color: Colors.textSecondary,
//     fontSize: 14,
//   },
//   emptyText: {
//     backgroundColor: 'rgba(0,0,0,0.05)',
//     borderRadius: 20,
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     color: Colors.textSecondary,
//     fontSize: 14,
//   },
//   dateSep: {
//     alignItems: 'center',
//     marginVertical: 12,
//   },
//   dateText: {
//     backgroundColor: 'rgba(255,255,255,0.9)',
//     color: Colors.textSecondary,
//     fontSize: 11,
//     fontWeight: '600',
//     paddingHorizontal: 12,
//     paddingVertical: 4,
//     borderRadius: 12,
//     overflow: 'hidden',
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//   },
//   scrollBtn: {
//     position: 'absolute',
//     bottom: 16,
//     right: 16,
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: Colors.white,
//     alignItems: 'center',
//     justifyContent: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//     elevation: 4,
//   },
//   scrollBadge: {
//     position: 'absolute',
//     top: -4,
//     right: -4,
//     width: 20,
//     height: 20,
//     borderRadius: 10,
//     backgroundColor: Colors.error,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   scrollBadgeText: {
//     color: Colors.white,
//     fontSize: 9,
//     fontWeight: '700',
//   },
// });
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
import MessageBubble from './MessageBubble';

// ─── Theme ───────────────────────────────────────────────────────────────────
const T = {
  bg: '#ffffff',
  fg: '#0f172a',
  primary: '#16a34a',
  primaryLight: '#dcfce7',
  muted: '#f1f5f9',
  mutedFg: '#6b7280',
  border: '#e5e7eb',
  white: '#ffffff',
  error: '#ef4444',
  chatBg: '#f8fafc',
  datePill: 'rgba(255,255,255,0.95)',
  datePillBorder: '#e5e7eb',
  scrollBtnBg: '#ffffff',
  scrollBtnShadow: '#000',
};

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
  // Build inverted flat list: messages first, date separator after each group
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
        return <DateSeparator date={item.date} />;
      }

      const { msg, prevMsg } = item;
      const mine = isMineMsg(msg, meId);
      const sameUser =
        prevMsg && String(senderId(prevMsg)) === String(senderId(msg));
      const mid = String(msgId(msg) ?? '');

      return (
        <View style={{ marginTop: sameUser ? 2 : 10 }}>
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
    ],
  );

  if (loadingMsgs) {
    return (
      <View style={styles.center}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={T.primary} />
          <Text style={styles.loadingText}>Loading messages…</Text>
        </View>
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
        keyExtractor={item =>
          item.type === 'date'
            ? `date-${item.date}`
            : `msg-${msgId((item as any).msg)}`
        }
        contentContainerStyle={styles.listContent}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyMessages isSearch={searchResults !== null} />}
      />

      {showScrollBtn && (
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.scrollBtn}
          onPress={onScrollToBottom}>
          <Feather name="chevron-down" size={20} color={T.primary} />
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function DateSeparator({ date }: { date: string }) {
  return (
    <View style={styles.dateSep}>
      <View style={styles.dateLine} />
      <View style={styles.datePill}>
        <Text style={styles.dateText}>{date}</Text>
      </View>
      <View style={styles.dateLine} />
    </View>
  );
}

function EmptyMessages({ isSearch }: { isSearch: boolean }) {
  return (
    <View style={[styles.center, { transform: [{ rotate: '180deg' }] }]}>
      <View style={styles.emptyIconWrap}>
        <Feather
          name={isSearch ? 'search' : 'message-circle'}
          size={30}
          color={T.primary}
        />
      </View>
      <Text style={styles.emptyTitle}>
        {isSearch ? 'No results found' : 'No messages yet'}
      </Text>
      <Text style={styles.emptySubtext}>
        {isSearch
          ? 'Try a different search term'
          : 'Be the first to say something 👋'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.chatBg,
  },
  list: { flex: 1 },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },

  // ── Loading
  center: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
    padding: 32,
    minHeight: 200,
  },
  loadingCard: {
    alignItems: 'center',
    backgroundColor: T.white,
    paddingHorizontal: 28,
    paddingVertical: 24,
    borderRadius: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  loadingText: {
    color: T.mutedFg,
    fontSize: 13,
    fontWeight: '500',
  },

  // ── Date separator
  dateSep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 8,
    gap: 10,
  },
  dateLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: T.border,
  },
  datePill: {
    backgroundColor: T.datePill,
    borderWidth: 1,
    borderColor: T.datePillBorder,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  dateText: {
    color: T.mutedFg,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // ── Empty
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: T.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: T.fg,
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  emptySubtext: {
    fontSize: 13,
    color: T.mutedFg,
    textAlign: 'center',
    lineHeight: 19,
  },

  // ── Scroll to bottom button
  scrollBtn: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: T.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: T.primaryLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  scrollBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: T.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: T.white,
  },
  scrollBadgeText: {
    color: T.white,
    fontSize: 9,
    fontWeight: '800',
  },
});