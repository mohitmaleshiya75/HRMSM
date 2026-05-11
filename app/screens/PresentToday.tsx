import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

import useGetPresentToday from "@/features/dashboard/hooks/useGetPresentToday";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";

type PresentAbsentResponseT = {
  id: string;
  profile_image_url: string;
  first_name: string;
  last_name: string;
  department: string;
  department_name: string;
  manager_full_name: string;
};

export default function PresentToday() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const { presentEmployees, isLoading, refetch } = useGetPresentToday();
  const [refreshing, setRefreshing] = React.useState(false);

  const data: PresentAbsentResponseT[] = presentEmployees ?? [];

  const bg = isDark ? "#0f172a" : "#f3f4f6";
  const card = isDark ? "#1e293b" : "#ffffff";
  const border = isDark ? "#334155" : "#e5e7eb";
  const fg = isDark ? "#ffffff" : "#111827";
  const muted = isDark ? "#94a3b8" : "#6b7280";
  const accent = "#10b981";
  const accentBg = isDark ? "rgba(16,185,129,0.12)" : "rgba(16,185,129,0.08)";

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch?.();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const getInitials = (firstName?: string, lastName?: string) => {
    const f = firstName?.trim()?.[0] || "";
    const l = lastName?.trim()?.[0] || "";
    return (f + l).toUpperCase() || "U";
  };
  const router = useRouter();

  const renderItem = ({ item }: { item: PresentAbsentResponseT }) => {
    const fullName = `${item.first_name || ""} ${item.last_name || ""}`.trim();

    return (
      
      <View style={[styles.employeeCard, { backgroundColor: card, borderColor: border }]}>
        <View style={styles.cardTopRow}>
          <View style={[styles.avatarWrap, { backgroundColor: accentBg }]}>
            {item.profile_image_url ? (
              <Image source={{ uri: item.profile_image_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: accent }]}>
                <Text style={styles.avatarFallbackText}>
                  {getInitials(item.first_name, item.last_name)}
                </Text>
              </View>
            )}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: fg }]} numberOfLines={1}>
              {fullName || "-"}
            </Text>
            <View style={[styles.badge, { backgroundColor: accentBg }]}>
              <Ionicons name="checkmark-circle" size={12} color={accent} />
              <Text style={[styles.badgeText, { color: accent }]}>Present Today</Text>
            </View>
          </View>
        </View>

        <View style={[styles.infoBox, { borderTopColor: border }]}>
          <View style={styles.infoRow}>
            <View style={[styles.iconBox, { backgroundColor: accentBg }]}>
              <MaterialIcons name="business" size={18} color={accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: muted }]}>Department</Text>
              <Text style={[styles.value, { color: fg }]} numberOfLines={2}>
                {item.department_name || item.department || "N/A"}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={[styles.iconBox, { backgroundColor: accentBg }]}>
              <MaterialIcons name="person" size={18} color={accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: muted }]}>Manager</Text>
              <Text style={[styles.value, { color: fg }]} numberOfLines={2}>
                {item.manager_full_name || "N/A"}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    
       
    <View style={[styles.container, { backgroundColor: bg }]}>
      <Stack.Screen options={{ title: 'Present Today', headerLeft: () => (<TouchableOpacity onPress={() => router.push("/")} style={{ paddingHorizontal: 10 }}> <Ionicons name="arrow-back" size={24} color="green" /> </TouchableOpacity>), }} />

      <View style={[styles.headerCard, { backgroundColor: card, borderColor: border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: fg }]}>Present Today</Text>
          <Text style={[styles.subtitle, { color: muted }]}>
            {data.length} employee{data.length === 1 ? "" : "s"} are present
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onRefresh}
          style={[styles.refreshBtn, { backgroundColor: accentBg }]}
        >
          <Ionicons name="refresh" size={18} color={accent} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={accent} />
          <Text style={[styles.loadingText, { color: muted }]}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={[styles.emptyCard, { backgroundColor: card, borderColor: border }]}>
              <Ionicons name="people-outline" size={28} color={muted} />
              <Text style={[styles.emptyText, { color: fg }]}>No present employees found.</Text>
              <Text style={[styles.emptySubText, { color: muted }]}>
                There is no attendance data to display right now.
              </Text>
            </View>
          }
        />
      )}
    </View>
   
  );
}

const styles = StyleSheet.create({
  
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },

  headerCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "500",
  },
  refreshBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "600",
  },

  listContent: {
    paddingBottom: 24,
  },

  employeeCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
  },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },

  name: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },

  infoBox: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    gap: 14,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  value: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },

  emptyCard: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "800",
  },
  emptySubText: {
    marginTop: 4,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },
});