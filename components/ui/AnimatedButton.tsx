import React, { useRef } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DesignSystem } from '@/constants/designSystem';

interface AnimatedButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'gradient';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const sizeStyles = {
    small: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 14 },
    medium: { paddingVertical: 12, paddingHorizontal: 24, fontSize: 15 },
    large: { paddingVertical: 16, paddingHorizontal: 32, fontSize: 16 },
  };

  const variantColors = {
    primary: { bg: DesignSystem.colors.primary, text: '#FFFFFF' },
    secondary: { bg: '#B5BAC1', text: '#FFFFFF' },
    danger: { bg: DesignSystem.colors.danger, text: '#FFFFFF' },
    success: { bg: DesignSystem.colors.accent, text: '#FFFFFF' },
    gradient: { bg: 'transparent', text: '#FFFFFF' },
  };

  const { bg, text } = variantColors[variant];
  const { paddingVertical, paddingHorizontal, fontSize } = sizeStyles[size];

  const buttonStyle = [
    styles.button,
    {
      paddingVertical,
      paddingHorizontal,
      backgroundColor: variant === 'gradient' ? 'transparent' : bg,
      opacity: disabled || loading ? 0.5 : 1,
      width: fullWidth ? '100%' : 'auto',
    },
    style,
  ];

  const buttonContent = (
    <>
      {loading && <ActivityIndicator color={text} style={{ marginRight: 8 }} />}
      {icon && !loading && icon}
      <Text style={[styles.text, { color: text, fontSize }, textStyle]}>
        {title}
      </Text>
    </>
  );

  if (variant === 'gradient') {
    return (
      <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
        >
          <LinearGradient
            colors={DesignSystem.colors.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={buttonStyle}
          >
            {buttonContent}
          </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <Pressable
        style={buttonStyle}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
      >
        {buttonContent}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: DesignSystem.borderRadius.medium,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...DesignSystem.shadows.small,
  },
  text: {
    fontWeight: DesignSystem.typography.fontWeight.semibold,
  },
});

