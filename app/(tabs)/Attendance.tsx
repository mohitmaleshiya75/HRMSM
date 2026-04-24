import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    Animated,
    ScrollView,
    useColorScheme,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { useMutation } from "@tanstack/react-query";
import { api, getReadableErrorMessage } from "@/lib/utils/apiUtils";
import useCurrentUser from "@/features/auth/hooks/useCurrentUser";
import useLiveWorkingHours from "@/features/attendance/hooks/useCalculateWorkingHrs";
import { MaterialIcons, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function AttendanceScreen() {
    const { isClockedOut, isLoading } = useLiveWorkingHours();
    const { data: user } = useCurrentUser();
    const scheme = useColorScheme();
    const isDark = scheme === "dark";

    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const cameraRef = useRef<any>(null);

    const [step, setStep] = useState(0);
    const [image, setImage] = useState<string | null>(null);
    const [location, setLocation] = useState<any>(null);
    const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

    const type = isClockedOut ? "clockIn" : "clockOut";
    const currentTime = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const currentDate = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

    const toastAnim = useRef(new Animated.Value(0)).current;

    // ── Colours (mirrors dashboard) ──────────────────────────────
    const bg     = isDark ? "#0f172a" : "#f3f4f6";
    const card    = isDark ? "#1e293b" : "#ffffff";
    const border  = isDark ? "#374151" : "#e5e7eb";
    const fg      = isDark ? "#ffffff" : "#111111";
    const muted   = isDark ? "#9ca3af" : "#6b7280";
    const accent  = "#10b981";
    const mutedBg = isDark ? "rgba(16,185,129,0.10)" : "rgba(16,185,129,0.06)";

    // ── Toast ────────────────────────────────────────────────────
    useEffect(() => {
        if (toast.visible) {
            Animated.sequence([
                Animated.timing(toastAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.delay(2500),
                Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
            ]).start(() => setToast(t => ({ ...t, visible: false })));
        }
    }, [toast.visible]);

    const showToast = (message: string, type: "success" | "error" = "success") =>
        setToast({ visible: true, message, type });

    // ── Mutation ─────────────────────────────────────────────────
    const { mutate, isPending, isError, error} = useMutation({
        mutationFn: async () => {
            const { data } = await api.post(
                type === "clockIn" ? "/accounts/clock-in/" : "/accounts/clock-out/",
                { image, latitude: location?.latitude, longitude: location?.longitude },
                { headers: { Authorization: `Bearer ${user?.token}` } }
            );
            return data;
        },
        onSuccess: () => {
            showToast("✓ Attendance marked successfully", "success");
            setTimeout(() => {
                setStep(0);
                setImage(null);
                setLocation(null);
                setLocationPermissionDenied(false);
            }, 2000);
        },
        onError: (e) => showToast(getReadableErrorMessage(e), "error"),
    });

    // ── Camera / Location / Submit effects ───────────────────────
    const captureImage = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.7 });
                setImage(`data:image/jpeg;base64,${photo.base64}`);
                setStep(2);
            } catch {
                showToast("Failed to capture image", "error");
            }
        }
    };

    const getLocation = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
            setLocationPermissionDenied(true);
            setStep(3);
            showToast("Location permission denied", "error");
            return;
        }
        try {
            const loc = await Location.getCurrentPositionAsync({});
            setLocation(loc.coords);
            setLocationPermissionDenied(false);
            setStep(3);
        } catch {
            showToast("Failed to get location", "error");
            setStep(3);
        }
    };

    useEffect(() => { if (step === 2 && !location) getLocation(); }, [step]);
    useEffect(() => { if (step === 3 && location && !locationPermissionDenied && !isPending) mutate(); }, [step, location]);
    useEffect(() => { if (!cameraPermission?.granted && step === 0) requestCameraPermission(); }, [step]);

    // ── Loading ──────────────────────────────────────────────────
    if (isLoading) {
        return (
            <View style={[styles.centered, { backgroundColor: bg }]}>
                <ActivityIndicator size="large" color={accent} />
                <Text style={[styles.loadingText, { color: muted, marginTop: 12 }]}>Loading...</Text>
            </View>
        );
    }

    // ── Step config (for progress bar) ──────────────────────────
    const steps = ["Capture Face", "Get Location", "Verify & Submit"];

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: bg }]}
            showsVerticalScrollIndicator={false}
        >
            {/* ── WELCOME HEADER (mirrors dashboard) ────────────── */}
            <View style={[styles.welcomeHeader, { backgroundColor: card, borderColor: border }]}>
                <View style={{ gap: 6 }}>
                    <Text style={[styles.welcomeTitle, { color: fg }]}>Mark Attendance 👋</Text>
                    <Text style={[styles.dateText, { color: muted }]}>{currentDate}</Text>
                    <Text style={[styles.subtitleText, { color: muted }]}>
                        {type === "clockIn" ? "Start your workday" : "End your workday"}
                    </Text>
                </View>

                {/* Clock In / Out badge */}
                <View style={[
                    styles.badge,
                    { backgroundColor: type === "clockIn" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.12)" }
                ]}>
                    <MaterialCommunityIcons
                        name={type === "clockIn" ? "login" : "logout"}
                        size={16}
                        color={type === "clockIn" ? accent : "#ef4444"}
                    />
                    <Text style={[
                        styles.badgeText,
                        { color: type === "clockIn" ? accent : "#ef4444" }
                    ]}>
                        {type === "clockIn" ? "Clock In" : "Clock Out"}
                    </Text>
                </View>
            </View>

            {/* ── STAT CARDS (mirrors dashboard) ────────────────── */}
            {step === 0 && (
                <View style={styles.statsContainer}>
                    {[
                        {
                            title: "Employee",
                            value: `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() || "User",
                            icon: "checkmark-circle-outline" as const,
                            color: accent,
                            subtext: user?.position || "Employee",
                        },
                        {
                            title: "Current Time",
                            value: currentTime,
                            icon: "time-outline" as const,
                            color: "#3b82f6",
                            subtext: "Local time",
                        },
                        {
                            title: "Status",
                            value: type === "clockIn" ? "Ready" : "Active",
                            icon: "calendar-outline" as const,
                            color: type === "clockIn" ? "#f59e0b" : "#8b5cf6",
                            subtext: type === "clockIn" ? "Not clocked in" : "Currently clocked in",
                        },
                    ].map((stat, i) => (
                        <View
                            key={i}
                            style={[
                                styles.statCard,
                                {
                                    backgroundColor: card,
                                    borderColor: border,
                                    borderLeftColor: stat.color,
                                },
                            ]}
                        >
                            <View style={styles.statContent}>
                                <View style={{ flex: 1, marginRight: 12 }}>
                                    <Text style={[styles.statLabel, { color: muted }]}>{stat.title}</Text>
                                    <Text style={[styles.statValue, { color: stat.color }]} numberOfLines={1}>
                                        {stat.value}
                                    </Text>
                                    <Text style={[styles.statSubtext, { color: muted }]}>{stat.subtext}</Text>
                                </View>
                                <View style={[styles.iconCircle, { backgroundColor: stat.color }]}>
                                    <Ionicons name={stat.icon} size={26} color="#fff" />
                                </View>
                            </View>
                        </View>
                    ))}
                </View>
            )}

            {/* ── PROGRESS BAR (steps 1-3 only) ─────────────────── */}
            {step > 0 && (
                <View style={[styles.bigCard, { backgroundColor: card, borderColor: border }]}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="git-commit-outline" size={20} color={accent} style={{ marginRight: 8 }} />
                        <Text style={[styles.sectionTitle, { color: fg }]}>Verification Steps</Text>
                    </View>

                    <View style={styles.stepIndicator}>
                        {steps.map((label, i) => {
                            const stepNum = i + 1;
                            const done = step > stepNum;
                            const active = step === stepNum;
                            const color = done || active ? accent : border;
                            return (
                                <View key={i} style={{ flex: 1, alignItems: "center" }}>
                                    <View style={{ flexDirection: "row", alignItems: "center", width: "100%" }}>
                                        {i > 0 && (
                                            <View style={[styles.stepLine, { backgroundColor: step > i ? accent : border }]} />
                                        )}
                                        <View style={[
                                            styles.stepCircle,
                                            { backgroundColor: done ? accent : active ? mutedBg : "transparent",
                                              borderColor: color, borderWidth: 2 }
                                        ]}>
                                            {done ? (
                                                <Ionicons name="checkmark" size={14} color="#fff" />
                                            ) : (
                                                <Text style={[styles.stepNumber, { color: active ? accent : muted }]}>
                                                    {stepNum}
                                                </Text>
                                            )}
                                        </View>
                                        {i < steps.length - 1 && (
                                            <View style={[styles.stepLine, { backgroundColor: step > stepNum ? accent : border }]} />
                                        )}
                                    </View>
                                    <Text style={[styles.stepLabel, { color: active ? fg : muted }]}>
                                        {label}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </View>
            )}

            {/* ── STEP 0 — Initial / Ready ───────────────────────── */}
            {step === 0 && cameraPermission?.granted && (
                <>
                    {/* How it works card */}
                    <View style={[styles.bigCard, { backgroundColor: card, borderColor: border }]}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="information-circle-outline" size={20} color={accent} style={{ marginRight: 8 }} />
                            <Text style={[styles.sectionTitle, { color: fg }]}>How It Works</Text>
                        </View>

                        {[
                            { icon: "camera-outline" as const, title: "Capture Face", desc: "Take a selfie for identity verification" },
                            { icon: "location-outline" as const, title: "Get Location", desc: "GPS coordinates are recorded automatically" },
                            { icon: "shield-checkmark-outline" as const, title: "Verify & Submit", desc: "Both are verified and submitted securely" },
                        ].map((item, i, arr) => (
                            <View
                                key={i}
                                style={[
                                    styles.howRow,
                                    { borderBottomColor: border, borderBottomWidth: i < arr.length - 1 ? 1 : 0 },
                                ]}
                            >
                                <View style={[styles.howIconBox, { backgroundColor: mutedBg }]}>
                                    <Ionicons name={item.icon} size={20} color={accent} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.howTitle, { color: fg }]}>{item.title}</Text>
                                    <Text style={[styles.howDesc, { color: muted }]}>{item.desc}</Text>
                                </View>
                                <View style={[styles.stepBadge, { backgroundColor: mutedBg }]}>
                                    <Text style={[styles.stepBadgeText, { color: accent }]}>Step {i + 1}</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* CTA Button */}
                    <TouchableOpacity
                        style={[styles.mainButton, { backgroundColor: accent }]}
                        activeOpacity={0.85}
                        onPress={() => setStep(1)}
                    >
                        <MaterialCommunityIcons
                            name={type === "clockIn" ? "login" : "logout"}
                            size={22}
                            color="#fff"
                        />
                        <Text style={styles.mainButtonText}>
                            {type === "clockIn" ? "Start Clock In" : "Start Clock Out"}
                        </Text>
                    </TouchableOpacity>
                </>
            )}

            {/* ── STEP 1 — Camera ────────────────────────────────── */}
            {step === 1 && cameraPermission?.granted && (
                <View style={[styles.bigCard, { backgroundColor: card, borderColor: border }]}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="camera-outline" size={20} color={accent} style={{ marginRight: 8 }} />
                        <Text style={[styles.sectionTitle, { color: fg }]}>Face Verification</Text>
                    </View>

                    <Text style={[styles.cameraHint, { color: muted }]}>
                        Centre your face within the oval, then tap capture.
                    </Text>

                    <View style={styles.cameraContainer}>
                        <CameraView ref={cameraRef} style={styles.camera} facing="front" />
                        {/* Oval overlay */}
                        <View style={styles.cameraOverlay}>
                            <View style={styles.faceMask} />
                        </View>
                        {/* Corner guides */}
                        {[styles.cornerTL, styles.cornerTR, styles.cornerBL, styles.cornerBR].map((corner, i) => (
                            <View key={i} style={[corner, { borderColor: accent }]} />
                        ))}
                    </View>

                    <TouchableOpacity
                        style={[styles.captureButton, { backgroundColor: accent }]}
                        onPress={captureImage}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="camera" size={22} color="#fff" />
                        <Text style={styles.mainButtonText}>Capture Photo</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* ── STEP 2 — Fetching Location ─────────────────────── */}
            {step === 2 && (
                <View style={[styles.bigCard, { backgroundColor: card, borderColor: border }]}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="location-outline" size={20} color={accent} style={{ marginRight: 8 }} />
                        <Text style={[styles.sectionTitle, { color: fg }]}>Getting Location</Text>
                    </View>

                    <View style={[styles.statusBanner, { backgroundColor: mutedBg, borderColor: border }]}>
                        <ActivityIndicator color={accent} size="large" />
                        <View style={{ marginLeft: 16 }}>
                            <Text style={[styles.statusBannerTitle, { color: fg }]}>Fetching GPS…</Text>
                            <Text style={[styles.statusBannerSub, { color: muted }]}>
                                Please wait while we get your coordinates
                            </Text>
                        </View>
                    </View>

                    {[
                        { icon: "checkmark-circle-outline" as const, label: "Face", status: "Captured", color: accent },
                        { icon: "time-outline" as const, label: "Location", status: "Fetching…", color: "#f59e0b" },
                    ].map((item, i) => (
                        <View
                            key={i}
                            style={[styles.verifyRow, { borderColor: border, borderBottomWidth: i === 0 ? 1 : 0 }]}
                        >
                            <View style={[styles.howIconBox, { backgroundColor: mutedBg }]}>
                                <Ionicons name={item.icon} size={18} color={item.color} />
                            </View>
                            <Text style={[styles.howTitle, { color: fg }]}>{item.label}</Text>
                            <Text style={[styles.verifyStatus, { color: item.color }]}>{item.status}</Text>
                        </View>
                    ))}
                </View>
            )}

            {/* ── STEP 3 — Verify / Submit ───────────────────────── */}
            {step === 3 && !locationPermissionDenied && (
                <View style={[styles.bigCard, { backgroundColor: card, borderColor: border }]}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="shield-checkmark-outline" size={20} color={accent} style={{ marginRight: 8 }} />
                        <Text style={[styles.sectionTitle, { color: fg }]}>Verification Summary</Text>
                    </View>

                    <View 
                        style={[
                            styles.statusBanner, 
                            { 
                                backgroundColor: isError ? "rgba(239,68,68,0.08)" : mutedBg, 
                                borderColor: isError ? "#ef444440" : border 
                            }
                        ]}
                    >
                        {isPending ? (
                            <ActivityIndicator color={accent} size="large" />
                        ) : isError ? (
                            <Ionicons name="close-circle" size={36} color="#ef4444" />
                        ) : (
                            <Ionicons name="checkmark-circle" size={36} color={accent} />
                        )}
                        <View style={{ marginLeft: 16 }}>
                            <Text style={[styles.statusBannerTitle, { color: fg }]}>
                                {isPending ? "Submitting…" : isError ? "Error" : "All Verified!"}
                            </Text>
                            <Text style={[styles.statusBannerSub, { color: muted }]}>
                                {isPending
                                    ? "Marking your attendance, please wait"
                                    : isError
                                    ? getReadableErrorMessage(error)
                                    : "Face and location confirmed successfully"}
                            </Text>
                        </View>
                    </View>

                    {isError && (
                        <View style={{ gap: 10, marginBottom: 16 }}>
                            <TouchableOpacity
                                style={[styles.mainButton, { backgroundColor: accent }]}
                                onPress={() => mutate()}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="refresh-outline" size={20} color="#fff" />
                                <Text style={styles.mainButtonText}>Retry Submission</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.secondaryButton, { borderColor: border }]}
                                onPress={() => {
                                    setStep(0);
                                    setImage(null);
                                    setLocation(null);
                                    setLocationPermissionDenied(false);
                                }}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="camera-outline" size={20} color={fg} />
                                <Text style={[styles.secondaryButtonText, { color: fg }]}>Restart Process</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {[
                        { icon: "camera-outline" as const,   label: "Face Scan", status: "Captured",  color: accent },
                        { icon: "location-outline" as const, label: "Location",  status: location ? "Verified" : "N/A", color: accent },
                        { icon: "time-outline" as const,     label: "Time",      status: currentTime, color: "#3b82f6" },
                    ].map((item, i, arr) => (
                        <View
                            key={i}
                            style={[
                                styles.verifyRow,
                                { borderColor: border, borderBottomWidth: i < arr.length - 1 ? 1 : 0 },
                            ]}
                        >
                            <View style={[styles.howIconBox, { backgroundColor: mutedBg }]}>
                                <Ionicons name={item.icon} size={18} color={item.color} />
                            </View>
                            <Text style={[styles.howTitle, { color: fg }]}>{item.label}</Text>
                            <View style={[styles.verifyBadge, { backgroundColor: item.color + "20" }]}>
                                <Text style={[styles.verifyStatus, { color: item.color }]}>{item.status}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            )}

            {/* ── STEP 3 — Location Denied ───────────────────────── */}
            {step === 3 && locationPermissionDenied && (
                <View style={[styles.bigCard, { backgroundColor: card, borderColor: "#ef4444" }]}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="warning-outline" size={20} color="#ef4444" style={{ marginRight: 8 }} />
                        <Text style={[styles.sectionTitle, { color: fg }]}>Permission Required</Text>
                    </View>

                    <View style={[styles.statusBanner, { backgroundColor: "rgba(239,68,68,0.08)", borderColor: "#ef444440" }]}>
                        <Ionicons name="location-outline" size={36} color="#ef4444" />
                        <View style={{ marginLeft: 16 }}>
                            <Text style={[styles.statusBannerTitle, { color: fg }]}>Location Denied</Text>
                            <Text style={[styles.statusBannerSub, { color: muted }]}>
                                Location access is required to mark attendance
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.mainButton, { backgroundColor: "#ef4444", marginTop: 8 }]}
                        onPress={getLocation}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="location-outline" size={20} color="#fff" />
                        <Text style={styles.mainButtonText}>Enable Location</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* ── BOTTOM PADDING ────────────────────────────────────*/}
            <View style={{ height: 32 }} />

            {/* ── TOAST ─────────────────────────────────────────── */}
            <Animated.View
                style={[
                    styles.toast,
                    {
                        backgroundColor: toast.type === "success" ? accent : "#ef4444",
                        opacity: toastAnim,
                        transform: [{
                            translateY: toastAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [50, 0],
                            }),
                        }],
                    },
                ]}
            >
                <Ionicons
                    name={toast.type === "success" ? "checkmark-circle-outline" : "close-circle-outline"}
                    size={18}
                    color="#fff"
                    style={{ marginRight: 8 }}
                />
                <Text style={styles.toastText}>{toast.message}</Text>
            </Animated.View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
    centered:  { flex: 1, justifyContent: "center", alignItems: "center" },
    loadingText: { fontSize: 14, fontWeight: "600" },

    // ── Welcome header ────────────────────────────────────────────
    welcomeHeader: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 3,
    },
    welcomeTitle: { fontSize: 22, fontWeight: "700", letterSpacing: -0.5 },
    dateText:     { fontSize: 13, fontWeight: "500" },
    subtitleText: { fontSize: 12, fontWeight: "400", marginTop: 2 },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    badgeText: { fontSize: 12, fontWeight: "700" },

    // ── Stat cards ────────────────────────────────────────────────
    statsContainer: { marginBottom: 16, gap: 12 },
    statCard: {
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderLeftWidth: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    statContent:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    statLabel:    { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
    statValue:    { fontSize: 22, fontWeight: "800", letterSpacing: -0.5, marginBottom: 4 },
    statSubtext:  { fontSize: 11, fontWeight: "400" },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: "center",
        alignItems: "center",
    },

    // ── Section card ──────────────────────────────────────────────
    bigCard: {
        borderRadius: 14,
        padding: 10,
        marginBottom: 16,
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    cardHeader:   { flexDirection: "row", alignItems: "center", marginBottom: 16 },
    sectionTitle: { fontSize: 16, fontWeight: "700", letterSpacing: -0.3 },

    // ── Progress stepper ──────────────────────────────────────────
    stepIndicator: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
    stepCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1,
    },
    stepNumber: { fontSize: 12, fontWeight: "700" },
    stepLine:   { flex: 1, height: 2, marginTop: 14 },
    stepLabel:  { fontSize: 10, fontWeight: "500", textAlign: "center", marginTop: 6 },

    // ── How it works rows ─────────────────────────────────────────
    howRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 13,
    },
    howIconBox: {
        width: 38,
        height: 38,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
    },
    howTitle: { flex: 1, fontSize: 14, fontWeight: "600" },
    howDesc:  { fontSize: 12, fontWeight: "400", marginTop: 2 },
    stepBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    stepBadgeText: { fontSize: 11, fontWeight: "700" },

    // ── Camera ────────────────────────────────────────────────────
    cameraHint: { fontSize: 13, fontWeight: "400", marginBottom: 14, textAlign: "center" },
    cameraContainer: {
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: "#000",
        aspectRatio: 3 / 4,
        marginBottom: 16,
        position: "relative",
    },
    camera:        { flex: 1 },
    cameraOverlay: {
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        justifyContent: "center",
        alignItems: "center",
    },
    faceMask: {
        width: 180,
        height: 230,
        borderRadius: 90,
        borderWidth: 2.5,
        borderColor: "rgba(255,255,255,0.5)",
        borderStyle: "dashed",
    },
    // Corner guides
    cornerTL: {
        position: "absolute", top: 16, left: 16,
        width: 28, height: 28,
        borderTopWidth: 3, borderLeftWidth: 3, borderRadius: 4,
    },
    cornerTR: {
        position: "absolute", top: 16, right: 16,
        width: 28, height: 28,
        borderTopWidth: 3, borderRightWidth: 3, borderRadius: 4,
    },
    cornerBL: {
        position: "absolute", bottom: 16, left: 16,
        width: 28, height: 28,
        borderBottomWidth: 3, borderLeftWidth: 3, borderRadius: 4,
    },
    cornerBR: {
        position: "absolute", bottom: 16, right: 16,
        width: 28, height: 28,
        borderBottomWidth: 3, borderRightWidth: 3, borderRadius: 4,
    },

    // ── Buttons ───────────────────────────────────────────────────
    mainButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 15,
        borderRadius: 12,
        gap: 10,
    },
    mainButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
    secondaryButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        gap: 10,
    },
    secondaryButtonText: {
        fontSize: 15,
        fontWeight: "600",
    },
    captureButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 15,
        borderRadius: 12,
        gap: 10,
    },

    // ── Status banner ─────────────────────────────────────────────
    statusBanner: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 16,
    },
    statusBannerTitle: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
    statusBannerSub:   { fontSize: 12, fontWeight: "400" },

    // ── Verify rows ───────────────────────────────────────────────
    verifyRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 13,
    },
    verifyBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    verifyStatus: { fontSize: 12, fontWeight: "700" },

    // ── Toast ─────────────────────────────────────────────────────
    toast: {
        position: "absolute",
        bottom: 30,
        left: 16,
        right: 16,
        paddingVertical: 13,
        paddingHorizontal: 16,
        borderRadius: 12,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    toastText: { color: "#fff", fontSize: 14, fontWeight: "600" },
});