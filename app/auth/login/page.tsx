import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useState } from "react";
import useLoginForm from "@/features/auth/hooks/useLoginForm";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

export default function LoginForm() {
  const {
    username,
    password,
    setUsername,
    setPassword,
    errors,
    isLoading,
    onSubmit,
  } = useLoginForm();

  const [showPassword, setShowPassword] = useState(false);
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#15803d" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Decorative Header ── */}
          <View style={styles.headerSection}>
            {/* Blob 1 – top-left */}
            <View style={styles.blob1} />
            {/* Blob 2 – top-right */}
            <View style={styles.blob2} />
            {/* Blob 3 – centre */}
            <View style={styles.blob3} />
            {/* Blob 4 – bottom accent */}
            <View style={styles.blob4} />

            {/* Logo badge */}
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>HRMSM</Text>
            </View>

            {/* Welcome copy */}
            <View style={styles.headerTextWrap}>
              <Text style={styles.welcomeLabel}>Welcome Back</Text>
          
            </View>
          </View>

          {/* ── Form Card ── */}
          <View style={styles.card}>
            {/* Pill handle */}
            <View style={styles.handle} />

            <Text style={styles.cardTitle}>Sign In</Text>
            <Text style={styles.cardSubtitle}>
              Enter your credentials to continue
            </Text>

            {/* Username */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Username</Text>
              <View
                style={[
                  styles.inputWrapper,
                  usernameFocused && styles.inputWrapperFocused,
                  errors.username && styles.inputWrapperError,
                ]}
              >
                
<Ionicons
  name="person"
  size={20}
  color="gray"
  style={styles.inputIcon}
/>
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Enter your username"
                  placeholderTextColor="#9ca3af"
                  style={styles.textInput}
                  autoCapitalize="none"
                  onFocus={() => setUsernameFocused(true)}
                  onBlur={() => setUsernameFocused(false)}
                />
              </View>
              {errors.username && (
                <Text style={styles.errorText}>⚠ {errors.username}</Text>
              )}
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <View
                style={[
                  styles.inputWrapper,
                  passwordFocused && styles.inputWrapperFocused,
                  errors.password && styles.inputWrapperError,
                ]}
              >
                <Ionicons
  name="lock-closed"
  size={20}
  color="gray"
  style={styles.inputIcon}
/>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#9ca3af"
                  style={[styles.textInput, { flex: 1 }]}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  <Ionicons
    name={showPassword ? "eye-off" : "eye"}
    size={22}
    color="gray"
  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.errorText}>⚠ {errors.password}</Text>
              )}
            </View>

            {/* Forgot Password */}
            {/* <TouchableOpacity style={styles.forgotWrap}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity> */}

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
              onPress={onSubmit}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.loginBtnText}>Sign In</Text>
                  <View style={styles.loginArrow}>
                    <Text style={styles.loginArrowIcon}>→</Text>
                  </View>
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            {/* <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View> */}

            {/* Sign-up nudge */}
            {/* <View style={styles.signupRow}>
              <Text style={styles.signupPrompt}>Don't have an account? </Text>
              <TouchableOpacity>
                <Text style={styles.signupLink}>Contact Admin</Text>
              </TouchableOpacity>
            </View> */}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ─────────────────────────────────────────
   Palette
   primary:      #15803d  (deep green)
   primary-mid:  #16a34a
   primary-light:#22c55e
   primary-pale: #bbf7d0  (mint)
   accent:       #4ade80  (bright green)
   bg:           #f0fdf4  (near-white green tint)
───────────────────────────────────────── */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#15803d",
  },

  /* ── Header / blob zone ── */
  headerSection: {
    height: height * 0.38,
    backgroundColor: "#15803d",
    overflow: "hidden",
    justifyContent: "flex-end",
    paddingBottom: 36,
    paddingHorizontal: 28,
  },

  /* Blob shapes */
  blob1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#4ade80",
    opacity: 0.35,
    top: -60,
    left: -50,
  },
  blob2: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#bbf7d0",
    opacity: 0.25,
    top: -30,
    right: -30,
  },
  blob3: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#16a34a",
    opacity: 0.4,
    top: 20,
    right: 40,
  },
  blob4: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#86efac",
    opacity: 0.2,
    bottom: 20,
    right: -20,
  },

  logoBadge: {
    width: 110,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  logoText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#15803d",
    letterSpacing: 1,
  },

  headerTextWrap: {},
  welcomeLabel: {
    fontSize: 30,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.3,
  },
  welcomeSub: {
    fontSize: 13,
    color: "#bbf7d0",
    marginTop: 4,
    letterSpacing: 0.5,
  },

  /* ── Card ── */
  card: {
    flex: 1,
    backgroundColor: "#f0fdf4",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 40,
    // subtle top shadow
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#d1fae5",
    alignSelf: "center",
    marginBottom: 24,
  },

  cardTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#14532d",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 28,
  },

  /* ── Fields ── */
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#15803d",
    marginBottom: 8,
    letterSpacing: 0.3,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#d1fae5",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 54,
    shadowColor: "#16a34a",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  inputWrapperFocused: {
    borderColor: "#22c55e",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputWrapperError: {
    borderColor: "#f87171",
  },

  inputIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    fontWeight: "500",
  },
  eyeBtn: {
    padding: 4,
  },
  eyeIcon: {
    fontSize: 16,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 6,
    fontWeight: "500",
  },

  /* ── Forgot ── */
  forgotWrap: {
    alignSelf: "flex-end",
    marginBottom: 24,
    marginTop: -4,
  },
  forgotText: {
    color: "#16a34a",
    fontSize: 13,
    fontWeight: "600",
  },

  /* ── Login button ── */
  loginBtn: {
    backgroundColor: "#15803d",
    borderRadius: 16,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#15803d",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  loginBtnDisabled: {
    opacity: 0.7,
  },
  loginBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginRight: 10,
  },
  loginArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  loginArrowIcon: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  /* ── Divider ── */
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#d1fae5",
  },
  dividerText: {
    marginHorizontal: 12,
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "500",
  },

  /* ── Sign-up row ── */
  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  signupPrompt: {
    color: "#6b7280",
    fontSize: 14,
  },
  signupLink: {
    color: "#15803d",
    fontSize: 14,
    fontWeight: "700",
  },
});