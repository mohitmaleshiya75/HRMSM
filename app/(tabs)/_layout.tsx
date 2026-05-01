import { useColorScheme } from '@/components/useColorScheme';
import { authAccessTokenCookieName } from '@/constant';
import Colors from '@/constant/Colors';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Redirect, Tabs } from 'expo-router';
import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native'; // Added View, Text, StyleSheet

// --- UnreadMessagesContext ---
interface UnreadMessagesContextType {
  totalUnread: number;
  setTotalUnread: (count: number) => void;
}

const UnreadMessagesContext = createContext<UnreadMessagesContextType | undefined>(undefined);

export function useUnreadMessages() {
  const context = useContext(UnreadMessagesContext);
  if (context === undefined) {
    throw new Error('useUnreadMessages must be used within an UnreadMessagesProvider');
  }
  return context;
}

function UnreadMessagesProvider({ children }: { children: React.ReactNode }) {
  const [totalUnread, setTotalUnread] = useState(0);
  return (
    <UnreadMessagesContext.Provider value={{ totalUnread, setTotalUnread }}>
      {children}
    </UnreadMessagesContext.Provider>
  );
}
// --- End UnreadMessagesContext ---

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

// Badge component for the tab icon
function TabBadge({ count, color }: { count: number; color: string }) {
  if (count === 0) return null;
  return (
    <View style={[styles.badgeContainer, { backgroundColor: color }]}>
      <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badgeContainer: {
    position: 'absolute',
    right: -6,
    top: -3,
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
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

      if (!token) {
        setIsLoggedIn(false);
      } else {
        setIsLoggedIn(true);
      }

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
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        // headerShown: useClientOnlyValue(false, true),
        //lazy: true, // Enable lazy loading of screens
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <TabBarIcon name="line-chart" color={color} />,
          // headerRight: () => (
          //   <Link href="/modal" asChild>
          //     <Pressable>
          //       {({ pressed }) => (
          //         <FontAwesome
          //           name="info-circle"
          //           size={25}
          //           color={Colors[colorScheme ?? 'light'].text}
          //           style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
          //         />
          //       )}
              // </Pressable>
            // </Link>
          // ),
        }}
      />
     
   <Tabs.Screen
  name="Attendance"
  options={{
    title: 'Attendance',
    tabBarIcon: ({ color }) => (
      <TabBarIcon name="check-circle" color={color} />
    ),
  }}
/>
<Tabs.Screen
  name="View Attendance"
  options={{
    title: 'View Attendance',
    tabBarIcon: ({ color }) => (
      <TabBarIcon name="clock-o" color={color} />
    ),
  }}
/>

<Tabs.Screen
  name="Leaves"
  options={{
    title: 'Leaves',
    tabBarIcon: ({ color }) => (
      <TabBarIcon name="plane" color={color} />
    ),
  }}
/>

<Tabs.Screen
  name="Chats"
  options={{
    title: 'Chats',
    headerShown: false,
    tabBarIcon: ({ color }) => {
      const { totalUnread } = useUnreadMessages();
      return (
        <View>
          <TabBarIcon name="comments" color={color} />
          <TabBadge count={totalUnread} color="red" />
        </View>
      );
    },
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