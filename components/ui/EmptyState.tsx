import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AnimatedButton } from './AnimatedButton';
import { DesignSystem, getColors } from '@/constants/designSystem';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionTitle?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionTitle,
  onAction,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getColors(isDark);

  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: isDark ? '#313338' : '#F2F3F5' }]}>
        <Ionicons name={icon} size={48} color={colors.textSecondary} />
      </View>
      
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        {description}
      </Text>

      {actionTitle && onAction && (
        <AnimatedButton
          title={actionTitle}
          onPress={onAction}
          variant="gradient"
          size="medium"
          style={styles.button}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DesignSystem.spacing.xxxl,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.xl,
  },
  title: {
    fontSize: DesignSystem.typography.fontSize.xxl,
    fontWeight: DesignSystem.typography.fontWeight.bold,
    marginBottom: DesignSystem.spacing.sm,
    textAlign: 'center',
  },
  description: {
    fontSize: DesignSystem.typography.fontSize.md,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: DesignSystem.spacing.xxl,
    maxWidth: 300,
  },
  button: {
    marginTop: DesignSystem.spacing.md,
  },
});

