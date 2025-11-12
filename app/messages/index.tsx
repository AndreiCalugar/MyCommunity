import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/lib/stores/authStore';
import { Avatar } from '@/components/shared/Avatar';
import { fetchConversations, Conversation } from '@/lib/api/conversations';

const formatMessageTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function MessagesInboxScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuthStore();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const colors = {
    background: isDark ? '#1E1F22' : '#FFFFFF',
    surface: isDark ? '#2B2D31' : '#F2F3F5',
    text: isDark ? '#FFFFFF' : '#060607',
    secondaryText: isDark ? '#B5BAC1' : '#4E5058',
    border: isDark ? '#4E5058' : '#E0E0E0',
    accent: '#5865F2',
  };

  const loadConversations = async () => {
    if (!user) return;

    try {
      const convos = await fetchConversations(user.id);
      setConversations(convos);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const handleConversationPress = (conversation: Conversation) => {
    if (conversation.type === 'community' && conversation.community_id) {
      // Navigate to community chat
      router.push(`/community/${conversation.community_id}/chat`);
    } else {
      // Navigate to direct message chat
      router.push(`/chat/${conversation.id}`);
    }
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const hasUnread = (item.unread_count || 0) > 0;
    const lastMessage = item.last_message?.message;
    const lastMessageTime = item.last_message?.created_at;

    return (
      <Pressable
        style={[styles.conversationCard, { backgroundColor: colors.surface }]}
        onPress={() => handleConversationPress(item)}
        android_ripple={{ color: colors.border }}
      >
        <Avatar
          imageUrl={item.avatar_url}
          name={item.name || 'Unknown'}
          size="medium"
        />

        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <Text
              style={[
                styles.conversationName,
                { color: colors.text },
                hasUnread && styles.unreadText,
              ]}
              numberOfLines={1}
            >
              {item.name || 'Unknown'}
            </Text>
            {lastMessageTime && (
              <Text style={[styles.timeText, { color: colors.secondaryText }]}>
                {formatMessageTime(lastMessageTime)}
              </Text>
            )}
          </View>

          <View style={styles.messagePreview}>
            <Text
              style={[
                styles.lastMessage,
                { color: colors.secondaryText },
                hasUnread && styles.unreadText,
              ]}
              numberOfLines={1}
            >
              {lastMessage || 'No messages yet'}
            </Text>
            {hasUnread && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.accent }]}>
                <Text style={styles.unreadCount}>
                  {(item.unread_count || 0) > 99 ? '99+' : item.unread_count}
                </Text>
              </View>
            )}
          </View>

          {item.type === 'community' && (
            <View style={styles.typeIndicator}>
              <Ionicons name="people-outline" size={12} color={colors.secondaryText} />
              <Text style={[styles.typeText, { color: colors.secondaryText }]}>
                Community
              </Text>
            </View>
          )}
        </View>

        <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />
      </Pressable>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={64} color={colors.secondaryText} />
      <Text style={[styles.emptyText, { color: colors.text }]}>
        No messages yet
      </Text>
      <Text style={[styles.emptySubtext, { color: colors.secondaryText }]}>
        Start a conversation by visiting a user's profile
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            title: 'Messages',
            headerShown: true,
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Messages',
          headerShown: true,
        }}
      />

      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  conversationInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  timeText: {
    fontSize: 12,
    marginLeft: 8,
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    flex: 1,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadCount: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  unreadText: {
    fontWeight: 'bold',
  },
  typeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  typeText: {
    fontSize: 11,
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

