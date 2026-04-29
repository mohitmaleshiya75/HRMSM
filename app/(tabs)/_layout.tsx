import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import { Pressable } from 'react-native';
import { Stack, Redirect } from "expo-router";
import { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import Colors from '@/constant/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { authAccessTokenCookieName } from '@/constant';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

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
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        // headerShown: useClientOnlyValue(false, true),
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
    tabBarIcon: ({ color }) => (
      <TabBarIcon name="comments" color={color} />
    ),
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
  );
}