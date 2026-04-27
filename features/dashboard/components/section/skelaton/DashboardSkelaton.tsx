import React from "react";
import { View, StyleSheet } from "react-native";

export default function DashboardSkeleton() {
  return (
    <View style={styles.container}>
      
      {/* Header */}
      <View style={styles.header} />

      {/* Stats Cards */}
      {[1, 2, 3, 4].map((_, i) => (
        <View key={i} style={styles.statCard} />
      ))}

      {/* Feature Cards */}
      {[1, 2, 3, 4].map((_, i) => (
        <View key={i} style={styles.featureCard} />
      ))}

      {/* Big Cards */}
      {[1, 2, 3].map((_, i) => (
        <View key={i} style={styles.bigCard} />
      ))}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },

  header: {
    height: 120,
    backgroundColor: "#e0e0e0",
    borderRadius: 16,
    marginBottom: 20,
  },

  statCard: {
    height: 80,
    backgroundColor: "#e0e0e0",
    borderRadius: 14,
    marginBottom: 12,
  },

  featureCard: {
    height: 70,
    backgroundColor: "#e0e0e0",
    borderRadius: 14,
    marginBottom: 12,
  },

  bigCard: {
    height: 160,
    backgroundColor: "#e0e0e0",
    borderRadius: 14,
    marginBottom: 16,
  },
});