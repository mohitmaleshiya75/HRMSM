import { useColorScheme } from '@/components/useColorScheme';
import { authAccessTokenCookieName } from '@/constant';
import Colors from '@/constant/Colors';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Redirect, Tabs } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { AppState, AppStateStatus, StyleSheet, Text, View } from 'react-native';
// ✅ ADD this import with your other imports
import { usePushNotifications } from '@/services/usePushNotifications';
// --- UnreadMessagesContext ---
interface UnreadMessagesContextType {
  totalUnread: number;
  setTotalUnread: React.Dispatch<React.SetStateAction<number>>;
  refreshUnreadCount: () => Promise<void>;
}

const UnreadMessagesContext = createContext<UnreadMessagesContextType | undefined>(undefined);

export function useUnreadMessages() {
  const context = useContext(UnreadMessagesContext);
  if (context === undefined) {
    throw new Error('useUnreadMessages must be used within an UnreadMessagesProvider');
  }
  return context;
}

// Replace this with your real API endpoint.
const API_BASE_URL = process.env.EXPO_PUBLIC_SERVER_BACKEND_URL ?? '';

async function fetchUnreadCountFromApi(token: string): Promise<number> {
  if (!API_BASE_URL) {
    return 0;
  }

  const response = await fetch(`${API_BASE_URL}/notifications/unread-count/`, { // Added trailing slash
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch unread count: ${response.status}`);
  }

  const data = await response.json();

  return Number(data?.totalUnread ?? data?.count ?? 0);
}

function UnreadMessagesProvider({ children }: { children: React.ReactNode }) {
  const [totalUnread, setTotalUnread] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync(authAccessTokenCookieName);

      if (!token) {
        setTotalUnread(0);
        return;
      }

      const unreadCount = await fetchUnreadCountFromApi(token);
      setTotalUnread(unreadCount);
    } catch (error) {
      console.log('Error fetching unread count:', error);
      setTotalUnread(0);
    }
  }, []);

  useEffect(() => {
    refreshUnreadCount();

    const subscription = AppState.addEventListener(
      'change',
      (state: AppStateStatus) => {
        if (state === 'active') {
          refreshUnreadCount();
        }
      }
    );

    const interval = setInterval(() => {
      refreshUnreadCount();
    }, 30000);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [refreshUnreadCount]);

  return (
    <UnreadMessagesContext.Provider
      value={{ totalUnread, setTotalUnread, refreshUnreadCount }}
    >
      {children}
    </UnreadMessagesContext.Provider>
  );
}
// --- End UnreadMessagesContext ---

// ✅ ADD this entire component before the TabLayout function
function PushNotificationHandler() {
  const { refreshUnreadCount } = useUnreadMessages();
  usePushNotifications(refreshUnreadCount);
  return null;
}

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

function ChatsTabIcon({ color }: { color: string }) {
  const { totalUnread } = useUnreadMessages();

  return (
    <View style={styles.chatIconWrapper}>
      <TabBarIcon name="comments" color={color} />
      {totalUnread > 0 && (
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>
            {totalUnread > 99 ? '99+' : totalUnread}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chatIconWrapper: {
    position: 'relative',
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainer: {
    position: 'absolute',
    right: -6,
    top: -3,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'red',
    zIndex: 1,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default function TabLayout() {
  const colorScheme = useColorScheme();

  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await SecureStore.getItemAsync(authAccessTokenCookieName);

      setIsLoggedIn(!!token);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  if (isLoading) return null;

  if (!isLoggedIn) {
    return <Redirect href="/auth/login/page" />;
  }

  return (
    <UnreadMessagesProvider>
          <PushNotificationHandler />

      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color }) => <TabBarIcon name="line-chart" color={color} />,
          }}
        />

        <Tabs.Screen
          name="Attendance"
          options={{
            title: 'Attendance',
            tabBarIcon: ({ color }) => <TabBarIcon name="check-circle" color={color} />,
          }}
        />

        <Tabs.Screen
          name="View Attendance"
          options={{
            title: 'View Attendance',
            tabBarIcon: ({ color }) => <TabBarIcon name="clock-o" color={color} />,
          }}
        />

        <Tabs.Screen
          name="Leaves"
          options={{
            title: 'Leaves',
            tabBarIcon: ({ color }) => <TabBarIcon name="plane" color={color} />,
          }}
        />

        <Tabs.Screen
          name="Chats"
          options={{
            title: 'Chats',
            headerShown: false,
            tabBarIcon: ({ color }) => <ChatsTabIcon color={color} />,
          }}
        />

        <Tabs.Screen
          name="Calls"
          options={{
            title: 'Calls',
            headerShown: false,
            tabBarIcon: ({ color }) => <TabBarIcon name="phone" color={color} />,
          }}
        />

        <Tabs.Screen
          name="Profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
          }}
        />
      </Tabs>
    </UnreadMessagesProvider>
  );
}