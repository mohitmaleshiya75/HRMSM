import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Alert, Linking } from 'react-native';
import 'react-native-reanimated';
import * as Notifications from 'expo-notifications';
import { usePushNotifications } from '@/services/usePushNotifications';
import QueryProvider from '@/provider/QueryProvider';
import { useColorScheme } from '@/components/useColorScheme';
import * as Updates from 'expo-updates';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // ─── Check + Request Notification Permission ──────────────────────────────
  useEffect(() => {
    async function checkPermission() {
      const { status } = await Notifications.getPermissionsAsync();
      console.log('[Permission] Current status:', status);

      if (status === 'granted') {
        console.log('[Permission] Already granted ✅');
        return;
      }

      if (status === 'denied') {
        // Already denied before — Android won't show dialog again
        // Send user to settings manually
        Alert.alert(
          '🔔 Enable Notifications',
          'Notifications are disabled. Please enable them in Settings to receive chat messages.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }

      // Status is 'undetermined' — show the dialog
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      console.log('[Permission] After request:', newStatus);

      if (newStatus !== 'granted') {
        Alert.alert(
          '🔔 Notifications Disabled',
          'You will not receive chat notifications. You can enable them in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
      }
    }

    checkPermission();
  }, []);

  // ─── OTA Updates ──────────────────────────────────────────────────────────
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          Alert.alert(
            'Update Available',
            'New version downloaded. Restart app?',
            [
              { text: 'Later' },
              { text: 'Restart', onPress: () => Updates.reloadAsync() },
            ]
          );
        }
      } catch (err) {
        console.log('OTA update failed:', err);
      }
    };
    checkForUpdates();
  }, []);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  // ✅ Hook called here — inside a component, after fonts load
  usePushNotifications();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <QueryProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          <Stack.Screen name="auth/login/page" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)/Chats" options={{ headerShown: false }} />
        </Stack>
      </QueryProvider>
    </ThemeProvider>
  );
}