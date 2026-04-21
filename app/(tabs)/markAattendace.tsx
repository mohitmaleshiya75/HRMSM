// import {
//     View,
//     Text,
//     TouchableOpacity,
//     ActivityIndicator,
//     Image,
//     Alert,
//     StyleSheet,
//     Animated,
//     Easing,
// } from "react-native";
// import { useState, useRef, useEffect } from "react";
// import { CameraView, useCameraPermissions } from "expo-camera";
// import * as Location from "expo-location";
// import { useMutation } from "@tanstack/react-query";
// import { api } from "@/lib/utils/apiUtils";
// import { useTheme } from "@/provider/ThemeProvider";
// import useCurrentUser from "@/features/auth/hooks/useCurrentUser";
// import useLiveWorkingHours from "@/features/attendance/hooks/useCalculateWorkingHrs";

// export default function AttendanceScreen() {
//     const { isClockedOut, isLoading } = useLiveWorkingHours();
//     const { data: user } = useCurrentUser();
//     const theme = useTheme();

//     const [cameraPermission, requestCameraPermission] = useCameraPermissions();
//     const cameraRef = useRef<any>(null);

//     const [step, setStep] = useState(0);
//     const [image, setImage] = useState<string | null>(null);
//     const [location, setLocation] = useState<any>(null);
//     const [loading, setLoading] = useState(false);
//     const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
//     const type = isClockedOut ? "clockIn" : "clockOut";

//     const toastAnim = useRef(new Animated.Value(0)).current;

//     useEffect(() => {
//         if (toast.visible) {
//             Animated.sequence([
//                 Animated.timing(toastAnim, {
//                     toValue: 1,
//                     duration: 300,
//                     useNativeDriver: true,
//                 }),
//                 Animated.delay(2500),
//                 Animated.timing(toastAnim, {
//                     toValue: 0,
//                     duration: 300,
//                     useNativeDriver: true,
//                 }),
//             ]).start(() => {
//                 setToast({ ...toast, visible: false });
//             });
//         }
//     }, [toast.visible]);

//     const showToast = (message: string, type: "success" | "error" = "success") => {
//         setToast({ visible: true, message, type });
//     };

//     // ✅ API mutation
//     const { mutate, isPending } = useMutation({
//         mutationFn: async () => {
//             const { data } = await api.post(
//                 type === "clockIn"
//                     ? "/accounts/clock-in/"
//                     : "/accounts/clock-out/",
//                 {
//                     image,
//                     latitude: location?.latitude,
//                     longitude: location?.longitude,
//                 },
//                 {
//                     headers: {
//                         Authorization: `Bearer ${user?.token}`,
//                     },
//                 }
//             );
//             return data;
//         },
//         onSuccess: () => {
//             showToast("✓ Attendance marked successfully", "success");
//             setTimeout(() => {
//                 setStep(0);
//                 setImage(null);
//                 setLocation(null);
//             }, 2000);
//         },
//         onError: () => {
//             showToast("✗ Something went wrong", "error");
//         },
//     });

//     // 📷 Capture Image
//     const captureImage = async () => {
//         if (cameraRef.current) {
//             try {
//                 const photo = await cameraRef.current.takePictureAsync({
//                     base64: true,
//                     quality: 0.7,
//                 });
//                 setImage(`data:image/jpeg;base64,${photo.base64}`);
//                 setStep(1);
//             } catch (error) {
//                 showToast("Failed to capture image", "error");
//             }
//         }
//     };

//     // 📍 Get Location
//     const getLocation = async () => {
//         setLoading(true);

//         const { status } = await Location.requestForegroundPermissionsAsync();
//         if (status !== "granted") {
//             showToast("Location permission denied", "error");
//             setLoading(false);
//             return;
//         }

//         try {
//             const loc = await Location.getCurrentPositionAsync({});
//             setLocation(loc.coords);
//             setLoading(false);
//             setStep(2);
//         } catch (error) {
//             showToast("Failed to get location", "error");
//             setLoading(false);
//         }
//     };

//     // ✅ Submit
//     const handleSubmit = () => {
//         mutate();
//     };

//     // Request camera permission
//     useEffect(() => {
//         if (!cameraPermission?.granted && step === 0) {
//             requestCameraPermission();
//         }
//     }, [step]);

