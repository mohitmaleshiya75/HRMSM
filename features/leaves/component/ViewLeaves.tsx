import React, { useMemo, useState, useRef } from "react";
// import React, { useMemo } from "react";
// import {
//     View,
//     Text,
//     StyleSheet,
//     ScrollView,
//     useColorScheme,
//     ActivityIndicator,
//     TouchableOpacity,
//     Alert,
//     Dimensions,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import useCurrentUser from "@/features/auth/hooks/useCurrentUser";
// import { useGetLeaves } from "../hooks/useGetLeaves";

// // ─────────────────────────────────────────────────────────────────────────────
// // Types
// // ─────────────────────────────────────────────────────────────────────────────
// type LeaveStatus = "Pending" | "Approved" | "Rejected" | "Canceled";
// type Duration    = "FULL" | "HALF_AM" | "HALF_PM";

// interface LeaveItem {
//     id: string;
//     employee: string;
//     employee_name: string;
//     leave_type_name: string;
//     reason: string;
//     duration: Duration;
//     leave_type: string;
//     start_date: string;
//     end_date: string;
//     status: LeaveStatus;
// }

// interface GroupedData {
//     [employee_id: string]: {
//         employee_name: string;
//         records: LeaveItem[];
//     };
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Helpers
// // ─────────────────────────────────────────────────────────────────────────────
// const SCREEN_W = Dimensions.get("window").width;

// const formatDate = (d: string) =>
//     new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

// const getDurationLabel = (duration: Duration) => {
//     switch (duration) {
//         case "FULL":    return "Full Day";
//         case "HALF_AM": return "First Half";
//         case "HALF_PM": return "Second Half";
//         default:        return "N/A";
//     }
// };

// const getDurationDays = (duration: Duration) =>
//     duration === "FULL" ? 1 : 0.5;

// const calcTotalDays = (records: LeaveItem[]) =>
//     records.reduce((sum, r) => sum + getDurationDays(r.duration), 0);

// // ✅ Keys exactly match "Pending" | "Approved" | "Rejected" | "Canceled"
// const STATUS_CONFIG: Record<LeaveStatus, { color: string; icon: string; label: string }> = {
//     Approved: { color: "#10b981", icon: "checkmark-circle-outline", label: "Approved" },
//     Pending:  { color: "#f59e0b", icon: "time-outline",             label: "Pending"  },
//     Rejected: { color: "#ef4444", icon: "close-circle-outline",     label: "Rejected" },
//     Canceled: { color: "#6b7280", icon: "ban-outline",              label: "Canceled" },
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // Page wrapper
// // ─────────────────────────────────────────────────────────────────────────────
// export default function ViewLeaves() {
//     const { leaves, isLoading, totalCount } = useGetLeaves();
//     const { data: user } = useCurrentUser();
//     const scheme = useColorScheme();
//     const isDark = scheme === "dark";
//     const bg = isDark ? "#0f172a" : "#f3f4f6";

//     if (isLoading) {
//         return (
//             <View style={[styles.centered, { backgroundColor: bg }]}>
//                 <ActivityIndicator size="large" color="#6366f1" />
//                 <Text style={[styles.loadingText, { color: isDark ? "#9ca3af" : "#6b7280", marginTop: 12 }]}>
//                     Loading leaves…
//                 </Text>
//             </View>
//         );
//     }

//     return (
//         <LeavesScreen
//             leaves={leaves ?? []}
//             totalCount={totalCount ?? 0}
//             isManager={user?.role !== "Employee"}
//         />
//     );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Main screen
// // ─────────────────────────────────────────────────────────────────────────────
// function LeavesScreen({
//     leaves,
//     totalCount,
//     isManager,
// }: {
//     leaves: LeaveItem[];
//     totalCount: number;
//     isManager: boolean;
// }) {
//     const scheme = useColorScheme();
//     const isDark = scheme === "dark";

//     const bg      = isDark ? "#0f172a" : "#f3f4f6";
//     const card    = isDark ? "#1e293b" : "#ffffff";
//     const border  = isDark ? "#374151" : "#e5e7eb";
//     const fg      = isDark ? "#ffffff" : "#111111";
//     const muted   = isDark ? "#9ca3af" : "#6b7280";
//     const accent  = "#6366f1";
//     const mutedBg = isDark ? "rgba(99,102,241,0.10)" : "rgba(99,102,241,0.06)";

//     // ── Global counts (using correct casing) ─────────────────
//     const approved = leaves.filter(l => l.status === "Approved").length;
//     const pending  = leaves.filter(l => l.status === "Pending").length;
//     const rejected = leaves.filter(l => l.status === "Rejected").length;
//     const canceled = leaves.filter(l => l.status === "Canceled").length;
//     const totalDaysAll = calcTotalDays(leaves);

//     // ── Leave-type breakdown for insights ────────────────────
//     const leaveTypeBreakdown = useMemo(() => {
//         const map: Record<string, number> = {};
//         leaves.forEach(l => {
//             map[l.leave_type_name] = (map[l.leave_type_name] ?? 0) + getDurationDays(l.duration);
//         });
//         return Object.entries(map).sort((a, b) => b[1] - a[1]);
//     }, [leaves]);

//     // ── Group by employee ────────────────────────────────────
//     const groupedData: GroupedData = useMemo(
//         () =>
//             leaves.reduce((acc, r) => {
//                 if (!acc[r.employee])
//                     acc[r.employee] = { employee_name: r.employee_name, records: [] };
//                 acc[r.employee].records.push(r);
//                 return acc;
//             }, {} as GroupedData),
//         [leaves]
//     );

//     const employees = Object.entries(groupedData);

//     // ── Empty state ──────────────────────────────────────────
//     if (employees.length === 0) {
//         return (
//             <ScrollView style={[styles.container, { backgroundColor: bg }]}>
//                 <GlobalSummary
//                     total={totalCount} approved={approved} pending={pending}
//                     rejected={rejected} canceled={canceled} totalDays={totalDaysAll}
//                     leaveTypeBreakdown={leaveTypeBreakdown}
//                     card={card} border={border} fg={fg} muted={muted} accent={accent}
//                 />
//                 <View style={[styles.emptyCard, { backgroundColor: card, borderColor: border }]}>
//                     <View style={[styles.emptyIconWrap, { backgroundColor: mutedBg }]}>
//                         <Ionicons name="document-text-outline" size={32} color={accent} />
//                     </View>
//                     <Text style={[styles.emptyTitle, { color: fg }]}>No Leave Records</Text>
//                     <Text style={[styles.emptyDesc, { color: muted }]}>
//                         No leave requests have been submitted for this period.
//                     </Text>
//                 </View>
//             </ScrollView>
//         );
//     }

//     return (
//         <ScrollView
//             style={[styles.container, { backgroundColor: bg }]}
//             showsVerticalScrollIndicator={false}
//         >
//             {/* ── Global summary + insights ─────────────────── */}
//             <GlobalSummary
//                 total={totalCount} approved={approved} pending={pending}
//                 rejected={rejected} canceled={canceled} totalDays={totalDaysAll}
//                 leaveTypeBreakdown={leaveTypeBreakdown}
//                 card={card} border={border} fg={fg} muted={muted} accent={accent}
//             />

