// services/NotificationService.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const CHANNEL_ID = 'chat_messages';

// ─── In-memory store ──────────────────────────────────────────────────────────
const roomMessageCache = new Map<string, { text: string; timestamp: number; senderName: string }[]>();

// ─── Set foreground handler (call ONCE at app start) ─────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Create Android channel ───────────────────────────────────────────────────
export async function createNotificationChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Chat Messages',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'notification.wav',
    vibrationPattern: [0, 250, 250, 250],
    enableVibrate: true,
  });
}

// ─── Setup iOS (no-op for now, expo handles it) ───────────────────────────────
export async function setupIOSCategories() {
  if (Platform.OS !== 'ios') return;
  await Notifications.setNotificationCategoryAsync('chat', [
    {
      identifier: 'mark_read',
      buttonTitle: '✅ Mark as Read',
      options: { isDestructive: false, isAuthenticationRequired: false },
    },
  ]);
}

// ─── Request Permissions ──────────────────────────────────────────────────────
export async function requestUserPermission(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[Push] Permission denied');
    return false;
  }

  return true;
}

// ─── Display a chat notification ──────────────────────────────────────────────
export async function displayChatNotification({
  title,
  body,
  roomId,
  messageId,
  roomName,
  avatarUri,
}: {
  title: string;
  body: string;
  roomId: string;
  messageId: string;
  roomName?: string;
  avatarUri?: string;
}) {
  const prev = roomMessageCache.get(roomId) ?? [];
  const updated = [
    ...prev,
    { text: body, timestamp: Date.now(), senderName: title },
  ].slice(-10);
  roomMessageCache.set(roomId, updated);

  const displayTitle = roomName && roomName !== title ? roomName : title;

  await Notifications.scheduleNotificationAsync({
    identifier: `room_${roomId}`,
    content: {
      title: displayTitle,
      body,
      sound: 'notification.wav',
      data: { roomId, messageId },
      categoryIdentifier: 'chat',
    },
    trigger: null, // show immediately
  });
}

// ─── Clear cache for a room ───────────────────────────────────────────────────
export function clearRoomNotificationCache(roomId: string) {
  roomMessageCache.delete(roomId);
  Notifications.dismissNotificationAsync(`room_${roomId}`).catch(() => {});
}

// ─── Register foreground handlers ────────────────────────────────────────────
export function registerNotifeeHandlers({
  onMarkRead,
  onNotificationTap,
}: {
  onMarkRead: (roomId: string, messageId: string) => void;
  onNotificationTap: (roomId: string) => void;
}) {
  // Foreground notification tap / action
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    const roomId = data?.roomId as string;
    const messageId = data?.messageId as string;
    const actionId = response.actionIdentifier;

    if (!roomId) return;

    if (actionId === 'mark_read') {
      onMarkRead(roomId, messageId);
      clearRoomNotificationCache(roomId);
    } else {
      // Default tap
      onNotificationTap(roomId);
      clearRoomNotificationCache(roomId);
    }
  });

  return () => sub.remove();
}