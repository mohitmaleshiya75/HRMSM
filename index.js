import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

// ✅ Static import at the top — NOT dynamic
import { displayChatNotification } from './services/NotificationService';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND_NOTIFICATION_TASK';

// ─── Notification handler (required for foreground) ───────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ─── Background notification handler ─────────────────────────────────────────
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('[Push BG] Task error:', error);
    return;
  }

  if (data) {
    const notification = data.notification;
    const content = notification?.request?.content;
    const payload = content?.data;

    const roomId    = payload?.room_id   || '';
    const messageId = payload?.msg_id    || '';
    const title     = payload?.title     || content?.title || 'New Message';
    const body      = payload?.body      || content?.body  || '';
    const roomName  = payload?.room_name || '';
    const avatarUri = payload?.avatar    || '';

    if (!roomId) return;

    // ✅ Now uses the statically imported function
    await displayChatNotification({ title, body, roomId, messageId, roomName, avatarUri });
  }
});

// ─── Create Android notification channel ─────────────────────────────────────
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('chat_messages', {
    name: 'Default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
    sound: true,
  });
}

// ─── Register background task ─────────────────────────────────────────────────
Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK).catch((e) => {
  console.error('[Push BG] Registration failed:', e);
});

// ─── Expo Router entry — MUST be the very last line ──────────────────────────
import 'expo-router/entry';