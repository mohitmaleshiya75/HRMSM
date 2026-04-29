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
} from '@/services/NotificationService';
import { makeApi } from '@/components/chat/chatAPI';

export function usePushNotifications() {
  const router      = useRouter();
  const cleanupRef  = useRef<(() => void) | null>(null);

  useEffect(() => {
    init();
    return () => cleanupRef.current?.();
  }, []);

  async function init() {
    // 1. Setup channels / iOS categories
    await createNotificationChannel();
    await setupIOSCategories();

    // 2. Request permission
    const status  = await messaging().requestPermission();
    const allowed =
      status === messaging.AuthorizationStatus.AUTHORIZED ||
      status === messaging.AuthorizationStatus.PROVISIONAL;
    if (!allowed) return;

    // 3. Get token → send to backend
    await syncToken();

    // 4. Refresh listener
    messaging().onTokenRefresh(syncToken);

    // 5. FOREGROUND messages → show via notifee with sound + actions
    const unsubForeground = messaging().onMessage(async (remote) => {
      const { notification, data } = remote;
      if (!notification) return;
      await displayChatNotification({
        title:     notification.title || 'New Message',
        body:      notification.body  || '',
        roomId:    (data?.room_id  as string) || '',
        messageId: (data?.msg_id   as string) || '',
      });
    });

    // 6. BACKGROUND tap → app in background, user taps notification
    messaging().onNotificationOpenedApp((remote) => {
      const roomId = remote.data?.room_id as string;
      if (roomId) navigateToRoom(roomId);
    });

    // 7. KILLED state tap → app was closed, user taps notification
    const initial = await messaging().getInitialNotification();
    if (initial?.data?.room_id) {
      navigateToRoom(initial.data.room_id as string);
    }

    // 8. Notifee action handlers (mark as read / tap)
    const unsubNotifee = registerNotifeeHandlers({
      onMarkRead: async (roomId, messageId) => {
        try {
          const token = await SecureStore.getItemAsync('accessToken');
          if (!token || !roomId || !messageId) return;
          const api = makeApi(token);
          await api.markSeen(roomId, messageId);
        } catch (e) {
          console.error('Mark as read failed:', e);
        }
      },
      onNotificationTap: navigateToRoom,
    });

    cleanupRef.current = () => {
      unsubForeground();
      unsubNotifee();
    };
  }

  function navigateToRoom(roomId: string) {
    router.push(`/(tabs)/chat/${roomId}` as never);
  }
}

// ── Standalone: get token & register to backend ───────────────────────────────
export async function syncToken() {
  try {
    const token = await messaging().getToken();
    const accessToken = await SecureStore.getItemAsync('accessToken');
    if (!accessToken) return;

    const api = makeApi(accessToken);
    await api.registerFCMToken(token, Platform.OS as 'android' | 'ios');
    await SecureStore.setItemAsync('fcmToken', token);
  } catch (e) {
    console.error('FCM sync token error:', e);
  }
}

// ── Standalone: unregister on logout ─────────────────────────────────────────
export async function unregisterPushToken() {
  try {
    const token = await SecureStore.getItemAsync('fcmToken');
    const accessToken = await SecureStore.getItemAsync('accessToken');
    if (!token || !accessToken) return;

    const api = makeApi(accessToken);
    await api.unregisterFCMToken(token);
    await SecureStore.deleteItemAsync('fcmToken');
  } catch (e) {
    console.error('FCM unregister error:', e);
  }
}