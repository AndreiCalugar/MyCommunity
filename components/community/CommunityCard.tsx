import React from 'react';
import { View, Text, StyleSheet, Image, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Community } from '@/lib/stores/communityStore';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { Ionicons } from '@expo/vector-icons';
import { DesignSystem, getColors } from '@/constants/designSystem';
import { EnhancedCard } from '@/components/ui/EnhancedCard';

interface CommunityCardProps {
  community: Community;
  isMember?: boolean;
  onJoin?: (communityId: string) => void;
  onLeave?: (communityId: string) => void;
  onPress?: (communityId: string) => void;
  loading?: boolean;
}

export const CommunityCard: React.FC<CommunityCardProps> = ({
  community,
  isMember = false,
  onJoin,
  onLeave,
  onPress,
  loading = false,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getColors(isDark);

  const handleCardPress = () => {
    if (onPress) {
      onPress(community.id);
    }
  };

  const handleButtonPress = () => {
    if (isMember && onLeave) {
      onLeave(community.id);
    } else if (!isMember && onJoin) {
      onJoin(community.id);
    }
  };

  return (
    <EnhancedCard
      onPress={handleCardPress}
      shadow="large"
      padding={0}
      style={styles.card}
    >
      {/* Community Image with Gradient Overlay */}
      <View style={styles.imageContainer}>
        {community.image_url ? (
          <>
            <Image
              source={{ uri: community.image_url }}
              style={styles.image}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.6)']}
              style={styles.imageGradient}
            />
          </>
        ) : (
          <LinearGradient
            colors={DesignSystem.colors.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.imagePlaceholder}
          >
            <Ionicons name="people" size={40} color="#FFFFFF" />
          </LinearGradient>
        )}
        
        {/* Member Count Badge */}
        <View style={[styles.memberBadge, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.95)' }]}>
          <Ionicons name="people" size={16} color={colors.text} />
          <Text style={[styles.memberBadgeText, { color: colors.text }]}>
            {community.member_count}
          </Text>
        </View>
      </View>

      {/* Community Info */}
      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {community.name}
        </Text>

        <Text
          style={[styles.description, { color: colors.textSecondary }]}
          numberOfLines={2}
        >
          {community.short_description || community.description}
        </Text>

        {/* Join/Leave Button */}
        <AnimatedButton
          title={isMember ? 'Leave' : 'Join Community'}
          onPress={handleButtonPress}
          variant={isMember ? 'secondary' : 'gradient'}
          size="medium"
          loading={loading}
          fullWidth
          icon={
            !loading ? (
              <Ionicons
                name={isMember ? 'exit-outline' : 'add-circle-outline'}
                size={18}
                color="#FFFFFF"
                style={{ marginRight: 8 }}
              />
            ) : undefined
          }
        />
      </View>
    </EnhancedCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: DesignSystem.spacing.lg,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberBadge: {
    position: 'absolute',
    top: DesignSystem.spacing.md,
    right: DesignSystem.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.borderRadius.round,
    gap: 4,
    ...DesignSystem.shadows.medium,
  },
  memberBadgeText: {
    fontSize: DesignSystem.typography.fontSize.sm,
    fontWeight: DesignSystem.typography.fontWeight.semibold,
  },
  content: {
    padding: DesignSystem.spacing.lg,
  },
  name: {
    fontSize: DesignSystem.typography.fontSize.xl,
    fontWeight: DesignSystem.typography.fontWeight.bold,
    marginBottom: DesignSystem.spacing.sm,
    letterSpacing: DesignSystem.typography.letterSpacing.tight,
  },
  description: {
    fontSize: DesignSystem.typography.fontSize.md,
    lineHeight: 22,
    marginBottom: DesignSystem.spacing.lg,
  },
});

