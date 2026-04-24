import React from "react";
import { View, StyleSheet } from "react-native";
import SkeletonPlaceholder from "react-native-skeleton-placeholder";

export default function DashboardSkeleton() {
  return (
    <SkeletonPlaceholder borderRadius={12}>
      <View style={styles.container}>
        
        {/* Header */}
        <View style={styles.header} />

        {/* Stats Cards */}
        {[1, 2, 3, 4].map((_, i) => (
          <View key={i} style={styles.statCard} />
        ))}

        {/* Features */}
        {[1, 2, 3, 4].map((_, i) => (
          <View key={i} style={styles.featureCard} />
        ))}

        {/* Big Cards */}
        {[1, 2, 3].map((_, i) => (
          <View key={i} style={styles.bigCard} />
        ))}

      </View>
    </SkeletonPlaceholder>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },

  header: {
    height: 120,
    borderRadius: 16,
    marginBottom: 20,
  },

  statCard: {
    height: 80,
    borderRadius: 14,
    marginBottom: 12,
  },

  featureCard: {
    height: 70,
    borderRadius: 14,
    marginBottom: 12,
  },

  bigCard: {
    height: 160,
    borderRadius: 14,
    marginBottom: 16,
  },
});