//     if (isLoading) {
//         return (
//             <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//                 <ActivityIndicator />
//             </View>
//         );
//     }
//     return (
//         <View style={[styles.container, { backgroundColor: theme.background }]}>
//             <Text style={[styles.title, { color: theme.foreground }]}>
//                 {type === "clockIn" ? "Clock In" : "Clock Out"}
//             </Text>

//             {/* STEP 0 - Camera View */}
//             {step === 0 && cameraPermission?.granted && (
//                 <View style={styles.cameraContainer}>
//                     <CameraView
//                         ref={cameraRef}
//                         style={styles.camera}
//                         facing="front"
//                     />
//                     <View style={styles.cameraOverlay}>
//                         <View style={styles.faceMask} />
//                     </View>

//                     <TouchableOpacity
//                         style={[styles.captureButton, { backgroundColor: theme.primary }]}
//                         onPress={captureImage}
//                     >
//                         <View style={styles.captureInner} />
//                         <Text style={styles.captureText}>Capture</Text>
//                     </TouchableOpacity>
//                 </View>
//             )}

//             {/* STEP 1 - Confirm Image */}
//             {step === 1 && (
//                 <View style={styles.center}>
//                     {image && (
//                         <Image source={{ uri: image }} style={styles.preview} />
//                     )}
//                     <Text style={[styles.stepText, { color: theme.mutedForeground }]}>
//                         Photo captured
//                     </Text>

//                     <View style={styles.actionButtons}>
//                         <TouchableOpacity
//                             style={[styles.button, { backgroundColor: theme.primary }]}
//                             onPress={getLocation}
//                         >
//                             {loading ? (
//                                 <ActivityIndicator color="#fff" />
//                             ) : (
//                                 <Text style={styles.btnText}>Next: Verify Location</Text>
//                             )}
//                         </TouchableOpacity>

//                         <TouchableOpacity
//                             style={[styles.button, { backgroundColor: theme.mutedForeground }]}
//                             onPress={() => setStep(0)}
//                         >
//                             <Text style={styles.btnText}>Retake Photo</Text>
//                         </TouchableOpacity>
//                     </View>
//                 </View>
//             )}

//             {/* STEP 2 - Confirm & Submit */}
//             {step === 2 && (
//                 <View style={styles.center}>
//                     <View style={styles.confirmBox}>
//                         <Text style={[styles.confirmTitle, { color: theme.foreground }]}>
//                             ✓ Ready to Submit
//                         </Text>
//                         <Text style={[styles.confirmDetail, { color: theme.mutedForeground }]}>
//                             Photo: Captured
//                         </Text>
//                         <Text style={[styles.confirmDetail, { color: theme.mutedForeground }]}>
//                             Location: {location?.latitude.toFixed(4)}, {location?.longitude.toFixed(4)}
//                         </Text>
//                     </View>

//                     <View style={styles.actionButtons}>
//                         <TouchableOpacity
//                             style={[styles.button, { backgroundColor: theme.primary }]}
//                             onPress={handleSubmit}
//                             disabled={isPending}
//                         >
//                             {isPending ? (
//                                 <ActivityIndicator color="#fff" />
//                             ) : (
//                                 <Text style={styles.btnText}>Confirm Attendance</Text>
//                             )}
//                         </TouchableOpacity>

//                         <TouchableOpacity
//                             style={[styles.button, { backgroundColor: theme.mutedForeground }]}
//                             onPress={() => setStep(0)}
//                         >
//                             <Text style={styles.btnText}>Start Over</Text>
//                         </TouchableOpacity>
//                     </View>
//                 </View>
//             )}

//             {/* Toast Notification */}
//             <Animated.View
//                 style={[
//                     styles.toast,
//                     {
//                         backgroundColor: toast.type === "success" ? "#10b981" : "#ef4444",
//                         opacity: toastAnim,
//                         transform: [
//                             {
//                                 translateY: toastAnim.interpolate({
//                                     inputRange: [0, 1],
//                                     outputRange: [50, 0],
//                                 }),
//                             },
//                         ],
//                     },
//                 ]}
//             >
//                 <Text style={styles.toastText}>{toast.message}</Text>
//             </Animated.View>
//         </View>
//     );
// }

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         padding: 20,
//     },

