// hooks/usePushNotifications.ts
import { useEffect, useRef } from 'react';
import messaging from '@react-native-firebase/messaging';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';

import {
  createNotificationChannel,
  displayChatNotification,
  registerNotifeeHandlers,
  setupIOSCategories,
  clearRoomNotificationCache,
} from '@/services/NotificationService';

// ✅ Correct import path — matches features/chat/chatAPI.ts
import { makeApi } from '@/components/chat/chatAPI';

export function usePushNotifications() {
  const router     = useRouter();
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    init();
    return () => cleanupRef.current?.();
  }, []);

  async function init() {
    // 1. Create channel + iOS categories FIRST (must exist before any notification fires)
    await createNotificationChannel();
    await setupIOSCategories();

    // 2. Request permission
    const authStatus = await messaging().requestPermission();
    const allowed =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!allowed) {
      console.warn('[Push] Notification permission denied');
      return;
    }

    // 3. Register FCM token with backend
    await syncToken();

    // 4. Refresh token listener (FCM rotates tokens occasionally)
    const unsubTokenRefresh = messaging().onTokenRefresh(syncToken);

    // 5. FOREGROUND messages → show via notifee with sound + actions
    //    (when app is open, Firebase doesn't auto-display — we handle it here)
    const unsubForeground = messaging().onMessage(async (remote) => {
      const data  = remote.data  || {};
      const notif = remote.notification;

      const title     = (data.title     as string) || notif?.title || 'New Message';
      const body      = (data.body      as string) || notif?.body  || '';
      const roomId    = (data.room_id   as string) || '';
      const messageId = (data.msg_id    as string) || '';
      const roomName  = (data.room_name as string) || '';
      const avatarUri = (data.avatar    as string) || '';

      if (!roomId) return;

      await displayChatNotification({
        title,
        body,
        roomId,
        messageId,
        roomName,
        avatarUri,
      });
    });

    // 6. App in BACKGROUND → user taps notification to open specific chat
    messaging().onNotificationOpenedApp((remote) => {
      const roomId = (remote.data?.room_id as string) || '';
      if (roomId) navigateToRoom(roomId);
    });

    // 7. App KILLED → user taps notification to cold-start into a specific chat
    const initial = await messaging().getInitialNotification();
    if (initial?.data?.room_id) {
      navigateToRoom(initial.data.room_id as string);
    }

    // 8. Notifee FOREGROUND action handlers (Mark as Read button / notification tap)
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
      unsubForeground();
      unsubTokenRefresh();
      unsubNotifee();
    };
  }

  function navigateToRoom(roomId: string) {
    // Clear cached messages and dismiss the notification for this room
    clearRoomNotificationCache(roomId);
    router.push(`/(tabs)/chat/${roomId}` as never);
  }
}

// ─── Standalone helpers (call from auth flow) ─────────────────────────────────

/** Call after login to register the device FCM token */
export async function syncToken() {
  try {
    const fcmToken    = await messaging().getToken();
    const accessToken = await SecureStore.getItemAsync('accessToken');
    if (!accessToken) return;

    const api = makeApi(accessToken);
    await api.registerFCMToken(fcmToken, Platform.OS as 'android' | 'ios');
    await SecureStore.setItemAsync('fcmToken', fcmToken);

    console.log('[Push] FCM token synced');
  } catch (e) {
    console.error('[Push] syncToken error:', e);
  }
}

/** Call on logout to stop receiving notifications for this device */
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