import useGetActiveAnnouncements from "@/features/announcements/hooks/useGetActiveAnnouncements";
import useCurrentUser from "@/features/auth/hooks/useCurrentUser";
import useGetBirthday from "@/features/birthdays/hooks/useGetBirthdays";
import useViewLeaveBalance from "@/features/leaves/hooks/useViewLeaveBalance";
import useLiveWorkingHours from "@/hooks/useCalculateWorkingHrs";
import { formateTime } from "@/lib/utils/dateUtils";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import DashboardSkeleton from "../skelaton/DashboardSkelaton";
import { useRouter } from "expo-router";

type IonIconName = React.ComponentProps<typeof Ionicons>["name"];
type MaterialCommunityIconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];


export default function EmployeeDashboardScreen() {
  const router = useRouter();
  const theme = useColorScheme();
  const { data: user } = useCurrentUser();
  const { isClockedOut, attendance, isLoading: loadingworkinghrs } = useLiveWorkingHours();
  const { birthdays: upcomingEvents, isLoading: LoadingBirthday } = useGetBirthday();
  const { data: announcements, isLoading: LoadingAnnouncements } = useGetActiveAnnouncements();
  const { data, isLoading: LoadingBalance } = useViewLeaveBalance();

  const leaveBalance = data?.reduce((total, leave) => {
    return total + (leave.monthly_allocation || 0);
  }, 0);

  const isDark = theme === "dark";

  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  if (isLoading && loadingworkinghrs && LoadingAnnouncements && LoadingBirthday) {
    <DashboardSkeleton />
  }

  const getFormattedDate = () => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  const clockin = (attendance.length > 0 && attendance[0].clock_in_time) ? true : false;
  // console.log(clockin)

  // Stat cards for employee
  const statCards: Array<{
    title: string;
    value: string;
    icon: IonIconName;
    color: string;
    subtext: string;
  }> = [
      {
        title: "Attendance Status",
        value: clockin ? "Present" : "Absent",
        icon: "checkmark-circle-outline",
        color: "#10b981",
        subtext: clockin ? formateTime(attendance[0].clock_in_time || new Date()) : "Not Clocked in yet",
      },
      // {
      //   title: "Pending Tasks",
      //   value: "5",
      //   icon: "checkmark-outline",
      //   color: "#3b82f6",
      //   subtext: "3 due today",
      // },
      {
        title: "Leave Balance",
        value: String(leaveBalance) || "0",
        icon: "calendar-outline",
        color: "#f59e0b",
        subtext: "Days remaining",
      },
      // {
      //   title: "Performance",
      //   value: "8.5/10",
      //   icon: "star-outline",
      //   color: "#8b5cf6",
      //   subtext: "Overall score",
      // },
    ];

  // Quick actions for employee
  const quickActions: Array<{
    title: string;
    description: string;
    icon: MaterialCommunityIconName;
    link: string;
  }> = [
      {
        title: "Mark Attendance",
        description: "Check in or check out",
        icon: "clock-outline",
        link: "/(tabs)/Attendance"
      },
      {
        title: "Leave Requests",
        description: "Apply for time off",
        icon: "calendar-clock-outline",
        link: "/(tabs)/Leaves"
      },
      // {
      //   title: "My Tasks",
      //   description: "View assigned tasks",  
      //   icon: "checkbox-marked-circle-outline",
      // },
      // {
      //   title: "My Performance",
      //   description: "View reviews and ratings",
      //   icon: "chart-box-outline",
      // },
      {
        title: "Profile",
        description: "Visit your profile",
        icon: "account",
        link: "/(tabs)/Profile"
      },
      // {
      //   title: "Support",
      //   description: "Contact HR support",
      //   icon: "file-document-outline",
      // },
    ];

  // Upcoming events for employee
  // const upcomingEvents: Array<{
  //   title: string;
  //   date: string;
  //   type: "meeting" | "deadline" | "review";
  //   icon: IonIconName;
  // }> = [
  //     {
  //       title: "Team Meeting",
  //       date: "Today at 2:00 PM",
  //       type: "meeting",
  //       icon: "people-outline",
  //     },
  //     {
  //       title: "Project Deadline",
  //       date: "Tomorrow",
  //       type: "deadline",
  //       icon: "flag-outline",
  //     },
  //     {
  //       title: "Performance Review",
  //       date: "This Friday",
  //       type: "review",
  //       icon: "checkmark-circle-outline",
  //     },
  //   ];

  // Announcements
  // const announcements = [
  //   {
  //     title: "Office Hours Updated",
  //     date: "2 hours ago",
  //     description: "New flexible work hours policy implemented",
  //   },
  //   {
  //     title: "Birthday Celebration",
  //     date: "1 day ago",
  //     description: "Join us for Sarah's birthday celebration on Friday",
  //   },
  // ];

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? "#0f172a" : "#f3f4f6",
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <ActivityIndicator size="large" color="#10b981" />
        <Text
          style={[
            styles.loadingText,
            { color: isDark ? "#fff" : "#111", marginTop: 12 },
          ]}
        >
          Loading Dashboard...
        </Text>
      </View>
    );
  }

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
            borderColor: isDark ? "#374151" : "#e5e7eb",
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
            Here's your work dashboard
          </Text>
        </View>
      </View>

      {/* STATS CARDS - Single Column */}
      <View style={styles.statsContainer}>
        {statCards.map((stat, index) => (
          <View
            key={index}
            style={[
              styles.statCard,
              {
                backgroundColor: isDark ? "#1e293b" : "#fff",
                borderColor: isDark ? "#374151" : "#e5e7eb",
                borderLeftColor: stat.color,
                borderLeftWidth: 4,
              },
            ]}
          >
            <View style={styles.statContent}>
              <View style={styles.statTextContainer}>
                <Text
                  style={[
                    styles.statLabel,
                    { color: isDark ? "#9ca3af" : "#6b7280" },
                  ]}
                >
                  {stat.title}
                </Text>
                <Text
                  style={[
                    styles.statValue,
                    { color: stat.color },
                  ]}
                >
                  {stat.value}
                </Text>
                <Text
                  style={[
                    styles.statSubtext,
                    { color: isDark ? "#6b7280" : "#9ca3af" },
                  ]}
                >
                  {stat.subtext}
                </Text>
              </View>
              <View style={[styles.iconCircle, { backgroundColor: stat.color }]}>
                <Ionicons name={stat.icon} size={28} color="#fff" />
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* QUICK ACTIONS SECTION */}
      <Text
        style={[
          styles.sectionTitle,
          { color: isDark ? "#fff" : "#111" },
        ]}
      >
        Quick Actions
      </Text>

      {/* ACTION CARDS - Single Column */}
      <View style={styles.actionsContainer}>
        {quickActions.map((action, index) => (
          <TouchableOpacity
            key={index}
            activeOpacity={0.8}
            onPress={() => {router.replace(action.link as any)}}
            style={[
              styles.actionCard,
              {
                backgroundColor: isDark
                  ? "rgba(16, 185, 129, 0.15)"
                  : "rgba(16, 185, 129, 0.08)",
              },
            ]}
          >
            <View style={styles.actionIconContainer}>
              <View style={styles.actionIconBackground}>
                <MaterialCommunityIcons
                  name={action.icon}
                  size={28}
                  color="#10b981"
                />
              </View>
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={[styles.actionTitle, { color: isDark ? "#fff" : "#111" }]}>
                {action.title}
              </Text>
              <Text style={[styles.actionDesc, { color: isDark ? "#9ca3af" : "#6b7280" }]}>
                {action.description}
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
                  src={event?.profile_image_url}
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


      {/* WORK SUMMARY SECTION */}
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
            name="stats-chart-outline"
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
            Work Summary
          </Text>
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="checkmark-done-outline" size={24} color="#10b981" />
            </View>
            <Text style={[styles.summaryValue, { color: "#10b981" }]}>
              12
            </Text>
            <Text style={[styles.summaryLabel, { color: isDark ? "#9ca3af" : "#6b7280" }]}>
              Tasks Done
            </Text>
          </View>

          <View style={styles.summaryItem}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="time-outline" size={24} color="#3b82f6" />
            </View>
            <Text style={[styles.summaryValue, { color: "#3b82f6" }]}>
              40h
            </Text>
            <Text style={[styles.summaryLabel, { color: isDark ? "#9ca3af" : "#6b7280" }]}>
              This Week
            </Text>
          </View>

          <View style={styles.summaryItem}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="briefcase-outline" size={24} color="#f59e0b" />
            </View>
            <Text style={[styles.summaryValue, { color: "#f59e0b" }]}>
              3
            </Text>
            <Text style={[styles.summaryLabel, { color: isDark ? "#9ca3af" : "#6b7280" }]}>
              Active
            </Text>
          </View>
        </View>
      </View> */}

      {/* RECENT ACTIVITIES */}
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
            name="list-outline"
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
            Recent Activities
          </Text>
        </View>

        <View style={styles.activityList}>
          {[1, 2, 3].map((item) => (
            <View
              key={item}
              style={[
                styles.activityItem,
                {
                  borderColor: isDark ? "#374151" : "#e5e7eb",
                  borderBottomWidth: item < 3 ? 1 : 0,
                },
              ]}
            >
            <View
                style={[
                  styles.activityDot,
                  { backgroundColor: "#10b981" },
                ]}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.activityTitle, { color: isDark ? "#fff" : "#111" }]}>
                  Completed Task #{item}
                </Text>
                <Text style={[styles.activityTime, { color: isDark ? "#9ca3af" : "#6b7280" }]}>
                  {2 - item} hours ago
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View> */}

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

  loadingText: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Welcome Header
  welcomeHeader: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },

  headerContent: {
    gap: 8,
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

  statTextContainer: {
    flex: 1,
    marginRight: 12,
  },

  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },

  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  statValue: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 4,
    letterSpacing: -0.5,
  },

  statSubtext: {
    fontSize: 11,
    fontWeight: "400",
  },

  // Section Title
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginVertical: 16,
    letterSpacing: -0.3,
  },

  // Actions Container
  actionsContainer: {
    marginBottom: 24,
    gap: 12,
  },

  actionCard: {
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

  actionIconContainer: {
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },

  actionIconBackground: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
  },

  actionTextContainer: {
    flex: 1,
  },

  actionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },

  actionDesc: {
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

  // Events List
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

  // Summary Grid
  summaryGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
  },

  summaryItem: {
    alignItems: "center",
    flex: 1,
  },

  summaryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },

  summaryValue: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },

  summaryLabel: {
    fontSize: 10,
    fontWeight: "500",
  },

  // Activity List
  activityList: {
    gap: 0,
  },

  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
    borderColor: "#e5e7eb",
  },

  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  activityTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },

  activityTime: {
    fontSize: 11,
    fontWeight: "400",
  },
});