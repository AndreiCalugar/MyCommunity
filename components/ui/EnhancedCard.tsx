import React from 'react';
import { View, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DesignSystem, getColors } from '@/constants/designSystem';

interface EnhancedCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  gradient?: boolean;
  gradientColors?: string[];
  shadow?: 'none' | 'small' | 'medium' | 'large' | 'xlarge';
  style?: ViewStyle;
  pressable?: boolean;
  borderRadius?: number;
  padding?: number;
}

export const EnhancedCard: React.FC<EnhancedCardProps> = ({
  children,
  onPress,
  gradient = false,
  gradientColors,
  shadow = 'medium',
  style,
  pressable = true,
  borderRadius = DesignSystem.borderRadius.large,
  padding = DesignSystem.spacing.lg,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getColors(isDark);

  const cardStyle = [
    styles.card,
    {
      borderRadius,
      padding,
      backgroundColor: gradient ? 'transparent' : colors.card,
    },
    DesignSystem.shadows[shadow],
    style,
  ];

  const content = (
    <View style={cardStyle}>
      {children}
    </View>
  );

  if (gradient) {
    const gradColors = gradientColors || DesignSystem.colors.gradients.primary;
    return (
      <Pressable
        disabled={!pressable || !onPress}
        onPress={onPress}
        style={({ pressed }) => [
          styles.pressable,
          { opacity: pressed && onPress ? 0.9 : 1 },
        ]}
      >
        <LinearGradient
          colors={gradColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[cardStyle, { padding: 0 }]}
        >
          <View style={{ padding }}>
            {children}
          </View>
        </LinearGradient>
      </Pressable>
    );
  }

  if (onPress && pressable) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.pressable,
          { opacity: pressed ? 0.95 : 1 },
        ]}
        android_ripple={{ color: colors.border }}
      >
        {content}
      </Pressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  pressable: {
    borderRadius: DesignSystem.borderRadius.large,
  },
});

