import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Text,
  Alert,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/lib/stores/authStore';
import {
  fetchConversationMessages,
  sendMessageToConversation,
  deleteConversationMessage,
  subscribeToConversation,
  unsubscribeFromConversation,
  markConversationAsRead,
  getConversationDetails,
  Message,
  Conversation,
} from '@/lib/api/conversations';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Avatar } from '@/components/shared/Avatar';

export default function DirectMessageChatScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useLocalSearchParams<{ conversationId: string }>();
  const { user } = useAuthStore();
  const flatListRef = useRef<FlatList>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const colors = {
    background: isDark ? '#1E1F22' : '#FFFFFF',
    surface: isDark ? '#2B2D31' : '#F2F3F5',
    text: isDark ? '#FFFFFF' : '#060607',
    secondaryText: isDark ? '#B5BAC1' : '#4E5058',
    border: isDark ? '#4E5058' : '#E0E0E0',
  };

  useEffect(() => {
    if (params.conversationId && user) {
      loadConversation();
      loadMessages();
      setupRealtimeSubscription();
      markAsRead();
    }

    return () => {
      if (channelRef.current) {
        unsubscribeFromConversation(channelRef.current);
      }
    };
  }, [params.conversationId]);

  const loadConversation = async () => {
    if (!params.conversationId || !user) return;

    try {
      const data = await getConversationDetails(params.conversationId, user.id);
      setConversation(data);
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const loadMessages = async () => {
    if (!params.conversationId) return;

    try {
      setLoading(true);
      const data = await fetchConversationMessages(params.conversationId);
      setMessages(data);
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    } catch (error: any) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    if (!params.conversationId || !user) return;

    try {
      await markConversationAsRead(params.conversationId, user.id);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!params.conversationId) return;

    const channel = subscribeToConversation(params.conversationId, (payload) => {
      if (payload.eventType === 'INSERT') {
        loadMessages(); // Reload to get profile info
      } else if (payload.eventType === 'UPDATE' && payload.new.deleted_at) {
        // Remove deleted message
        setMessages((prev) => prev.filter((m) => m.id !== payload.new.id));
      }
    });

    channelRef.current = channel;
  };

  const handleSend = async (message: string) => {
    if (!params.conversationId || !user) return;

    try {
      setSending(true);
      await sendMessageToConversation(params.conversationId, user.id, message);
      // Realtime will handle adding the message
    } catch (error: any) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (messageId: string) => {
    Alert.alert('Delete Message', 'Are you sure you want to delete this message?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteConversationMessage(messageId);
            // Realtime will handle removing the message
          } catch (error: any) {
            console.error('Error deleting message:', error);
            Alert.alert('Error', 'Failed to delete message');
          }
        },
      },
    ]);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <MessageBubble
      message={item}
      isOwnMessage={item.user_id === user?.id}
      onDelete={() => handleDelete(item.id)}
      colorScheme={colorScheme}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={64} color={colors.secondaryText} />
      <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
        No messages yet
      </Text>
      <Text style={[styles.emptySubtext, { color: colors.secondaryText }]}>
        Send a message to start the conversation
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
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        
        {conversation && (
          <View style={styles.headerInfo}>
            <Avatar
              imageUrl={conversation.avatar_url}
              name={conversation.name || 'Unknown'}
              size="small"
            />
            <View style={styles.headerText}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {conversation.name}
              </Text>
              {conversation.type === 'direct' && (
                <Text style={[styles.headerSubtitle, { color: colors.secondaryText }]}>
                  Direct Message
                </Text>
              )}
            </View>
          </View>
        )}
        
        <View style={styles.backButton} />
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesContent}
        ListEmptyComponent={renderEmpty}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        keyboardDismissMode="interactive"
      />

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        disabled={sending}
        colorScheme={colorScheme}
      />
    </KeyboardAvoidingView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  messagesContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});