//     title: {
//         fontSize: 26,
//         fontWeight: "700",
//         marginBottom: 20,
//         textAlign: "center",
//         marginTop: 10,
//     },

//     cameraContainer: {
//         flex: 1,
//         borderRadius: 20,
//         overflow: "hidden",
//         backgroundColor: "#000",
//         marginBottom: 20,
//     },

//     camera: {
//         flex: 1,
//     },

//     cameraOverlay: {
//         position: "absolute",
//         top: 0,
//         left: 0,
//         right: 0,
//         bottom: 0,
//         justifyContent: "center",
//         alignItems: "center",
//     },

//     faceMask: {
//         width: 200,
//         height: 250,
//         borderRadius: 100,
//         borderWidth: 3,
//         borderColor: "rgba(255, 255, 255, 0.3)",
//     },

//     captureButton: {
//         position: "absolute",
//         bottom: 30,
//         alignSelf: "center",
//         width: 80,
//         height: 80,
//         borderRadius: 40,
//         justifyContent: "center",
//         alignItems: "center",
//         shadowColor: "#000",
//         shadowOffset: { width: 0, height: 4 },
//         shadowOpacity: 0.3,
//         shadowRadius: 5,
//         elevation: 8,
//     },

//     captureInner: {
//         width: 70,
//         height: 70,
//         borderRadius: 35,
//         backgroundColor: "rgba(255, 255, 255, 0.3)",
//     },

//     captureText: {
//         position: "absolute",
//         color: "#fff",
//         fontSize: 12,
//         fontWeight: "600",
//         bottom: 5,
//     },

//     center: {
//         flex: 1,
//         justifyContent: "center",
//         alignItems: "center",
//         gap: 20,
//     },

//     preview: {
//         width: 180,
//         height: 180,
//         borderRadius: 20,
//         borderWidth: 2,
//         borderColor: "rgba(255, 255, 255, 0.1)",
//     },

//     stepText: {
//         fontSize: 14,
//         fontWeight: "500",
//     },

//     confirmBox: {
//         width: "100%",
//         padding: 20,
//         borderRadius: 15,
//         backgroundColor: "rgba(255, 255, 255, 0.05)",
//         borderWidth: 1,
//         borderColor: "rgba(255, 255, 255, 0.1)",
//         marginBottom: 20,
//     },

//     confirmTitle: {
//         fontSize: 18,
//         fontWeight: "700",
//         marginBottom: 12,
//     },

//     confirmDetail: {
//         fontSize: 13,
//         marginVertical: 4,
//     },

//     actionButtons: {
//         width: "100%",
//         gap: 12,
//     },

//     button: {
//         padding: 16,
//         borderRadius: 12,
//         alignItems: "center",
//         justifyContent: "center",
//         minHeight: 50,
//     },

//     btnText: {
//         color: "#fff",
//         fontWeight: "600",
//         fontSize: 15,
//     },

//     toast: {
//         position: "absolute",
//         bottom: 30,
//         left: 20,
//         right: 20,
//         paddingVertical: 12,
//         paddingHorizontal: 16,
//         borderRadius: 12,
//         justifyContent: "center",
//         alignItems: "center",
//         shadowColor: "#000",
//         shadowOffset: { width: 0, height: 4 },
//         shadowOpacity: 0.3,
//         shadowRadius: 5,
//         elevation: 8,
//     },

//     toastText: {
//         color: "#fff",
//         fontSize: 14,
//         fontWeight: "600",
//         textAlign: "center",
//     },
// });

import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    StyleSheet,
    Animated,
    ScrollView,
    Dimensions,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/utils/apiUtils";