//             {/* ── Per-employee groups ────────────────────────── */}
//             {employees.map(([id, emp]) => {
//                 const empDays   = calcTotalDays(emp.records);
//                 const appCount  = emp.records.filter(r => r.status === "Approved").length;
//                 const pendCount = emp.records.filter(r => r.status === "Pending").length;
//                 const rejCount  = emp.records.filter(r => r.status === "Rejected").length;
//                 const canCount  = emp.records.filter(r => r.status === "Canceled").length;
//                 const leaveTypes = [...new Set(emp.records.map(r => r.leave_type_name))];

//                 const decisionCount = appCount + rejCount;
//                 const empApprRate   = decisionCount > 0
//                     ? Math.round((appCount / decisionCount) * 100)
//                     : null;
//                 const empBarColor = empApprRate === null ? "#6b7280"
//                     : empApprRate >= 70 ? "#10b981"
//                     : empApprRate >= 40 ? "#f59e0b"
//                     : "#ef4444";

//                 // Build pill list — add Canceled only when present
//                 const pills = [
//                     { label: "Total",    value: emp.records.length, color: "#6366f1" },
//                     { label: "Approved", value: appCount,            color: "#10b981" },
//                     { label: "Pending",  value: pendCount,           color: "#f59e0b" },
//                     { label: "Rejected", value: rejCount,            color: "#ef4444" },
//                     ...(canCount > 0 ? [{ label: "Canceled", value: canCount, color: "#6b7280" }] : []),
//                 ];

//                 return (
//                     <View key={id}>
//                         {/* ── Employee header card ──────────────── */}
//                         <View style={[styles.employeeHeaderCard, { backgroundColor: card, borderColor: border }]}>

//                             {/* Avatar + name */}
//                             <View style={styles.empRow}>
//                                 <View style={[styles.avatar, { backgroundColor: accent }]}>
//                                     <Text style={styles.avatarText}>
//                                         {emp.employee_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
//                                     </Text>
//                                 </View>
//                                 <View style={{ flex: 1, minWidth: 0 }}>
//                                     <Text style={[styles.empName, { color: fg }]} numberOfLines={1}>
//                                         {emp.employee_name}
//                                     </Text>
//                                     <Text style={[styles.empSub, { color: muted }]}>
//                                         {emp.records.length} request{emp.records.length !== 1 ? "s" : ""} · {empDays} day{empDays !== 1 ? "s" : ""}
//                                     </Text>
//                                 </View>
//                                 <View style={[styles.daysBadge, { backgroundColor: accent + "18", borderColor: accent + "30" }]}>
//                                     <Text style={[styles.daysBadgeNum, { color: accent }]}>{empDays}</Text>
//                                     <Text style={[styles.daysBadgeLbl, { color: accent }]}>days</Text>
//                                 </View>
//                             </View>

//                             {/* Leave type tags */}
//                             {leaveTypes.length > 0 && (
//                                 <View style={styles.tagRow}>
//                                     {leaveTypes.map((lt, i) => (
//                                         <View key={i} style={[styles.typeTag, { backgroundColor: mutedBg, borderColor: border }]}>
//                                             <Ionicons name="briefcase-outline" size={10} color={accent} />
//                                             <Text style={[styles.typeTagText, { color: muted }]}>{lt}</Text>
//                                         </View>
//                                     ))}
//                                 </View>
//                             )}

//                             {/* Stat pills — flex-wrap, responsive */}
//                             <View style={styles.pillRow}>
//                                 {pills.map((p, i) => (
//                                     <View
//                                         key={i}
//                                         style={[
//                                             styles.pill,
//                                             { backgroundColor: p.color + "18", borderColor: p.color + "30" },
//                                         ]}
//                                     >
//                                         <Text style={[styles.pillValue, { color: p.color }]}>{p.value}</Text>
//                                         <Text style={[styles.pillLabel, { color: muted }]}>{p.label}</Text>
//                                     </View>
//                                 ))}
//                             </View>

//                             {/* Per-employee approval rate bar */}
//                             {empApprRate !== null && (
//                                 <View style={styles.progressSection}>
//                                     <View style={styles.progressHeader}>
//                                         <Text style={[styles.progressLabel, { color: muted }]}>Approval rate</Text>
//                                         <Text style={[styles.progressPct, { color: empBarColor }]}>{empApprRate}%</Text>
//                                     </View>
//                                     <View style={[styles.progressTrack, { backgroundColor: border }]}>
//                                         <View
//                                             style={[
//                                                 styles.progressFill,
//                                                 { width: `${empApprRate}%` as any, backgroundColor: empBarColor },
//                                             ]}
//                                         />
//                                     </View>
//                                     <Text style={[styles.progressHint, { color: muted }]}>
//                                         {appCount} of {decisionCount} decided
//                                         {pendCount > 0 ? ` · ${pendCount} pending` : ""}
//                                         {canCount  > 0 ? ` · ${canCount} canceled` : ""}
//                                     </Text>
//                                 </View>
//                             )}
//                         </View>

//                         {/* ── Section label ─────────────────────── */}
//                         <View style={styles.recordsTitleRow}>
//                             <Ionicons name="list-outline" size={16} color={accent} style={{ marginRight: 6 }} />
//                             <Text style={[styles.recordsTitle, { color: muted }]}>Leave Requests</Text>
//                         </View>

//                         {/* ── Individual cards ──────────────────── */}
//                         {emp.records.map((r: LeaveItem) => {
//                             const sc       = STATUS_CONFIG[r.status] ?? STATUS_CONFIG["Pending"];
//                             const durLabel = getDurationLabel(r.duration);
//                             const start    = new Date(r.start_date);
//                             const end      = new Date(r.end_date);
//                             const spanDays = Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1;
//                             const isSameDay = r.start_date === r.end_date;

//                             return (
//                                 <View
//                                     key={r.id}
//                                     style={[
//                                         styles.recordCard,
//                                         { backgroundColor: card, borderColor: border, borderLeftColor: sc.color },
//                                     ]}
//                                 >
//                                     {/* Date + status badge */}
//                                     <View style={styles.recordTopRow}>
//                                         <View style={[styles.recordDateRow, { flex: 1 }]}>
//                                             <View style={[styles.recordIconBox, { backgroundColor: mutedBg }]}>
//                                                 <Ionicons name="calendar-outline" size={13} color={accent} />
//                                             </View>
//                                             <View style={{ flex: 1, minWidth: 0 }}>
//                                                 <Text style={[styles.recordDateMain, { color: fg }]} numberOfLines={1}>
//                                                     {formatDate(r.start_date)}
//                                                 </Text>
//                                                 {!isSameDay && (
//                                                     <Text style={[styles.recordDateSub, { color: muted }]} numberOfLines={1}>
//                                                         → {formatDate(r.end_date)}
//                                                     </Text>
//                                                 )}
//                                             </View>
//                                         </View>
//                                         <View style={[styles.statusBadge, { backgroundColor: sc.color + "18" }]}>
//                                             <Ionicons name={sc.icon as any} size={11} color={sc.color} />
//                                             <Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text>
//                                         </View>
//                                     </View>

//                                     {/* Info grid: Type · Duration · Span */}
//                                     <View style={[styles.infoGrid, { borderTopColor: border }]}>
//                                         <View style={styles.infoItem}>
//                                             <View style={[styles.infoIconBox, { backgroundColor: accent + "15" }]}>
//                                                 <Ionicons name="briefcase-outline" size={13} color={accent} />
//                                             </View>
//                                             <View style={{ flex: 1, minWidth: 0 }}>
//                                                 <Text style={[styles.infoLabel, { color: muted }]}>Type</Text>
//                                                 <Text style={[styles.infoValue, { color: fg }]} numberOfLines={1}>
//                                                     {r.leave_type_name}
//                                                 </Text>
//                                             </View>
//                                         </View>

