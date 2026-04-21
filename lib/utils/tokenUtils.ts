import "server-only";
import { jwtDecode } from "jwt-decode";

interface JWTPayload {
  exp: number;
}

export const getExpirationFromToken = (token: string): number => {
  try {
    const decoded = jwtDecode<JWTPayload>(token);
    // exp is in seconds, convert to milliseconds and get seconds from now
    const expiresIn = decoded.exp * 1000 - Date.now();
    // Convert milliseconds to seconds for cookie maxAge
    return Math.floor(expiresIn / 1000);
  } catch (error) {
    console.error("Error decoding JWT:", error);
    // Fallback expiration times if decoding fails
    return 60 * 60 * 24; // 1 day for access token
  }
};
