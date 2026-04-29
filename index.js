// index.js
import messaging from '@react-native-firebase/messaging';
import notifee, { EventType } from '@notifee/react-native';

// ── Background FCM handler ─────────────────────────────────────────────────────
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  const { notification, data } = remoteMessage;
  if (!notification) return;

  const { displayChatNotification } = await import('./services/NotificationService');
  await displayChatNotification({
    title:     notification.title || 'New Message',
    body:      notification.body  || '',
    roomId:    (data?.room_id)    || '',
    messageId: (data?.msg_id)     || '',
  });
});

// ── Notifee background action handler ─────────────────────────────────────────
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.ACTION_PRESS && detail.pressAction?.id === 'mark_read') {
    const roomId    = detail.notification?.data?.roomId;
    const messageId = detail.notification?.data?.messageId;

    if (roomId && messageId) {
      const SecureStore = await import('expo-secure-store');
      const { makeApi } = await import('./components/chat/chatAPI.ts');
      const token = await SecureStore.getItemAsync('accessToken');
      if (token) {
        const api = makeApi(token);
        await api.markSeen(roomId, messageId).catch(() => {});
      }
    }

    if (detail.notification?.id) {
      await notifee.cancelNotification(detail.notification.id);
    }
  }
});

// ── Expo Router entry (MUST be last) ──────────────────────────────────────────
import 'expo-router/entry';