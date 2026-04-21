import { authAccessTokenCookieName } from "@/constant";
import { useNavigation } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
  authRoutes,
  baseUrl,
  landingPage,
  LOGIN_REDIRECT,
  publicRoutes,
} from "./config/routesConfig";

/**
 * Hook to check if user is logged in
 * Checks for auth token in secure storage
 */
export const useAuthCheck = async (): Promise<boolean> => {
  try {
    const token = await SecureStore.getItemAsync(authAccessTokenCookieName);
    return !!token;
  } catch (error) {
    console.error("Error checking auth status:", error);
    return false;
  }
};

/**
 * Get stored authentication token
 */
export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(authAccessTokenCookieName);
  } catch (error) {
    console.error("Error retrieving auth token:", error);
    return null;
  }
};

/**
 * Store authentication token securely
 */
export const saveAuthToken = async (token: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(authAccessTokenCookieName, token);
  } catch (error) {
    console.error("Error saving auth token:", error);
    throw error;
  }
};

/**
 * Remove authentication token
 */
export const removeAuthToken = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(authAccessTokenCookieName);
  } catch (error) {
    console.error("Error removing auth token:", error);
    throw error;
  }
};

/**
 * Navigation guard hook for protected routes
 * Use this in your root navigation component
 */
export const useAuthNavigation = () => {
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", async (e) => {
      const targetRoute = (e.data.action.payload as { name?: string })?.name;``
      const isLoggedIn = await useAuthCheck();

      if (!targetRoute) {
        return;
      }

      // Check if route requires authentication
      const requiresAuth =
        !publicRoutes.includes(targetRoute) &&
        !authRoutes.includes(targetRoute);

      // If route requires auth and user is not logged in, prevent navigation
      if (requiresAuth && !isLoggedIn) {
        e.preventDefault();
        navigation.reset({
          index: 0,
          routes: [{ name: landingPage as never }],
        });
      }

      // If user is logged in and trying to access auth routes, redirect to home
      if (authRoutes.includes(targetRoute) && isLoggedIn) {
        e.preventDefault();
        navigation.reset({
          index: 0,
          routes: [{ name: baseUrl as never }],
        });
      }
    });

    return unsubscribe;
  }, [navigation]);
};

/**
 * Hook to protect individual screens
 * Place this in your protected screens
 */
export const checkAuth = async (): Promise<boolean> => {
  const token = await SecureStore.getItemAsync(authAccessTokenCookieName);
  return !!token;
};
export const useProtectedRoute = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = checkAuth();


      if (!token) {
        navigation.reset({
          index: 0,
          routes: [{ name: LOGIN_REDIRECT as never }],
        });
      }


  }, [navigation]);

  return { isLoading, isLoggedIn };
};

/**
 * Navigation configuration helper
 * Use to configure which routes are public, auth, or protected
 */
export const checkRouteAccess = async (
  routeName: string,
  isPublicRoute: boolean,
  isAuthRoute: boolean,
): Promise<{
  allowed: boolean;
  redirectTo?: string;
}> => {
  const isLoggedIn = await useAuthCheck();

  // API routes are always allowed
  if (routeName.startsWith("/api")) {
    return { allowed: true };
  }

  // Public routes are always allowed
  if (isPublicRoute) {
    return { allowed: true };
  }

  // Auth routes redirect to home if logged in
  if (isAuthRoute && isLoggedIn) {
    return { allowed: false, redirectTo: baseUrl };
  }

  // Auth routes allowed if not logged in
  if (isAuthRoute && !isLoggedIn) {
    return { allowed: true };
  }

  // Protected routes require login
  if (!isLoggedIn) {
    return { allowed: false, redirectTo: landingPage };
  }

  return { allowed: true };
};
