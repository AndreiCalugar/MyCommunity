import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Avatar } from '@/components/shared/Avatar';
import { Button } from '@/components/shared/Button';
import { Ionicons } from '@expo/vector-icons';
import { fetchComments, createComment, deleteComment, Comment } from '@/lib/api/posts';

interface CommentsModalProps {
  visible: boolean;
  postId: string | null;
  currentUserId?: string;
  onClose: () => void;
}

export const CommentsModal: React.FC<CommentsModalProps> = ({
  visible,
  postId,
  currentUserId,
  onClose,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const colors = {
    background: isDark ? '#1E1F22' : '#FFFFFF',
    surface: isDark ? '#2B2D31' : '#F2F3F5',
    text: isDark ? '#FFFFFF' : '#060607',
    secondaryText: isDark ? '#B5BAC1' : '#4E5058',
    border: isDark ? '#4E5058' : '#E0E0E0',
  };

  useEffect(() => {
    if (visible && postId) {
      loadComments();
    }
  }, [visible, postId]);

  const loadComments = async () => {
    if (!postId) return;

    setLoading(true);
    try {
      const data = await fetchComments(postId);
      setComments(data);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!postId || !currentUserId || !newComment.trim()) return;

    setSubmitting(true);
    try {
      const comment = await createComment(postId, currentUserId, newComment.trim());
      setComments([...comments, comment]);
      setNewComment('');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    Alert.alert('Delete Comment', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteComment(commentId);
            setComments(comments.filter((c) => c.id !== commentId));
          } catch (error) {
            Alert.alert('Error', 'Failed to delete comment');
          }
        },
      },
    ]);
  };

  const timeAgo = (date: string) => {
    const now = new Date();
    const commentDate = new Date(date);
    const seconds = Math.floor((now.getTime() - commentDate.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return commentDate.toLocaleDateString();
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={[styles.commentCard, { backgroundColor: colors.surface }]}>
      <Avatar
        imageUrl={item.profile?.avatar_url}
        name={item.profile?.full_name || 'Unknown'}
        size="small"
      />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={[styles.commentAuthor, { color: colors.text }]}>
            {item.profile?.full_name || 'Unknown'}
          </Text>
          <Text style={[styles.commentTime, { color: colors.secondaryText }]}>
            {timeAgo(item.created_at)}
          </Text>
        </View>
        <Text style={[styles.commentText, { color: colors.text }]}>{item.content}</Text>
      </View>
      {currentUserId === item.user_id && (
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={16} color={colors.secondaryText} />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={48} color={colors.secondaryText} />
      <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
        No comments yet. Be the first!
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Comments ({comments.length})
          </Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Comments List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#5865F2" />
          </View>
        ) : (
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
            renderItem={renderComment}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmpty}
          />
        )}

        {/* Input */}
        <View style={[styles.inputContainer, { borderTopColor: colors.border }]}>
          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
            placeholder="Write a comment..."
            placeholderTextColor={colors.secondaryText}
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!newComment.trim() || submitting}
            style={[
              styles.sendButton,
              (!newComment.trim() || submitting) && styles.sendButtonDisabled,
            ]}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  commentCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  commentContent: {
    flex: 1,
    marginLeft: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentTime: {
    fontSize: 12,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  deleteButton: {
    padding: 4,
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#5865F2',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

