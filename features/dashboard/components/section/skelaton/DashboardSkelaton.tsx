import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import SkeletonContent from "react-native-skeleton-content";

const { width } = Dimensions.get("window");

export default function DashboardSkeleton() {
  return (
    <SkeletonContent
      containerStyle={styles.container}
      isLoading={true}
      layout={[
        // Header
        { key: "header", width: width - 32, height: 120, borderRadius: 16, marginBottom: 20 },

        // Stats Cards
        ...[1, 2, 3, 4].map((_, i) => ({
          key: `stat-${i}`,
          width: width - 32,
          height: 80,
          borderRadius: 14,
          marginBottom: 12,
        })),

        // Feature Cards
        ...[1, 2, 3, 4].map((_, i) => ({
          key: `feature-${i}`,
          width: width - 32,
          height: 70,
          borderRadius: 14,
          marginBottom: 12,
        })),

        // Big Cards
        ...[1, 2, 3].map((_, i) => ({
          key: `big-${i}`,
          width: width - 32,
          height: 160,
          borderRadius: 14,
          marginBottom: 16,
        })),
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
});