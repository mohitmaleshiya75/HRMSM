// services/NotificationService.ts
import notifee, {
  AndroidImportance,
  AndroidStyle,
  EventType,
} from "@notifee/react-native";
import { Platform } from "react-native";

export const CHANNEL_ID = "chat_messages";

// ─── In-memory store: accumulates messages per room for MessagingStyle ────────
// Key = roomId, Value = array of { text, timestamp, senderName }
const roomMessageCache = new Map<
  string,
  { text: string; timestamp: number; senderName: string; avatarUri?: string }[]
>();

// ─── Create Android channel (call ONCE on app start) ─────────────────────────
export async function createNotificationChannel() {
  if (Platform.OS !== "android") return;
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: "Chat Messages",
    importance: AndroidImportance.HIGH,
    // 'notification' = res/raw/notification.mp3 — NO extension in code
    sound: "notification",
    vibration: true,
    vibrationPattern: [0, 250, 250, 250],
  });
}

// ─── iOS categories (call ONCE on app start) ──────────────────────────────────
export async function setupIOSCategories() {
  if (Platform.OS !== "ios") return;
  await notifee.setNotificationCategories([
    {
      id: "chat",
      actions: [
        {
          id: "mark_read",
          title: "✅ Mark as Read",
          destructive: false,
          authenticationRequired: false,
        },
      ],
    },
  ]);
}

// ─── Request Permissions ─────────────────────────────────────────────────────
export async function requestUserPermission() {
  const settings = await notifee.requestPermission();

  if (settings.authorizationStatus >= 1) {
    console.log("User granted permissions");
    return true;
  } else {
    console.log("User declined permissions");
    return false;
  }
}

// ─── Display a WhatsApp-style chat notification ───────────────────────────────
// • Groups messages by roomId so same chat collapses into one notification
// • Shows sender name + message body like WhatsApp / Instagram DMs
// • "Mark as Read" action button
export async function displayChatNotification({
  title, // sender's full name  (e.g. "John Doe")
  body, // the message text
  roomId,
  messageId,
  roomName, // group name or same as title for DMs
  avatarUri, // optional: sender's avatar URL for large icon
}: {
  title: string;
  body: string;
  roomId: string;
  messageId: string;
  roomName?: string;
  avatarUri?: string;
}) {
  // Accumulate messages for this room so MessagingStyle stacks them
  const prev = roomMessageCache.get(roomId) ?? [];
  const updated = [
    ...prev,
    { text: body, timestamp: Date.now(), senderName: title, avatarUri },
  ].slice(-10); // keep last 10 messages max
  roomMessageCache.set(roomId, updated);

  const displayTitle = roomName && roomName !== title ? roomName : title;

  await notifee.displayNotification({
    // Use roomId as the notification ID so same-room messages REPLACE each other
    // (like WhatsApp — one notification per conversation, not one per message)
    id: `room_${roomId}`,

    title: displayTitle,
    body,

    // Store both IDs in data so action handlers can use them
    data: { roomId, messageId },

    android: {
      channelId: CHANNEL_ID,
      // Sound file at android/app/src/main/res/raw/notification.mp3
      sound: "notification",
      importance: AndroidImportance.HIGH,

      // Large icon = sender's avatar (falls back to app icon)
      ...(avatarUri ? { largeIcon: avatarUri } : {}),

      // WhatsApp-style messaging bubble style
      style: {
        type: AndroidStyle.MESSAGING,
        person: {
          name: title,
          // If you have the avatar locally cached you can pass it here too
          ...(avatarUri ? { icon: avatarUri } : {}),
          important: true,
        },
        messages: updated.map((m) => ({
          text: m.text,
          timestamp: m.timestamp,
          person: {
            name: m.senderName,
            ...(m.avatarUri ? { icon: m.avatarUri } : {}),
          },
        })),
        // Shows group name in header for group chats
        ...(roomName && roomName !== title ? { title: roomName } : {}),
      },

      // Action buttons (like WhatsApp's "Mark as read")
      actions: [
        {
          title: "✅ Mark as Read",
          pressAction: { id: "mark_read" },
        },
      ],

      // Tapping the notification itself
      pressAction: { id: "default" },

      // Group notifications from same app together in notification shade
      groupId: "chat_group",
      groupSummary: false,
    },

    ios: {
      // notification.wav must be added to Xcode project (Copy Bundle Resources)
      sound: "notification.wav",
      categoryId: "chat",
      foregroundPresentationOptions: {
        alert: true,
        badge: true,
        sound: true,
      },
      threadId: roomId, // iOS groups by threadId (same as WhatsApp conversation grouping)
    },
  });
}

// ─── Clear the in-memory cache for a room (call when user opens the chat) ─────
export function clearRoomNotificationCache(roomId: string) {
  roomMessageCache.delete(roomId);
  notifee.cancelNotification(`room_${roomId}`).catch(() => {});
}

// ─── Register FOREGROUND event handlers ──────────────────────────────────────
// Returns an unsubscribe function — call it on component unmount
export function registerNotifeeHandlers({
  onMarkRead,
  onNotificationTap,
}: {
  onMarkRead: (roomId: string, messageId: string) => void;
  onNotificationTap: (roomId: string) => void;
}) {
  return notifee.onForegroundEvent(({ type, detail }) => {
    const roomId = detail.notification?.data?.roomId as string;
    const messageId = detail.notification?.data?.messageId as string;
    const notifId = detail.notification?.id;

    if (!roomId) return;

    switch (type) {
      case EventType.ACTION_PRESS:
        if (detail.pressAction?.id === "mark_read") {
          onMarkRead(roomId, messageId);
          clearRoomNotificationCache(roomId);
          if (notifId) notifee.cancelNotification(notifId).catch(() => {});
        }
        break;

      case EventType.PRESS:
        onNotificationTap(roomId);
        clearRoomNotificationCache(roomId);
        if (notifId) notifee.cancelNotification(notifId).catch(() => {});
        break;

      default:
        break;
    }
  });
}
