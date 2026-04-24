import React, { useState } from "react";
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface Column<T> {
    header: string;
    accessor?: keyof T;
    cell?: (item: T) => React.ReactNode;
    size?: number;
}

interface ResponsiveTableProps<T> {
    columns: Column<T>[];
    data: T[];
    count?: number;
    showPagination?: boolean;
    pageSize?: number;
    title?: string;
    /** Icon name from Ionicons shown in the section header */
    headerIcon?: React.ComponentProps<typeof Ionicons>["name"];
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export function ResponsiveTable<T>({
    columns,
    data,
    count,
    showPagination = true,
    pageSize = 10,
    title,
    headerIcon = "list-outline",
}: ResponsiveTableProps<T>) {
    const scheme  = useColorScheme();
    const isDark  = scheme === "dark";
    const [pageIndex, setPageIndex] = useState(0);

    // ── Theme (identical tokens to dashboard) ──────────────────
    const bg      = isDark ? "#0f172a" : "#f3f4f6";
    const card    = isDark ? "#1e293b" : "#ffffff";
    const border  = isDark ? "#374151" : "#e5e7eb";
    const fg      = isDark ? "#ffffff" : "#111111";
    const muted   = isDark ? "#9ca3af" : "#6b7280";
    const accent  = "#10b981";
    const headerBg = isDark ? "#0f172a"                        : "#f8fafc";
    const rowAlt   = isDark ? "rgba(255,255,255,0.025)"        : "rgba(0,0,0,0.018)";
    const mutedBg  = isDark ? "rgba(16,185,129,0.10)"          : "rgba(16,185,129,0.06)";

    // ── Manual Pagination Logic ──────────────────────────────
    const totalCount = count ?? data.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    
    // If 'count' is provided, we assume data is already sliced (server-side)
    const visibleRows = count !== undefined 
        ? data 
        : data.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

    const canPrev     = pageIndex > 0;
    const canNext     = pageIndex < totalPages - 1;

    // ── Page number window (show max 5 around current) ─────────
    const visiblePages = (() => {
        const pages: number[] = [];
        const start = Math.max(0, pageIndex - 2);
        const end   = Math.min(totalPages - 1, pageIndex + 2);
        for (let i = start; i <= end; i++) pages.push(i);
        return pages;
    })();

    return (
        <View style={styles.wrapper}>
            {/* ── Card shell ─────────────────────────────────── */}
            <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>

                {/* Section header (optional title) */}
                {title && (
                    <View style={styles.cardHeader}>
                        <Ionicons name={headerIcon} size={20} color={accent} style={{ marginRight: 8 }} />
                        <Text style={[styles.cardTitle, { color: fg }]}>{title}</Text>
                        {count !== undefined && (
                            <View style={[styles.countBadge, { backgroundColor: mutedBg }]}>
                                <Text style={[styles.countBadgeText, { color: accent }]}>{count}</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* ── Table (horizontal scroll) ───────────────── */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View>
                        {/* ── Header row ─────────────────────── */}
                        <View style={[styles.headerRow, { backgroundColor: headerBg, borderBottomColor: border }]}>
                            {columns.map((col, i) => (
                                <View
                                    key={`header-${i}`}
                                    style={[
                                        styles.headerCell,
                                        { minWidth: col.size || 120, borderRightColor: border },
                                    ]}
                                >
                                    <Text style={[styles.headerCellText, { color: muted }]}>
                                        {col.header}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        {/* ── Data rows ──────────────────────── */}
                        {visibleRows.length > 0 ? (
                            visibleRows.map((item, rowIdx) => (
                                <View
                                    key={`row-${rowIdx}`}
                                    style={[
                                        styles.dataRow,
                                        {
                                            backgroundColor: rowIdx % 2 === 1 ? rowAlt : "transparent",
                                            borderBottomColor: border,
                                            borderBottomWidth: rowIdx < visibleRows.length - 1 ? 1 : 0,
                                        },
                                    ]}
                                >
                                    {columns.map((col, colIdx) => (
                                        <View
                                            key={`cell-${rowIdx}-${colIdx}`}
                                            style={[
                                                styles.dataCell,
                                                {
                                                    minWidth: col.size || 120,
                                                    borderRightColor: border,
                                                },
                                            ]}
                                        >
                                            {renderCell(item, col, fg, muted)}
                                        </View>
                                    ))}
                                </View>
                            ))
                        ) : (
                            /* ── Empty state ─────────────────── */
                            <View style={[styles.emptyRow, { borderTopColor: border }]}>
                                <View style={[styles.emptyIconWrap, { backgroundColor: mutedBg }]}>
                                    <Ionicons name="document-outline" size={24} color={accent} />
                                </View>
                                <Text style={[styles.emptyTitle, { color: fg }]}>No results found</Text>
                                <Text style={[styles.emptyDesc, { color: muted }]}>
                                    There are no records to display right now.
                                </Text>
                            </View>
                        )}
                    </View>
                </ScrollView>

                {/* ── Result count strip ──────────────────────── */}
                {visibleRows.length > 0 && (
                    <View style={[styles.countStrip, { borderTopColor: border, backgroundColor: headerBg }]}>
                        <Text style={[styles.countStripText, { color: muted }]}>
                            Showing{" "}
                            <Text style={{ color: fg, fontWeight: "700" }}>
                                {pageIndex * pageSize + 1}–{Math.min((pageIndex + 1) * pageSize, totalCount)}
                            </Text>{" "}
                            of{" "}
                            <Text style={{ color: fg, fontWeight: "700" }}>
                                {totalCount}
                            </Text>{" "}
                            results
                        </Text>
                    </View>
                )}
            </View>

            {/* ── Pagination ──────────────────────────────────── */}
            {showPagination && totalPages > 1 && (
                <View style={styles.paginationRow}>
                    {/* Prev */}
                    <TouchableOpacity
                        onPress={() => canPrev && setPageIndex(pageIndex - 1)}
                        activeOpacity={0.75}
                        style={[
                            styles.pageBtn,
                            {
                                backgroundColor: card,
                                borderColor: border,
                                opacity: canPrev ? 1 : 0.4,
                            },
                        ]}
                        disabled={!canPrev}
                    >
                        <Ionicons name="chevron-back-outline" size={16} color={canPrev ? accent : muted} />
                    </TouchableOpacity>

                    {/* First page if not in window */}
                    {visiblePages[0] > 0 && (
                        <>
                            <TouchableOpacity
                                onPress={() => setPageIndex(0)}
                                activeOpacity={0.75}
                                style={[styles.pageBtn, { backgroundColor: card, borderColor: border }]}
                            >
                                <Text style={[styles.pageBtnText, { color: fg }]}>1</Text>
                            </TouchableOpacity>
                            {visiblePages[0] > 1 && (
                                <View style={[styles.pageBtn, { backgroundColor: "transparent", borderColor: "transparent" }]}>
                                    <Text style={[styles.pageBtnText, { color: muted }]}>…</Text>
                                </View>
                            )}
                        </>
                    )}

                    {/* Numbered pages */}
                    {visiblePages.map((p) => {
                        const isActive = p === pageIndex;
                        return (
                            <TouchableOpacity
                                key={p}
                                onPress={() => setPageIndex(p)}
                                activeOpacity={0.75}
                                style={[
                                    styles.pageBtn,
                                    {
                                        backgroundColor: isActive ? accent : card,
                                        borderColor: isActive ? accent : border,
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.pageBtnText,
                                        { color: isActive ? "#fff" : fg, fontWeight: isActive ? "700" : "500" },
                                    ]}
                                >
                                    {p + 1}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}

                    {/* Last page if not in window */}
                    {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                        <>
                            {visiblePages[visiblePages.length - 1] < totalPages - 2 && (
                                <View style={[styles.pageBtn, { backgroundColor: "transparent", borderColor: "transparent" }]}>
                                    <Text style={[styles.pageBtnText, { color: muted }]}>…</Text>
                                </View>
                            )}
                            <TouchableOpacity
                                onPress={() => setPageIndex(totalPages - 1)}
                                activeOpacity={0.75}
                                style={[styles.pageBtn, { backgroundColor: card, borderColor: border }]}
                            >
                                <Text style={[styles.pageBtnText, { color: fg }]}>{totalPages}</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {/* Next */}
                    <TouchableOpacity
                        onPress={() => canNext && setPageIndex(pageIndex + 1)}
                        activeOpacity={0.75}
                        style={[
                            styles.pageBtn,
                            {
                                backgroundColor: card,
                                borderColor: border,
                                opacity: canNext ? 1 : 0.4,
                            },
                        ]}
                        disabled={!canNext}
                    >
                        <Ionicons name="chevron-forward-outline" size={16} color={canNext ? accent : muted} />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Cell renderer — handles string, number, React element
// ─────────────────────────────────────────────────────────────────────────────
function renderCell<T>(item: T, column: Column<T>, fg: string, muted: string) {
    let rendered: any;

    if (column.cell) {
        rendered = column.cell(item);
    } else if (column.accessor) {
        rendered = (item as any)[column.accessor];
    }

    // If it's a plain primitive, wrap in Text
    if (typeof rendered === "string" || typeof rendered === "number") {
        return (
            <Text style={[cellStyles.text, { color: fg }]} numberOfLines={2}>
                {rendered}
            </Text>
        );
    }

    // If it's a React element (badge, button, etc.), render as-is
    if (React.isValidElement(rendered)) {
        return rendered;
    }

    // Fallback
    return (
        <Text style={[cellStyles.text, { color: muted }]}>—</Text>
    );
}

const cellStyles = StyleSheet.create({
    text: { fontSize: 13, fontWeight: "500" },
});

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    wrapper: { gap: 12 },

    // ── Card shell ───────────────────────────────────────────────
    card: {
        borderRadius: 14,
        borderWidth: 1,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },

    // ── Optional title header ────────────────────────────────────
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "transparent", // overridden inline
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "700",
        letterSpacing: -0.3,
        flex: 1,
    },
    countBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    countBadgeText: {
        fontSize: 12,
        fontWeight: "700",
    },

    // ── Table header ─────────────────────────────────────────────
    headerRow: {
        flexDirection: "row",
        borderBottomWidth: 2,
    },
    headerCell: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRightWidth: 0,
        justifyContent: "center",
    },
    headerCellText: {
        fontSize: 11,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.6,
    },

    // ── Data rows ────────────────────────────────────────────────
    dataRow: {
        flexDirection: "row",
    },
    dataCell: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        justifyContent: "center",
    },

    // ── Empty state ──────────────────────────────────────────────
    emptyRow: {
        alignItems: "center",
        paddingVertical: 48,
        paddingHorizontal: 24,
        gap: 10,
        borderTopWidth: 1,
    },
    emptyIconWrap: {
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 4,
    },
    emptyTitle: { fontSize: 15, fontWeight: "700" },
    emptyDesc:  { fontSize: 13, fontWeight: "400", textAlign: "center" },

    // ── Result count strip ───────────────────────────────────────
    countStrip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderTopWidth: 1,
    },
    countStripText: { fontSize: 12, fontWeight: "500" },

    // ── Pagination ───────────────────────────────────────────────
    paginationRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: 6,
    },
    pageBtn: {
        minWidth: 36,
        height: 36,
        borderRadius: 8,
        borderWidth: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 10,
    },
    pageBtnText: { fontSize: 13 },
});

export default ResponsiveTable;