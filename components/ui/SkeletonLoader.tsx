import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DesignSystem } from '@/constants/designSystem';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = DesignSystem.borderRadius.medium,
  style,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: isDark ? '#313338' : '#E3E5E8',
          opacity,
        },
        style,
      ]}
    />
  );
};

// Skeleton Card Component
export const SkeletonCard: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <SkeletonLoader width={40} height={40} borderRadius={20} />
        <View style={styles.headerText}>
          <SkeletonLoader width="60%" height={16} />
          <SkeletonLoader width="40%" height={12} style={{ marginTop: 8 }} />
        </View>
      </View>
      <SkeletonLoader width="100%" height={60} style={{ marginTop: 12 }} />
      <View style={styles.footer}>
        <SkeletonLoader width={60} height={32} />
        <SkeletonLoader width={60} height={32} />
      </View>
    </View>
  );
};

// Skeleton List
export const SkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} style={{ marginBottom: 12 }} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  card: {
    padding: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borderRadius.large,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
});

