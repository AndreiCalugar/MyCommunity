import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  Pressable,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Post } from '@/lib/api/posts';
import { Avatar } from '@/components/shared/Avatar';
import { Ionicons } from '@expo/vector-icons';
import { EnhancedCard } from '@/components/ui/EnhancedCard';
import { DesignSystem, getColors } from '@/constants/designSystem';

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  onLike: (postId: string) => void;
  onUnlike: (postId: string) => void;
  onComment: (postId: string) => void;
  onDelete: (postId: string) => void;
  loading?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  onLike,
  onUnlike,
  onComment,
  onDelete,
  loading = false,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getColors(isDark);
  const likeScale = useRef(new Animated.Value(1)).current;

  const isOwnPost = currentUserId === post.user_id;
  const hasLiked = post.user_has_liked;

  const handleLike = () => {
    // Animate heart
    Animated.sequence([
      Animated.timing(likeScale, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(likeScale, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();

    if (hasLiked) {
      onUnlike(post.id);
    } else {
      onLike(post.id);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDelete(post.id),
      },
    ]);
  };

  const timeAgo = (date: string) => {
    const now = new Date();
    const postDate = new Date(date);
    const seconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return postDate.toLocaleDateString();
  };

  const handleUserPress = () => {
    if (post.user_id) {
      router.push(`/user/${post.user_id}`);
    }
  };

  return (
    <EnhancedCard shadow="medium" style={styles.card} pressable={false}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleUserPress}>
          <Avatar
            imageUrl={post.profile?.avatar_url}
            name={post.profile?.full_name || 'Unknown'}
            size="medium"
          />
        </Pressable>
        <View style={styles.headerInfo}>
          <Pressable onPress={handleUserPress}>
            <Text style={[styles.authorName, { color: colors.text }]}>
              {post.profile?.full_name || 'Unknown User'}
            </Text>
          </Pressable>
          <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
            {timeAgo(post.created_at)}
          </Text>
        </View>
        {isOwnPost && (
          <Pressable onPress={handleDelete} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={22} color={DesignSystem.colors.danger} />
          </Pressable>
        )}
      </View>

      {/* Content */}
      <Text style={[styles.content, { color: colors.text }]}>{post.content}</Text>

      {/* Image */}
      {post.image_url && (
        <Image source={{ uri: post.image_url }} style={styles.image} resizeMode="cover" />
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          style={styles.actionButton}
          onPress={handleLike}
          disabled={loading}
          android_ripple={{ color: 'rgba(237, 66, 69, 0.1)' }}
        >
          <Animated.View style={{ transform: [{ scale: likeScale }] }}>
            <Ionicons
              name={hasLiked ? 'heart' : 'heart-outline'}
              size={24}
              color={hasLiked ? DesignSystem.colors.danger : colors.textSecondary}
            />
          </Animated.View>
          <Text
            style={[
              styles.actionText,
              { color: hasLiked ? DesignSystem.colors.danger : colors.textSecondary },
            ]}
          >
            {post.likes_count}
          </Text>
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={() => onComment(post.id)}
          android_ripple={{ color: 'rgba(88, 101, 242, 0.1)' }}
        >
          <Ionicons name="chatbubble-outline" size={22} color={colors.textSecondary} />
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>
            {post.comments_count}
          </Text>
        </Pressable>
      </View>
    </EnhancedCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: DesignSystem.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.md,
  },
  headerInfo: {
    flex: 1,
    marginLeft: DesignSystem.spacing.md,
  },
  authorName: {
    fontSize: DesignSystem.typography.fontSize.md,
    fontWeight: DesignSystem.typography.fontWeight.semibold,
    marginBottom: 2,
  },
  timestamp: {
    fontSize: DesignSystem.typography.fontSize.xs,
  },
  deleteButton: {
    padding: DesignSystem.spacing.xs,
  },
  content: {
    fontSize: DesignSystem.typography.fontSize.md,
    lineHeight: 22,
    marginBottom: DesignSystem.spacing.md,
  },
  image: {
    width: '100%',
    height: 280,
    borderRadius: DesignSystem.borderRadius.medium,
    marginBottom: DesignSystem.spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: DesignSystem.spacing.xl,
    paddingTop: DesignSystem.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.xs,
    paddingHorizontal: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.medium,
  },
  actionText: {
    fontSize: DesignSystem.typography.fontSize.md,
    fontWeight: DesignSystem.typography.fontWeight.semibold,
  },
});