//                                         <View style={[styles.infoDivider, { backgroundColor: border }]} />

//                                         <View style={styles.infoItem}>
//                                             <View style={[styles.infoIconBox, { backgroundColor: "#f59e0b15" }]}>
//                                                 <Ionicons name="timer-outline" size={13} color="#f59e0b" />
//                                             </View>
//                                             <View>
//                                                 <Text style={[styles.infoLabel, { color: muted }]}>Duration</Text>
//                                                 <Text style={[styles.infoValue, { color: "#f59e0b" }]}>{durLabel}</Text>
//                                             </View>
//                                         </View>

//                                         <View style={[styles.infoDivider, { backgroundColor: border }]} />

//                                         <View style={styles.infoItem}>
//                                             <View style={[styles.infoIconBox, { backgroundColor: "#3b82f615" }]}>
//                                                 <Ionicons name="calendar-number-outline" size={13} color="#3b82f6" />
//                                             </View>
//                                             <View>
//                                                 <Text style={[styles.infoLabel, { color: muted }]}>Span</Text>
//                                                 <Text style={[styles.infoValue, { color: "#3b82f6" }]}>
//                                                     {isSameDay ? "1 day" : `${spanDays} days`}
//                                                 </Text>
//                                             </View>
//                                         </View>
//                                     </View>

//                                     {/* Reason (managers only) */}
//                                     {isManager && !!r.reason && (
//                                         <TouchableOpacity
//                                             style={[styles.reasonRow, { borderTopColor: border, backgroundColor: mutedBg }]}
//                                             onPress={() => Alert.alert(`${emp.employee_name}'s Reason`, r.reason)}
//                                             activeOpacity={0.7}
//                                         >
//                                             <Ionicons name="chatbubble-ellipses-outline" size={13} color={accent} />
//                                             <Text style={[styles.reasonLabel, { color: muted }]}>Reason</Text>
//                                             <Text style={[styles.reasonPreview, { color: fg }]} numberOfLines={1}>
//                                                 {r.reason}
//                                             </Text>
//                                             <Ionicons name="chevron-forward" size={13} color={muted} />
//                                         </TouchableOpacity>
//                                     )}
//                                 </View>
//                             );
//                         })}

//                         <View style={{ height: 8 }} />
//                     </View>
//                 );
//             })}

//             <View style={{ height: 32 }} />
//         </ScrollView>
//     );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Global summary + insights
// // ─────────────────────────────────────────────────────────────────────────────
// function GlobalSummary({
//     total, approved, pending, rejected, canceled, totalDays,
//     leaveTypeBreakdown,
//     card, border, fg, muted, accent,
// }: {
//     total: number; approved: number; pending: number;
//     rejected: number; canceled: number; totalDays: number;
//     leaveTypeBreakdown: [string, number][];
//     card: string; border: string; fg: string; muted: string; accent: string;
// }) {
//     const decided      = approved + rejected;
//     const approvalRate = decided > 0 ? Math.round((approved / decided) * 100) : null;
//     const resolution   = total   > 0 ? Math.round(((approved + rejected + canceled) / total) * 100) : 0;

//     const barColor = approvalRate === null ? "#6b7280"
//         : approvalRate >= 70 ? "#10b981"
//         : approvalRate >= 40 ? "#f59e0b"
//         : "#ef4444";

//     return (
//         <View style={[styles.summaryCard, { backgroundColor: card, borderColor: border }]}>

//             {/* Header */}
//             <View style={styles.summaryHeader}>
//                 <View style={[styles.summaryIconWrap, { backgroundColor: accent + "18" }]}>
//                     <Ionicons name="document-text-outline" size={20} color={accent} />
//                 </View>
//                 <View style={{ flex: 1, minWidth: 0 }}>
//                     <Text style={[styles.summaryTitle, { color: fg }]}>Leave Overview</Text>
//                     <Text style={[styles.summarySub, { color: muted }]}>All recorded leave requests</Text>
//                 </View>
//                 <View style={[styles.totalBadge, { backgroundColor: accent + "18", borderColor: accent + "30" }]}>
//                     <Text style={[styles.totalBadgeNum, { color: accent }]}>{total}</Text>
//                     <Text style={[styles.totalBadgeLbl, { color: accent }]}>Total</Text>
//                 </View>
//             </View>

//             {/* 4-stat row with dividers */}
//             <View style={[styles.summaryStatRow, { borderTopColor: border, borderBottomColor: border }]}>
//                 {([
//                     { label: "Approved", value: approved, color: "#10b981", icon: "checkmark-circle" },
//                     { label: "Pending",  value: pending,  color: "#f59e0b", icon: "time"             },
//                     { label: "Rejected", value: rejected, color: "#ef4444", icon: "close-circle"     },
//                     { label: "Canceled", value: canceled, color: "#6b7280", icon: "ban"              },
//                 ] as const).map((s, i) => (
//                     <View
//                         key={i}
//                         style={[
//                             styles.summaryStat,
//                             i < 3 && { borderRightWidth: 1, borderRightColor: border },
//                         ]}
//                     >
//                         <Ionicons name={s.icon as any} size={16} color={s.color} />
//                         <Text style={[styles.summaryStatNum, { color: s.color }]}>{s.value}</Text>
//                         <Text style={[styles.summaryStatLabel, { color: muted }]}>{s.label}</Text>
//                     </View>
//                 ))}
//             </View>

//             {/* ── Insights ────────────────────────────────────── */}
//             <View style={styles.insightsSection}>
//                 <Text style={[styles.insightsSectionTitle, { color: muted }]}>Insights</Text>

//                 {/* 2-column metric cards */}
//                 <View style={styles.insightRow}>
//                     <View style={[styles.insightCard, { backgroundColor: accent + "12", borderColor: accent + "25" }]}>
//                         <Ionicons name="calendar-outline" size={15} color={accent} />
//                         <Text style={[styles.insightNum, { color: accent }]}>{totalDays}</Text>
//                         <Text style={[styles.insightLbl, { color: muted }]}>Total days{"\n"}requested</Text>
//                     </View>
//                     <View style={[styles.insightCard, { backgroundColor: "#3b82f612", borderColor: "#3b82f625" }]}>
//                         <Ionicons name="checkmark-done-outline" size={15} color="#3b82f6" />
//                         <Text style={[styles.insightNum, { color: "#3b82f6" }]}>{resolution}%</Text>
//                         <Text style={[styles.insightLbl, { color: muted }]}>Resolution{"\n"}rate</Text>
//                     </View>
//                 </View>

//                 {/* Pending action alert */}
//                 {pending > 0 && (
//                     <View style={[styles.alertRow, { backgroundColor: "#f59e0b12", borderColor: "#f59e0b30" }]}>
//                         <Ionicons name="alert-circle-outline" size={15} color="#f59e0b" />
//                         <Text style={[styles.alertText, { color: "#f59e0b" }]}>
//                             {pending} request{pending !== 1 ? "s" : ""} awaiting action
//                         </Text>
//                     </View>
//                 )}

