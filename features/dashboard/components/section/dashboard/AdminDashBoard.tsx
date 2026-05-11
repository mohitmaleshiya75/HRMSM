import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  useColorScheme,
  Image,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import useGetDashboardStats from "@/features/dashboard/hooks/useGetDashboardStats";
import DashboardSkeleton from "../skelaton/DashboardSkelaton";
import { useRouter } from "expo-router";
import useGetActiveAnnouncements from "@/features/announcements/hooks/useGetActiveAnnouncements";
import useGetBirthday from "@/features/birthdays/hooks/useGetBirthdays";
import useGetHolidays from "@/features/holidays/hooks/useGetHolidays";

// const { width } = Dimensions.get("window");

export default function DashboardScreen() {
  const theme = useColorScheme();
  const router = useRouter();
  const isDark = theme === "dark";
  const { birthdays: upcomingEvents, isLoading: LoadingBirthday } = useGetBirthday();
  const { data: announcements, isLoading: LoadingAnnouncements } = useGetActiveAnnouncements();
  const { data: AdminStats, isLoading } = useGetDashboardStats();
  const { holidays, isLoading: LoadingHolidays } = useGetHolidays();
  const [refreshing, setRefreshing] = useState(false);
  // const [presentDialogOpen, setPresentDialogOpen] = useState(false);
  // const [absentDialogOpen, setAbsentDialogOpen] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);
  if (isLoading || LoadingAnnouncements || LoadingBirthday || LoadingHolidays) {
    <DashboardSkeleton />
  }
  const attendancePercentage = Math.round(
    ((AdminStats?.present_count || 0) / (AdminStats?.employee_count || 1)) * 100
  );

  // Stats data
  const stats: Array<{
    title: string;
    value: number;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    onPress?: () => void;
  }> = [
      {
        title: "Total Employees",
        value: AdminStats?.employee_count || 0,
        icon: "people-outline",
        color: "#10b981",
        onPress: () => router.push("/screens/AllEmployees"),
      },
      {
        title: "Present Today",
        value: AdminStats?.present_count || 0,
        icon: "checkmark-circle-outline",
        color: "#10b981",
        onPress: () => router.push("/screens/PresentToday"),
      },
      {
        title: "Absent Today",
        value: AdminStats?.absent_count || 0,
        icon: "close-circle-outline",
        color: "#10b981",
        onPress: () => router.push("/screens/AbsentToday"),
      },
      {
        title: "Pending Leaves",
        value: AdminStats?.pending_leave_requests || 0,
        icon: "document-text-outline",
        color: "#10b981",
        onPress: () => router.push("/screens/Leaves"),
      },
    ];

  // Feature cards
  const features: Array<{
    title: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
    link: string;
  }> = [
      {
        title: "Mark Attendance",
        description: "Mark your attendance",
        icon: "location-outline",
        link: "/screens/Attendance",
      },
      {
        title: "Attendance",
        description: "Track your attendance",
        icon: "calendar-outline",
        link: "/screens/View Attendance",
      },
      {
        title: "Leave Requests",
        description: "Handle leave requests",
        icon: "calendar-number-outline",
        link: "/screens/Leaves",
      },
      // {
      //   title: "Job Openings",
      //   description: "Manage job postings",
      //   icon: "briefcase-outline",
      // },
      // {
      //   title: "Announcements",
      //   description: "Company announcements",
      //   icon: "megaphone-outline",
      // },
      // {
      //   title: "Holidays",
      //   description: "Manage holidays here",
      //   icon: "business-outline",
      // },
      // {
      //   title: "Employee Salary",
      //   description: "Manage employee salary",
      //   icon: "wallet-outline",
      // },
      // {
      //   title: "Organization",
      //   description: "View company structure",
      //   icon: "git-network-outline",
      // },
    ];

  const getFormattedDate = () => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isDark ? "#0f172a" : "#f3f4f6" },
      ]}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* WELCOME HEADER */}
      <View
        style={[
          styles.welcomeHeader,
          {
            backgroundColor: isDark ? "#1e293b" : "#fff",
            borderColor: isDark ? "#374151" : "#dbeafe",
          },
        ]}
      >
        <View style={styles.headerContent}>
          <Text style={[styles.welcomeTitle, { color: isDark ? "#fff" : "#111" }]}>
            Welcome Back 👋
          </Text>
          <Text style={[styles.dateText, { color: isDark ? "#9ca3af" : "#6b7280" }]}>
            {getFormattedDate()}
          </Text>
          <Text style={[styles.subtitleText, { color: isDark ? "#9ca3af" : "#6b7280" }]}>
            Here's what's happening in your organization today
          </Text>
        </View>
      </View>

      {/* STATS CARDS - Single Column */}
      <View style={styles.statsContainer}>
        {stats.map((item, index) => (
          <TouchableOpacity
            key={index}
            activeOpacity={0.7}
            onPress={item.onPress}
            style={[
              styles.statCard,
              {
                backgroundColor: isDark ? "#1e293b" : "#fff",
                borderColor: isDark ? "#374151" : "#e5e7eb",
              },
            ]}
          >
            <View style={styles.statContent}>
              <View>
                <Text
                  style={[
                    styles.statLabel,
                    { color: isDark ? "#9ca3af" : "#6b7280" },
                  ]}
                >
                  {item.title}
                </Text>
                <Text
                  style={[
                    styles.statValue,
                    { color: isDark ? "#fff" : "#111" },
                  ]}
                >
                  {item.value}
                </Text>
              </View>
              <View style={[styles.iconCircle, { backgroundColor: item.color }]}>
                <Ionicons name={item.icon} size={26} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* QUICK ACCESS SECTION TITLE */}
      <Text
        style={[
          styles.sectionTitle,
          { color: isDark ? "#fff" : "#111" },
        ]}
      >
        Quick Access
      </Text>

      {/* FEATURE CARDS - Single Column */}
      <View style={styles.featuresContainer}>
        {features.map((item, index) => (
          <TouchableOpacity
            onPress={() => { router.replace(item.link as any) }}
            key={index}
            activeOpacity={0.8}
            style={[
              styles.featureCard,
              {
                backgroundColor: isDark
                  ? "rgba(16, 185, 129, 0.2)"
                  : "rgba(16, 185, 129, 0.1)",
              },
            ]}
          >
            <View style={styles.featureIconContainer}>
              <View style={styles.featureIconBackground}>
                <Ionicons name={item.icon} size={28} color="#10b981" />
              </View>
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={[styles.featureTitle, { color: isDark ? "#fff" : "#111" }]}>
                {item.title}
              </Text>
              <Text style={[styles.featureDesc, { color: isDark ? "#9ca3af" : "#6b7280" }]}>
                {item.description}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward-outline"
              size={20}
              color={isDark ? "#6b7280" : "#9ca3af"}
              style={styles.chevron}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* ATTENDANCE OVERVIEW */}
      <View
        // style={[
        //   styles.bigCard,
        //   {
        //     backgroundColor: isDark ? "#1e293b" : "#fff",
        //     borderColor: isDark ? "#374151" : "#e5e7eb",
        //   },
        // ]}
      >
        {/* <View style={styles.cardHeader}>
          <Ionicons
            name="bar-chart-outline"
            size={20}
            color="#10b981"
            style={{ marginRight: 8 }}
          />
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? "#fff" : "#111", marginVertical: 0 },
            ]}
          >
            Attendance Overview
          </Text>
        </View> */}

        {/* <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${attendancePercentage}%` }]} />
          </View>
          <Text
            style={[
              styles.progressText,
              { color: isDark ? "#9ca3af" : "#6b7280" },
            ]}
          >
            {attendancePercentage}% attendance today
          </Text>
        </View> */}

        {/* Attendance Stats Row */}
        {/* <View style={styles.attendanceStatsRow}>
          <View style={styles.attendanceStat}>
            <Text style={[styles.statNumber, { color: "#10b981" }]}>{AdminStats?.present_count}</Text>
            <Text style={[styles.statSmallLabel, { color: isDark ? "#9ca3af" : "#6b7280" }]}>
              Present
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.attendanceStat}>
            <Text style={[styles.statNumber, { color: "#ef4444" }]}>{AdminStats?.absent_count}</Text>
            <Text style={[styles.statSmallLabel, { color: isDark ? "#9ca3af" : "#6b7280" }]}>
              Absent
            </Text>
          </View>
        </View> */}
      </View>

      {/* ANNOUNCEMENTS */}
      <View
        style={[
          styles.bigCard,
          {
            backgroundColor: isDark ? "#1e293b" : "#fff",
            borderColor: isDark ? "#374151" : "#e5e7eb",
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <Ionicons
            name="megaphone-outline"
            size={20}
            color="#10b981"
            style={{ marginRight: 8 }}
          />
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? "#fff" : "#111", marginVertical: 0 },
            ]}
          >
            Announcements
          </Text>
        </View>

        <View style={styles.announcementsList}>
          {(announcements?.length === 0 || announcements === undefined) && (<Text style={[styles.eventTitle, { color: isDark ? "#fff" : "#111" }]}>
            No announcements yet
          </Text>)}
          {announcements?.map((announcement, index) => (
            <View
              key={index}
              style={[
                styles.announcementItem,
                {
                  backgroundColor: isDark ? "rgba(16, 185, 129, 0.1)" : "rgba(16, 185, 129, 0.05)",
                  borderColor: isDark ? "#374151" : "#e5e7eb",
                },
              ]}
            >
              <View style={styles.announcementBadge}>
                <MaterialCommunityIcons
                  name="bell-outline"
                  size={16}
                  color="#10b981"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.announcementTitle, { color: isDark ? "#fff" : "#111" }]}>
                  {announcement.title}
                </Text>
                <Text style={[styles.announcementDesc, { color: isDark ? "#9ca3af" : "#6b7280" }]}>
                  {announcement.message}
                </Text>
                <Text style={[styles.announcementTime, { color: isDark ? "#6b7280" : "#9ca3af" }]}>
                  {announcement.created_by_name}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* RECENT LEAVE REQUESTS */}
      {/* <View
        style={[
          styles.bigCard,
          {
            backgroundColor: isDark ? "#1e293b" : "#fff",
            borderColor: isDark ? "#374151" : "#e5e7eb",
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <Ionicons
            name="document-text-outline"
            size={20}
            color="#10b981"
            style={{ marginRight: 8 }}
          />
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? "#fff" : "#111", marginVertical: 0 },
            ]}
          >
            Recent Leave Requests
          </Text>
        </View>
        <Text style={[styles.emptyText, { color: isDark ? "#9ca3af" : "#6b7280" }]}>
          No leave requests found
        </Text>
      </View> */}

      {/* UPCOMING BIRTHDAYS */}
      <View
        style={[
          styles.bigCard,
          {
            backgroundColor: isDark ? "#1e293b" : "#fff",
            borderColor: isDark ? "#374151" : "#e5e7eb",
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons
            name="calendar-month-outline"
            size={20}
            color="#10b981"
            style={{ marginRight: 8 }}
          />
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? "#fff" : "#111", marginVertical: 0 },
            ]}
          >
            Upcoming Birthdays
          </Text>
        </View>

        <View style={styles.eventsList}>
          {upcomingEvents.length === 0 && (<Text style={[styles.eventTitle, { color: isDark ? "#fff" : "#111" }]}>
            {"No more birthdays this month"}
          </Text>)}
          {upcomingEvents.map((event, index) => (
            <View
              key={index}
              style={[
                styles.eventItem,
                {
                  borderBottomColor: isDark ? "#374151" : "#e5e7eb",
                  borderBottomWidth: index < upcomingEvents.length - 1 ? 1 : 0,
                },
              ]}
            >
              <View style={styles.eventIcon}>
                <Image
                  src={event?.profile_image_url || "/images/avatar.jpg"}
                  height={20}
                  width={20}
                // color="#10b981"
                />
              </View>
              <View style={styles.eventContent}>
                <Text style={[styles.eventTitle, { color: isDark ? "#fff" : "#111" }]}>
                  {event.first_name}{" "}{event.last_name}
                </Text>
                <Text style={[styles.eventDate, { color: isDark ? "#9ca3af" : "#6b7280" }]}>
                  {event.date_of_birth}
                </Text>
              </View>
              {/* <View
                      style={[
                        styles.eventTypeBadge,
                        {
                          backgroundColor:
                            event.type === "meeting" ? "#dbeafe" :
                              event.type === "deadline" ? "#fecaca" :
                                "#e0e7ff",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.eventTypeText,
                          {
                            color:
                              event.type === "meeting" ? "#0284c7" :
                                event.type === "deadline" ? "#dc2626" :
                                  "#4338ca",
                          },
                        ]}
                      >
                        {event.type}
                      </Text>
                    </View> */}
            </View>
          ))}
        </View>
      </View>

      {/* HOLIDAYS */}
      <View
        style={[
          styles.bigCard,
          {
            backgroundColor: isDark ? "#1e293b" : "#fff",
            borderColor: isDark ? "#374151" : "#e5e7eb",
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons
            name="beach"
            size={20}
            color="#10b981"
            style={{ marginRight: 8 }}
          />
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? "#fff" : "#111", marginVertical: 0 },
            ]}
          >
            Upcoming Holidays
          </Text>
        </View>
        {holidays && holidays.length > 0 ? (
          holidays.map((holiday, index) => (
            <View
              key={index}
              style={[
                styles.eventItem,
                {
                  borderBottomColor: isDark ? "#374151" : "#e5e7eb",
                  borderBottomWidth: index < holidays.length - 1 ? 1 : 0,
                },
              ]}
            >
              {/* <View style={styles.eventIcon}>
                <Image
                  src={holiday?.profile_image_url || "/images/avatar.jpg"}
                  height={20}
                  width={20}
                />
              </View> */}
              <View style={styles.eventContent}>
                <Text style={[styles.eventTitle, { color: isDark ? "#fff" : "#111" }]}>
                  {holiday.occasion}
                </Text>
                <Text style={[styles.eventDate, { color: isDark ? "#9ca3af" : "#6b7280" }]}>
                  {holiday.date}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={[styles.emptyText, { color: isDark ? "#9ca3af" : "#6b7280" }]}>
            No holidays scheduled
          </Text>
        )}
      </View>

      {/* Bottom padding */}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  welcomeHeader: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },

  headerContent: {
    gap: 8,
  },
  // Announcements List
  announcementsList: {
    gap: 12,
  },

  announcementItem: {
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    gap: 12,
    borderWidth: 1,
  },

  announcementBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },

  announcementTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },

  announcementDesc: {
    fontSize: 11,
    fontWeight: "400",
    marginBottom: 6,
  },

  announcementTime: {
    fontSize: 10,
    fontWeight: "400",
  },

  welcomeTitle: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.5,
  },

  dateText: {
    fontSize: 14,
    fontWeight: "500",
  },

  subtitleText: {
    fontSize: 12,
    fontWeight: "400",
    marginTop: 4,
  },

  // Stats Container
  statsContainer: {
    marginBottom: 24,
    gap: 12,
  },

  statCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },

  statContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  eventsList: {
    gap: 0,
  },

  eventItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },

  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },

  eventContent: {
    flex: 1,
  },

  eventTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },

  eventDate: {
    fontSize: 11,
    fontWeight: "400",
  },

  eventTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },

  eventTypeText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "capitalize",
  },

  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },

  statLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 6,
  },

  statValue: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },

  // Section Title
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginVertical: 16,
    letterSpacing: -0.3,
  },

  // Features Container
  featuresContainer: {
    marginBottom: 24,
    gap: 12,
  },

  featureCard: {
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },

  featureIconContainer: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },

  featureIconBackground: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
  },

  featureTextContainer: {
    flex: 1,
  },

  featureTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },

  featureDesc: {
    fontSize: 11,
    fontWeight: "400",
  },

  chevron: {
    opacity: 0.6,
  },

  // Big Card
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

  // Progress Bar
  progressSection: {
    gap: 10,
  },

  progressBar: {
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 10,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#10b981",
  },

  progressText: {
    fontSize: 12,
    fontWeight: "500",
  },

  // Attendance Stats Row
  attendanceStatsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },

  attendanceStat: {
    flex: 1,
    alignItems: "center",
  },

  statNumber: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 4,
  },

  statSmallLabel: {
    fontSize: 11,
    fontWeight: "500",
  },

  divider: {
    width: 1,
    height: 30,
    backgroundColor: "#e5e7eb",
    marginHorizontal: 12,
  },

  // Empty State
  emptyText: {
    fontSize: 13,
    fontWeight: "400",
    paddingVertical: 8,
  },
});