import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Avatar } from '../shared/Avatar';
import { Ionicons } from '@expo/vector-icons';
import { ChatMessage } from '@/lib/api/chat';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  colorScheme: 'light' | 'dark';
  onDelete?: (messageId: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  colorScheme,
  onDelete,
}) => {
  const isDark = colorScheme === 'dark';

  const colors = {
    ownBubble: '#5865F2',
    otherBubble: isDark ? '#2B2D31' : '#F2F3F5',
    ownText: '#FFFFFF',
    otherText: isDark ? '#FFFFFF' : '#060607',
    timestamp: isDark ? '#B5BAC1' : '#4E5058',
    name: isDark ? '#B5BAC1' : '#4E5058',
  };

  const handleLongPress = () => {
    if (isOwnMessage && onDelete) {
      Alert.alert('Delete Message', 'Are you sure you want to delete this message?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(message.id),
        },
      ]);
    }
  };

  const formatTime = (date: string) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      // Today: show time
      return messageDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    } else if (diffInHours < 48) {
      // Yesterday
      return 'Yesterday';
    } else if (diffInHours < 168) {
      // This week: show day
      return messageDate.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      // Older: show date
      return messageDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  return (
    <Pressable
      onLongPress={handleLongPress}
      style={[styles.container, isOwnMessage && styles.ownMessageContainer]}
    >
      {!isOwnMessage && (
        <Avatar
          imageUrl={message.profile.avatar_url}
          name={message.profile.full_name}
          size="small"
        />
      )}
      <View style={styles.messageContent}>
        {!isOwnMessage && (
          <Text style={[styles.senderName, { color: colors.name }]}>
            {message.profile.full_name}
          </Text>
        )}
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: isOwnMessage ? colors.ownBubble : colors.otherBubble,
            },
            isOwnMessage && styles.ownBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              { color: isOwnMessage ? colors.ownText : colors.otherText },
            ]}
          >
            {message.message}
          </Text>
          <Text
            style={[
              styles.timestamp,
              {
                color: isOwnMessage ? 'rgba(255,255,255,0.7)' : colors.timestamp,
              },
            ]}
          >
            {formatTime(message.created_at)}
          </Text>
        </View>
      </View>
      {isOwnMessage && <View style={styles.spacer} />}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 12,
    alignItems: 'flex-end',
  },
  ownMessageContainer: {
    flexDirection: 'row-reverse',
  },
  messageContent: {
    flex: 1,
    marginHorizontal: 8,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
    marginLeft: 12,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    maxWidth: '80%',
  },
  ownBubble: {
    alignSelf: 'flex-end',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  spacer: {
    width: 40,
  },
});

