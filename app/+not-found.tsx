import { Link, Stack, useRouter } from 'expo-router';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { Ionicons } from '@expo/vector-icons';

export default function NotFoundScreen() {
   const router = useRouter();
  const theme = useColorScheme();
  const isDark = theme === 'dark';

  const colors = {
    background: isDark ? '#0f172a' : '#f8fafc',
    text: isDark ? '#f1f5f9' : '#0f172a',
    subText: isDark ? '#94a3b8' : '#64748b',
    accent: '#22c55e', // green
    buttonText: '#ffffff',
  };

  return (
    <>
                <Stack.Screen options={{ title: 'Page Not Found', headerLeft: () => (<TouchableOpacity onPress={() => router.push("/(tabs)")} style={{ paddingHorizontal: 10 }}> <Ionicons name="arrow-back" size={24} color="green" /> </TouchableOpacity>), }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Big 404 */}
        <Text style={[styles.code, { color: colors.accent }]}>
          404
        </Text>

        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>
          Page Not Found
        </Text>

        {/* Subtitle */}
        <Text style={[styles.subtitle, { color: colors.subText }]}>
          The page you're looking for doesn’t exist or has been moved.
        </Text>

        {/* Button */}
        <Link href="/" asChild>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.accent }]}
          >
            <Text style={[styles.buttonText, { color: colors.buttonText }]}>
              Return to Dashboard
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  code: {
    fontSize: 72,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
    elevation: 3,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
