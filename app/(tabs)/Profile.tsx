import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  useColorScheme,
  RefreshControl,
} from "react-native";
import { MaterialIcons, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import useCurrentUser from "@/features/auth/hooks/useCurrentUser";
import { removeAuthToken } from "@/middleware";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";

export default function ProfileView() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const fullName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim();

  const handleLogout = async () => {
    await removeAuthToken();
    router.replace("/auth/login/page");
  };

  // ── Stat summary bar ──────────────────────────────────────────
  const stats = [
    { label: "Department", value: user?.department_name || "N/A", icon: "business" as const },
    { label: "Position",   value: user?.position        || "N/A", icon: "work"     as const },
    { label: "Leave",      value: "12 Days",                      icon: "calendar-today" as const },
  ];

  // ── Field groups ──────────────────────────────────────────────
  type IconName = React.ComponentProps<typeof MaterialIcons>["name"];

  const personalFields: { label: string; value: string | null | undefined; icon: IconName }[] = [
    { label: "Username",         value: user?.username,      icon: "alternate-email" as IconName },
    { label: "Email",            value: user?.email,         icon: "email"           as IconName },
    { label: "Phone",            value: user?.phone_number,  icon: "phone"           as IconName },
    { label: "Date of Birth",    value: user?.date_of_birth, icon: "cake"            as IconName },
    { label: "Gender",           value: user?.gender,        icon: "person-outline"  as IconName },
    {
      label: "Marital Status",
      value: user?.marital_status === "True" ? "Married" : "Unmarried",
      icon: "favorite",
    },
    { label: "Blood Group",  value: user?.blood_group,  icon: "opacity" as IconName },
    { label: "Nationality",  value: user?.nationality,  icon: "flag"    as IconName },
  ];

  const workFields: { label: string; value: string | null | undefined; icon: IconName }[] = [
    { label: "Joining Date", value: user?.date_of_joining,   icon: "calendar-today" as IconName },
    { label: "Department",   value: user?.department_name,   icon: "business"       as IconName },
    { label: "Position",     value: user?.position,          icon: "work"           as IconName },
    { label: "Manager",      value: user?.manager_full_name, icon: "person"         as IconName },
  ];

  const contactFields: { label: string; value: string | null | undefined; icon: IconName }[] = [
    { label: "Emergency",          value: user?.emergency_number,  icon: "call"        as IconName },
    { label: "Address",            value: user?.address,           icon: "location-on" as IconName },
    { label: "Permanent Address",  value: user?.permanent_address, icon: "location-on" as IconName },
  ];

  // ── Colours ───────────────────────────────────────────────────
  const bg      = isDark ? "#0f172a" : "#f3f4f6";
  const card     = isDark ? "#1e293b" : "#ffffff";
  const border   = isDark ? "#374151" : "#e5e7eb";
  const fg       = isDark ? "#ffffff" : "#111111";
  const muted    = isDark ? "#9ca3af" : "#6b7280";
  const accent   = "#10b981";
  const mutedBg  = isDark ? "rgba(16,185,129,0.10)" : "rgba(16,185,129,0.06)";

  // ── Reusable field row ────────────────────────────────────────
  const FieldRow = ({
    label,
    value,
    icon,
    last = false,
  }: {
    label: string;
    value?: string | null;
    icon: IconName;
    last?: boolean;
  }) => (
    <View
      style={[
        styles.fieldRow,
        { borderBottomColor: border, borderBottomWidth: last ? 0 : 1 },
      ]}
    >
      <View style={[styles.fieldIconWrap, { backgroundColor: mutedBg }]}>
        <MaterialIcons name={icon} size={18} color={value ? accent : muted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.fieldLabel, { color: muted }]}>{label}</Text>
        <Text style={[styles.fieldValue, { color: value ? fg : muted }]}>
          {value || "N/A"}
        </Text>
      </View>
    </View>
  );

  // ── Section card ──────────────────────────────────────────────
  const SectionCard = ({
    iconName,
    title,
    children,
  }: {
    iconName: React.ComponentProps<typeof Ionicons>["name"];
    title: string;
    children: React.ReactNode;
  }) => (
    <View style={[styles.bigCard, { backgroundColor: card, borderColor: border }]}>
      <View style={styles.cardHeader}>
        <Ionicons name={iconName} size={20} color={accent} style={{ marginRight: 8 }} />
        <Text style={[styles.sectionTitle, { color: fg }]}>{title}</Text>
      </View>
      {children}
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: bg }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* ── HERO CARD ─────────────────────────────────────────── */}
      <View style={[styles.heroCard, { backgroundColor: card, borderColor: border }]}>
        {/* Avatar */}
        <View style={styles.avatarWrapper}>
          <Image
            source={
              user?.profile_image_url
                ? { uri: user.profile_image_url }
                : require("@/assets/images/avatar.jpg")
            }
            style={styles.avatar}
          />
          <View style={[styles.onlineDot, { borderColor: card }]} />
        </View>

        <Text style={[styles.heroName, { color: fg }]}>{fullName || "User"}</Text>
        <Text style={[styles.heroRole, { color: muted }]}>
          {user?.position || "Employee"} • {user?.department_name || ""}
        </Text>

        {/* ── Mini stat pills ──────────────────────────────────── */}
        <View style={styles.statRow}>
          {stats.map((s, i) => (
            <View
              key={i}
              style={[styles.statPill, { backgroundColor: mutedBg, borderColor: border }]}
            >
              <MaterialIcons name={s.icon} size={14} color={accent} />
              <View style={{ marginLeft: 6 }}>
                <Text style={[styles.statPillLabel, { color: muted }]}>{s.label}</Text>
                <Text style={[styles.statPillValue, { color: fg }]} numberOfLines={1}>
                  {s.value}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* ── PERSONAL INFO ─────────────────────────────────────── */}
      <SectionCard iconName="person-outline" title="Personal Info">
        {personalFields.map((f, i) => (
          <FieldRow
            key={i}
            label={f.label}
            value={f.value}
            icon={f.icon}
            last={i === personalFields.length - 1}
          />
        ))}
      </SectionCard>

      {/* ── WORK INFO ─────────────────────────────────────────── */}
      <SectionCard iconName="briefcase-outline" title="Work Info">
        {workFields.map((f, i) => (
          <FieldRow
            key={i}
            label={f.label}
            value={f.value}
            icon={f.icon}
            last={i === workFields.length - 1}
          />
        ))}
      </SectionCard>

      {/* ── CONTACT & ADDRESS ─────────────────────────────────── */}
      <SectionCard iconName="call-outline" title="Contact & Address">
        {contactFields.map((f, i) => (
          <FieldRow
            key={i}
            label={f.label}
            value={f.value}
            icon={f.icon}
            last={i === contactFields.length - 1}
          />
        ))}
      </SectionCard>

      {/* ── QUICK ACTIONS ─────────────────────────────────────── */}
      {/* <View style={[styles.bigCard, { backgroundColor: card, borderColor: border }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="flash-outline" size={20} color={accent} style={{ marginRight: 8 }} />
          <Text style={[styles.sectionTitle, { color: fg }]}>Quick Actions</Text>
        </View>

        {[
          { label: "Edit Profile",       icon: "pencil-outline"          as const },
          { label: "Change Password",    icon: "lock-closed-outline"     as const },
          { label: "Notification Prefs", icon: "notifications-outline"   as const },
          { label: "Privacy Settings",   icon: "shield-checkmark-outline" as const },
        ].map((action, i, arr) => (
          <TouchableOpacity
            key={i}
            activeOpacity={0.75}
            style={[
              styles.actionRow,
              {
                borderBottomColor: border,
                borderBottomWidth: i < arr.length - 1 ? 1 : 0,
                backgroundColor: mutedBg,
              },
            ]}
          >
            <View style={[styles.actionIconBox, { backgroundColor: mutedBg }]}>
              <Ionicons name={action.icon} size={20} color={accent} />
            </View>
            <Text style={[styles.actionLabel, { color: fg }]}>{action.label}</Text>
            <Ionicons name="chevron-forward-outline" size={18} color={muted} />
          </TouchableOpacity>
        ))}
      </View> */}

      {/* ── LOGOUT ────────────────────────────────────────────── */}
      <TouchableOpacity
        style={[styles.logoutBtn, { backgroundColor: card, borderColor: "#ef4444" }]}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Ionicons name="log-out-outline" size={20} color="#ef4444" style={{ marginRight: 8 }} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  // ── Hero ────────────────────────────────────────────────────
  heroCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 12,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: "#10b981",
  },
  onlineDot: {
    position: "absolute",
    bottom: 3,
    right: 3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#10b981",
    borderWidth: 2,
  },
  heroName: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  heroRole: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 18,
  },

  // ── Stat pills ───────────────────────────────────────────────
  statRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  statPillLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  statPillValue: {
    fontSize: 12,
    fontWeight: "700",
  },

  // ── Section card ─────────────────────────────────────────────
  bigCard: {
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.3,
  },

  // ── Field row ────────────────────────────────────────────────
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
  },
  fieldIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: "600",
  },

  // ── Action row ───────────────────────────────────────────────
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  actionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  actionLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },

  // ── Logout ───────────────────────────────────────────────────
  logoutBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  logoutText: {
    color: "#ef4444",
    fontWeight: "700",
    fontSize: 15,
  },
});