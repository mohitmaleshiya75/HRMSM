import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { Platform } from "react-native";

import { displayChatNotification } from "./services/NotificationService";

const BACKGROUND_NOTIFICATION_TASK = "BACKGROUND_NOTIFICATION_TASK";

TaskManager.defineTask(
  BACKGROUND_NOTIFICATION_TASK,
  async ({ data, error }) => {
    if (error) {
      console.error("[Push BG] Task error:", error);
      return;
    }
    if (!data) return;

    console.log("[Push BG] Raw data:", JSON.stringify(data, null, 2));

    const notification = data.notification;
    const content = notification?.request?.content;
    const payload = content?.data ?? {};

    const roomId    = String(payload?.roomId || payload?.room_id || "");
    const messageId = String(payload?.msg_id || payload?.messageId || "");
    const title     = String(payload?.title || "New Message");
    const body      = String(payload?.body || "");
    const roomName  = String(payload?.room_name || "");

    if (!roomId) return;

    await displayChatNotification({
      title,
      body,
      roomId,
      messageId,
      roomName,
      avatarUri: "",
    });
  }
);

if (Platform.OS === "android") {
  Notifications.setNotificationChannelAsync("chat_messages", {
    name: "Chat Messages",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
    vibrationPattern: [0, 250, 250, 250],
    enableVibrate: true,
  });
}

Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK).catch((e) => {
  console.error("[Push BG] Registration failed:", e);
});

// MUST be last
import "expo-router/entry";