//                 {/* Approval rate bar */}
//                 {approvalRate !== null && (
//                     <View style={styles.rateBlock}>
//                         <View style={styles.rateHeader}>
//                             <Text style={[styles.rateLabel, { color: muted }]}>Approval rate (decided only)</Text>
//                             <Text style={[styles.ratePct, { color: barColor }]}>{approvalRate}%</Text>
//                         </View>
//                         <View style={[styles.rateTrack, { backgroundColor: border }]}>
//                             <View style={[styles.rateFill, { width: `${approvalRate}%` as any, backgroundColor: barColor }]} />
//                         </View>
//                         <Text style={[styles.rateHint, { color: muted }]}>
//                             {approved} of {decided} decided approved
//                             {pending > 0 ? ` · ${pending} pending excluded` : ""}
//                         </Text>
//                     </View>
//                 )}

//                 {/* Leave type breakdown */}
//                 {leaveTypeBreakdown.length > 0 && (
//                     <View style={styles.breakdownBlock}>
//                         <Text style={[styles.breakdownTitle, { color: muted }]}>Leave type breakdown (days)</Text>
//                         {leaveTypeBreakdown.map(([name, days], i) => {
//                             const maxDays = leaveTypeBreakdown[0][1];
//                             const pct     = Math.round((days / maxDays) * 100);
//                             const colors  = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6"];
//                             const col     = colors[i % colors.length];
//                             return (
//                                 <View key={name} style={styles.breakdownItem}>
//                                     <View style={styles.breakdownLabelRow}>
//                                         <View style={[styles.breakdownDot, { backgroundColor: col }]} />
//                                         <Text style={[styles.breakdownName, { color: fg }]} numberOfLines={1}>{name}</Text>
//                                         <Text style={[styles.breakdownDays, { color: col }]}>
//                                             {days} day{days !== 1 ? "s" : ""}
//                                         </Text>
//                                     </View>
//                                     <View style={[styles.breakdownTrack, { backgroundColor: border }]}>
//                                         <View style={[styles.breakdownFill, { width: `${pct}%` as any, backgroundColor: col }]} />
//                                     </View>
//                                 </View>
//                             );
//                         })}
//                     </View>
//                 )}
//             </View>
//         </View>
//     );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Styles
// // ─────────────────────────────────────────────────────────────────────────────
// // Pill width: share the card width (screen - 32px padding - 36px card padding) across 4 items
// const PILL_W = (SCREEN_W - 32 - 36 - 24) / 4; // 24 = 3 gaps of 8

// const styles = StyleSheet.create({
//     container:   { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
//     centered:    { flex: 1, justifyContent: "center", alignItems: "center" },
//     loadingText: { fontSize: 14, fontWeight: "600" },

//     // ── Empty ─────────────────────────────────────────────────
//     emptyCard: {
//         borderRadius: 14, padding: 36, borderWidth: 1,
//         alignItems: "center", marginTop: 16, gap: 10,
//     },
//     emptyIconWrap: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center" },
//     emptyTitle: { fontSize: 16, fontWeight: "700" },
//     emptyDesc:  { fontSize: 13, textAlign: "center" },

//     // ── Summary card ──────────────────────────────────────────
//     summaryCard: {
//         borderRadius: 16, borderWidth: 1,
//         marginTop: 8, marginBottom: 4,
//         shadowColor: "#000",
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.07, shadowRadius: 4, elevation: 3,
//         overflow: "hidden",
//     },
//     summaryHeader: {
//         flexDirection: "row", alignItems: "center",
//         gap: 12, padding: 16, paddingBottom: 14,
//     },
//     summaryIconWrap: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center", flexShrink: 0 },
//     summaryTitle:    { fontSize: 15, fontWeight: "700", letterSpacing: -0.3 },
//     summarySub:      { fontSize: 12, marginTop: 1 },
//     totalBadge: {
//         borderRadius: 10, borderWidth: 1, flexShrink: 0,
//         paddingHorizontal: 12, paddingVertical: 6, alignItems: "center",
//     },
//     totalBadgeNum: { fontSize: 18, fontWeight: "800" },
//     totalBadgeLbl: { fontSize: 9, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },

//     summaryStatRow: {
//         flexDirection: "row",
//         borderTopWidth: 1, borderBottomWidth: 1,
//     },
//     summaryStat: { flex: 1, alignItems: "center", paddingVertical: 12, gap: 3 },
//     summaryStatNum:   { fontSize: 17, fontWeight: "800" },
//     summaryStatLabel: { fontSize: 9, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 },

//     // ── Insights ──────────────────────────────────────────────
//     insightsSection: { padding: 14, gap: 12 },
//     insightsSectionTitle: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: -4 },

//     insightRow: { flexDirection: "row", gap: 10 },
//     insightCard: {
//         flex: 1, borderRadius: 10, borderWidth: 1,
//         alignItems: "center", paddingVertical: 14, gap: 4,
//     },
//     insightNum: { fontSize: 22, fontWeight: "800" },
//     insightLbl: { fontSize: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.3, textAlign: "center" },

//     alertRow: {
//         flexDirection: "row", alignItems: "center",
//         gap: 8, borderRadius: 10, borderWidth: 1,
//         paddingHorizontal: 12, paddingVertical: 10,
//     },
//     alertText: { fontSize: 13, fontWeight: "600", flex: 1 },

//     rateBlock: { gap: 6 },
//     rateHeader: { flexDirection: "row", justifyContent: "space-between" },
//     rateLabel:  { fontSize: 12, fontWeight: "600" },
//     ratePct:    { fontSize: 12, fontWeight: "700" },
//     rateHint:   { fontSize: 11, marginTop: -2 },
//     rateTrack:  { height: 8, borderRadius: 4, overflow: "hidden" },
//     rateFill:   { height: "100%", borderRadius: 4 },

//     breakdownBlock: { gap: 8 },
//     breakdownTitle: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 },
//     breakdownItem:  { gap: 5 },
//     breakdownLabelRow: { flexDirection: "row", alignItems: "center", gap: 7 },
//     breakdownDot:  { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
//     breakdownName: { flex: 1, fontSize: 12, fontWeight: "600" },
//     breakdownDays: { fontSize: 12, fontWeight: "700", flexShrink: 0 },
//     breakdownTrack: { height: 5, borderRadius: 3, overflow: "hidden" },
//     breakdownFill:  { height: "100%", borderRadius: 3 },

//     // ── Employee header card ───────────────────────────────────
//     employeeHeaderCard: {
//         borderRadius: 14, padding: 16, borderWidth: 1,
//         marginTop: 16, marginBottom: 12,
//         shadowColor: "#000",
//         shadowOffset: { width: 0, height: 1 },
//         shadowOpacity: 0.05, shadowRadius: 2, elevation: 2,
//         gap: 14,
//     },
//     empRow: { flexDirection: "row", alignItems: "center", gap: 12 },
//     avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center", flexShrink: 0 },
//     avatarText: { color: "#fff", fontWeight: "700", fontSize: 15 },
//     empName: { fontSize: 15, fontWeight: "700", letterSpacing: -0.3 },
//     empSub:  { fontSize: 12, fontWeight: "400", marginTop: 2 },

//     daysBadge: {
//         borderRadius: 10, borderWidth: 1, flexShrink: 0,
//         paddingHorizontal: 10, paddingVertical: 5, alignItems: "center", minWidth: 50,
//     },
//     daysBadgeNum: { fontSize: 16, fontWeight: "800" },
//     daysBadgeLbl: { fontSize: 9, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },

//     tagRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
//     typeTag: {
//         flexDirection: "row", alignItems: "center", gap: 4,
//         borderRadius: 6, borderWidth: 1,
//         paddingHorizontal: 8, paddingVertical: 4,
//     },
//     typeTagText: { fontSize: 11, fontWeight: "600" },

