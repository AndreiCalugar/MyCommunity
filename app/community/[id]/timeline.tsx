import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/lib/stores/authStore';
import {
  fetchPosts,
  createPost,
  deletePost,
  likePost,
  unlikePost,
  subscribeToPosts,
  Post,
} from '@/lib/api/posts';
import { PostCard } from '@/components/posts/PostCard';
import { CreatePostModal } from '@/components/posts/CreatePostModal';
import { CommentsModal } from '@/components/posts/CommentsModal';
import { Ionicons } from '@expo/vector-icons';

export default function TimelineScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingPostId, setLoadingPostId] = useState<string | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const colors = {
    background: isDark ? '#1E1F22' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#060607',
    secondaryText: isDark ? '#B5BAC1' : '#4E5058',
  };

  useEffect(() => {
    if (params.id) {
      loadPosts();

      // Subscribe to real-time updates
      const subscription = subscribeToPosts(params.id, (payload) => {
        console.log('Post update:', payload);
        loadPosts();
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [params.id]);

  const loadPosts = async () => {
    if (!params.id) return;

    try {
      setLoading(true);
      const data = await fetchPosts(params.id, user?.id);
      setPosts(data);
    } catch (error: any) {
      console.error('Error loading posts:', error);
      // Check if it's a permission error (not a member)
      if (error.message?.includes('permission') || error.code === 'PGRST301') {
        Alert.alert(
          'Join Required',
          'You need to join this community to view posts. Go back and tap the Join button.'
        );
      } else {
        Alert.alert('Error', 'Failed to load posts');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPosts();
  };

  const handleCreatePost = async (content: string, imageUri?: string) => {
    if (!params.id || !user) return;

    try {
      const newPost = await createPost(params.id, user.id, content, imageUri);
      setPosts([newPost, ...posts]);
    } catch (error: any) {
      console.error('Error creating post:', error);
      throw error;
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deletePost(postId);
      setPosts(posts.filter((p) => p.id !== postId));
    } catch (error: any) {
      console.error('Error deleting post:', error);
      Alert.alert('Error', 'Failed to delete post');
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;

    setLoadingPostId(postId);
    try {
      await likePost(postId, user.id);
      
      // Optimistic update
      setPosts(
        posts.map((p) =>
          p.id === postId
            ? {
                ...p,
                likes_count: p.likes_count + 1,
                user_has_liked: true,
              }
            : p
        )
      );
    } catch (error: any) {
      console.error('Error liking post:', error);
      Alert.alert('Error', 'Failed to like post');
    } finally {
      setLoadingPostId(null);
    }
  };

  const handleUnlike = async (postId: string) => {
    if (!user) return;

    setLoadingPostId(postId);
    try {
      await unlikePost(postId, user.id);
      
      // Optimistic update
      setPosts(
        posts.map((p) =>
          p.id === postId
            ? {
                ...p,
                likes_count: Math.max(0, p.likes_count - 1),
                user_has_liked: false,
              }
            : p
        )
      );
    } catch (error: any) {
      console.error('Error unliking post:', error);
      Alert.alert('Error', 'Failed to unlike post');
    } finally {
      setLoadingPostId(null);
    }
  };

  const handleComment = (postId: string) => {
    setSelectedPostId(postId);
    setCommentsModalVisible(true);
  };

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      currentUserId={user?.id}
      onLike={handleLike}
      onUnlike={handleUnlike}
      onComment={handleComment}
      onDelete={handleDeletePost}
      loading={loadingPostId === item.id}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="newspaper-outline" size={64} color={colors.secondaryText} />
      <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
        No posts yet
      </Text>
      <Text style={[styles.emptySubtext, { color: colors.secondaryText }]}>
        Be the first to share something!
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#5865F2" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#5865F2"
          />
        }
        ListEmptyComponent={renderEmpty}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setCreateModalVisible(true)}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Create Post Modal */}
      <CreatePostModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSubmit={handleCreatePost}
      />

      {/* Comments Modal */}
      <CommentsModal
        visible={commentsModalVisible}
        postId={selectedPostId}
        currentUserId={user?.id}
        onClose={() => {
          setCommentsModalVisible(false);
          setSelectedPostId(null);
          // Reload posts to update comment counts
          loadPosts();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  emptyContainer: {
    paddingVertical: 64,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#5865F2',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});

