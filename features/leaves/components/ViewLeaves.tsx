import React, { useMemo, useState, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    useColorScheme,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    Animated,
    LayoutAnimation,
    Platform,
    UIManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import useCurrentUser from "@/features/auth/hooks/useCurrentUser";
import { useGetLeaves } from "../hooks/useGetLeaves";
import { Stack, useRouter } from "expo-router";
import useUpdateLeaveStatus from "../hooks/useEditLeaveForm";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type LeaveStatus = "Pending" | "Approved" | "Rejected" | "Canceled";
type Duration = "FULL" | "HALF_AM" | "HALF_PM";

interface LeaveItem {
    id: string;
    employee: string;
    employee_name: string;
    leave_type_name: string;
    reason: string;
    duration: Duration;
    leave_type: string;
    start_date: string;
    end_date: string;
    status: LeaveStatus;
}

interface GroupedData {
    [employee_id: string]: {
        employee_name: string;
        records: LeaveItem[];
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const getDurationLabel = (duration: Duration) => {
    switch (duration) {
        case "FULL": return "Full Day";
        case "HALF_AM": return "First Half";
        case "HALF_PM": return "Second Half";
        default: return "N/A";
    }
};

const getDurationDays = (duration: Duration) => (duration === "FULL" ? 1 : 0.5);

const calcTotalDays = (records: LeaveItem[]) =>
    records.reduce((sum, r) => sum + getDurationDays(r.duration), 0);

const STATUS_CONFIG: Record<LeaveStatus, { color: string; bg: string; icon: string; label: string }> = {
    Approved: { color: "#059669", bg: "#d1fae5", icon: "checkmark-circle", label: "Approved" },
    Pending: { color: "#d97706", bg: "#fef3c7", icon: "time", label: "Pending" },
    Rejected: { color: "#dc2626", bg: "#fee2e2", icon: "close-circle", label: "Rejected" },
    Canceled: { color: "#6b7280", bg: "#f3f4f6", icon: "ban", label: "Canceled" },
};

// Initials helper
const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

// Avatar palette — deterministic by name
const AVATAR_COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];
const avatarColor = (name: string) =>
    AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

// ─────────────────────────────────────────────────────────────────────────────
// Page wrapper
// ─────────────────────────────────────────────────────────────────────────────
export default function ViewLeaves() {
    const router = useRouter();
    const { leaves, isLoading, totalCount } = useGetLeaves();
    const { data: user } = useCurrentUser();
    const scheme = useColorScheme();
    const isDark = scheme === "dark";
    const bg = isDark ? "#0f172a" : "#f8fafc";

    const header = (
        <Stack.Screen
            options={{
                title: "Leave Requests",
                headerLeft: () => (
                    <TouchableOpacity
                        onPress={() => router.push("/(tabs)")}
                        style={{ paddingHorizontal: 10 }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="arrow-back" size={24} color={isDark ? "#fff" : "#111"} />
                    </TouchableOpacity>
                ),
            }}
        />
    );

    if (isLoading) {
        return (
            <>
                {header}
                <View style={[styles.centered, { backgroundColor: bg }]}>
                    <ActivityIndicator size="large" color="#6366f1" />
                    <Text style={[styles.loadingText, { color: isDark ? "#94a3b8" : "#64748b", marginTop: 14 }]}>
                        Loading requests…
                    </Text>
                </View>
            </>
        );
    }

    return (
        <>
            {header}
            <LeavesScreen
                leaves={leaves ?? []}
                totalCount={totalCount ?? 0}
                isManager={(user?.role==="Admin" || user?.role==="Employee" || user?.role==="HR" || user?.role==="Manager" || user?.role==="SuperAdmin")? true : false}
                isDark={isDark}
            />
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────
function LeavesScreen({
    leaves,
    totalCount,
    isManager,
    isDark,
}: {
    leaves: LeaveItem[];
    totalCount: number;
    isManager: boolean;
    isDark: boolean;
}) {
    const bg = isDark ? "#0f172a" : "#f8fafc";
    const card = isDark ? "#1e293b" : "#ffffff";
    const border = isDark ? "#334155" : "#e2e8f0";
    const fg = isDark ? "#f1f5f9" : "#0f172a";
    const muted = isDark ? "#94a3b8" : "#64748b";
    const subtle = isDark ? "#1e293b" : "#f1f5f9";

    const approved = leaves.filter(l => l.status === "Approved").length;
    const pending = leaves.filter(l => l.status === "Pending").length;
    const rejected = leaves.filter(l => l.status === "Rejected").length;
    const canceled = leaves.filter(l => l.status === "Canceled").length;
    const totalDays = calcTotalDays(leaves);

    const leaveTypeBreakdown = useMemo(() => {
        const map: Record<string, number> = {};
        leaves.forEach(l => { map[l.leave_type_name] = (map[l.leave_type_name] ?? 0) + getDurationDays(l.duration); });
        return Object.entries(map).sort((a, b) => b[1] - a[1]);
    }, [leaves]);

    const groupedData: GroupedData = useMemo(
        () => leaves.reduce((acc, r) => {
            if (!acc[r.employee]) acc[r.employee] = { employee_name: r.employee_name, records: [] };
            acc[r.employee].records.push(r);
            return acc;
        }, {} as GroupedData),
        [leaves]
    );

    const employees = Object.entries(groupedData);

    if (employees.length === 0) {
        return (
            <ScrollView style={[styles.container, { backgroundColor: bg }]} contentContainerStyle={{ paddingBottom: 40 }}>
                <SummaryPanel {...{ totalCount, approved, pending, rejected, canceled, totalDays, leaveTypeBreakdown, card, border, fg, muted, subtle, isDark }} />
                <View style={[styles.emptyWrap, { backgroundColor: card, borderColor: border }]}>
                    <Ionicons name="calendar-outline" size={40} color={muted} />
                    <Text style={[styles.emptyTitle, { color: fg }]}>No leave records</Text>
                    <Text style={[styles.emptyDesc, { color: muted }]}>No requests have been submitted yet.</Text>
                </View>
            </ScrollView>
        );
    }

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: bg }]}
            contentContainerStyle={{ paddingBottom: 48 }}
            showsVerticalScrollIndicator={false}
        >
            <SummaryPanel {...{ totalCount, approved, pending, rejected, canceled, totalDays, leaveTypeBreakdown, card, border, fg, muted, subtle, isDark }} />

            <Text style={[styles.sectionHeading, { color: muted }]}>
                {employees.length} EMPLOYEE{employees.length !== 1 ? "S" : ""}
            </Text>

            {employees.map(([id, emp]) => (
                <EmployeeGroup
                    key={id}
                    emp={emp}
                    isManager={isManager}
                    card={card} border={border} fg={fg} muted={muted} subtle={subtle} isDark={isDark}
                />
            ))}
        </ScrollView>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Collapsible employee group
// ─────────────────────────────────────────────────────────────────────────────
function EmployeeGroup({
    emp, isManager, card, border, fg, muted, subtle, isDark,
}: {
    emp: { employee_name: string; records: LeaveItem[] };
    isManager: boolean;
    card: string; border: string; fg: string; muted: string; subtle: string; isDark: boolean;
}) {
    const [expanded, setExpanded] = useState(false);
    const rotateAnim = useRef(new Animated.Value(0)).current;

    const toggle = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        Animated.timing(rotateAnim, {
            toValue: expanded ? 0 : 1,
            duration: 220,
            useNativeDriver: true,
        }).start();
        setExpanded(v => !v);
    };

    const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });

    const total = emp.records.length;
    const appCount = emp.records.filter(r => r.status === "Approved").length;
    const pendCount = emp.records.filter(r => r.status === "Pending").length;
    const empDays = calcTotalDays(emp.records);
    const aColor = avatarColor(emp.employee_name);
    const initials = getInitials(emp.employee_name);

    const pills = [
        { label: "Total", value: total, color: "#6366f1" },
        { label: "Approved", value: appCount, color: "#059669" },
        { label: "Pending", value: pendCount, color: "#d97706" },
    ];

    return (
        <View style={[styles.groupCard, { backgroundColor: card, borderColor: border }]}>
            {/* ── Header (always visible) ─────────────────────── */}
            <TouchableOpacity
                onPress={toggle}
                activeOpacity={0.75}
                style={styles.groupHeader}
            >
                {/* Avatar */}
                <View style={[styles.avatar, { backgroundColor: aColor }]}>
                    <Text style={styles.avatarText}>{initials}</Text>
                </View>

                {/* Name + meta */}
                <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                    <Text style={[styles.empName, { color: fg }]} numberOfLines={1}>
                        {emp.employee_name}
                    </Text>
                    <View style={styles.empMeta}>
                        {pills.map((p, i) => (
                            <View key={i} style={[styles.miniPill, { backgroundColor: p.color + "18" }]}>
                                <Text style={[styles.miniPillText, { color: p.color }]}>
                                    {p.value} {p.label}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Days badge */}
                <View style={[styles.daysBadge, { backgroundColor: aColor + "18", borderColor: aColor + "35" }]}>
                    <Text style={[styles.daysBadgeNum, { color: aColor }]}>{empDays}</Text>
                    <Text style={[styles.daysBadgeLbl, { color: aColor }]}>days</Text>
                </View>

                {/* Chevron */}
                <Animated.View style={{ transform: [{ rotate }], marginLeft: 8 }}>
                    <Ionicons name="chevron-down" size={20} color={muted} />
                </Animated.View>
            </TouchableOpacity>

            {/* ── Collapsible records ─────────────────────────── */}
            {expanded && (
                <View style={[styles.recordsList, { borderTopColor: border }]}>
                    {emp.records.map((r, idx) => (
                        <LeaveCard
                            key={r.id}
                            record={r}
                            isLast={idx === emp.records.length - 1}
                            isManager={isManager}
                            employeeName={emp.employee_name}
                            border={border} fg={fg} muted={muted} subtle={subtle} isDark={isDark}
                        />
                    ))}
                </View>
            )}
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Individual leave card
// ─────────────────────────────────────────────────────────────────────────────
function LeaveCard({
    record: r,
    isLast,
    isManager,
    employeeName,
    border, fg, muted, subtle, isDark,
}: {
    record: LeaveItem;
    isLast: boolean;
    isManager: boolean;
    employeeName: string;
    border: string; fg: string; muted: string; subtle: string; isDark: boolean;
}) {
    const sc = STATUS_CONFIG[r.status] ?? STATUS_CONFIG["Pending"];
      const { updateStatus, isPending, } = useUpdateLeaveStatus();
    const start = formatDate(r.start_date);
    const end = formatDate(r.end_date);
    const isSame = r.start_date === r.end_date;
    const span = isSame ? 1 : Math.ceil((new Date(r.end_date).getTime() - new Date(r.start_date).getTime()) / 86400000) + 1;

    const handleAction = (action: LeaveStatus) => {
        const messages: Record<string, string> = {
            Approved: `Approve ${employeeName}'s leave request?`,
            Rejected: `Reject ${employeeName}'s leave request?`,
            Canceled: `Cancel ${employeeName}'s leave request?`,
        };
        Alert.alert(
            action.charAt(0).toUpperCase() + action.slice(1),
            `Are you sure you want to ${action.toLowerCase()} request?`,
            [
                { text: "No", style: "cancel" },
                {
                    text: "Yes",
                    style: action === "Approved" ? "default" : "destructive",
                    onPress: () => {
                        updateStatus({ leaveId: Number(r.id), status: action });
                    },
                },
            ]
        );
    };

    return (
        <View style={[styles.leaveCard, !isLast && { borderBottomWidth: 1, borderBottomColor: border }]}>
            {/* Status stripe */}
            <View style={[styles.statusStripe, { backgroundColor: sc.color }]} />

            <View style={styles.leaveCardInner}>
                {/* ── Top row: date range + status badge ── */}
                <View style={styles.lcTopRow}>
                    <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[styles.lcDateMain, { color: fg }]}>{start}</Text>
                        {!isSame && (
                            <Text style={[styles.lcDateTo, { color: muted }]}>→  {end}</Text>
                        )}
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                        <Ionicons name={sc.icon as any} size={12} color={sc.color} />
                        <Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text>
                    </View>
                </View>

                {/* ── Detail rows ── */}
                <View style={[styles.detailGrid, { borderTopColor: border, borderBottomColor: border }]}>
                    <DetailRow icon="briefcase-outline" label="Leave type" value={r.leave_type_name} color="#6366f1" fg={fg} muted={muted} subtle={subtle} />
                    <View style={[styles.detailDivider, { backgroundColor: border }]} />
                    <DetailRow icon="timer-outline" label="Duration" value={getDurationLabel(r.duration)} color="#d97706" fg={fg} muted={muted} subtle={subtle} />
                    <View style={[styles.detailDivider, { backgroundColor: border }]} />
                    <DetailRow icon="calendar-number-outline" label="Span" value={`${span} day${span !== 1 ? "s" : ""}`} color="#0ea5e9" fg={fg} muted={muted} subtle={subtle} />
                </View>

                {/* ── Reason (manager) ── */}
                {isManager && !!r.reason && (
                    <TouchableOpacity
                        style={[styles.reasonBox, { backgroundColor: subtle, borderColor: border }]}
                        onPress={() => Alert.alert(`${employeeName}'s Reason`, r.reason)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="chatbubble-ellipses-outline" size={14} color="#6366f1" />
                        <Text style={[styles.reasonText, { color: muted }]} numberOfLines={2}>{r.reason}</Text>
                        <Ionicons name="chevron-forward" size={14} color={muted} style={{ flexShrink: 0 }} />
                    </TouchableOpacity>
                )}

                {/* ── Action buttons (manager, pending only) ── */}
                {isManager && r.status === "Pending" && (
                    <View style={styles.actionRow}>
                        <ActionButton
                            label="Approve"
                            icon="checkmark"
                            color="#059669"
                            bg="#d1fae5"
                            onPress={() => handleAction("Approved")}
                        />
                        <ActionButton
                            label="Reject"
                            icon="close"
                            color="#dc2626"
                            bg="#fee2e2"
                            onPress={() => handleAction("Rejected")}
                        />
                        <ActionButton
                            label="Cancel"
                            icon="ban-outline"
                            color="#6b7280"
                            bg={isDark ? "#374151" : "#f1f5f9"}
                            onPress={() => handleAction("Canceled")}
                        />
                    </View>
                )}

                {/* ── Allow cancel on approved too ── */}
                {isManager && r.status === "Approved" && (
                    <View style={styles.actionRow}>
                        <ActionButton
                            label="Cancel leave"
                            icon="ban-outline"
                            color="#6b7280"
                            bg={isDark ? "#374151" : "#f1f5f9"}
                            onPress={() => handleAction("Canceled")}
                            fullWidth
                        />
                    </View>
                )}
            </View>
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Small sub-components
// ─────────────────────────────────────────────────────────────────────────────
function DetailRow({
    icon, label, value, color, fg, muted, subtle,
}: {
    icon: string; label: string; value: string; color: string;
    fg: string; muted: string; subtle: string;
}) {
    return (
        <View style={styles.detailItem}>
            <View style={[styles.detailIconBox, { backgroundColor: color + "18" }]}>
                <Ionicons name={icon as any} size={14} color={color} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.detailLabel, { color: muted }]}>{label}</Text>
                <Text style={[styles.detailValue, { color: fg }]} numberOfLines={1}>{value}</Text>
            </View>
        </View>
    );
}

function ActionButton({
    label, icon, color, bg, onPress, fullWidth,
}: {
    label: string; icon: string; color: string; bg: string;
    onPress: () => void; fullWidth?: boolean;
}) {
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.75}
            style={[
                styles.actionBtn,
                { backgroundColor: bg },
                fullWidth && { flex: 1 },
            ]}
        >
            <Ionicons name={icon as any} size={14} color={color} />
            <Text style={[styles.actionBtnText, { color }]}>{label}</Text>
        </TouchableOpacity>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Summary panel (top)
// ─────────────────────────────────────────────────────────────────────────────
function SummaryPanel({
    totalCount, approved, pending, rejected, canceled, totalDays,
    leaveTypeBreakdown,
    card, border, fg, muted, subtle, isDark,
}: {
    totalCount: number; approved: number; pending: number;
    rejected: number; canceled: number; totalDays: number;
    leaveTypeBreakdown: [string, number][];
    card: string; border: string; fg: string; muted: string; subtle: string; isDark: boolean;
}) {
    const [showBreakdown, setShowBreakdown] = useState(false);
    const decided = approved + rejected;
    const appRate = decided > 0 ? Math.round((approved / decided) * 100) : null;
    const rateColor = appRate == null ? "#6b7280" : appRate >= 70 ? "#059669" : appRate >= 40 ? "#d97706" : "#dc2626";

    const stats = [
        { label: "Approved", value: approved, color: "#059669" },
        { label: "Pending", value: pending, color: "#d97706" },
        { label: "Rejected", value: rejected, color: "#dc2626" },
        { label: "Canceled", value: canceled, color: "#6b7280" },
    ];

    return (
        <View style={[styles.summaryCard, { backgroundColor: card, borderColor: border }]}>
            {/* Header row */}
            <View style={styles.summaryHeaderRow}>
                <View>
                    <Text style={[styles.summaryTitle, { color: fg }]}>Overview</Text>
                    <Text style={[styles.summarySub, { color: muted }]}>All leave requests</Text>
                </View>
                <View style={styles.totalChip}>
                    <Text style={styles.totalChipNum}>{totalCount}</Text>
                    <Text style={styles.totalChipLbl}>total</Text>
                </View>
            </View>

            {/* Stat grid */}
            <View style={[styles.statGrid, { borderTopColor: border }]}>
                {stats.map((s, i) => (
                    <View
                        key={i}
                        style={[
                            styles.statItem,
                            i < 3 && { borderRightWidth: 1, borderRightColor: border },
                        ]}
                    >
                        <Text style={[styles.statNum, { color: s.color }]}>{s.value}</Text>
                        <Text style={[styles.statLabel, { color: muted }]}>{s.label}</Text>
                    </View>
                ))}
            </View>

            {/* Metrics row */}
            <View style={[styles.metricsRow, { borderTopColor: border }]}>
                <View style={styles.metricItem}>
                    <Text style={[styles.metricNum, { color: "#6366f1" }]}>{totalDays}</Text>
                    <Text style={[styles.metricLabel, { color: muted }]}>Days requested</Text>
                </View>
                <View style={[styles.metricDivider, { backgroundColor: border }]} />
                {appRate !== null ? (
                    <View style={styles.metricItem}>
                        <Text style={[styles.metricNum, { color: rateColor }]}>{appRate}%</Text>
                        <Text style={[styles.metricLabel, { color: muted }]}>Approval rate</Text>
                    </View>
                ) : (
                    <View style={styles.metricItem}>
                        <Text style={[styles.metricNum, { color: muted }]}>—</Text>
                        <Text style={[styles.metricLabel, { color: muted }]}>Approval rate</Text>
                    </View>
                )}
                <View style={[styles.metricDivider, { backgroundColor: border }]} />
                <View style={styles.metricItem}>
                    <Text style={[styles.metricNum, { color: "#0ea5e9" }]}>{pending}</Text>
                    <Text style={[styles.metricLabel, { color: muted }]}>Awaiting action</Text>
                </View>
            </View>

            {/* Leave type breakdown toggle */}
            {leaveTypeBreakdown.length > 0 && (
                <>
                    <TouchableOpacity
                        style={[styles.breakdownToggle, { borderTopColor: border }]}
                        onPress={() => {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            setShowBreakdown(v => !v);
                        }}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="pie-chart-outline" size={14} color="#6366f1" />
                        <Text style={[styles.breakdownToggleText, { color: "#6366f1" }]}>
                            Leave type breakdown
                        </Text>
                        <Ionicons
                            name={showBreakdown ? "chevron-up" : "chevron-down"}
                            size={14} color="#6366f1"
                            style={{ marginLeft: "auto" }}
                        />
                    </TouchableOpacity>

                    {showBreakdown && (
                        <View style={[styles.breakdownBody, { borderTopColor: border }]}>
                            {leaveTypeBreakdown.map(([name, days], i) => {
                                const max = leaveTypeBreakdown[0][1];
                                const pct = Math.round((days / max) * 100);
                                const PALETTE = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];
                                const col = PALETTE[i % PALETTE.length];
                                return (
                                    <View key={name} style={styles.breakdownRow}>
                                        <View style={styles.breakdownLabelRow}>
                                            <View style={[styles.breakdownDot, { backgroundColor: col }]} />
                                            <Text style={[styles.breakdownName, { color: fg }]} numberOfLines={1}>{name}</Text>
                                            <Text style={[styles.breakdownDays, { color: col }]}>{days}d</Text>
                                        </View>
                                        <View style={[styles.barTrack, { backgroundColor: border }]}>
                                            <View style={[styles.barFill, { width: `${pct}%` as any, backgroundColor: col }]} />
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </>
            )}
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 16 },
    centered: { flex: 1, justifyContent: "center", alignItems: "center" },
    loadingText: { fontSize: 14, fontWeight: "500" },

    sectionHeading: {
        fontSize: 11, fontWeight: "700", letterSpacing: 1.2,
        textTransform: "uppercase", marginTop: 24, marginBottom: 10, paddingHorizontal: 2,
    },

    // Empty
    emptyWrap: {
        borderRadius: 16, borderWidth: 1,
        padding: 48, alignItems: "center", gap: 10, marginTop: 16,
    },
    emptyTitle: { fontSize: 16, fontWeight: "700" },
    emptyDesc: { fontSize: 14, textAlign: "center" },

    // ── Summary card ──────────────────────────────────────────
    summaryCard: {
        borderRadius: 18, borderWidth: 1,
        marginTop: 16, marginBottom: 0,
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
        overflow: "hidden",
    },
    summaryHeaderRow: {
        flexDirection: "row", alignItems: "center",
        justifyContent: "space-between",
        padding: 20,
    },
    summaryTitle: { fontSize: 18, fontWeight: "800", letterSpacing: -0.4 },
    summarySub: { fontSize: 13, marginTop: 2 },
    totalChip: {
        backgroundColor: "#6366f1", borderRadius: 12,
        paddingHorizontal: 14, paddingVertical: 8, alignItems: "center",
    },
    totalChipNum: { color: "#fff", fontSize: 20, fontWeight: "800" },
    totalChipLbl: { color: "rgba(255,255,255,0.8)", fontSize: 10, fontWeight: "700", textTransform: "uppercase" },

    statGrid: { flexDirection: "row", borderTopWidth: 1 },
    statItem: { flex: 1, alignItems: "center", paddingVertical: 16, gap: 4 },
    statNum: { fontSize: 20, fontWeight: "800" },
    statLabel: { fontSize: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 },

    metricsRow: {
        flexDirection: "row", alignItems: "center",
        borderTopWidth: 1, paddingVertical: 16,
    },
    metricItem: { flex: 1, alignItems: "center", gap: 4 },
    metricNum: { fontSize: 22, fontWeight: "800" },
    metricLabel: { fontSize: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4, textAlign: "center" },
    metricDivider: { width: 1, height: 36, flexShrink: 0 },

    breakdownToggle: {
        flexDirection: "row", alignItems: "center",
        gap: 8, borderTopWidth: 1,
        paddingHorizontal: 20, paddingVertical: 14,
    },
    breakdownToggleText: { fontSize: 13, fontWeight: "600" },

    breakdownBody: { borderTopWidth: 1, padding: 20, gap: 14 },
    breakdownRow: { gap: 7 },
    breakdownLabelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    breakdownDot: { width: 9, height: 9, borderRadius: 5 },
    breakdownName: { flex: 1, fontSize: 13, fontWeight: "600" },
    breakdownDays: { fontSize: 13, fontWeight: "700" },
    barTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
    barFill: { height: "100%", borderRadius: 3 },

    // ── Employee group card ───────────────────────────────────
    groupCard: {
        borderRadius: 16, borderWidth: 1, marginBottom: 12,
        shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
        overflow: "hidden",
    },
    groupHeader: {
        flexDirection: "row", alignItems: "center",
        padding: 16, gap: 12,
    },
    avatar: { width: 46, height: 46, borderRadius: 23, justifyContent: "center", alignItems: "center", flexShrink: 0 },
    avatarText: { color: "#fff", fontWeight: "700", fontSize: 15 },

    empName: { fontSize: 15, fontWeight: "700", letterSpacing: -0.2 },
    empMeta: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 2 },

    miniPill: {
        borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3,
    },
    miniPillText: { fontSize: 11, fontWeight: "600" },

    daysBadge: {
        borderRadius: 10, borderWidth: 1, flexShrink: 0,
        paddingHorizontal: 10, paddingVertical: 6, alignItems: "center",
    },
    daysBadgeNum: { fontSize: 16, fontWeight: "800" },
    daysBadgeLbl: { fontSize: 9, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },

    recordsList: { borderTopWidth: 1 },

    // ── Leave card ────────────────────────────────────────────
    leaveCard: { flexDirection: "row" },
    statusStripe: { width: 4, flexShrink: 0 },
    leaveCardInner: { flex: 1, paddingHorizontal: 16, paddingVertical: 16, gap: 14 },

    lcTopRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
    lcDateMain: { fontSize: 14, fontWeight: "700", letterSpacing: -0.2 },
    lcDateTo: { fontSize: 12, marginTop: 2 },

    statusBadge: {
        flexDirection: "row", alignItems: "center", gap: 5,
        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, flexShrink: 0,
    },
    statusText: { fontSize: 11, fontWeight: "700" },

    // Detail grid
    detailGrid: {
        flexDirection: "row",
        borderTopWidth: 1, borderBottomWidth: 1,
        paddingVertical: 14, gap: 0,
    },
    detailItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4 },
    detailIconBox: { width: 30, height: 30, borderRadius: 8, justifyContent: "center", alignItems: "center", flexShrink: 0 },
    detailLabel: { fontSize: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.3 },
    detailValue: { fontSize: 12, fontWeight: "700", marginTop: 2 },
    detailDivider: { width: 1, height: 32, alignSelf: "center", flexShrink: 0 },

    // Reason
    reasonBox: {
        flexDirection: "row", alignItems: "center",
        gap: 10, borderRadius: 10, borderWidth: 1,
        paddingHorizontal: 12, paddingVertical: 10,
    },
    reasonText: { flex: 1, fontSize: 13 },

    // Action buttons
    actionRow: { flexDirection: "row", gap: 8 },
    actionBtn: {
        flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: 5, borderRadius: 10,
        paddingVertical: 11, paddingHorizontal: 8,
    },
    actionBtnText: { fontSize: 13, fontWeight: "700" },
});