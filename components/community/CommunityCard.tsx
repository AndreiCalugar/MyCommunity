import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Community } from '@/lib/stores/communityStore';
import { Button } from '@/components/shared/Button';
import { Ionicons } from '@expo/vector-icons';

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

  const colors = {
    background: isDark ? '#2B2D31' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#060607',
    secondaryText: isDark ? '#B5BAC1' : '#4E5058',
    border: isDark ? '#4E5058' : '#E0E0E0',
  };

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
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.background, borderColor: colors.border },
      ]}
      onPress={handleCardPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      {/* Community Image */}
      <View style={styles.imageContainer}>
        {community.image_url ? (
          <Image
            source={{ uri: community.image_url }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: '#5865F2' }]}>
            <Ionicons name="people" size={32} color="#FFFFFF" />
          </View>
        )}
      </View>

      {/* Community Info */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {community.name}
          </Text>
          <View style={styles.memberCount}>
            <Ionicons name="people-outline" size={14} color={colors.secondaryText} />
            <Text style={[styles.memberCountText, { color: colors.secondaryText }]}>
              {community.member_count}
            </Text>
          </View>
        </View>

        <Text
          style={[styles.description, { color: colors.secondaryText }]}
          numberOfLines={2}
        >
          {community.short_description || community.description}
        </Text>

        {/* Join/Leave Button */}
        <View style={styles.actions}>
          <Button
            title={isMember ? 'Leave' : 'Join'}
            onPress={handleButtonPress}
            variant={isMember ? 'outline' : 'primary'}
            size="small"
            loading={loading}
            style={styles.button}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    width: '100%',
    height: 160,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberCountText: {
    fontSize: 14,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    minWidth: 80,
  },
});

