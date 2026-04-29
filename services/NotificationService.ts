import notifee, {
  AndroidImportance,
  AndroidStyle,
  EventType,
} from '@notifee/react-native';
import { Platform } from 'react-native';

export const CHANNEL_ID = 'chat_messages';

// ── Create Android channel (call once on app start) ───────────────────────────
export async function createNotificationChannel() {
  if (Platform.OS !== 'android') return;
  await notifee.createChannel({
    id:          CHANNEL_ID,
    name:        'Chat Messages',
    importance:  AndroidImportance.HIGH,
    sound:       'notification',   // ← matches res/raw/notification.mp3 (no extension)
    vibration:   true,
    vibrationPattern: [0, 250, 250, 250],
  });
}

// ── Display a chat push notification ─────────────────────────────────────────
export async function displayChatNotification({
  title,
  body,
  roomId,
  messageId,
  largeIcon,
}: {
  title:      string;
  body:       string;
  roomId:     string;
  messageId:  string;
  largeIcon?: string;
}) {
  await notifee.displayNotification({
    id:    `msg_${messageId}`,
    title,
    body,
    data:  { roomId, messageId },

    android: {
      channelId:  CHANNEL_ID,
      sound:      'notification',
      importance: AndroidImportance.HIGH,
      largeIcon:  largeIcon,
      style: {
        type: AndroidStyle.BIGTEXT,
        text: body,
      },
      actions: [
        {
          title:       '✅ Mark as Read',
          pressAction: { id: 'mark_read' },
        },
      ],
      pressAction: { id: 'default' },
    },

    ios: {
      sound: 'notification.wav',
      foregroundPresentationOptions: {
        alert: true,
        badge: true,
        sound: true,
      },
      categoryId: 'chat',
    },
  });
}

// ── Register foreground action handlers (call inside component) ───────────────
export function registerNotifeeHandlers({
  onMarkRead,
  onNotificationTap,
}: {
  onMarkRead:       (roomId: string, messageId: string) => void;
  onNotificationTap: (roomId: string) => void;
}) {
  return notifee.onForegroundEvent(({ type, detail }) => {
    const roomId    = detail.notification?.data?.roomId    as string;
    const messageId = detail.notification?.data?.messageId as string;

    switch (type) {
      case EventType.ACTION_PRESS:
        if (detail.pressAction?.id === 'mark_read') {
          onMarkRead(roomId, messageId);
          notifee.cancelNotification(detail.notification!.id!);
        }
        break;

      case EventType.PRESS:
        onNotificationTap(roomId);
        notifee.cancelNotification(detail.notification!.id!);
        break;
    }
  });
}

// ── iOS category (call once on app start) ────────────────────────────────────
export async function setupIOSCategories() {
  if (Platform.OS !== 'ios') return;
  await notifee.setNotificationCategories([
    {
      id:      'chat',
      actions: [{ id: 'mark_read', title: '✅ Mark as Read' }],
    },
  ]);
}