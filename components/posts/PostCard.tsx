import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Post } from '@/lib/api/posts';
import { Avatar } from '@/components/shared/Avatar';
import { Ionicons } from '@expo/vector-icons';

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

  const colors = {
    background: isDark ? '#2B2D31' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#060607',
    secondaryText: isDark ? '#B5BAC1' : '#4E5058',
    border: isDark ? '#4E5058' : '#E0E0E0',
    likeActive: '#ED4245',
  };

  const isOwnPost = currentUserId === post.user_id;
  const hasLiked = post.user_has_liked;

  const handleLike = () => {
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
    <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
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
          <Text style={[styles.timestamp, { color: colors.secondaryText }]}>
            {timeAgo(post.created_at)}
          </Text>
        </View>
        {isOwnPost && (
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={20} color={colors.secondaryText} />
          </TouchableOpacity>
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
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleLike}
          disabled={loading}
        >
          <Ionicons
            name={hasLiked ? 'heart' : 'heart-outline'}
            size={22}
            color={hasLiked ? colors.likeActive : colors.secondaryText}
          />
          <Text
            style={[
              styles.actionText,
              { color: hasLiked ? colors.likeActive : colors.secondaryText },
            ]}
          >
            {post.likes_count}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onComment(post.id)}
        >
          <Ionicons name="chatbubble-outline" size={20} color={colors.secondaryText} />
          <Text style={[styles.actionText, { color: colors.secondaryText }]}>
            {post.comments_count}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 4,
  },
  content: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: 8,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