//     // Pills: flex-wrap, min-width so they stay 4-per-row on normal screens
//     // but wrap to 2-per-row on small (< 360) screens naturally
//     pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
//     pill: {
//         minWidth: PILL_W,
//         flex: 1,
//         borderRadius: 10, borderWidth: 1,
//         paddingVertical: 10, paddingHorizontal: 4,
//         alignItems: "center",
//     },
//     pillValue: { fontSize: 15, fontWeight: "800", letterSpacing: -0.3 },
//     pillLabel: { fontSize: 9, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4, marginTop: 2 },

//     // ── Progress ──────────────────────────────────────────────
//     progressSection: { gap: 5 },
//     progressHeader:  { flexDirection: "row", justifyContent: "space-between" },
//     progressLabel:   { fontSize: 12, fontWeight: "600" },
//     progressPct:     { fontSize: 12, fontWeight: "700" },
//     progressHint:    { fontSize: 11 },
//     progressTrack:   { height: 8, borderRadius: 4, overflow: "hidden" },
//     progressFill:    { height: "100%", borderRadius: 4 },

//     // ── Records title ─────────────────────────────────────────
//     recordsTitleRow: { flexDirection: "row", alignItems: "center", marginBottom: 8, paddingHorizontal: 2 },
//     recordsTitle:    { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },

//     // ── Record card ───────────────────────────────────────────
//     recordCard: {
//         borderRadius: 12, borderWidth: 1, borderLeftWidth: 4,
//         marginBottom: 10, overflow: "hidden",
//         shadowColor: "#000",
//         shadowOffset: { width: 0, height: 1 },
//         shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
//     },
//     recordTopRow: {
//         flexDirection: "row", justifyContent: "space-between",
//         alignItems: "center", padding: 12, paddingBottom: 10, gap: 8,
//     },
//     recordDateRow:  { flexDirection: "row", alignItems: "center", gap: 8 },
//     recordIconBox:  { width: 28, height: 28, borderRadius: 8, justifyContent: "center", alignItems: "center", flexShrink: 0 },
//     recordDateMain: { fontSize: 13, fontWeight: "600" },
//     recordDateSub:  { fontSize: 11, marginTop: 1 },
//     statusBadge:    {
//         flexDirection: "row", alignItems: "center", gap: 4,
//         paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, flexShrink: 0,
//     },
//     statusText: { fontSize: 11, fontWeight: "700" },

//     // ── Info grid ─────────────────────────────────────────────
//     infoGrid: {
//         flexDirection: "row", alignItems: "center",
//         borderTopWidth: 1, paddingHorizontal: 10, paddingVertical: 11,
//     },
//     infoItem:    { flex: 1, flexDirection: "row", alignItems: "center", gap: 6, overflow: "hidden" },
//     infoIconBox: { width: 26, height: 26, borderRadius: 7, justifyContent: "center", alignItems: "center", flexShrink: 0 },
//     infoLabel:   { fontSize: 9, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.3 },
//     infoValue:   { fontSize: 12, fontWeight: "700", marginTop: 1 },
//     infoDivider: { width: 1, height: 28, marginHorizontal: 4, flexShrink: 0 },

