import { authAccessTokenCookieName } from "@/constant";
import { User } from "@/features/auth/types";
import axios from "axios";
import * as SecureStore from "expo-secure-store";

export const currentUserAction = async () => {
  const token = await SecureStore.getItemAsync("accessToken");
  
  try {
    const access = await SecureStore.getItemAsync(authAccessTokenCookieName);
    
    if (!token) {
      return null;
    }
    
    const { data: user } = await axios.get<User>(
      `${process.env.EXPO_PUBLIC_SERVER_BACKEND_URL}/accounts/profile/`,
      {
        headers: {
          Authorization: `Bearer ${access}`,
        },
      }
    );
    
    return { ...user, token: access };
    
  } catch (error) {
    // Check if it's a 401 error
    // if (axios.isAxiosError(error) && error.response?.status === 401) {
    //   // Delete the cookie properly
    //   cookieStore.delete(authAccessTokenCookieName);
    //   console.log("Token invalidated - user logged out");
    //   return redirect("/home");
    // }
    // return <Redirect href="" />;
    // For other errors, log and return null
    console.error("Error getting current user:", error);
    // return null;
  }
};