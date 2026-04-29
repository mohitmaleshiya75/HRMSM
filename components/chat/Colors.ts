// features/chat/Colors.ts
import { Appearance } from "react-native";

const isDark = Appearance.getColorScheme() === "dark";

export const WhatsAppColors = {
  light: {
    primary: "#008069",
    primaryLight: "#25D366",
    primaryDark: "#075E54",
    primarySurface: "#E7FFDB",
    primaryBorder: "#D1FACB",
    white: "#ffffff",
    background: "#FFFFFF",
    surface: "#F0F2F5",
    surfaceGreen: "#D9FDD3",
    text: "#000000",
    textSecondary: "#333333", // Darkened for better visibility
    textLight: "#555555", // Darkened for better visibility
    border: "#e9edef",
    borderGreen: "#dcf8c6",
    bubbleOut: "#d9fdd3",
    bubbleOutText: "#000000", // Pure black for message text
    bubbleIn: "#ffffff",
    bubbleInText: "#000000", // Pure black for message text
    error: "#f15c6d",
    badge: "#25D366",
    badgeText: "#ffffff",
    overlay: "rgba(0,0,0,0.4)",
    headerBg: "#008069",
    headerText: "#ffffff",
    online: "#1fa855",
    offline: "#8696a0",
    replyBar: "#f0f2f5",
    systemMsg: "#fff5c4",
    deleted: "#f0f2f5",
    inputBg: "#ffffff",
    shadow: "#000000",
  },
  dark: {
    primary: "#00a884",
    primaryLight: "#00a884",
    primaryDark: "#005c4b",
    primarySurface: "#005c4b",
    primaryBorder: "#202c33",
    white: "#ffffff",
    background: "#0b141a",
    surface: "#202c33",
    surfaceGreen: "#005c4b",
    text: "#000000",
    textSecondary: "#8696a0",
    textLight: "#667781",
    border: "#222d34",
    borderGreen: "#005c4b",
    bubbleOut: "#005c4b",
    bubbleOutText: "#e9edef",
    bubbleIn: "#202c33",
    bubbleInText: "#000000",
    error: "#f15c6d",
    badge: "#00a884",
    badgeText: "#111b21",
    overlay: "rgba(0,0,0,0.7)",
    headerBg: "#202c33",
    headerText: "#e9edef",
    online: "#00a884",
    offline: "#8696a0",
    replyBar: "#182229",
    systemMsg: "#182229",
    deleted: "#182229",
    inputBg: "#2a3942",
    shadow: "#000000",
  },
};

export const Colors = isDark ? WhatsAppColors.dark : WhatsAppColors.light;
