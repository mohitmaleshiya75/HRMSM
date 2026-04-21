import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useState } from "react";
import useLoginForm from "@/features/auth/hooks/useLoginForm";

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

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Logo / Title */}
        <Text style={styles.logo}>HRMSM</Text>

        <Text style={styles.title}>Welcome back to HRMSM</Text>
        <Text style={styles.subtitle}>Login with your credentials</Text>

        {/* Username */}
        <View style={styles.field}>
          <Text style={styles.label}>UserName</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Enter username"
            style={styles.input}
          />
          {errors.username && (
            <Text style={styles.error}>{errors.username}</Text>
          )}
        </View>

        {/* Password */}
        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>

          <View style={styles.passwordWrapper}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholder="********"
              style={styles.passwordInput}
            />

            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={{ fontSize: 16 }}>
                {showPassword ? "🙈" : "👁️"}
              </Text>
            </TouchableOpacity>
          </View>

          {errors.password && (
            <Text style={styles.error}>{errors.password}</Text>
          )}
        </View>

        {/* Login Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={onSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        {/* Reset Password */}
        <TouchableOpacity>
          <Text style={styles.reset}>Reset Password</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    padding: 20,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    elevation: 4, // Android shadow
    shadowColor: "#000", // iOS shadow
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },

  logo: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#22c55e",
    textAlign: "center",
    marginBottom: 10,
  },

  title: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },

  subtitle: {
    textAlign: "center",
    color: "#6b7280",
    marginBottom: 20,
  },

  field: {
    marginBottom: 15,
  },

  label: {
    marginBottom: 5,
    fontWeight: "500",
  },

  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#f9fafb",
  },

  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f9fafb",
  },

  passwordInput: {
    flex: 1,
    paddingVertical: 12,
  },

  button: {
    backgroundColor: "#16a34a",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },

  reset: {
    textAlign: "center",
    marginTop: 15,
    color: "#374151",
  },

  error: {
    color: "red",
    marginTop: 4,
    fontSize: 12,
  },
});