// index.js
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND_NOTIFICATION_TASK';

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

    const { displayChatNotification } = await import('./services/NotificationService');
    await displayChatNotification({ title, body, roomId, messageId, roomName, avatarUri });
  }
});

// Register background task
Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK).catch(() => {});

// ─── Expo Router entry — MUST be the very last line ──────────────────────────
import 'expo-router/entry';