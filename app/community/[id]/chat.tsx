import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Text,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useGlobalSearchParams } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/lib/stores/authStore';
import {
  fetchMessages,
  sendMessage,
  deleteMessage,
  subscribeToMessages,
  unsubscribeFromMessages,
  ChatMessage,
} from '@/lib/api/chat';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { RealtimeChannel } from '@supabase/supabase-js';

export default function CommunityChatScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useGlobalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const flatListRef = useRef<FlatList>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const colors = {
    background: isDark ? '#1E1F22' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#060607',
    secondaryText: isDark ? '#B5BAC1' : '#4E5058',
  };

  useEffect(() => {
    if (params.id) {
      loadMessages();
      setupRealtimeSubscription();
    }

    return () => {
      if (channelRef.current) {
        unsubscribeFromMessages(channelRef.current);
      }
    };
  }, [params.id]);

  const loadMessages = async () => {
    if (!params.id) return;

    try {
      setLoading(true);
      const messagesData = await fetchMessages(params.id as string);
      setMessages(messagesData);
      // Scroll to bottom after loading
      setTimeout(() => scrollToBottom(), 100);
    } catch (error: any) {
      console.error('Error loading messages:', error);
      if (error.message?.includes('permission') || error.code === 'PGRST301') {
        Alert.alert(
          'Join Required',
          'You need to join this community to view chat. Go back and tap the Join button.'
        );
      } else {
        Alert.alert('Error', 'Failed to load messages');
      }
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!params.id) return;

    channelRef.current = subscribeToMessages(
      params.id as string,
      (newMessage) => {
        setMessages((prev) => [...prev, newMessage]);
        scrollToBottom();
      },
      (messageId) => {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      }
    );
  };

  const handleSendMessage = async (message: string) => {
    if (!params.id || !user) return;

    try {
      setSending(true);
      await sendMessage(params.id as string, user.id, message);
      // Message will be added via realtime subscription
    } catch (error: any) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessage(messageId);
      // Message will be removed via realtime subscription
    } catch (error: any) {
      console.error('Error deleting message:', error);
      Alert.alert('Error', 'Failed to delete message');
    }
  };

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <MessageBubble
      message={item}
      isOwnMessage={item.user_id === user?.id}
      colorScheme={colorScheme}
      onDelete={handleDeleteMessage}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
        No messages yet. Start the conversation!
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
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        ListEmptyComponent={renderEmpty}
        onContentSizeChange={scrollToBottom}
        onLayout={scrollToBottom}
        keyboardShouldPersistTaps="handled"
      />
      <ChatInput onSend={handleSendMessage} colorScheme={colorScheme} disabled={sending} />
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
  messageList: {
    paddingVertical: 12,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
  },
});

