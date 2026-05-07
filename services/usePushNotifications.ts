// services/usePushNotifications.ts
import {
  clearRoomNotificationCache,
  createNotificationChannel,
  displayChatNotification,
  registerNotifeeHandlers,
  requestUserPermission,
  setupIOSCategories,
} from "@/services/NotificationService";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { makeApi } from "@/components/chat/chatAPI";
// import messaging from "@react-native-firebase/messaging";
let _pushInitialized = false;

export function usePushNotifications(onNewMessage?: () => void) {
  const router = useRouter();
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (_pushInitialized) {
      console.log("[Push] Already initialized, skipping");
      return;
    }
    _pushInitialized = true;
    console.log("[Push] Initializing usePushNotifications hook");
    init();

    return () => {
      cleanupRef.current?.();
      _pushInitialized = false;
    };
  }, []);

  // ✅ FCM foreground listener
// const fcmUnsub = messaging().onMessage(async (remoteMessage) => {
//   console.log("[FCM] Foreground message:", remoteMessage);

//   const data = remoteMessage.data || {};

//   const roomId    = String(data?.roomId || data?.room_id || "");
//   const messageId = String(data?.msg_id || "");
//   const title     = String(remoteMessage.notification?.title || data?.title || "New Message");
//   const body      = String(remoteMessage.notification?.body || data?.body || "");

//   if (roomId) {
//     await displayChatNotification({
//       title,
//       body,
//       roomId,
//       messageId,
//       roomName: "",
//       avatarUri: "",
//     });
//   }
// });



  async function init() {
    console.log("[Push] Starting init sequence...");

    await createNotificationChannel();
    await setupIOSCategories();

    const allowed = await requestUserPermission();
    if (!allowed) {
      console.warn("[Push] Notification permission denied");
      return;
    }

    await syncToken();

    // ✅ Single foreground listener — shows notification banner + refreshes badge
    const foregroundSub = Notifications.addNotificationReceivedListener(
      async (notification) => {
        const data = notification.request.content.data;
        const roomId    = String(data?.roomId    || data?.room_id   || "");
        const messageId = String(data?.msg_id    || data?.messageId || "");
        const title     = String(data?.title     || "New Message");
        const body      = String(data?.body      || "");
        const roomName  = String(data?.room_name || "");

        console.log("[Push FG] Received:", { roomId, title, body });

        if (roomId) {
          await displayChatNotification({
            title,
            body,
            roomId,
            messageId,
            roomName,
            avatarUri: "",
          });
        }

        onNewMessage?.();
      },
    );

    // Handle app opened from a tapped notification
    const lastResponse = await Notifications.getLastNotificationResponseAsync();
    console.log("[Push] Last notification response:", lastResponse ? "Found" : "None");
    const lastRoomId =
      lastResponse?.notification.request.content.data?.roomId ||
      lastResponse?.notification.request.content.data?.room_id;
    if (lastRoomId) {
      console.log("[Push] App opened from notification for room:", lastRoomId);
      navigateToRoom(lastRoomId as string);
    }

    const unsubNotifee = registerNotifeeHandlers({
      onMarkRead: async (roomId, messageId) => {
        console.log("[Push Action] Mark Read triggered for room:", roomId);
        try {
          const token = await SecureStore.getItemAsync("accessToken");
          if (!token || !roomId || !messageId) return;
          const api = makeApi(token);
          await api.markSeen(roomId, messageId);
        } catch (e) {
          console.error("[Push] Mark as read failed:", e);
        }
      },
      onNotificationTap: navigateToRoom,
    });

    cleanupRef.current = () => {
      foregroundSub.remove();
      unsubNotifee();
    };
  }

  function navigateToRoom(roomId: string) {
    clearRoomNotificationCache(roomId);
    router.push(`/(tabs)/chat/${roomId}` as never);
  }
}

export async function syncToken() {
  console.log("[Push] Syncing device token...");
  try {
    const tokenObj = await Notifications.getDevicePushTokenAsync();
    const fcmToken = tokenObj.data;

    console.log("[Push] Native FCM Token:", fcmToken);

    const accessToken = await SecureStore.getItemAsync("accessToken");
    if (!accessToken) return;

    const api = makeApi(accessToken);

    await api.registerFCMToken(fcmToken, Platform.OS as "android" | "ios");

    console.log("[Push] FCM token synced with backend");
  } catch (e) {
    console.error("[Push] syncToken error:", e);
  }
}
export async function unregisterPushToken() {
  try {
    const fcmToken = await SecureStore.getItemAsync("fcmToken");
    const accessToken = await SecureStore.getItemAsync("accessToken");
    if (!fcmToken || !accessToken) return;

    const api = makeApi(accessToken);
    await api.unregisterFCMToken(fcmToken);
    await SecureStore.deleteItemAsync("fcmToken");

    console.log("[Push] Token unregistered");
  } catch (e) {
    console.error("[Push] unregisterPushToken error:", e);
  }
}