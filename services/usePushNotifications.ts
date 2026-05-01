// services/usePushNotifications.ts
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';

import {
  createNotificationChannel,
  displayChatNotification,
  registerNotifeeHandlers,
  setupIOSCategories,
  clearRoomNotificationCache,
  requestUserPermission,
} from '@/services/NotificationService';

import { makeApi } from '@/components/chat/chatAPI';

export function usePushNotifications() {
  const router = useRouter();
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    init();
    return () => cleanupRef.current?.();
  }, []);

  async function init() {
    // 1. Create channel + iOS categories
    await createNotificationChannel();
    await setupIOSCategories();

    // 2. Request permission
    const allowed = await requestUserPermission();
    if (!allowed) {
      console.warn('[Push] Notification permission denied');
      return;
    }

    // 3. Register FCM token with backend
    await syncToken();

    // 4. FOREGROUND messages → show via expo-notifications
    const foregroundSub = Notifications.addNotificationReceivedListener(async (notification) => {
      const data = notification.request.content.data;

      const title     = (data?.title     as string) || notification.request.content.title || 'New Message';
      const body      = (data?.body      as string) || notification.request.content.body  || '';
      const roomId    = (data?.room_id   as string) || '';
      const messageId = (data?.msg_id    as string) || '';
      const roomName  = (data?.room_name as string) || '';
      const avatarUri = (data?.avatar    as string) || '';

      if (!roomId) return;

      await displayChatNotification({ title, body, roomId, messageId, roomName, avatarUri });
    });

    // 5. App in BACKGROUND/KILLED → user taps notification
    const lastResponse = await Notifications.getLastNotificationResponseAsync();
    if (lastResponse?.notification.request.content.data?.room_id) {
      navigateToRoom(lastResponse.notification.request.content.data.room_id as string);
    }

    // 6. Notifee-style handlers (tap / mark as read)
    const unsubNotifee = registerNotifeeHandlers({
      onMarkRead: async (roomId, messageId) => {
        try {
          const token = await SecureStore.getItemAsync('accessToken');
          if (!token || !roomId || !messageId) return;
          const api = makeApi(token);
          await api.markSeen(roomId, messageId);
        } catch (e) {
          console.error('[Push] Mark as read failed:', e);
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

// ─── Standalone helpers ────────────────────────────────────────────────────────

export async function syncToken() {
  try {
    // Gets native FCM token (actual Firebase token) on Android
    const deviceToken = await Notifications.getDevicePushTokenAsync();
    const fcmToken = deviceToken.data as string;

    const accessToken = await SecureStore.getItemAsync('accessToken');
    if (!accessToken) return;

    const api = makeApi(accessToken);
    await api.registerFCMToken(fcmToken, Platform.OS as 'android' | 'ios');
    await SecureStore.setItemAsync('fcmToken', fcmToken);

    console.log('[Push] FCM token synced:', fcmToken); // ← you'll see this in console
  } catch (e) {
    console.error('[Push] syncToken error:', e);
  }
}

export async function unregisterPushToken() {
  try {
    const fcmToken    = await SecureStore.getItemAsync('fcmToken');
    const accessToken = await SecureStore.getItemAsync('accessToken');
    if (!fcmToken || !accessToken) return;

    const api = makeApi(accessToken);
    await api.unregisterFCMToken(fcmToken);
    await SecureStore.deleteItemAsync('fcmToken');

    console.log('[Push] FCM token unregistered');
  } catch (e) {
    console.error('[Push] unregisterPushToken error:', e);
  }
}