import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { syncToken } from '@/services/usePushNotifications'; // ← fixed path

import { LoginRequest, LoginResponse200 } from "../types";
import { api, getReadableErrorMessage } from "@/lib/utils/apiUtils";
import useCurrentUser from "./useCurrentUser";
import { authAccessTokenCookieName, authRefreshTokenCookieName } from "@/constant";

const useLoginForm = () => {
  const router = useRouter();
  const { refetch } = useCurrentUser();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

  const { mutate, isPending } = useMutation<LoginResponse200, unknown, LoginRequest>({
    mutationFn: async (values) => {
      const { data } = await api.post<LoginResponse200>("/accounts/login/", values);
      return data;
    },

    onSuccess: async (data) => {
      try {
        await SecureStore.setItemAsync("accessToken", data.access);
        await SecureStore.setItemAsync("refreshToken", data.refresh);
        await SecureStore.setItemAsync(authAccessTokenCookieName, data.access);
        await SecureStore.setItemAsync(authRefreshTokenCookieName, data.refresh);

        Alert.alert("Success", "Login successful");

        await refetch();
        router.replace("/(tabs)");
        await syncToken(); // ← FCM token will log in console after this
      } catch (e) {
        Alert.alert("Error", "Something went wrong after login");
      }
    },

    onError: (error) => {
      const err = getReadableErrorMessage(error);
      if (err.includes("Invalid credentials")) {
        setErrors({ username: "Invalid credentials", password: "Invalid credentials" });
      }
      Alert.alert("Error", err);
    },
  });

  const onSubmit = () => {
    setErrors({});
    if (!username || !password) {
      setErrors({
        username: !username ? "Username required" : undefined,
        password: !password ? "Password required" : undefined,
      });
      return;
    }
    mutate({ username, password });
  };

  return { username, password, setUsername, setPassword, errors, isLoading: isPending, onSubmit };
};

export default useLoginForm;