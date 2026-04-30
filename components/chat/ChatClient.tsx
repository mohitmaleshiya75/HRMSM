// features/chat/ChatClient.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  LayoutAnimation,
  BackHandler,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useNavigation } from 'expo-router';

import {
  Employee,
  Room,
  Message,
  Receipt,
  Id,
  empId,
  empName,
  roomId,
  msgId,
  msgText,
  isMineMsg,
  fmtDate,
  msgTs,
  normalizeList,
  flattenEmployees,
  confirmAction,
} from './chatTypes';
import { makeApi } from './chatAPI';
import { useWebSocket } from './useWebSocket';
import { Colors } from './Colors';

import ChatSidebar from './ChatSidebar';
import ChatTopBar from './ChatTopBar';
import MessageInput from './MessageInput';
import MessagesArea from './MessagesArea';
import DetailPanel from './DetailPanel';
import {
  AddParticipantsModal,
  ForwardModal,
  ReceiptsModal,
  HistoryModal,
  CreateGroupModal,
} from './ChatModals';
import { User } from '@/features/auth/types';

export default function ChatClient({ currentUser }: { currentUser: User }) {
  const token = useMemo(() => currentUser.token as string, [currentUser.token]);

  const meId = useMemo<Id | null>(() => {
    const id = currentUser?.id;
    if (id != null && id !== '') return id;
    return (currentUser as any)?.employee_id ?? (currentUser as any)?.pk ?? null;
  }, [currentUser]);

  const api = useMemo(() => makeApi(token), [token]);

  // ── State ─────────────────────────────────────────────────────────────────
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [searchResults, setSearchResults] = useState<Message[] | null>(null);
  const [chatSearch, setChatSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const [selectMode, setSelectMode] = useState(false);
  const [selectedMsgs, setSelectedMsgs] = useState(new Set<string>());
  const [mutedRooms, setMutedRooms] = useState(new Set<string>());
  const [pinnedMsg, setPinnedMsg] = useState<Message | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [unreadBottom, setUnreadBottom] = useState(0);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [fwdMsg, setFwdMsg] = useState<Message | null>(null);
  const [showAddPart, setShowAddPart] = useState(false);
  const [receiptsData, setReceiptsData] = useState<Receipt[] | null>(null);
  const [historyData, setHistoryData] = useState<unknown[] | null>(null);
  const [otherStatus, setOtherStatus] = useState<{
    is_online?: boolean;
    last_seen_human?: string;
  } | null>(null);

  const sendRef = useRef<(data: unknown) => boolean>(() => false);
  const flatListRef = useRef<FlatList<any>>(null);
  const selectedRoomRef = useRef<Room | null>(null);
  const meIdRef = useRef<Id | null>(null);
  const loadingMsgsRef = useRef(false);
  const isTypingRef = useRef(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadRoomsRef = useRef<(() => Promise<void>) | null>(null);
  const currentRoomIdRef = useRef<Id | null>(null);

  const navigation = useNavigation();

  // Handle Hardware Back Button for Android
  useEffect(() => {
    const backAction = () => {
      if (selectedRoom) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSelectedRoom(null);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [selectedRoom]);

  useEffect(() => {
    navigation.setOptions({
      tabBarStyle: selectedRoom ? { display: 'none' } : { display: 'flex' },
    });
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [selectedRoom, navigation]);

  selectedRoomRef.current = selectedRoom;
  meIdRef.current = meId;

  const currentRoomId = useMemo(
    () => selectedRoom?.id ?? selectedRoom?.room_id ?? null,
    [selectedRoom?.id, selectedRoom?.room_id]
  );
  currentRoomIdRef.current = currentRoomId;

  // ── WS Event Handler ───────────────────────────────────────────────────────
  const handleWsEvent = useCallback(
    (event: string, payload: unknown, wsRoomId: Id) => {
      const p = payload as Record<string, unknown>;
      const myId = meIdRef.current;
      const msgRid = String(p.room ?? wsRoomId);
      const curId = String(currentRoomIdRef.current ?? '');
      const inCur = msgRid === curId;

      switch (event) {
        case 'new_message': {
          const msg = p as Message;
          const mine = isMineMsg(msg, myId);

          setMessages(prev => {
            if (prev.find(m => !m.isPending && String(msgId(m)) === String(msgId(msg)))) return prev;

            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

            if (mine) {
              const pi = prev.findIndex(m => m.isPending && String(msgId(m)).startsWith('temp-'));
              if (pi >= 0) {
                const n = [...prev];
                n[pi] = { ...msg, isPending: false };
                return n;
              }
            }

            // Prepend for inverted list so it appears at the bottom
            return [msg, ...prev];
          });

          if (!mine) {
            if (!inCur) {
              setUnreadMap(prev => ({
                ...prev,
                [msgRid]: (prev[msgRid] || 0) + 1,
              }));
            }

            if (inCur && msgId(msg)) {
              sendRef.current({ type: 'mark_seen', last_message_id: msgId(msg) });
            }

            if (inCur) {
              const newCount = unreadBottom + 1;
              setUnreadBottom(newCount);
            }
          } else {
            // Scroll to offset 0 (bottom of inverted list)
            setTimeout(() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true }), 50);
          }

          setRooms(prev =>
            prev.map(r =>
              String(roomId(r)) === msgRid
                ? { ...r, last_message: msg, updated_at: msg.created_at }
                : r
            )
          );
          break;
        }

        case 'message_edited': {
          const m = p as Message;
          setMessages(prev =>
            prev.map(x =>
              String(msgId(x)) === String(m.id ?? m.message_id)
                ? { ...x, ...m, is_edited: true }
                : x
            )
          );
          break;
        }

        case 'message_deleted': {
          const mid = p.message_id ?? (p as Message).id;
          setMessages(prev =>
            prev.map(x =>
              String(msgId(x)) === String(mid)
                ? { ...x, is_deleted: true, content: '' }
                : x
            )
          );
          break;
        }

        case 'message_status_updated': {
          setMessages(prev =>
            prev.map(x =>
              String(msgId(x)) === String(p.message_id)
                ? {
                    ...x,
                    status: p.status as Message['status'],
                    tick_status: p.status as string,
                  }
                : x
            )
          );
          break;
        }

        case 'reaction_added': {
          const { message_id, emoji, employee_id } = p;
          setMessages(prev =>
            prev.map(msg => {
              if (String(msgId(msg)) !== String(message_id)) return msg;
              const existing = msg.reactions || [];
              if (
                existing.find(
                  r =>
                    r.emoji === emoji &&
                    String(empId(r.employee)) === String(employee_id)
                )
              ) {
                return msg;
              }
              return {
                ...msg,
                reactions: [
                  ...existing,
                  {
                    emoji: emoji as string,
                    employee: p.employee as Employee,
                    count: 1,
                  },
                ],
              };
            })
          );
          break;
        }

        case 'reaction_removed': {
          const { message_id, emoji, employee_id } = p;
          setMessages(prev =>
            prev.map(msg => {
              if (String(msgId(msg)) !== String(message_id)) return msg;
              return {
                ...msg,
                reactions: (msg.reactions || []).filter(
                  r =>
                    !(
                      r.emoji === emoji &&
                      String(empId(r.employee)) === String(employee_id)
                    )
                ),
              };
            })
          );
          break;
        }

        case 'typing': {
          const eid_ = String(p.employee_id || '');
          if (String(p.employee_id) === String(myId)) break;

          const name_ = String(
            p.employee_name || p.full_name || p.employee_id || ''
          );

          if (p.is_typing) {
            setTypingUsers(prev => ({ ...prev, [eid_]: name_ }));
            setTimeout(() => {
              setTypingUsers(prev => {
                const n = { ...prev };
                delete n[eid_];
                return n;
              });
            }, 3500);
          } else {
            setTypingUsers(prev => {
              const n = { ...prev };
              delete n[eid_];
              return n;
            });
          }
          break;
        }

        case 'messages_seen': {
          const lastId = String(p.last_message_id);
          setMessages(prev =>
            prev.map(x =>
              String(msgId(x)) <= lastId
                ? { ...x, status: 'seen', tick_status: 'seen' }
                : x
            )
          );
          break;
        }

        case 'message_pinned': {
          const pinned = p as Message;
          setPinnedMsg(pinned);
          setMessages(prev =>
            prev.map(m =>
              String(msgId(m)) === String(msgId(pinned))
                ? { ...m, is_pinned: true }
                : { ...m, is_pinned: false }
            )
          );
          break;
        }

        case 'message_unpinned':
          setPinnedMsg(null);
          setMessages(prev => prev.map(m => ({ ...m, is_pinned: false })));
          break;
      }
    },
    [unreadBottom]
  );

  // ── Data loaders ───────────────────────────────────────────────────────────
  const loadEmployees = useCallback(async () => {
    try {
      const data = await api.employees();
      const flat = flattenEmployees(data);
      const seen = new Set<string>();

      setEmployees(
        flat.filter(e => {
          const id = String(empId(e));
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        })
      );
    } catch {
      setEmployees([]);
    }
  }, [api]);

  const loadRooms = useCallback(async () => {
    setLoadingRooms(true);
    try {
      const data = await api.listRooms();
      const list = normalizeList<Room>(data);
      setRooms(list);

      const map: Record<string, number> = {};
      list.forEach(r => {
        map[String(roomId(r) ?? '')] = r.unread_count ?? 0;
      });
      setUnreadMap(map);
    } catch {
    } finally {
      setLoadingRooms(false);
    }
  }, [api]);

  const loadMessages = useCallback(
    async (rid: Id, scrollBottom = true, doMarkSeen = true, silent = false) => {
      if (loadingMsgsRef.current) return;

      loadingMsgsRef.current = true;
      if (!silent) setLoadingMsgs(true);

      try {
        const data = await api.listMessages(rid);
        const list = normalizeList<Message>(data);

        // Reverse list because API is usually oldest -> newest, but UI needs newest at index 0
        setMessages([...list].reverse());
        setSearchResults(null);
        setUnreadMap(prev => ({ ...prev, [String(rid)]: 0 }));
        setUnreadBottom(0);

        if (doMarkSeen) {
          const last = list[list.length - 1];
          if (last && msgId(last)) {
            sendRef.current({
              type: 'mark_seen',
              last_message_id: msgId(last),
            });
          }
        }

        setPinnedMsg(list.find(m => m.is_pinned) || null);

        if (scrollBottom && !silent) {
          setTimeout(
            () => flatListRef.current?.scrollToOffset({ offset: 0, animated: false }),
            100
          );
        }
      } catch (e) {
        if (!silent) setError((e as Error).message);
      } finally {
        setLoadingMsgs(false);
        loadingMsgsRef.current = false;
      }
    },
    [api]
  );

  // ── Room selection ─────────────────────────────────────────────────────────
  const selectTarget = useCallback(
    async (target: Employee | Room) => {
      setError(null);
      setSearchResults(null);
      setChatSearch('');
      setSelectMode(false);
      setSelectedMsgs(new Set());
      setReplyTo(null);
      setShowSearch(false);
      setShowDetail(false);
      
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

      const asRoom = target as Room;
      if (asRoom.room_type || asRoom.participants || (asRoom as any).room_id) {
        const rid = roomId(asRoom);
        if (!rid) return;

        try {
          // Reset local message state before loading new room for smoother transition
          setMessages([]);
          const room = await api.getRoom(rid);
          setSelectedRoom(room);
          await loadMessages(rid);
        } catch (e) {
          setError((e as Error).message);
        }
        return;
      }

      const emp = target as Employee;
      const eid = empId(emp);

      if (!eid || String(eid) === String(meId)) {
        setError("Can't message yourself.");
        return;
      }

      try {
        const room = await api.createRoom({
          room_type: 'direct',
          employee_id: eid,
        });
        await loadRooms();

        const rid = roomId(room);
        if (rid) {
          const fresh = await api.getRoom(rid);
          setSelectedRoom(fresh);
          await loadMessages(rid);
        }
      } catch (e) {
        setError((e as Error).message);
      }
    },
    [api, loadMessages, loadRooms, meId]
  );

  // ── WebSocket ──────────────────────────────────────────────────────────────
  const { status: wsStatus, send: wsSend } = useWebSocket(
    currentRoomId,
    token,
    handleWsEvent
  );

  useEffect(() => {
    sendRef.current = wsSend;
  }, [wsSend]);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const rid = currentRoomId;
    console.log('[ChatDebug] sendMessage triggered. RoomID:', rid);
    if (!rid) {
      console.warn('[ChatDebug] Aborting send: No currentRoomId');
      return;
    }

  const text = (drafts[String(rid)] || '').trim();
    console.log('[ChatDebug] Message text:', text);
    if (!text) return;

    const prevReply = replyTo;
    setDrafts(prev => ({ ...prev, [String(rid)]: '' }));
    setReplyTo(null);

    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      sender: {
        ...currentUser,
        full_name: empName(currentUser as any),
      } as unknown as Employee,
      content: text,
      message_type: 'text',
      created_at: new Date().toISOString(),
      status: 'sending',
      isPending: true,
      reply_to: prevReply || null,
      room: rid,
    };

    setMessages(prev => [
      optimisticMsg,
      ...prev,
    ]);

    setTimeout(() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true }), 20);

    const sent = wsSend({
      type: 'send_message',
      room_id: rid,
      content: text,
      reply_to_id: prevReply ? msgId(prevReply) : null,
    });

    console.log('[ChatDebug] wsSend response:', sent);

    if (!sent) {
      console.error('[ChatDebug] Failed to send via WebSocket (Socket not open)');
      setError('Reconnecting… please wait.');
        setTimeout(() => {
    setError(null); // or setError('') depending on your initial state
  }, 3000);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setDrafts(prev => ({ ...prev, [String(rid)]: text })); 
      setReplyTo(prevReply);
    }
  }, [currentRoomId, currentUser, drafts, replyTo, wsSend]);

  // ── Message actions ────────────────────────────────────────────────────────
  const handleEdit = useCallback(
    async (msg: Message) => {
      const id = msgId(msg);
      if (!id) return;

      Alert.prompt?.(
        'Edit Message',
        'Edit your message:',
        async (newText) => {
          if (!newText || newText.trim() === msgText(msg)) return;
          try {
            await api.editMessage(id, { content: newText.trim() });
            setMessages(prev =>
              prev.map(m =>
                String(msgId(m)) === String(id)
                  ? { ...m, content: newText.trim(), is_edited: true }
                  : m
              )
            );
          } catch (e) {
            setError((e as Error).message);
          }
        },
        'plain-text',
        msgText(msg)
      );
    },
    [api]
  );

  const handleDelete = useCallback(
    async (msg: Message) => {
      const id = msgId(msg);
      if (!id) return;

      confirmAction('Delete this message?', async () => {
        try {
          await api.deleteMessage(id, true);
          setMessages(prev =>
            prev.map(m =>
              String(msgId(m)) === String(id) ? { ...m, is_deleted: true } : m
            )
          );
        } catch (e) {
          setError((e as Error).message);
        }
      });
    },
    [api]
  );

  const handleBulkDelete = useCallback(async () => {
    if (!currentRoomId || selectedMsgs.size === 0) return;

    confirmAction(`Delete ${selectedMsgs.size} messages?`, async () => {
      try {
        await api.bulkDelete(currentRoomId, {
          message_ids: [...selectedMsgs],
        });
        setMessages(prev =>
          prev.map(m =>
            selectedMsgs.has(String(msgId(m)))
              ? { ...m, is_deleted: true }
              : m
          )
        );
        setSelectedMsgs(new Set());
        setSelectMode(false);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }, [api, currentRoomId, selectedMsgs]);

  const handleReact = useCallback(
    async (msg: Message, emoji: string) => {
      const id = msgId(msg);
      if (!id) return;

      try {
        const mine = msg.reactions?.find(
          r => String(empId(r.employee)) === String(meId)
        );
        if (mine && mine.emoji === emoji) await api.removeReaction(id);
        else await api.react(id, { emoji });
      } catch (e) {
        setError((e as Error).message);
      }
    },
    [api, meId]
  );

  const handlePin = useCallback(
    async (msg: Message) => {
      const id = msgId(msg);
      if (!id) return;

      try {
        if (msg.is_pinned) {
          await api.unpinMessage(id);
          setPinnedMsg(null);
        } else {
          await api.pinMessage(id);
          setPinnedMsg({ ...msg, is_pinned: true });
        }

        setMessages(prev =>
          prev.map(m =>
            String(msgId(m)) === String(id)
              ? { ...m, is_pinned: !m.is_pinned }
              : { ...m, is_pinned: false }
          )
        );
      } catch (e) {
        setError((e as Error).message);
      }
    },
    [api]
  );

  const handleCopy = useCallback(async (msg: Message) => {
    const t = msgText(msg);
    if (t) {
      try {
        await Clipboard.setStringAsync(t);
      } catch {}
    }
  }, []);

  const handleForwardSubmit = useCallback(
    async (roomIds: Id[]) => {
      if (!fwdMsg) return;
      const id = msgId(fwdMsg);
      if (!id) return;

      try {
        await api.forwardMessage(id, { room_ids: roomIds.map(Number) });
        setFwdMsg(null);
      } catch (e) {
        setError((e as Error).message);
      }
    },
    [api, fwdMsg]
  );

  const handleShowReceipts = useCallback(
    async (msg: Message) => {
      const id = msgId(msg);
      if (!id) return;

      try {
        const data = await api.receipts(id);
        setReceiptsData(Array.isArray(data) ? data : []);
      } catch (e) {
        setError((e as Error).message);
      }
    },
    [api]
  );

  const handleShowHistory = useCallback(
    async (msg: Message) => {
      const id = msgId(msg);
      if (!id) return;

      try {
        const data = await api.editHistory(id);
        setHistoryData(normalizeList(data));
      } catch (e) {
        setError((e as Error).message);
      }
    },
    [api]
  );

  const handleTyping = useCallback(() => {
    if (!currentRoomId) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      wsSend({ type: 'typing', is_typing: true });
    }

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      wsSend({ type: 'typing', is_typing: false });
    }, 3000);
  }, [currentRoomId, wsSend]);

  // ── Group management ───────────────────────────────────────────────────────
  const handleCreateGroup = useCallback(
    async (data: {
      name: string;
      description: string;
      participant_ids: Id[];
    }) => {
      try {
        const room = await api.createRoom({
          room_type: 'group',
          name: data.name,
          description: data.description,
          participant_ids: data.participant_ids.map(Number),
        });

        await loadRooms();

        const rid = roomId(room);
        if (rid) {
          const fresh = await api.getRoom(rid);
          setSelectedRoom(fresh);
          await loadMessages(rid);
        }
      } catch (e) {
        setError((e as Error).message);
      }
    },
    [api, loadRooms, loadMessages]
  );

  const handleAddParticipants = useCallback(
    async (ids: Id[]) => {
      if (!currentRoomId) return;

      try {
        await api.addParticipants(currentRoomId, {
          employee_ids: ids.map(Number),
        });
        setShowAddPart(false);
        const fresh = await api.getRoom(currentRoomId);
        setSelectedRoom(fresh);
      } catch (e) {
        setError((e as Error).message);
      }
    },
    [api, currentRoomId]
  );

  const handleRemoveParticipant = useCallback(
    async (emp: Employee) => {
      if (!currentRoomId) return;

      try {
        await api.removeParticipant(currentRoomId, {
          employee_id: Number(empId(emp)),
        });
        const fresh = await api.getRoom(currentRoomId);
        setSelectedRoom(fresh);
      } catch (e) {
        setError((e as Error).message);
      }
    },
    [api, currentRoomId]
  );

  const handleChangeRole = useCallback(
    async (emp: Employee, role: string) => {
      if (!currentRoomId) return;

      try {
        await api.changeRole(currentRoomId, {
          employee_id: Number(empId(emp)),
          role,
        });
        const fresh = await api.getRoom(currentRoomId);
        setSelectedRoom(fresh);
      } catch (e) {
        setError((e as Error).message);
      }
    },
    [api, currentRoomId]
  );

  const handleRejoin = useCallback(
    async (emp: Employee) => {
      if (!currentRoomId) return;

      try {
        await api.addParticipants(currentRoomId, {
          employee_ids: [Number(empId(emp))],
        });
        const fresh = await api.getRoom(currentRoomId);
        setSelectedRoom(fresh);
      } catch (e) {
        setError((e as Error).message);
      }
    },
    [api, currentRoomId]
  );

  const handleUpdateGroup = useCallback(
    async (data: { name?: string; description?: string }) => {
      if (!currentRoomId) return;

      try {
        await api.updateRoom(currentRoomId, data);
        const fresh = await api.getRoom(currentRoomId);
        setSelectedRoom(fresh);
        setRooms(prev =>
          prev.map(r =>
            String(roomId(r)) === String(currentRoomId)
              ? { ...r, ...fresh }
              : r
          )
        );
      } catch (e) {
        setError((e as Error).message);
      }
    },
    [api, currentRoomId]
  );

  const handleLeave = useCallback(async () => {
    if (!currentRoomId) return;

    try {
      await api.leaveRoom(currentRoomId);
      setSelectedRoom(null);
      setMessages([]);
      setShowDetail(false);
      await loadRooms();
    } catch (e) {
      setError((e as Error).message);
    }
  }, [api, currentRoomId, loadRooms]);

  const handleClearChat = useCallback(async () => {
    if (!currentRoomId) return;

    confirmAction('Clear all messages?', async () => {
      try {
        await api.clearChat(currentRoomId);
        setMessages([]);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }, [api, currentRoomId]);

  const handleMuteToggle = useCallback(() => {
    if (!currentRoomId) return;

    const rid = String(currentRoomId);
    const next = new Set(mutedRooms);

    if (next.has(rid)) next.delete(rid);
    else next.add(rid);

    setMutedRooms(next);
  }, [currentRoomId, mutedRooms]);

  const handleSearchMessages = useCallback(async () => {
    const q = chatSearch.trim();
    const rid = currentRoomId;
    if (!q || !rid) return;

    try {
      const data = await api.searchMessages(rid, q);
      setSearchResults(normalizeList<Message>(data));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [api, chatSearch, currentRoomId]);

  // ── Polling ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentRoomId) return;

    const interval = setInterval(() => {
      const rid = currentRoomIdRef.current;
      if (rid && !loadingMsgsRef.current) {
        loadMessages(rid, false, false, true);
      }
    }, wsStatus === 'connected' ? 30000 : 5000);

    return () => clearInterval(interval);
  }, [loadMessages, wsStatus, currentRoomId]);

  useEffect(() => {
    const t = setInterval(() => {
      loadRoomsRef.current?.();
    }, 30000);

    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    loadRoomsRef.current = loadRooms;
  }, [loadRooms]);

  useEffect(() => {
    loadEmployees();
    loadRooms();
    api.updateOnline({ is_online: true }).catch(() => {});
    return () => {
      api.updateOnline({ is_online: false }).catch(() => {});
    };
  }, []);

  // ── Online status ─────────────────────────────────────────────────────────
  const otherParticipant =
    selectedRoom?.room_type === 'direct'
      ? (selectedRoom.room_participants || []).find(
          p => String(empId(p.employee)) !== String(meId)
        )?.employee
      : undefined;

  const isOtherOnline = otherParticipant?.online_status?.is_online === true;

  useEffect(() => {
    if (!otherParticipant) {
      setOtherStatus(null);
      return;
    }

    const fetchStatus = async () => {
      const id = empId(otherParticipant);
      if (!id) return;

      try {
        const data = await api.getOnlineStatus(id);
        setOtherStatus(
          data as { is_online?: boolean; last_seen_human?: string }
        );
      } catch {}
    };

    fetchStatus();

    const t = setInterval(fetchStatus, 30000);
    return () => clearInterval(t);
  }, [api, otherParticipant]);

  // ── Computed ───────────────────────────────────────────────────────────────
  const displayedMsgs = searchResults ?? messages;
  const typingList = Object.values(typingUsers);
  const isMuted = mutedRooms.has(String(currentRoomId ?? ''));

  const isGroupAdmin = useMemo(
    () =>
      selectedRoom?.room_type === 'group' &&
      (selectedRoom.room_participants || []).some(
        p => String(empId(p.employee)) === String(meId) && p.role === 'admin'
      ),
    [selectedRoom, meId]
  );

  const roomParticipantEmployees = useMemo(
    () =>
      (selectedRoom?.room_participants || [])
        .filter(
          p => p.is_active && String(empId(p.employee)) !== String(meId)
        )
        .map(p => p.employee!)
        .filter(Boolean),
    [selectedRoom, meId]
  );

  const groupedMsgs = useMemo(() => {
    const groups: { date: string; messages: Message[] }[] = [];
    displayedMsgs.forEach(msg => {
      const date = fmtDate(msgTs(msg));
      if (!groups.length || groups[groups.length - 1].date !== date) {
        groups.push({ date, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });
    return groups;
  }, [displayedMsgs]);

  const handleMsgSelect = useCallback((m: Message) => {
    const k = String(msgId(m) ?? '');
    setSelectedMsgs(prev => {
      const s = new Set(prev);
      s.has(k) ? s.delete(k) : s.add(k);
      return s;
    });
  }, []);

  const sharedModals = (
    <>
      <AddParticipantsModal
        visible={showAddPart}
        employees={employees}
        meId={meId}
        existingIds={new Set(
          roomParticipantEmployees.map(e => String(empId(e)))
        )}
        onClose={() => setShowAddPart(false)}
        onAdd={handleAddParticipants}
      />

      <ForwardModal
        visible={!!fwdMsg}
        rooms={rooms}
        currentRoomId={currentRoomId}
        meId={meId}
        onClose={() => setFwdMsg(null)}
        onForward={handleForwardSubmit}
      />

      <ReceiptsModal
        visible={receiptsData !== null}
        receipts={receiptsData || []}
        onClose={() => setReceiptsData(null)}
      />

      <HistoryModal
        visible={historyData !== null}
        history={(historyData || []) as any}
        onClose={() => setHistoryData(null)}
      />

      <CreateGroupModal
        visible={showCreateGroup}
        employees={employees}
        meId={meId}
        onClose={() => setShowCreateGroup(false)}
        onSubmit={async data => {
          setShowCreateGroup(false);
          await handleCreateGroup(data);
        }}
      />

      {error && (
        <View style={styles.errorToast}>
          <Text style={styles.errorText} numberOfLines={2}>
            {error}
          </Text>
        </View>
      )}
    </>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  if (!selectedRoom) {
    return (
      <SafeAreaView style={styles.flex}>
        <StatusBar backgroundColor={Colors.headerBg} barStyle="light-content" />

        <ChatSidebar
          employees={employees}
          rooms={rooms}
          meId={meId}
          selectedRoomId={currentRoomId}
          loading={loadingRooms}
          unreadMap={unreadMap}
          mutedRooms={mutedRooms}
          visible={true}
          inline={true}
          onClose={() => setShowSidebar(false)}
          onSelect={selectTarget}
          onCreateGroup={() => setShowCreateGroup(true)}
          onRefresh={() => {
            loadRooms();
            loadEmployees();
          }}
        />

        {sharedModals}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.flex}>
      <StatusBar backgroundColor={Colors.headerBg} barStyle="light-content" />

      <View style={styles.flex}>
        <ChatTopBar
          selectedRoom={selectedRoom}
          meId={meId}
          typingList={typingList}
          otherStatus={otherStatus}
          otherParticipant={otherParticipant}
          isOtherOnline={isOtherOnline}
          unreadNotifs={0}
          showSearch={showSearch}
          showDetail={showDetail}
          selectMode={selectMode}
          selectedMsgsCount={selectedMsgs.size}
          isMuted={isMuted}
          chatSearch={chatSearch}
          searchResultsCount={searchResults !== null ? searchResults.length : null}
          wsStatus={wsStatus}
          onBack={() => setSelectedRoom(null)}
          onOpenSidebar={() => setShowSidebar(true)}
          onToggleSearch={() => setShowSearch(v => !v)}
          onToggleDetail={() => setShowDetail(true)}
          onToggleSelectMode={() => {
            setSelectMode(v => !v);
            setSelectedMsgs(new Set());
          }}
          onCancelSelect={() => {
            setSelectMode(false);
            setSelectedMsgs(new Set());
          }}
          onBulkDelete={handleBulkDelete}
          onSearchChange={setChatSearch}
          onSearchSubmit={handleSearchMessages}
          onClearSearch={() => {
            setSearchResults(null);
            setChatSearch('');
            setShowSearch(false);
          }}
        />

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 115 : 0}
        >
          <View style={styles.flex}>
            {pinnedMsg && (
              <View style={styles.pinBar}>
                <Text style={styles.pinIcon}>📌</Text>
                <View style={styles.pinContent}>
                  <Text style={styles.pinLabel}>Pinned</Text>
                  <Text style={styles.pinText} numberOfLines={1}>
                    {empName(pinnedMsg.sender)}: {msgText(pinnedMsg)}
                  </Text>
                </View>
              </View>
            )}

            <MessagesArea
              groupedMsgs={groupedMsgs}
              loadingMsgs={loadingMsgs}
              searchResults={searchResults}
              meId={meId}
              selectedMsgs={selectedMsgs}
              selectMode={selectMode}
              showScrollBtn={showScrollBtn}
              unreadBottom={unreadBottom}
              flatListRef={flatListRef}
              onScrollToBottom={() => {
                flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
                setUnreadBottom(0);
              }}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onReact={handleReact}
              onForward={m => setFwdMsg(m)}
              onReply={setReplyTo}
              onShowReceipts={handleShowReceipts}
              onShowHistory={handleShowHistory}
              onImageClick={(_url) => {}}
              onSelect={handleMsgSelect}
              onPin={handlePin}
              onCopy={handleCopy}
            />

            {typingList.length > 0 && (
              <View style={styles.typingBar}>
                <Text style={styles.typingDots}>● ● ●</Text>
                <Text style={styles.typingText}>
                  {typingList.join(', ')} typing…
                </Text>
              </View>
            )}

            <MessageInput
              replyTo={replyTo}
              onClearReply={() => setReplyTo(null)}
              draft={currentRoomId ? (drafts[String(currentRoomId)] || '') : ''}
              setDraft={(val) => {
                if (currentRoomId) {
                  setDrafts(prev => ({ ...prev, [String(currentRoomId)]: val }));
                }
              }}
              onSend={sendMessage}
              onTyping={handleTyping}
              uploading={uploading}
              uploadProgress={uploadPct}
            />
          </View>
        </KeyboardAvoidingView>
      </View>

      <ChatSidebar
        employees={employees}
        rooms={rooms}
        meId={meId}
        selectedRoomId={currentRoomId}
        loading={loadingRooms}
        unreadMap={unreadMap}
        mutedRooms={mutedRooms}
        visible={showSidebar}
        onClose={() => setShowSidebar(false)}
        onSelect={selectTarget}
        onCreateGroup={() => setShowCreateGroup(true)}
        onRefresh={() => {
          loadRooms();
          loadEmployees();
        }}
      />

      {showDetail && selectedRoom && (
        <DetailPanel
          visible={showDetail}
          room={selectedRoom}
          meId={meId}
          isAdmin={isGroupAdmin}
          isMuted={isMuted}
          onClose={() => setShowDetail(false)}
          onAddParticipants={() => setShowAddPart(true)}
          onRemoveParticipant={handleRemoveParticipant}
          onChangeRole={handleChangeRole}
          onLeave={handleLeave}
          onMuteToggle={handleMuteToggle}
          onClearChat={handleClearChat}
          onUpdateGroup={handleUpdateGroup}
          onRejoin={handleRejoin}
        />
      )}

      {sharedModals}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  emptyHeader: {
    backgroundColor: Colors.headerBg,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  emptyHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  emptyHeaderTitle: { color: Colors.white, fontSize: 20, fontWeight: '700' },
  pinBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.primarySurface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primaryBorder,
  },
  pinIcon: { fontSize: 14 },
  pinContent: { flex: 1 },
  pinLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
  },
  pinText: { fontSize: 13, color: Colors.textSecondary },
  typingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: Colors.white,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },
  typingDots: {
    color: Colors.primary,
    fontSize: 8,
    letterSpacing: 2,
  },
  typingText: {
    fontSize: 12,
    color: Colors.primary,
    fontStyle: 'italic',
  },
  errorToast: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: '#1f2937',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  errorText: {
    color: Colors.white,
    fontSize: 13,
    textAlign: 'center',
  },
});