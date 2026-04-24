import React, { useMemo } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    useColorScheme,
    ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { GetAttendanceResponseT } from "../type";
import { PaginatedResponse } from "@/types";
import { convertToOnlyDate, formateTime } from "@/lib/utils/dateUtils";
import useLiveWorkingHours from "@/hooks/useCalculateWorkingHrs";
import useCurrentUser from "@/features/auth/hooks/useCurrentUser";
import WorkingHoursCard from "./workinghours/WorkingHours";
import useViewAttendance from "@/features/attendance/hooks/useViewAttendance";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface GroupedData {
    [employee_id: string]: {
        employee_name: string;
        records: GetAttendanceResponseT[];
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const pad2 = (n: number) => String(n).padStart(2, "0");

const calcWorkedMinutes = (records: GetAttendanceResponseT[]) =>
    records.reduce((total, r) => {
        if (!r.clock_in_time || !r.clock_out_time) return total;
        return total + (new Date(r.clock_out_time).getTime() - new Date(r.clock_in_time).getTime()) / 60000;
    }, 0);

const fmtHrs = (mins: number) => `${Math.floor(mins / 60)}h ${pad2(Math.floor(mins % 60))}m`;

// ─────────────────────────────────────────────────────────────────────────────
// Page wrapper (replaces ViewAttandance page)
// ─────────────────────────────────────────────────────────────────────────────
export default function ViewAttendancePage() {
    const { attendance, isLoading, totalCount } = useViewAttendance({ showAllAttendance: true });

    const scheme = useColorScheme();
    const isDark = scheme === "dark";
    const bg = isDark ? "#0f172a" : "#f3f4f6";

    if (isLoading) {
        return (
            <View style={[styles.centered, { backgroundColor: bg }]}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={[styles.loadingText, { color: isDark ? "#9ca3af" : "#6b7280", marginTop: 12 }]}>
                    Loading attendance…
                </Text>
            </View>
        );
    }

    return (
        <AttendanceScreen
            data={{ results: attendance, count: totalCount, next: null, previous: null }}
        />
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
function AttendanceScreen({ data }: { data: PaginatedResponse<GetAttendanceResponseT> }) {
    const scheme = useColorScheme();
    const isDark = scheme === "dark";

    // ── Theme ────────────────────────────────────────────────
    const bg = isDark ? "#0f172a" : "#f3f4f6";
    const card = isDark ? "#1e293b" : "#ffffff";
    const border = isDark ? "#374151" : "#e5e7eb";
    const fg = isDark ? "#ffffff" : "#111111";
    const muted = isDark ? "#9ca3af" : "#6b7280";
    const accent = "#10b981";
    const mutedBg = isDark ? "rgba(16,185,129,0.10)" : "rgba(16,185,129,0.06)";

    // ── Group by employee ────────────────────────────────────
    const groupedData: GroupedData = useMemo(
        () =>
            (data.results || []).reduce((acc, r) => {
                if (!acc[r.employee])
                    acc[r.employee] = { employee_name: r.employee_name, records: [] };
                acc[r.employee].records.push(r);
                return acc;
            }, {} as GroupedData),
        [data.results]
    );

    const employees = Object.entries(groupedData);

    // ── Empty state ──────────────────────────────────────────
    if (employees.length === 0) {
        return (
            <ScrollView style={[styles.container, { backgroundColor: bg }]}>
                <WorkingHoursCard />
                <View style={[styles.emptyCard, { backgroundColor: card, borderColor: border }]}>
                    <View style={[styles.emptyIconWrap, { backgroundColor: mutedBg }]}>
                        <Ionicons name="calendar-outline" size={32} color={accent} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: fg }]}>No Records Found</Text>
                    <Text style={[styles.emptyDesc, { color: muted }]}>
                        No attendance records available for this period.
                    </Text>
                </View>
            </ScrollView>
        );
    }

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: bg }]}
            showsVerticalScrollIndicator={false}
        >
            {/* ── Working Hours Card ─────────────────────────── */}
            <WorkingHoursCard />

            {/* ── Summary stat cards ────────────────────────── */}
            {employees.map(([id, emp]) => {
                const workedMins = calcWorkedMinutes(emp.records);
                const percent = Math.min(Math.round((workedMins / (8 * 60)) * 100), 100);
                const barColor = percent >= 80 ? "#10b981" : percent >= 50 ? "#f59e0b" : "#ef4444";
                const clockIns = emp.records.filter(r => r.clock_in_time).length;
                const clockOuts = emp.records.filter(r => r.clock_out_time).length;

                return (
                    <View key={id}>
                        {/* ── Employee header card ──────────────── */}
                        <View style={[styles.employeeHeaderCard, { backgroundColor: card, borderColor: border }]}>
                            {/* Avatar + name */}
                            <View style={styles.empRow}>
                                <View style={[styles.avatar, { backgroundColor: accent }]}>
                                    <Text style={styles.avatarText}>
                                        {emp.employee_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                                    </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.empName, { color: fg }]}>{emp.employee_name}</Text>
                                    <Text style={[styles.empSub, { color: muted }]}>
                                        {emp.records.length} attendance record{emp.records.length !== 1 ? "s" : ""}
                                    </Text>
                                </View>
                            </View>

                            {/* ── Stat pills ───────────────────────── */}
                            <View style={styles.pillRow}>
                                {[
                                    { label: "Entries", value: emp.records.length, color: "#3b82f6" },
                                    { label: "Clock In", value: clockIns, color: accent },
                                    { label: "Clock Out", value: clockOuts, color: "#f59e0b" },
                                    { label: "Worked", value: fmtHrs(workedMins), color: barColor },
                                ].map((p, i) => (
                                    <View
                                        key={i}
                                        style={[styles.pill, { backgroundColor: p.color + "18", borderColor: p.color + "30" }]}
                                    >
                                        <Text style={[styles.pillValue, { color: p.color }]}>{p.value}</Text>
                                        <Text style={[styles.pillLabel, { color: muted }]}>{p.label}</Text>
                                    </View>
                                ))}
                            </View>

                            {/* ── Progress bar ─────────────────────── */}
                            <View style={styles.progressSection}>
                                <View style={styles.progressHeader}>
                                    <Text style={[styles.progressLabel, { color: muted }]}>Daily goal progress</Text>
                                    <Text style={[styles.progressPct, { color: barColor }]}>{percent}%</Text>
                                </View>
                                <View style={[styles.progressTrack, { backgroundColor: border }]}>
                                    <View style={[styles.progressFill, { width: `${percent}%` as any, backgroundColor: barColor }]} />
                                </View>
                            </View>
                        </View>

                        {/* ── Records section title ─────────────── */}
                        <View style={styles.recordsTitleRow}>
                            <Ionicons name="list-outline" size={16} color={accent} style={{ marginRight: 6 }} />
                            <Text style={[styles.recordsTitle, { color: muted }]}>Attendance Records</Text>
                        </View>

                        {/* ── Individual records ────────────────── */}
                        {emp.records.map((r: GetAttendanceResponseT, idx: number) => {
                            const complete = !!(r.clock_in_time && r.clock_out_time);
                            const statusColor = complete ? "#10b981" : "#f59e0b";
                            const statusLabel = complete ? "Complete" : r.clock_in_time ? "In Progress" : "Absent";

                            return (
                                <View
                                    key={r.id}
                                    style={[
                                        styles.recordCard,
                                        {
                                            backgroundColor: card,
                                            borderColor: border,
                                            borderLeftColor: statusColor,
                                        },
                                    ]}
                                >
                                    {/* Date + badge */}
                                    <View style={styles.recordTopRow}>
                                        <View style={styles.recordDateRow}>
                                            <View style={[styles.recordIconBox, { backgroundColor: mutedBg }]}>
                                                <Ionicons name="calendar-outline" size={14} color={accent} />
                                            </View>
                                            <Text style={[styles.recordDate, { color: fg }]}>
                                                {formatDate(r.date)}
                                            </Text>
                                        </View>
                                        <View style={[styles.statusBadge, { backgroundColor: statusColor + "18" }]}>
                                            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                                            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
                                        </View>
                                    </View>

                                    {/* Clock In / Out rows */}
                                    <View style={[styles.timeGrid, { borderTopColor: border }]}>
                                        <View style={styles.timeItem}>
                                            <View style={[styles.timeIconBox, { backgroundColor: "rgba(16,185,129,0.12)" }]}>
                                                <Ionicons name="log-in-outline" size={15} color="#10b981" />
                                            </View>
                                            <View>
                                                <Text style={[styles.timeItemLabel, { color: muted }]}>Clock In</Text>
                                                <Text style={[styles.timeItemValue, { color: r.clock_in_time ? fg : muted }]}>
                                                    {r.clock_in_time ? formateTime(r.clock_in_time) : "—"}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={[styles.timeDivider, { backgroundColor: border }]} />

                                        <View style={styles.timeItem}>
                                            <View style={[styles.timeIconBox, { backgroundColor: "rgba(245,158,11,0.12)" }]}>
                                                <Ionicons name="log-out-outline" size={15} color="#f59e0b" />
                                            </View>
                                            <View>
                                                <Text style={[styles.timeItemLabel, { color: muted }]}>Clock Out</Text>
                                                <Text style={[styles.timeItemValue, { color: r.clock_out_time ? fg : muted }]}>
                                                    {r.clock_out_time ? formateTime(r.clock_out_time) : "—"}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Duration */}
                                        {r.clock_in_time && r.clock_out_time && (() => {
                                            const mins = (new Date(r.clock_out_time).getTime() - new Date(r.clock_in_time).getTime()) / 60000;
                                            return (
                                                <>
                                                    <View style={[styles.timeDivider, { backgroundColor: border }]} />
                                                    <View style={styles.timeItem}>
                                                        <View style={[styles.timeIconBox, { backgroundColor: "rgba(59,130,246,0.12)" }]}>
                                                            <Ionicons name="timer-outline" size={15} color="#3b82f6" />
                                                        </View>
                                                        <View>
                                                            <Text style={[styles.timeItemLabel, { color: muted }]}>Duration</Text>
                                                            <Text style={[styles.timeItemValue, { color: "#3b82f6" }]}>
                                                                {fmtHrs(mins)}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                </>
                                            );
                                        })()}
                                    </View>
                                </View>
                            );
                        })}

                        <View style={{ height: 8 }} />
                    </View>
                );
            })}

            <View style={{ height: 32 }} />
        </ScrollView>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
    centered: { flex: 1, justifyContent: "center", alignItems: "center" },
    loadingText: { fontSize: 14, fontWeight: "600" },

    // ── Empty ─────────────────────────────────────────────────
    emptyCard: {
        borderRadius: 14,
        padding: 36,
        borderWidth: 1,
        alignItems: "center",
        marginTop: 16,
        gap: 10,
    },
    emptyIconWrap: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center" },
    emptyTitle: { fontSize: 16, fontWeight: "700" },
    emptyDesc: { fontSize: 13, textAlign: "center" },

    // ── Employee header card ───────────────────────────────────
    employeeHeaderCard: {
        borderRadius: 14,
        padding: 18,
        borderWidth: 1,
        marginTop: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        gap: 16,
    },
    empRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
    avatarText: { color: "#fff", fontWeight: "700", fontSize: 15 },
    empName: { fontSize: 16, fontWeight: "700", letterSpacing: -0.3 },
    empSub: { fontSize: 12, fontWeight: "400", marginTop: 2 },

    // ── Stat pills ────────────────────────────────────────────
    pillRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
    pill: {
        flex: 1,
        minWidth: 68,
        borderRadius: 10,
        borderWidth: 1,
        padding: 10,
        alignItems: "center",
    },
    pillValue: { fontSize: 16, fontWeight: "800", letterSpacing: -0.3 },
    pillLabel: { fontSize: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4, marginTop: 2 },

    // ── Progress ──────────────────────────────────────────────
    progressSection: { gap: 6 },
    progressHeader: { flexDirection: "row", justifyContent: "space-between" },
    progressLabel: { fontSize: 12, fontWeight: "600" },
    progressPct: { fontSize: 12, fontWeight: "700" },
    progressTrack: { height: 8, borderRadius: 4, overflow: "hidden" },
    progressFill: { height: "100%", borderRadius: 4 },

    // ── Records title ─────────────────────────────────────────
    recordsTitleRow: { flexDirection: "row", alignItems: "center", marginBottom: 8, paddingHorizontal: 2 },
    recordsTitle: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },

    // ── Record card ───────────────────────────────────────────
    recordCard: {
        borderRadius: 12,
        borderWidth: 1,
        borderLeftWidth: 4,
        marginBottom: 10,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 1,
    },
    recordTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 12,
        paddingBottom: 10,
    },
    recordDateRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    recordIconBox: { width: 28, height: 28, borderRadius: 8, justifyContent: "center", alignItems: "center" },
    recordDate: { fontSize: 13, fontWeight: "600" },
    statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 11, fontWeight: "700" },

    // ── Time grid ─────────────────────────────────────────────
    timeGrid: {
        flexDirection: "row",
        alignItems: "center",
        borderTopWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 12,
        gap: 0,
    },
    timeItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
    timeIconBox: { width: 30, height: 30, borderRadius: 8, justifyContent: "center", alignItems: "center" },
    timeItemLabel: { fontSize: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.3 },
    timeItemValue: { fontSize: 13, fontWeight: "700", marginTop: 1 },
    timeDivider: { width: 1, height: 32, marginHorizontal: 6 },
});