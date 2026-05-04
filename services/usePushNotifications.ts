// services/usePushNotifications.ts
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';

import {
  createNotificationChannel,
  registerNotifeeHandlers,
  setupIOSCategories,
  clearRoomNotificationCache,
  requestUserPermission,
} from '@/services/NotificationService';

import { makeApi } from '@/components/chat/chatAPI';

export function usePushNotifications(onNewMessage?: () => void) {
  const router = useRouter();
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    init();
    return () => cleanupRef.current?.();
  }, []);

  async function init() {
    await createNotificationChannel();
    await setupIOSCategories();

    const allowed = await requestUserPermission();
    if (!allowed) {
      console.warn('[Push] Notification permission denied');
      return;
    }

    await syncToken();

  const foregroundSub = Notifications.addNotificationReceivedListener((notification) => {
  const data = notification.request.content.data;
  const roomId = (data?.room_id as string) || '';
  if (!roomId) return;
  console.log('[Push FG] Received for room:', roomId);
  // ✅ Immediately refresh badge count
  onNewMessage?.();
});

    const lastResponse = await Notifications.getLastNotificationResponseAsync();
    if (lastResponse?.notification.request.content.data?.room_id) {
      navigateToRoom(lastResponse.notification.request.content.data.room_id as string);
    }

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
   const tokenObj = await Notifications.getDevicePushTokenAsync();
const fcmToken = tokenObj.data; // raw FCM token — works when app is killed
    const accessToken = await SecureStore.getItemAsync('accessToken');
    if (!accessToken) return;

    const api = makeApi(accessToken);
    await api.registerFCMToken(fcmToken, Platform.OS as 'android' | 'ios');
    await SecureStore.setItemAsync('fcmToken', fcmToken);

    console.log('[Push] Expo token synced:', fcmToken);
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

    console.log('[Push] Expo token unregistered');
  } catch (e) {
    console.error('[Push] unregisterPushToken error:', e);
  }
}