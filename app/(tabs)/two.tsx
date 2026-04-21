import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/provider/ThemeProvider";
import useCurrentUser from "@/features/auth/hooks/useCurrentUser";
import { removeAuthToken } from "@/middleware"; // adjust path
import { useRouter } from "expo-router";

export default function ProfileView() {
  const theme = useTheme();
  const router = useRouter();
  const { data: user } = useCurrentUser();

  const fullName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim();

  const profileFields = [
    { label: "Username", value: user?.username, icon: "alternate-email" },
    { label: "Email", value: user?.email, icon: "email" },
    { label: "Phone", value: user?.phone_number, icon: "phone" },
    { label: "Joining Date", value: user?.date_of_joining, icon: "calendar-today" },
    { label: "DOB", value: user?.date_of_birth, icon: "cake" },
    { label: "Department", value: user?.department_name, icon: "business" },
    { label: "Position", value: user?.position, icon: "work" },
    { label: "Manager", value: user?.manager_full_name, icon: "person" },
    { label: "Gender", value: user?.gender, icon: "person-outline" },
    {
      label: "Marital Status",
      value: user?.marital_status === "True" ? "Married" : "Unmarried",
      icon: "favorite",
    },
    { label: "Emergency", value: user?.emergency_number, icon: "call" },
    { label: "Address", value: user?.address, icon: "location-on" },
    { label: "Permanent Address", value: user?.permanent_address, icon: "location-on" },
    { label: "Blood Group", value: user?.blood_group, icon: "opacity" },
    { label: "Nationality", value: user?.nationality, icon: "flag" },
  ];

  const handleLogout = async () => {
    await removeAuthToken();
    router.replace("/auth/login/page");
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        
        {/* 👤 Profile Image */}
        <View style={styles.header}>
          <Image
            source={
              user?.profile_image_url
                ? { uri: user.profile_image_url }
                : require("@/assets/images/avatar.jpg")
            }
            style={styles.avatar}
          />

          <Text style={[styles.name, { color: theme.foreground }]}>
            {fullName || "User"}
          </Text>
        </View>

        {/* 📋 Fields (1 per row) */}
        <View>
          {profileFields.map((field, index) => {
            const isEmpty = !field.value;

            return (
              <View
                key={index}
                style={[
                  styles.item,
                  {
                    backgroundColor: theme.muted,
                    borderColor: theme.border,
                  },
                ]}
              >
                <MaterialIcons
                  name={field.icon as any}
                  size={18}
                  color={isEmpty ? theme.mutedForeground : theme.primary}
                />

                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: theme.mutedForeground }]}>
                    {field.label}
                  </Text>

                  <Text
                    style={[
                      styles.value,
                      {
                        color: isEmpty
                          ? theme.mutedForeground
                          : theme.foreground,
                      },
                    ]}
                    numberOfLines={2} // prevents breaking ugly
                  >
                    {field.value || "N/A"}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* 🚪 Logout */}
        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: theme.primary }]}
          onPress={handleLogout}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  card: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },

  header: {
    alignItems: "center",
    marginBottom: 20,
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 10,
  },

  name: {
    fontSize: 18,
    fontWeight: "600",
  },

  item: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
  },

  label: {
    fontSize: 12,
  },

  value: {
    fontWeight: "600",
  },

  logoutBtn: {
    marginTop: 20,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
});