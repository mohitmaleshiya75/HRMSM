import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { convertToOnlyDate } from "@/lib/utils/dateUtils";
import useLiveWorkingHours from "@/hooks/useCalculateWorkingHrs";
import useCurrentUser from "@/features/auth/hooks/useCurrentUser";

interface TimeBreakdown {
  hours: number;
  minutes: number;
  seconds: number;
}

const parseTimeString = (timeStr: string): TimeBreakdown => {
  const hoursMatch = timeStr.match(/(\d+)h/);
  const minutesMatch = timeStr.match(/(\d+)m/);
  const secondsMatch = timeStr.match(/(\d+)s/);

  return {
    hours: hoursMatch ? Number.parseInt(hoursMatch[1]) : 0,
    minutes: minutesMatch ? Number.parseInt(minutesMatch[1]) : 0,
    seconds: secondsMatch ? Number.parseInt(secondsMatch[1]) : 0,
  };
};

export default function WorkingHoursCard() {
    const { data: user } = useCurrentUser();
    const date = convertToOnlyDate(new Date());
    const { totalWorkingTime } = useLiveWorkingHours({
        employee_id: user?.id,
        date: date!,
    });
    const timeBreakdown = parseTimeString(totalWorkingTime);
    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Ionicons name="time-outline" size={16} color="#10b981" />
                <Text style={styles.headerText}>Today's Working Hours</Text>
            </View>

            {/* Grid */}
            <View style={styles.grid}>
                {/* Hours */}
                <View style={styles.card}>
                    <View style={styles.circle} />
                    <Text style={styles.value}>
                        {String(timeBreakdown.hours).padStart(2, "0")}
                    </Text>
                    <Text style={styles.label}>HOURS</Text>
                </View>

                {/* Minutes */}
                <View style={styles.card}>
                    <View style={styles.circle} />
                    <Text style={styles.value}>
                        {String(timeBreakdown.minutes).padStart(2, "0")}
                    </Text>
                    <Text style={styles.label}>MINUTES</Text>
                </View>

                {/* Seconds */}
                <View style={styles.card}>
                    <View style={styles.circle} />
                    <Text style={styles.value}>
                        {String(timeBreakdown.seconds).padStart(2, "0")}
                    </Text>
                    <Text style={styles.label}>SECONDS</Text>
                </View>
            </View>
        </View>
    );
}
const styles = StyleSheet.create({
    container: {
        gap: 12,
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },

    headerText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#9ca3af",
    },

    grid: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,
    },

    card: {
        flex: 1,
        backgroundColor: "#111827",
        padding: 16,
        borderRadius: 16,
        alignItems: "center",
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#1f2937",
    },

    circle: {
        position: "absolute",
        top: -20,
        right: -20,
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: "rgba(16,185,129,0.08)",
    },

    value: {
        fontSize: 28,
        fontWeight: "800",
        color: "#10b981",
    },

    label: {
        marginTop: 4,
        fontSize: 10,
        fontWeight: "600",
        color: "#9ca3af",
        letterSpacing: 1,
    },
});