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

  useEffect(() => {
    async function checkPermission() {
      const { status } = await Notifications.getPermissionsAsync();

      if (status === 'granted') return;

      if (status === 'denied') {
        Alert.alert(
          '🔔 Enable Notifications',
          'Please enable notifications in Settings to receive chat messages.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }

      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus !== 'granted') {
        Alert.alert(
          '🔔 Notifications Disabled',
          'You will not receive chat notifications.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
      }
    }

    checkPermission();
  }, []);

  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        if (!Updates.isEnabled) return;

        const update = await Updates.checkForUpdateAsync();

        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (err) {
        // Safe to ignore in Expo Go / dev mode / unsupported environments.
        console.log('OTA update check skipped:', err);
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
  usePushNotifications();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <QueryProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          <Stack.Screen name="auth/login/page" options={{ headerShown: false }} />
        </Stack>
      </QueryProvider>
    </ThemeProvider>
  );
}