import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Alert } from 'react-native';
import 'react-native-reanimated';
// import messaging from '@react-native-firebase/messaging';
// import { usePushNotifications } from '@/services/usePushNotifications';
import QueryProvider from '@/provider/QueryProvider';
import { useColorScheme } from '@/components/useColorScheme';

import * as Updates from 'expo-updates';
export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
   // usePushNotifications();
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

//   useEffect(() => {
//   messaging().getToken().then(token => {
//     console.log('====================================');
//     console.log('🔔 FCM TOKEN:');
//     console.log(token);
//     console.log('====================================');
//   });
// }, []);

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
            { text: 'Restart', onPress: () => Updates.reloadAsync() }
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
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

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