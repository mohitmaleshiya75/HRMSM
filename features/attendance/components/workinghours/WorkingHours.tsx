import React from "react";
import { View, Text, StyleSheet, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { convertToOnlyDate } from "@/lib/utils/dateUtils";
import useLiveWorkingHours from "@/hooks/useCalculateWorkingHrs";
import useCurrentUser from "@/features/auth/hooks/useCurrentUser";

interface TimeBreakdown {
    hours: number;
    minutes: number;
    seconds: number;
}

const parseTimeString = (timeStr: string): TimeBreakdown => ({
    hours:   parseInt(timeStr.match(/(\d+)h/)?.[1] ?? "0"),
    minutes: parseInt(timeStr.match(/(\d+)m/)?.[1] ?? "0"),
    seconds: parseInt(timeStr.match(/(\d+)s/)?.[1] ?? "0"),
});

const pad = (n: number) => String(n).padStart(2, "0");

export default function WorkingHoursCard() {
    const scheme = useColorScheme();
    const isDark = scheme === "dark";
    const { data: user } = useCurrentUser();
    const date = convertToOnlyDate(new Date());
    const { totalWorkingTime } = useLiveWorkingHours({ employee_id: user?.id, date: date! });
    const t = parseTimeString(totalWorkingTime);

    const totalMinutes = t.hours * 60 + t.minutes;
    const percent = Math.min(Math.round((totalMinutes / (8 * 60)) * 100), 100);
    const barColor = percent >= 80 ? "#10b981" : percent >= 50 ? "#f59e0b" : "#3b82f6";

    // ── Theme ──────────────────────────────────────────────────
    const card   = isDark ? "#1e293b" : "#ffffff";
    const border = isDark ? "#374151" : "#e5e7eb";
    const fg     = isDark ? "#ffffff" : "#111111";
    const muted  = isDark ? "#9ca3af" : "#6b7280";
    const accent = "#10b981";
    const mutedBg = isDark ? "rgba(16,185,129,0.10)" : "rgba(16,185,129,0.06)";

    const units = [
        { label: "Hours",   value: pad(t.hours),   color: "#10b981", icon: "time-outline"    as const },
        { label: "Minutes", value: pad(t.minutes),  color: "#3b82f6", icon: "timer-outline"   as const },
        { label: "Seconds", value: pad(t.seconds),  color: "#f59e0b", icon: "hourglass-outline" as const },
    ];

    return (
        <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
            {/* Header */}
            <View style={styles.cardHeader}>
                <Ionicons name="stats-chart-outline" size={20} color={accent} style={{ marginRight: 8 }} />
                <Text style={[styles.sectionTitle, { color: fg }]}>Today's Working Hours</Text>
            </View>

            {/* Time units */}
            <View style={styles.unitsRow}>
                {units.map((u, i) => (
                    <View
                        key={i}
                        style={[
                            styles.unitBox,
                            {
                                backgroundColor: mutedBg,
                                borderColor: border,
                                borderLeftColor: u.color,
                            },
                        ]}
                    >
                        <Ionicons name={u.icon} size={14} color={u.color} style={{ marginBottom: 6 }} />
                        <Text style={[styles.unitValue, { color: u.color }]}>{u.value}</Text>
                        <Text style={[styles.unitLabel, { color: muted }]}>{u.label}</Text>
                    </View>
                ))}
            </View>

            {/* Progress towards 8h goal */}
            <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                    <Text style={[styles.progressLabel, { color: muted }]}>Daily Goal</Text>
                    <Text style={[styles.progressValue, { color: barColor }]}>
                        {pad(t.hours)}h {pad(t.minutes)}m / 8h 00m
                    </Text>
                </View>
                <View style={[styles.progressTrack, { backgroundColor: border }]}>
                    <View
                        style={[
                            styles.progressFill,
                            { width: `${percent}%` as any, backgroundColor: barColor },
                        ]}
                    />
                </View>
                <Text style={[styles.percentText, { color: barColor }]}>{percent}% complete</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 14,
        padding: 18,
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

    // ── Units ──────────────────────────────────────────────────
    unitsRow: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 18,
    },
    unitBox: {
        flex: 1,
        borderRadius: 12,
        borderWidth: 1,
        borderLeftWidth: 3,
        padding: 14,
        alignItems: "center",
    },
    unitValue: {
        fontSize: 26,
        fontWeight: "800",
        letterSpacing: -0.5,
        marginBottom: 2,
    },
    unitLabel: {
        fontSize: 10,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },

    // ── Progress ───────────────────────────────────────────────
    progressSection: { gap: 6 },
    progressHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    progressLabel: { fontSize: 12, fontWeight: "600" },
    progressValue: { fontSize: 12, fontWeight: "700" },
    progressTrack: {
        height: 8,
        borderRadius: 4,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        borderRadius: 4,
    },
    percentText: {
        fontSize: 11,
        fontWeight: "600",
        textAlign: "right",
    },
});