import { useTheme } from "@/provider/ThemeProvider";
import useCurrentUser from "@/features/auth/hooks/useCurrentUser";
import useLiveWorkingHours from "@/features/attendance/hooks/useCalculateWorkingHrs";
import { MaterialIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function AttendanceScreen() {
    const { isClockedOut, isLoading } = useLiveWorkingHours();
    const { data: user } = useCurrentUser();
    const theme = useTheme();

    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const cameraRef = useRef<any>(null);

    const [step, setStep] = useState(0); // 0: Initial, 1: Camera, 2: Location, 3: Verify/Submit
    const [image, setImage] = useState<string | null>(null);
    const [location, setLocation] = useState<any>(null);
    const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
    const type = isClockedOut ? "clockIn" : "clockOut";
    const currentTime = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
    });

    const toastAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (toast.visible) {
            Animated.sequence([
                Animated.timing(toastAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.delay(2500),
                Animated.timing(toastAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setToast({ ...toast, visible: false });
            });
        }
    }, [toast.visible]);

    const showToast = (message: string, type: "success" | "error" = "success") => {
        setToast({ visible: true, message, type });
    };

    // ✅ API mutation
    const { mutate, isPending } = useMutation({
        mutationFn: async () => {
            const { data } = await api.post(
                type === "clockIn"
                    ? "/accounts/clock-in/"
                    : "/accounts/clock-out/",
                {
                    image,
                    latitude: location?.latitude,
                    longitude: location?.longitude,
                },
                {
                    headers: {
                        Authorization: `Bearer ${user?.token}`,
                    },
                }
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
        onError: () => {
            showToast("✗ Something went wrong", "error");
        },
    });

    // 📷 Capture Image
    const captureImage = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync({
                    base64: true,
                    quality: 0.7,
                });
                setImage(`data:image/jpeg;base64,${photo.base64}`);
                setStep(2); // Move to location fetching
            } catch (error) {
                showToast("Failed to capture image", "error");
            }
        }
    };

    // 📍 Auto Get Location (runs after image capture)
    useEffect(() => {
        if (step === 2 && !location) {
            getLocation();
        }
    }, [step]);

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
            setStep(3); // Move to verification/submit
        } catch (error) {
            showToast("Failed to get location", "error");
            setStep(3);
        }
    };

    // ✅ Auto Submit when location is fetched
    useEffect(() => {
        if (step === 3 && location && !locationPermissionDenied && !isPending) {
            mutate();
        }
    }, [step, location]);

    // Request camera permission
    useEffect(() => {
        if (!cameraPermission?.granted && step === 0) {
            requestCameraPermission();
        }
    }, [step]);

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.background }]}
            showsVerticalScrollIndicator={false}
        >
            {/* Header */}
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: theme.foreground }]}>
                    Mark Attendance
                </Text>
            </View>

            {/* User Info Card */}
            {step === 0 && (
                <View style={[styles.userCard, { backgroundColor: theme.primary + "15", borderColor: theme.primary + "30" }]}>
                    <View style={styles.userInfo}>
                        <View style={styles.userRow}>
                            <MaterialIcons name="person" size={20} color={theme.foreground} />
                            <Text style={[styles.userName, { color: theme.foreground }]}>
                                {`${user?.first_name} ${user?.last_name}` || "User"}
                            </Text>
                        </View>
                        <View style={styles.userRow}>
                            <MaterialIcons name="access-time" size={20} color={theme.foreground} />
                            <Text style={[styles.userTime, { color: theme.foreground }]}>
                                {currentTime}
                            </Text>
                        </View>
                    </View>
                    <View>
                        <Text style={[styles.clockStatus, { color: theme.primary }]}>
                            {type === "clockIn" ? "Clock In" : "Clock Out"}
                        </Text>
                        <Text style={[styles.clockSubtext, { color: theme.mutedForeground }]}>
                            {type === "clockIn" ? "Start your workday" : "End your workday"}
                        </Text>
                    </View>
                </View>
            )}

            {/* Progress Steps */}
            {step > 0 && (
                <View style={styles.stepsContainer}>
                    <View style={styles.stepIndicator}>
                        <View style={[styles.stepCircle, { backgroundColor: step >= 1 ? theme.primary : theme.mutedForeground }]}>
                            <Text style={styles.stepNumber}>1</Text>
                        </View>
                        <View style={[styles.stepLine, { backgroundColor: step >= 2 ? theme.primary : theme.mutedForeground }]} />
                        <View style={[styles.stepCircle, { backgroundColor: step >= 2 ? theme.primary : theme.mutedForeground }]}>
                            <Text style={styles.stepNumber}>2</Text>
                        </View>
                        <View style={[styles.stepLine, { backgroundColor: step >= 3 ? theme.primary : theme.mutedForeground }]} />
                        <View style={[styles.stepCircle, { backgroundColor: step >= 3 ? theme.primary : theme.mutedForeground }]}>
                            <Text style={styles.stepNumber}>3</Text>
                        </View>
                    </View>
                    <View style={styles.stepLabels}>
                        <Text style={[styles.stepLabel, { color: step >= 1 ? theme.foreground : theme.mutedForeground }]}>
                            Fetching Face
                        </Text>
                        <Text style={[styles.stepLabel, { color: step >= 2 ? theme.foreground : theme.mutedForeground }]}>
                            Fetching Location
                        </Text>
                        <Text style={[styles.stepLabel, { color: step >= 3 ? theme.foreground : theme.mutedForeground }]}>
                            Verified Face & Location
                        </Text>
                    </View>
                </View>
            )}

            {/* STEP 0 - Initial Screen */}
            {step === 0 && cameraPermission?.granted && (
                <View style={styles.contentArea}>
                    <View style={[styles.statusCard, { backgroundColor: theme.primary }]}>
                        <MaterialIcons name="check-circle" size={28} color="#fff" />
                        <Text style={styles.statusTitle}>Ready to Begin</Text>
                        <Text style={styles.statusSubtext}>
                            Click the button below to start verification
                        </Text>
                    </View>

                    <View style={styles.infoBox}>
                        <MaterialIcons name="photo-camera" size={24} color={theme.primary} />
                        <Text style={[styles.infoTitle, { color: theme.foreground }]}>
                            Verify Your Face
                        </Text>
                        <Text style={[styles.infoSubtext, { color: theme.mutedForeground }]}>
                            Click the button below to start face scanning
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.mainButton, { backgroundColor: theme.primary }]}
                        onPress={() => setStep(1)}
                    >
                        <MaterialIcons name="photo-camera" size={20} color="#fff" />
                        <Text style={styles.mainButtonText}>
                            {type === "clockIn" ? "Clock In" : "Clock Out"}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* STEP 1 - Camera View */}
            {step === 1 && cameraPermission?.granted && (
                <View style={styles.cameraSection}>
                    <View style={styles.cameraContainer}>
                        <CameraView
                            ref={cameraRef}
                            style={styles.camera}
                            facing="front"
                        />
                        <View style={styles.cameraOverlay}>
                            <View style={styles.faceMask} />
                        </View>

                        <TouchableOpacity
                            style={[styles.captureButton, { backgroundColor: theme.primary }]}
                            onPress={captureImage}
                        >
                            <View style={styles.captureInner} />
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* STEP 2 - Location Fetching */}
            {step === 2 && (
                <View style={styles.contentArea}>
                    <View style={[styles.statusCard, { backgroundColor: theme.primary }]}>
                        <ActivityIndicator color="#fff" size="large" />
                        <Text style={styles.statusTitle}>Fetching Location</Text>
                        <Text style={styles.statusSubtext}>
                            Please wait while we verify your location...
                        </Text>
                    </View>
                </View>
            )}

            {/* STEP 3 - Verification & Auto Submit */}
            {step === 3 && (
                <View style={styles.contentArea}>
                    {!locationPermissionDenied ? (
                        <>
                            <View style={[styles.statusCard, { backgroundColor: theme.primary }]}>
                                {!isPending ? (
                                    <MaterialIcons name="check-circle" size={28} color="#fff" />
                                ) : (
                                    <ActivityIndicator color="#fff" size="large" />
                                )}
                                <Text style={styles.statusTitle}>
                                    {isPending ? "Submitting..." : "Verified"}
                                </Text>
                                <Text style={styles.statusSubtext}>
                                    {isPending
                                        ? "Processing your attendance..."
                                        : "Face and location verified successfully"}
                                </Text>
                            </View>

                            {location && (
                                <View style={[styles.verificationBox, { borderColor: theme.primary }]}>
                                    <View style={styles.verifyItem}>
                                        <MaterialIcons name="photo" size={18} color={theme.primary} />
                                        <Text style={[styles.verifyText, { color: theme.foreground }]}>
                                            Face: Captured
                                        </Text>
                                    </View>
                                    <View style={styles.verifyItem}>
                                        <MaterialIcons name="location-on" size={18} color={theme.primary} />
                                        <Text style={[styles.verifyText, { color: theme.foreground }]}>
                                            Location: Verified
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </>
                    ) : (
                        <>
                            <View style={[styles.statusCard, { backgroundColor: "#ef4444" }]}>
                                <MaterialIcons name="location-off" size={28} color="#fff" />
                                <Text style={styles.statusTitle}>Permission Required</Text>
                                <Text style={styles.statusSubtext}>
                                    Location permission is needed for attendance
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={[styles.mainButton, { backgroundColor: theme.primary }]}
                                onPress={getLocation}
                            >
                                <MaterialIcons name="location-on" size={20} color="#fff" />
                                <Text style={styles.mainButtonText}>
                                    Enable Location Permission
                                </Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            )}

            {/* Toast Notification */}
            <Animated.View
                style={[
                    styles.toast,
                    {
                        backgroundColor: toast.type === "success" ? "#10b981" : "#ef4444",
                        opacity: toastAnim,
                        transform: [
                            {
                                translateY: toastAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [50, 0],
                                }),
                            },
                        ],
                    },
                ]}
            >
                <Text style={styles.toastText}>{toast.message}</Text>
            </Animated.View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
    },

    header: {
        marginTop: 20,
        marginBottom: 24,
    },

    headerTitle: {
        fontSize: 32,
        fontWeight: "800",
        textAlign: "center",
    },

    userCard: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 24,
    },

    userInfo: {
        flex: 1,
        gap: 10,
    },

    userRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },

    userName: {
        fontSize: 16,
        fontWeight: "600",
    },

    userTime: {
        fontSize: 14,
        fontWeight: "500",
    },

    clockStatus: {
        fontSize: 14,
        fontWeight: "700",
        marginBottom: 4,
    },

    clockSubtext: {
        fontSize: 12,
        fontWeight: "400",
    },

    stepsContainer: {
        marginBottom: 24,
        paddingHorizontal: 8,
    },

    stepIndicator: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
    },

    stepCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
    },

    stepNumber: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 16,
    },

    stepLine: {
        flex: 1,
        height: 3,
        marginHorizontal: 8,
        borderRadius: 2,
    },

    stepLabels: {
        flexDirection: "row",
        justifyContent: "space-around",
    },

    stepLabel: {
        fontSize: 12,
        fontWeight: "500",
        textAlign: "center",
        flex: 1,
    },

    contentArea: {
        paddingBottom: 40,
        gap: 20,
    },

    statusCard: {
        borderRadius: 16,
        padding: 24,
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
        marginBottom: 16,
    },

    statusTitle: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
    },

    statusSubtext: {
        color: "rgba(255, 255, 255, 0.8)",
        fontSize: 14,
        fontWeight: "400",
        textAlign: "center",
    },

    infoBox: {
        alignItems: "center",
        gap: 12,
        paddingVertical: 24,
    },

    infoTitle: {
        fontSize: 18,
        fontWeight: "600",
    },

    infoSubtext: {
        fontSize: 14,
        fontWeight: "400",
        textAlign: "center",
    },

    mainButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
        marginTop: 12,
    },

    mainButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },

    cameraSection: {
        paddingVertical: 24,
        paddingBottom: 40,
    },

    cameraContainer: {
        borderRadius: 20,
        overflow: "hidden",
        backgroundColor: "#000",
        aspectRatio: 9 / 16,
        marginBottom: 20,
    },

    camera: {
        flex: 1,
    },

    cameraOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
    },

    faceMask: {
        width: 200,
        height: 250,
        borderRadius: 100,
        borderWidth: 3,
        borderColor: "rgba(255, 255, 255, 0.3)",
    },

    captureButton: {
        position: "absolute",
        bottom: 30,
        alignSelf: "center",
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: "center",
        alignItems: "center",
    },

    captureInner: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: "rgba(255, 255, 255, 0.3)",
    },

    verificationBox: {
        borderWidth: 2,
        borderRadius: 12,
        padding: 16,
        gap: 12,
        marginTop: 8,
    },

    verifyItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },

    verifyText: {
        fontSize: 14,
        fontWeight: "500",
    },

    toast: {
        position: "absolute",
        bottom: 30,
        left: 16,
        right: 16,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },

    toastText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
        textAlign: "center",
    },
});