import React, { useState, useMemo } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    LayoutAnimation,
    Platform,
    UIManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GetAttendanceResponseT } from "../type";
import { PaginatedResponse } from "@/types";
import { convertToOnlyDate, formateTime } from "@/lib/utils/dateUtils";
import useLiveTimer from "../hooks/useLiveTimer";
import useLiveWorkingHours from "@/hooks/useCalculateWorkingHrs";
import useCurrentUser from "@/features/auth/hooks/useCurrentUser";
import WorkingHoursCard from "./workinghours/WorkingHours";

// Enable animation on Android
if (Platform.OS === "android") {
    UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

interface CollapsibleAttendanceTableProps {
    data: PaginatedResponse<GetAttendanceResponseT>;
    showPagination?: boolean;
}
interface GroupedData {
    [employee_id: string]: {
        employee_name: string;
        records: GetAttendanceResponseT[];
    };
}

export default function AttendanceScreen({
    data,
}: CollapsibleAttendanceTableProps) {
    const { data:user } = useCurrentUser();
    const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);
    const { time } = useLiveTimer(0); // or pass backend seconds
    const date = convertToOnlyDate(new Date());
    const { totalWorkingTime } = useLiveWorkingHours({
    employee_id: user?.id,
    date: date!,
  });



    const groupedData: GroupedData = (data.results || []).reduce(
        (acc, record) => {
            if (!acc[record.employee]) {
                acc[record.employee] = {
                    employee_name: record.employee_name,
                    records: [],
                };
            }
            acc[record.employee].records.push(record);
            return acc;
        },
        {} as GroupedData,
    );

    const employees = Object.entries(groupedData);

    const toggleEmployee = (id: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedEmployee(prev => (prev === id ? null : id));
    };

    // HELPERS
    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });

    const formatTime = (date: string) =>
        new Date(date).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });

    const calculateWorkedMinutes = (records: GetAttendanceResponseT[]) => {
        let total = 0;

        records.forEach(r => {
            if (r.clock_in_time && r.clock_out_time) {
                const inTime = new Date(r.clock_in_time);
                const outTime = new Date(r.clock_out_time);
                total += (outTime.getTime() - inTime.getTime()) / (1000 * 60);
            }
        });

        return total;
    };

    const formateHrs = (mins: number) => {
        const h = Math.floor(mins / 60);
        const m = Math.floor(mins % 60);
        return `${h}h ${m}m`;
    };

    if (employees.length === 0) {
        return (
            <View style={styles.empty}>
                <Ionicons name="calendar-outline" size={50} color="#9ca3af" />
                <Text style={styles.emptyTitle}>No attendance records</Text>
            </View>
        );
    }
    const getAttendanceStats = (records: GetAttendanceResponseT[]) => {
        const totalEntries = records.length;
        const clockIn = records.filter(
            (r) => r.clock_in_time
        ).length;
        const clockOut = records.filter(
            (r) => r.clock_out_time
        ).length;

        return { totalEntries, clockIn, clockOut };
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {employees.map(([id, emp]) => {
                const { totalEntries, clockIn, clockOut } =
                    getAttendanceStats(emp.records);
                const isExpanded = expandedEmployee === id;

                // const totalEntries = emp.records.length;
                // const clockIn = emp.records.filter((r) => r.clock_in_time).length;
                // const clockOut = emp.records.filter((r) => r.clock_out_time).length;

                const workedMinutes = calculateWorkedMinutes(emp.records);
                const percent = Math.min(Math.round((workedMinutes / (8 * 60)) * 100), 100);

                return (
                    <View key={id} style={styles.card}>
                        {/* HEADER */}

                        
                        <TouchableOpacity onPress={() => toggleEmployee(id)} style={styles.header}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {emp.employee_name
                                        .split(" ")
                                        .map((n: string) => n[0])
                                        .join("")}
                                </Text>
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={styles.name}>{emp.employee_name}</Text>
                                <Text style={styles.sub}>
                                    {totalEntries} records
                                </Text>
                            </View>

                            <Ionicons
                                name={isExpanded ? "chevron-up" : "chevron-down"}
                                size={22}
                                color="#6b7280"
                            />
                        </TouchableOpacity>

                        {/* EXPANDED */}
                        {isExpanded && (
                            <View style={styles.content}>
                                {/* STATS */}
                                <View style={styles.statsRow}>
                                    <View style={styles.statBox}>
                                        <Text style={styles.statNumber}>{totalEntries}</Text>
                                        <Text style={styles.statLabel}>Entries</Text>
                                    </View>

                                    <View style={styles.statBox}>
                                        <Text style={[styles.statNumber, { color: "#10b981" }]}>
                                            {clockIn}
                                        </Text>
                                        <Text style={styles.statLabel}>In</Text>
                                    </View>

                                    <View style={styles.statBox}>
                                        <Text style={[styles.statNumber, { color: "#f59e0b" }]}>
                                            {clockOut}
                                        </Text>
                                        <Text style={styles.statLabel}>Out</Text>
                                    </View>
                                </View>

                                {/* PROGRESS */}
                                <View style={{ marginBottom: 16 }}>
                                    <Text style={styles.progressText}>
                                        {formateHrs(workedMinutes)} / 8h
                                    </Text>

                                    <View style={styles.progressBar}>
                                        <View
                                            style={[
                                                styles.progressFill,
                                                {
                                                    width: `${percent}%`,
                                                    backgroundColor:
                                                        percent > 80 ? "#10b981" :
                                                            percent > 50 ? "#f59e0b" : "#ef4444",
                                                },
                                            ]}
                                        />
                                    </View>
                                </View>

                                {/* RECORDS */}
                                {emp.records.map((r: GetAttendanceResponseT) => (
                                    <View key={r.id} style={styles.record}>
                                        <View>
                                            <Text style={styles.date}>{formatDate(r.date)}</Text>

                                            <Text style={styles.time}>
                                                <Ionicons name="log-in-outline" />
                                                {r.clock_in_time
                                                    ? `: ${formateTime(r.clock_in_time)}`
                                                    : ": No Check-in"}
                                            </Text>

                                            <Text style={styles.time}>
                                                <Ionicons name="log-out-outline" />
                                                {r.clock_out_time
                                                    ? `: ${formateTime(r.clock_out_time)}`
                                                    : ": No Check-out"}
                                            </Text>
                                        </View>

                                        <View
                                            style={[
                                                styles.statusDot,
                                                {
                                                    backgroundColor:
                                                        r.clock_in_time && r.clock_out_time
                                                            ? "#10b981"
                                                            : "#f59e0b",
                                                },
                                            ]}
                                        />
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                );
            })}
        </ScrollView>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 12,
        backgroundColor: "#f3f4f6",
    },

    card: {
        backgroundColor: "#fff",
        borderRadius: 12,
        marginBottom: 12,
        overflow: "hidden",
        elevation: 2,
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
        padding: 14,
        gap: 10,
    },
    timerCard: {
        backgroundColor: "#111827",
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
        alignItems: "center",
    },

    timer: {
        fontSize: 36,
        fontWeight: "bold",
        color: "#10b981",
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#10b981",
        alignItems: "center",
        justifyContent: "center",
    },

    avatarText: {
        color: "#fff",
        fontWeight: "700",
    },

    name: {
        fontSize: 14,
        fontWeight: "600",
    },

    sub: {
        fontSize: 11,
        color: "#6b7280",
    },

    content: {
        padding: 14,
        backgroundColor: "#f9fafb",
    },

    statsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 16,
    },

    statBox: {
        alignItems: "center",
        flex: 1,
    },

    statNumber: {
        fontSize: 18,
        fontWeight: "700",
    },

    statLabel: {
        fontSize: 11,
        color: "#6b7280",
    },

    progressText: {
        fontSize: 12,
        marginBottom: 6,
        color: "#6b7280",
    },

    progressBar: {
        height: 6,
        backgroundColor: "#e5e7eb",
        borderRadius: 6,
        overflow: "hidden",
    },

    progressFill: {
        height: "100%",
    },

    record: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#fff",
        padding: 12,
        borderRadius: 10,
        marginBottom: 8,
    },

    date: {
        fontWeight: "600",
        fontSize: 13,
    },

    time: {
        fontSize: 11,
        color: "#6b7280",
    },

    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },

    empty: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },

    emptyTitle: {
        marginTop: 10,
        fontSize: 16,
        fontWeight: "600",
        color: "#6b7280",
    },
});