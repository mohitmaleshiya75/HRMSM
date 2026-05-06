// Chats.tsx  ← your existing file, now updated
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ChatClient from '../../components/chat/ChatClient';
import { Colors } from '../../components/chat/Colors';

// Replace this with your actual hook
import useCurrentUser from '@/features/auth/hooks/useCurrentUser';
import { useUnreadMessages } from './_layout'; // Import the context hook

const Chats = () => {
  const { data: currentUser, isLoading } = useCurrentUser();
  const { setTotalUnread } = useUnreadMessages(); // Get the setter from context
  
  if (isLoading) {
    return (
      <SafeAreaProvider>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading chat…</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  if (!currentUser) {
    return (
      <SafeAreaProvider>
        <View style={styles.loading}>
          <Text style={styles.errorText}>Please log in to continue</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ChatClient currentUser={currentUser} setTotalUnread={setTotalUnread} />
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    gap: 12,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 15,
  },
  errorText: {
    color: Colors.error,
    fontSize: 15,
  },
});

export default Chats;