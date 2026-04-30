// index.js  ← React Native entry point (MUST register background handlers here)
import messaging from '@react-native-firebase/messaging';
import notifee, { EventType } from '@notifee/react-native';

// ─────────────────────────────────────────────────────────────────────────────
// ⚠️  IMPORTANT — READ THIS IF NOTIFICATIONS AREN'T WORKING IN BACKGROUND
//
// Firebase FCM has two message types:
//
//  1. "Notification message"  → has a `notification` field
//     • Android OS shows the notification automatically when app is background/killed
//     • setBackgroundMessageHandler is called BUT showing is already done by OS
//     • OS-shown notifications use DEFAULT sound — not your custom res/raw file
//     • Action buttons (Mark as Read) will NOT appear
//
//  2. "Data-only message"     → only has a `data` field, NO `notification` field
//     • setBackgroundMessageHandler is ALWAYS called — you control everything
//     • Custom sound ✓  Action buttons ✓  MessagingStyle ✓
//
// 👉 Tell your backend to send DATA-ONLY messages like this:
//    { "data": { "room_id": "123", "msg_id": "456", "title": "John", "body": "Hey!" } }
//    Remove the top-level "notification" field entirely.
//
// ─────────────────────────────────────────────────────────────────────────────

// ─── Background FCM handler ───────────────────────────────────────────────────
// This fires for:
//  • Data-only messages (always)
//  • Notification messages when app is in FOREGROUND (already handled by usePushNotifications)
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  // Support both data-only and notification+data payloads
  const data  = remoteMessage.data  || {};
  const notif = remoteMessage.notification;

  // Pull values from data field first (data-only), then fall back to notification field
  const title     = (data.title     ) || notif?.title || 'New Message';
  const body      = (data.body      ) || notif?.body  || '';
  const roomId    = (data.room_id   ) || '';
  const messageId = (data.msg_id    ) || '';
  const roomName  = (data.room_name ) || '';
  const avatarUri = (data.avatar    ) || '';

  if (!roomId) return; // can't do anything without a roomId

  // Dynamically import to avoid module load order issues at entry
  const { displayChatNotification } = await import('./services/NotificationService');

  await displayChatNotification({
    title,
    body,
    roomId,
    messageId,
    roomName,
    avatarUri,
  });
});

// ─── Notifee background action handler ───────────────────────────────────────
// Fires when user taps "Mark as Read" while app is background/killed
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (
    type === EventType.ACTION_PRESS &&
    detail.pressAction?.id === 'mark_read'
  ) {
    const roomId    = detail.notification?.data?.roomId    ;
    const messageId = detail.notification?.data?.messageId ;

    if (roomId && messageId) {
      try {
        // ✅ Correct import path — matches features/chat/chatAPI.ts
        const [{ makeApi }, SecureStore] = await Promise.all([
          import('./features/chat/chatAPI'),
          import('expo-secure-store'),
        ]);

        const token = await SecureStore.getItemAsync('accessToken');
        if (token) {
          const api = makeApi(token);
          await api.markSeen(roomId, messageId);
        }
      } catch (e) {
        console.error('[Notifee BG] markSeen failed:', e);
      }
    }

    // Clear notification from the shade after mark as read
    if (detail.notification?.id) {
      await notifee.cancelNotification(detail.notification.id);
    }
  }

  // Handle notification tap while app is killed (navigated via getInitialNotification)
  // No navigation here — handled in usePushNotifications via messaging().getInitialNotification()
});

// ─── Expo Router entry — MUST be the very last line ──────────────────────────
import 'expo-router/entry';