//     // ── Reason row ────────────────────────────────────────────
//     reasonRow: {
//         flexDirection: "row", alignItems: "center",
//         borderTopWidth: 1, paddingHorizontal: 12, paddingVertical: 9,
//         gap: 6,
//     },
//     reasonLabel:   { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3, flexShrink: 0 },
//     reasonPreview: { fontSize: 12, flex: 1 },
// });
import React, { useMemo, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    useColorScheme,
    ActivityIndicator,
    TouchableOpacity,
    Modal,
    Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import useCurrentUser from "@/features/auth/hooks/useCurrentUser";
import { useGetLeaves } from "../hooks/useGetLeaves";
import { Stack, useRouter } from "expo-router";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type LeaveStatus = "Pending" | "Approved" | "Rejected" | "Canceled";
type Duration = "FULL" | "HALF_AM" | "HALF_PM";
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

interface DetailModalState {
    visible: boolean;
    leave?: LeaveItem;
    employeeName?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const getDurationLabel = (duration: Duration) => {
    switch (duration) {
        case "FULL": return "Full Day";
        case "FULL": return "Full Day";
        case "HALF_AM": return "First Half";
        case "HALF_PM": return "Second Half";
        default: return "N/A";
        default: return "N/A";
    }
};

const getDurationDays = (duration: Duration) => (duration === "FULL" ? 1 : 0.5);
const getDurationDays = (duration: Duration) => (duration === "FULL" ? 1 : 0.5);

const calcTotalDays = (records: LeaveItem[]) =>
    records.reduce((sum, r) => sum + getDurationDays(r.duration), 0);

const STATUS_CONFIG: Record<LeaveStatus, { color: string; icon: string; label: string }> = {
    Approved: { color: "#10b981", icon: "checkmark-circle-outline", label: "Approved" },
    Pending: { color: "#f59e0b", icon: "time-outline", label: "Pending" },
    Rejected: { color: "#ef4444", icon: "close-circle-outline", label: "Rejected" },
    Canceled: { color: "#6b7280", icon: "ban-outline", label: "Canceled" },
const STATUS_CONFIG: Record<LeaveStatus, { color: string; bg: string; icon: string; label: string }> = {
    Approved: { color: "#059669", bg: "#d1fae5", icon: "checkmark-circle", label: "Approved" },
    Pending:  { color: "#d97706", bg: "#fef3c7", icon: "time",             label: "Pending"  },
    Rejected: { color: "#dc2626", bg: "#fee2e2", icon: "close-circle",     label: "Rejected" },
    Canceled: { color: "#6b7280", bg: "#f3f4f6", icon: "ban",              label: "Canceled" },
};

// Initials helper
const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

// Avatar palette — deterministic by name
const AVATAR_COLORS = ["#6366f1","#0ea5e9","#10b981","#f59e0b","#ec4899","#8b5cf6"];
const avatarColor = (name: string) =>
    AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

// ─────────────────────────────────────────────────────────────────────────────
// Main Export
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
                isManager={user?.role !== "Employee"}
                isDark={isDark}
            />
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
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
}) {
    const scheme = useColorScheme();
    const isDark = scheme === "dark";
    const [detailModal, setDetailModal] = useState<DetailModalState>({ visible: false });

    // Theme colors
    const bg = isDark ? "#0f172a" : "#f3f4f6";
    const card = isDark ? "#1e293b" : "#ffffff";
    const border = isDark ? "#374151" : "#e5e7eb";
    const fg = isDark ? "#ffffff" : "#111111";
    const muted = isDark ? "#9ca3af" : "#6b7280";
    const accent = "#6366f1";
    const mutedBg = isDark ? "rgba(99,102,241,0.10)" : "rgba(99,102,241,0.06)";

    // Global stats
    const approved = leaves.filter(l => l.status === "Approved").length;
    const pending = leaves.filter(l => l.status === "Pending").length;
    const rejected = leaves.filter(l => l.status === "Rejected").length;
    const canceled = leaves.filter(l => l.status === "Canceled").length;
    const totalDaysAll = calcTotalDays(leaves);

    // Leave type breakdown
    const leaveTypeBreakdown = useMemo(() => {
        const map: Record<string, number> = {};
        leaves.forEach(l => { map[l.leave_type_name] = (map[l.leave_type_name] ?? 0) + getDurationDays(l.duration); });
        return Object.entries(map).sort((a, b) => b[1] - a[1]);
    }, [leaves]);

    // Group by employee
    const groupedData: GroupedData = useMemo(
        () => leaves.reduce((acc, r) => {
            if (!acc[r.employee]) acc[r.employee] = { employee_name: r.employee_name, records: [] };
            acc[r.employee].records.push(r);
            return acc;
        }, {} as GroupedData),
        [leaves]
    );

    const employees = Object.entries(groupedData);

    // Empty state
    if (employees.length === 0) {
        return (
            <ScrollView style={[styles.container, { backgroundColor: bg }]}>
                <GlobalSummary
                    total={totalCount}
                    approved={approved}
                    pending={pending}
                    rejected={rejected}
                    canceled={canceled}
                    totalDays={totalDaysAll}
                    leaveTypeBreakdown={leaveTypeBreakdown}
                    card={card}
                    border={border}
                    fg={fg}
                    muted={muted}
                    accent={accent}
                />
                <EmptyState card={card} border={border} fg={fg} muted={muted} accent={accent} />
            </ScrollView>
        );
    }

    return (
        <>
            <ScrollView style={[styles.container, { backgroundColor: bg }]} showsVerticalScrollIndicator={false}>
                {/* Global Summary */}
                <GlobalSummary
                    total={totalCount}
                    approved={approved}
                    pending={pending}
                    rejected={rejected}
                    canceled={canceled}
                    totalDays={totalDaysAll}
                    leaveTypeBreakdown={leaveTypeBreakdown}
                    card={card}
                    border={border}
                    fg={fg}
                    muted={muted}
                    accent={accent}
                />

                {/* Employee Groups */}
                {employees.map(([id, emp]) => (
                    <EmployeeLeaveGroup
                        key={id}
                        employee={emp}
                        isManager={isManager}
                        card={card}
                        border={border}
                        fg={fg}
                        muted={muted}
                        accent={accent}
                        mutedBg={mutedBg}
                        onViewDetails={(leave) =>
                            setDetailModal({
                                visible: true,
                                leave,
                                employeeName: emp.employee_name,
                            })
                        }
                    />
                ))}

                <View style={{ height: 32 }} />
            </ScrollView>

            {/* Detail Modal */}
            {detailModal.leave && (
                <LeaveDetailModal
                    visible={detailModal.visible}
                    leave={detailModal.leave}
                    employeeName={detailModal.employeeName}
                    isManager={isManager}
                    onClose={() => setDetailModal({ visible: false })}
                    card={card}
                    border={border}
                    fg={fg}
                    muted={muted}
                    accent={accent}
                />
            )}
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Employee Leave Group (compact view with See More)
// ─────────────────────────────────────────────────────────────────────────────
function EmployeeLeaveGroup({
    employee,
    isManager,
    card,
    border,
    fg,
    muted,
    accent,
    mutedBg,
    onViewDetails,
}: {
    employee: { employee_name: string; records: LeaveItem[] };
    isManager: boolean;
    card: string;
    border: string;
    fg: string;
    muted: string;
    accent: string;
    mutedBg: string;
    onViewDetails: (leave: LeaveItem) => void;
}) {
    const empDays = calcTotalDays(employee.records);
    const appCount = employee.records.filter(r => r.status === "Approved").length;
    const pendCount = employee.records.filter(r => r.status === "Pending").length;

    // Show only first 2 records, rest in modal
    const visibleRecords = employee.records.slice(0, 2);
    const hiddenCount = Math.max(0, employee.records.length - 2);

    return (
        <View>
            {/* Employee Header Card */}
            <EmployeeHeaderCard
                name={employee.employee_name}
                totalRecords={employee.records.length}
                totalDays={empDays}
                approved={appCount}
                pending={pendCount}
                accent={accent}
                card={card}
                border={border}
                fg={fg}
                muted={muted}
                mutedBg={mutedBg}
            />

            {/* Leave records section title */}
            <View style={styles.recordsTitleRow}>
                <Ionicons name="list-outline" size={16} color={accent} style={{ marginRight: 6 }} />
                <Text style={[styles.recordsTitle, { color: muted }]}>Recent Requests</Text>
            </View>

            {/* Visible records only */}
            {visibleRecords.map(r => (
                <LeaveRecordCard
                    key={r.id}
                    leave={r}
                    onViewMore={() => onViewDetails(r)}
                    card={card}
                    border={border}
                    fg={fg}
                    muted={muted}
                    accent={accent}
                    mutedBg={mutedBg}
                />
            ))}

            {/* View More Button */}
            {hiddenCount > 0 && (
                <TouchableOpacity
                    style={[styles.viewMoreBtn, { backgroundColor: accent + "12", borderColor: accent + "30" }]}
                    onPress={() => {
                        // Implement full list view or show all in modal
                    }}
                >
                    <Text style={[styles.viewMoreText, { color: accent }]}>
                        View {hiddenCount} more request{hiddenCount !== 1 ? "s" : ""}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={accent} />
                </TouchableOpacity>
            )}

            <View style={{ height: 12 }} />
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Employee Header Card (compact)
// ─────────────────────────────────────────────────────────────────────────────
function EmployeeHeaderCard({
    name,
    totalRecords,
    totalDays,
    approved,
    pending,
    accent,
    card,
    border,
    fg,
    muted,
    mutedBg,
}: {
    name: string;
    totalRecords: number;
    totalDays: number;
    approved: number;
    pending: number;
    accent: string;
    card: string;
    border: string;
    fg: string;
    muted: string;
    mutedBg: string;
}) {
    return (
        <View style={[styles.employeeHeaderCard, { backgroundColor: card, borderColor: border }]}>
            {/* Avatar + Name */}
            <View style={styles.empRow}>
                <View style={[styles.avatar, { backgroundColor: accent }]}>
                    <Text style={styles.avatarText}>
                        {name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.empName, { color: fg }]} numberOfLines={1}>
                        {name}
                    </Text>
                    <Text style={[styles.empSub, { color: muted }]}>
                        {totalRecords} request{totalRecords !== 1 ? "s" : ""} · {totalDays} day{totalDays !== 1 ? "s" : ""}
                    </Text>
                </View>
                <View style={[styles.daysBadge, { backgroundColor: accent + "18", borderColor: accent + "30" }]}>
                    <Text style={[styles.daysBadgeNum, { color: accent }]}>{totalDays}</Text>
                    <Text style={[styles.daysBadgeLbl, { color: accent }]}>days</Text>
                </View>
            </View>

            {/* Quick Stats */}
            <View style={styles.quickStatsRow}>
                <StatBadge label="Approved" value={approved} color="#10b981" />
                <StatBadge label="Pending" value={pending} color="#f59e0b" />
            </View>
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Leave Record Card (compact, with See More button)
// ─────────────────────────────────────────────────────────────────────────────
function LeaveRecordCard({
    leave,
    onViewMore,
    card,
    border,
    fg,
    muted,
    accent,
    mutedBg,
}: {
    leave: LeaveItem;
    onViewMore: () => void;
    card: string;
    border: string;
    fg: string;
    muted: string;
    accent: string;
    mutedBg: string;
}) {
    const sc = STATUS_CONFIG[leave.status] ?? STATUS_CONFIG["Pending"];
    const isSameDay = leave.start_date === leave.end_date;

    return (
        <View style={[styles.recordCard, { backgroundColor: card, borderColor: border, borderLeftColor: sc.color }]}>
            {/* Date + Status */}
            <View style={styles.recordTopRow}>
                <View style={styles.recordDateRow}>
                    <View style={[styles.recordIconBox, { backgroundColor: mutedBg }]}>
                        <Ionicons name="calendar-outline" size={13} color={accent} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={[styles.recordDateMain, { color: fg }]} numberOfLines={1}>
                            {formatDate(leave.start_date)}
                        </Text>
                        {!isSameDay && (
                            <Text style={[styles.recordDateSub, { color: muted }]} numberOfLines={1}>
                                → {formatDate(leave.end_date)}
                            </Text>
                        )}
                    </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: sc.color + "18" }]}>
                    <Ionicons name={sc.icon as any} size={11} color={sc.color} />
                    <Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text>
                </View>
            </View>

            {/* Type & Duration */}
            <View style={[styles.compactInfoRow, { borderTopColor: border }]}>
                <View style={styles.infoColumn}>
                    <Text style={[styles.infoLabel, { color: muted }]}>Type</Text>
                    <Text style={[styles.infoValue, { color: fg }]} numberOfLines={1}>
                        {leave.leave_type_name}
                    </Text>
                </View>
                <View style={[styles.infoDivider, { backgroundColor: border }]} />
                <View style={styles.infoColumn}>
                    <Text style={[styles.infoLabel, { color: muted }]}>Duration</Text>
                    <Text style={[styles.infoValue, { color: "#f59e0b" }]}>
                        {getDurationLabel(leave.duration)}
                    </Text>
                </View>
            </View>

            {/* See More Button */}
            <TouchableOpacity
                style={[styles.seeMoreBtn, { borderTopColor: border, backgroundColor: mutedBg }]}
                onPress={onViewMore}
            >
                <Text style={[styles.seeMoreText, { color: accent }]}>See details</Text>
                <Ionicons name="chevron-forward" size={14} color={accent} />
            </TouchableOpacity>
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Leave Detail Modal
// ─────────────────────────────────────────────────────────────────────────────
function LeaveDetailModal({
    visible,
    leave,
    employeeName,
    isManager,
    onClose,
    card,
    border,
    fg,
    muted,
    accent,
}: {
    visible: boolean;
    leave: LeaveItem;
    employeeName?: string;
    isManager: boolean;
    onClose: () => void;
    card: string;
    border: string;
    fg: string;
    muted: string;
    accent: string;
}) {
    const sc = STATUS_CONFIG[leave.status] ?? STATUS_CONFIG["Pending"];
    const start = new Date(leave.start_date);
    const end = new Date(leave.end_date);
    const spanDays = Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1;
    const isSameDay = leave.start_date === leave.end_date;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
                <View style={[styles.modalContent, { backgroundColor: card }]}>
                    {/* Header */}
                    <View style={[styles.modalHeader, { borderBottomColor: border }]}>
                        <View>
                            <Text style={[styles.modalTitle, { color: fg }]}>Leave Request Details</Text>
                            <Text style={[styles.modalSub, { color: muted }]}>{employeeName}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color={fg} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                        {/* Status Section */}
                        <DetailSection label="Status">
                            <View style={[styles.statusBadge, { backgroundColor: sc.color + "18" }]}>
                                <Ionicons name={sc.icon as any} size={14} color={sc.color} />
                                <Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text>
                            </View>
                        </DetailSection>

                        {/* Dates Section */}
                        <DetailSection label="Dates">
                            <DetailRow icon="calendar-outline" label="Start" value={formatDate(leave.start_date)} color={accent} />
                            {!isSameDay && (
                                <DetailRow icon="calendar-outline" label="End" value={formatDate(leave.end_date)} color={accent} />
                            )}
                            <DetailRow icon="calendar-number-outline" label="Duration" value={`${isSameDay ? "1" : spanDays} day${isSameDay ? "" : "s"}`} color="#3b82f6" />
                        </DetailSection>

                        {/* Type & Duration Section */}
                        <DetailSection label="Details">
                            <DetailRow icon="briefcase-outline" label="Type" value={leave.leave_type_name} color={accent} />
                            <DetailRow icon="timer-outline" label="Duration" value={getDurationLabel(leave.duration)} color="#f59e0b" />
                        </DetailSection>

                        {/* Reason Section (Manager Only) */}
                        {isManager && leave.reason && (
                            <DetailSection label="Reason">
                                <View style={[styles.reasonBox, { backgroundColor: "#f59e0b12", borderColor: "#f59e0b30" }]}>
                                    <Text style={[styles.reasonText, { color: fg }]}>{leave.reason}</Text>
                                </View>
                            </DetailSection>
                        )}
                    </ScrollView>

                    {/* Close Button */}
                    <TouchableOpacity
                        style={[styles.modalCloseBtn, { backgroundColor: accent }]}
                        onPress={onClose}
                    >
                        <Text style={styles.modalCloseBtnText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Global Summary (simplified)
// ─────────────────────────────────────────────────────────────────────────────
function GlobalSummary({
    total,
    approved,
    pending,
    rejected,
    canceled,
    totalDays,
    leaveTypeBreakdown,
    card,
    border,
    fg,
    muted,
    accent,
}: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    canceled: number;
    totalDays: number;
    leaveTypeBreakdown: [string, number][];
    card: string;
    border: string;
    fg: string;
    muted: string;
    accent: string;
}) {
    const decided = approved + rejected;
    const approvalRate = decided > 0 ? Math.round((approved / decided) * 100) : null;

    const barColor =
        approvalRate === null ? "#6b7280" : approvalRate >= 70 ? "#10b981" : approvalRate >= 40 ? "#f59e0b" : "#ef4444";

    return (
        <View style={[styles.summaryCard, { backgroundColor: card, borderColor: border }]}>
            {/* Header */}
            <View style={styles.summaryHeader}>
                <View style={[styles.summaryIconWrap, { backgroundColor: accent + "18" }]}>
                    <Ionicons name="document-text-outline" size={20} color={accent} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.summaryTitle, { color: fg }]}>Leave Overview</Text>
                    <Text style={[styles.summarySub, { color: muted }]}>{total} total requests</Text>
                </View>
            </View>

            {/* Stats Row */}
            <View style={[styles.summaryStatsRow, { borderTopColor: border, borderBottomColor: border }]}>
                <CompactStat label="Approved" value={approved} color="#10b981" />
                <View style={[styles.statDivider, { backgroundColor: border }]} />
                <CompactStat label="Pending" value={pending} color="#f59e0b" />
                <View style={[styles.statDivider, { backgroundColor: border }]} />
                <CompactStat label="Rejected" value={rejected} color="#ef4444" />
            </View>

            {/* Insights */}
            {approvalRate !== null && (
                <View style={styles.insightSection}>
                    <View style={styles.insightRow}>
                        <Text style={[styles.insightLabel, { color: muted }]}>Approval Rate</Text>
                        <Text style={[styles.insightValue, { color: barColor }]}>{approvalRate}%</Text>
                    </View>
                    <View style={[styles.progressTrack, { backgroundColor: border }]}>
                        <View style={[styles.progressFill, { width: `${approvalRate}%` as any, backgroundColor: barColor }]} />
                    </View>
                </View>
            )}

            {/* Leave Type Breakdown */}
            {leaveTypeBreakdown.length > 0 && (
                <View style={styles.breakdownSection}>
                    <Text style={[styles.breakdownTitle, { color: muted }]}>By Type</Text>
                    {leaveTypeBreakdown.map(([name, days], i) => {
                        const colors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6"];
                        const col = colors[i % colors.length];
                        return (
                            <View key={name} style={styles.breakdownRow}>
                                <View style={[styles.breakdownDot, { backgroundColor: col }]} />
                                <Text style={[styles.breakdownName, { color: fg }]} numberOfLines={1}>
                                    {name}
                                </Text>
                                <Text style={[styles.breakdownValue, { color: col }]}>
                                    {days} day{days !== 1 ? "s" : ""}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            )}
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty State
// ─────────────────────────────────────────────────────────────────────────────
function EmptyState({ card, border, fg, muted, accent }: any) {
    return (
        <View style={[styles.emptyCard, { backgroundColor: card, borderColor: border }]}>
            <View style={[styles.emptyIconWrap, { backgroundColor: accent + "12" }]}>
                <Ionicons name="document-text-outline" size={32} color={accent} />
            </View>
            <Text style={[styles.emptyTitle, { color: fg }]}>No Leave Records</Text>
            <Text style={[styles.emptyDesc, { color: muted }]}>No leave requests found for this period.</Text>
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Reusable Components
// ─────────────────────────────────────────────────────────────────────────────
function StatBadge({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <View style={[styles.statBadge, { backgroundColor: color + "12", borderColor: color + "25" }]}>
            <Text style={[styles.statBadgeValue, { color }]}>{value}</Text>
            <Text style={[styles.statBadgeLabel, { color }]}>{label}</Text>
        </View>
    );
}

function CompactStat({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <View style={styles.compactStat}>
            <Text style={[styles.compactStatValue, { color }]}>{value}</Text>
            <Text style={{ fontSize: 10, color, fontWeight: "600" }}>{label}</Text>
        </View>
    );
}

function DetailSection({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <View style={styles.detailSection}>
            <Text style={[styles.detailSectionLabel, { color: "#9ca3af" }]}>{label}</Text>
            {children}
        </View>
    );
}

function DetailRow({
    icon,
    label,
    value,
    color,
}: {
    icon: string;
    label: string;
    value: string;
    color: string;
}) {
    return (
        <View style={styles.detailRow}>
            <Ionicons name={icon as any} size={16} color={color} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: "#9ca3af", fontWeight: "600" }}>{label}</Text>
                <Text style={{ fontSize: 14, color: "#ffffff", fontWeight: "700", marginTop: 2 }}>{value}</Text>
            </View>
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
    centered: { flex: 1, justifyContent: "center", alignItems: "center" },
    loadingText: { fontSize: 14, fontWeight: "600" },

    // ── Empty State ───────────────────────────────────────────
    emptyCard: { borderRadius: 14, padding: 36, borderWidth: 1, alignItems: "center", marginTop: 16, gap: 10 },
    emptyIconWrap: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center" },
    emptyTitle: { fontSize: 16, fontWeight: "700" },
    emptyDesc: { fontSize: 13, textAlign: "center" },

    // ── Summary Card ──────────────────────────────────────────
    summaryCard: { borderRadius: 16, borderWidth: 1, marginTop: 8, marginBottom: 16, overflow: "hidden" },
    summaryHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
    summaryIconWrap: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
    summaryTitle: { fontSize: 15, fontWeight: "700" },
    summarySub: { fontSize: 12, marginTop: 2 },

    summaryStatsRow: { flexDirection: "row", borderTopWidth: 1, borderBottomWidth: 1 },
    compactStat: { flex: 1, alignItems: "center", paddingVertical: 14, gap: 3 },
    compactStatValue: { fontSize: 18, fontWeight: "800" },
    statDivider: { width: 1, height: 36 },

    insightSection: { padding: 14, gap: 8 },
    insightRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    insightLabel: { fontSize: 12, fontWeight: "600" },
    insightValue: { fontSize: 16, fontWeight: "800" },

    breakdownSection: { padding: 14, borderTopWidth: 1, gap: 10 },
    breakdownTitle: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 },
    breakdownRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    breakdownDot: { width: 8, height: 8, borderRadius: 4 },
    breakdownName: { flex: 1, fontSize: 12, fontWeight: "600" },
    breakdownValue: { fontSize: 12, fontWeight: "700" },

    // ── Employee Header ───────────────────────────────────────
    employeeHeaderCard: { borderRadius: 14, padding: 16, borderWidth: 1, marginTop: 16, marginBottom: 12, gap: 12 },
    empRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
    avatarText: { color: "#fff", fontWeight: "700", fontSize: 15 },
    empName: { fontSize: 15, fontWeight: "700" },
    empSub: { fontSize: 12, marginTop: 2 },
    daysBadge: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5, alignItems: "center" },
    daysBadgeNum: { fontSize: 16, fontWeight: "800" },
    daysBadgeLbl: { fontSize: 9, fontWeight: "700", textTransform: "uppercase" },

    quickStatsRow: { flexDirection: "row", gap: 10 },
    statBadge: { flex: 1, borderRadius: 10, borderWidth: 1, padding: 10, alignItems: "center", gap: 4 },
    statBadgeValue: { fontSize: 16, fontWeight: "800" },
    statBadgeLabel: { fontSize: 10, fontWeight: "700" },

    // ── Records ───────────────────────────────────────────────
    recordsTitleRow: { flexDirection: "row", alignItems: "center", marginBottom: 8, paddingHorizontal: 2 },
    recordsTitle: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },

    recordCard: { borderRadius: 12, borderWidth: 1, borderLeftWidth: 4, marginBottom: 10, overflow: "hidden" },
    recordTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12, gap: 8 },
    recordDateRow: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
    recordIconBox: { width: 28, height: 28, borderRadius: 8, justifyContent: "center", alignItems: "center" },
    recordDateMain: { fontSize: 13, fontWeight: "600" },
    recordDateSub: { fontSize: 11, marginTop: 1 },
    statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8 },
    statusText: { fontSize: 11, fontWeight: "700" },

    compactInfoRow: { flexDirection: "row", borderTopWidth: 1, paddingHorizontal: 10, paddingVertical: 10, gap: 0 },
    infoColumn: { flex: 1 },
    infoLabel: { fontSize: 10, fontWeight: "600", textTransform: "uppercase" },
    infoValue: { fontSize: 12, fontWeight: "700", marginTop: 3 },
    infoDivider: { width: 1, height: 32, marginHorizontal: 8 },

    seeMoreBtn: { borderTopWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, gap: 6 },
    seeMoreText: { fontSize: 13, fontWeight: "700" },

    viewMoreBtn: { marginHorizontal: -12, marginBottom: 0, borderRadius: 0, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, gap: 6, borderTopWidth: 1 },
    viewMoreText: { fontSize: 13, fontWeight: "700" },

    // ── Modal ─────────────────────────────────────────────────
    modalOverlay: { flex: 1, justifyContent: "flex-end" },
    modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "90%", overflow: "hidden" },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", padding: 16, borderBottomWidth: 1 },
    modalTitle: { fontSize: 18, fontWeight: "700" },
    modalSub: { fontSize: 13, marginTop: 4 },
    closeBtn: { padding: 8 },
    modalBody: { flex: 1, padding: 16, gap: 16 },
    modalCloseBtn: { paddingVertical: 14, alignItems: "center", margin: 16, borderRadius: 10 },
    modalCloseBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

    detailSection: { gap: 8 },
    detailSectionLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },
    detailRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 8 },

    reasonBox: { borderRadius: 10, borderWidth: 1, padding: 12 },
    reasonText: { fontSize: 13, lineHeight: 20 },

    progressTrack: { height: 8, borderRadius: 4, overflow: "hidden" },
    progressFill: { height: "100%", borderRadius: 4 },
});