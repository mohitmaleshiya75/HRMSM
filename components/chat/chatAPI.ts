// features/chat/chatAPI.ts
import { ACCOUNTS_API, Id, Message, Notification, Receipt, Room } from './chatTypes';

export function makeApi(token: string | null) {
  const req = async <T = unknown>(path: string, opts: RequestInit = {}): Promise<T> => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = `Bearer ${token}`;
    if (opts.body instanceof FormData) delete h['Content-Type'];
    const res = await fetch(`${ACCOUNTS_API}${path}`, {
      ...opts,
      headers: { ...h, ...(opts.headers as Record<string, string> || {}) },
    });
    const isJ = res.headers.get('content-type')?.includes('application/json');                                                                                                                                                    
    const data = isJ ? await res.json().catch(() => null) : await res.text().catch(() => null);
    if (!res.ok) {
      const msg = (data && typeof data === 'object'
        ? (data as Record<string, unknown>).detail || (data as Record<string, unknown>).message ||
          (data as Record<string, unknown>).error || Object.values(data as object).flat().join(' ')
        : null) || `HTTP ${res.status}`;
      throw new Error(String(msg));
    }
    return data as T;
  };

  return {
    employees: () => req<unknown>('/employee-hierarchy/'),
    listRooms: () => req<Room[]>('/rooms/'),
    createRoom: (b: object) => req<Room>('/rooms/', { method: 'POST', body: JSON.stringify(b) }),
    getRoom: (id: Id) => req<Room>(`/rooms/${id}/`),
    updateRoom: (id: Id, b: object) => req(`/rooms/${id}/`, { method: 'PATCH', body: JSON.stringify(b) }),
    leaveRoom: (id: Id) => req(`/rooms/${id}/`, { method: 'DELETE' }),
    clearChat: (id: Id) => req(`/rooms/${id}/clear/`, { method: 'POST' }),
    addParticipants: (id: Id, b: object) => req(`/rooms/${id}/add-participants/`, { method: 'POST', body: JSON.stringify(b) }),
    removeParticipant: (id: Id, b: object) => req(`/rooms/${id}/remove-participant/`, { method: 'POST', body: JSON.stringify(b) }),
    changeRole: (id: Id, b: object) => req(`/rooms/${id}/change-role/`, { method: 'POST', body: JSON.stringify(b) }),
    listMessages: (id: Id) => req<unknown>(`/rooms/${id}/messages/`),
    sendMessage: (id: Id, b: object | FormData) => req<Message>(`/rooms/${id}/messages/`, {
      method: 'POST',
      body: b instanceof FormData ? b : JSON.stringify(b),
    }),
    editMessage: (id: Id, b: object) => req(`/messages/${id}/`, { method: 'PATCH', body: JSON.stringify(b) }),
    deleteMessage: (id: Id, forAll: boolean) => req(`/messages/${id}/?for_all=${forAll}`, { method: 'DELETE' }),
    bulkDelete: (id: Id, b: object) => req(`/rooms/${id}/messages/bulk-delete/`, { method: 'POST', body: JSON.stringify(b) }),
    forwardMessage: (id: Id, b: object) => req(`/messages/${id}/forward/`, { method: 'POST', body: JSON.stringify(b) }),
    searchMessages: (id: Id, q: string) => req<unknown>(`/rooms/${id}/messages/search/?q=${encodeURIComponent(q)}`),
    editHistory: (id: Id) => req(`/messages/${id}/history/`),
    pinMessage: (id: Id) => req(`/messages/${id}/pin/`, { method: 'POST', body: JSON.stringify({ is_pinned: true }) }),
    unpinMessage: (id: Id) => req(`/messages/${id}/pin/`, { method: 'POST', body: JSON.stringify({ is_pinned: false }) }),
    receipts: (id: Id) => req<Receipt[]>(`/messages/${id}/receipts/`),
    react: (id: Id, b: object) => req(`/messages/${id}/react/`, { method: 'POST', body: JSON.stringify(b) }),
    removeReaction: (id: Id) => req(`/messages/${id}/react/`, { method: 'DELETE' }),
    updateOnline: (b: object) => req('/online-status/me/', { method: 'PATCH', body: JSON.stringify(b) }),
    getOnlineStatus: (id: Id) => req(`/online-status/${id}/`),
    notifications: () => req<Notification[]>('/notifications/'),
    markNotifsRead: (b: object) => req('/notifications/mark-read/', { method: 'POST', body: JSON.stringify(b) }),
    // Add to the return block of makeApi():

markSeen: (roomId: Id, lastMessageId: Id) =>
  req(`/rooms/${roomId}/seen/`, {
    method: 'POST',
    body: JSON.stringify({ last_message_id: lastMessageId }),
  }),

registerFCMToken: (token: string, platform: 'android' | 'ios') =>
  req('/fcm-token/', {
    method: 'POST',
    body: JSON.stringify({ token, platform }),
  }),

unregisterFCMToken: (token: string) =>
  req('/fcm-token/delete/', {
    method: 'DELETE',
    body: JSON.stringify({ token }),
  }),
  };
}