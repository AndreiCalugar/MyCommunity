import { supabase } from '../supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface ChatMessage {
  id: string;
  community_id: string;
  user_id: string;
  message: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  profile: {
    full_name: string;
    avatar_url?: string;
  };
}

/**
 * Fetch chat messages for a community with pagination
 */
export const fetchMessages = async (
  communityId: string,
  limit: number = 50,
  offset: number = 0
): Promise<ChatMessage[]> => {
  // First, get the conversation_id for this community
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('id')
    .eq('type', 'community')
    .eq('community_id', communityId)
    .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 rows gracefully

  if (convError) {
    console.error('Error fetching conversation:', convError);
    throw convError;
  }

  // If no conversation exists yet, return empty array (no messages yet)
  if (!conversation) {
    return [];
  }

  // Fetch messages using conversation_id
  const { data: messages, error } = await supabase
    .from('chat_messages')
    .select('id, community_id, conversation_id, user_id, message, created_at, updated_at, deleted_at')
    .eq('conversation_id', conversation.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }

  if (!messages || messages.length === 0) {
    return [];
  }

  // Fetch profiles for all user_ids
  const userIds = [...new Set(messages.map((m) => m.user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', userIds);

  // Create a profile map for quick lookup
  const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

  // Merge messages with profiles and reverse to show oldest first
  return messages
    .map((message) => ({
      ...message,
      profile: profileMap.get(message.user_id) || {
        full_name: 'Unknown',
        avatar_url: undefined,
      },
    }))
    .reverse(); // Reverse to show oldest first
};

/**
 * Send a chat message
 */
export const sendMessage = async (
  communityId: string,
  userId: string,
  message: string
): Promise<ChatMessage | null> => {
  // First, get or create the conversation_id for this community
  let { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('id')
    .eq('type', 'community')
    .eq('community_id', communityId)
    .maybeSingle(); // Use maybeSingle() to handle 0 rows gracefully

  if (convError) {
    console.error('Error fetching conversation:', convError);
    throw convError;
  }

  // If no conversation exists, create one
  if (!conversation) {
    const { data: newConversation, error: createError } = await supabase
      .from('conversations')
      .insert({ type: 'community', community_id: communityId })
      .select('id')
      .single();

    if (createError || !newConversation) {
      console.error('Error creating conversation:', createError);
      throw createError || new Error('Failed to create conversation');
    }

    conversation = newConversation;
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      community_id: communityId,
      conversation_id: conversation.id,
      user_id: userId,
      message,
    })
    .select()
    .single();

  if (error) {
    console.error('Error sending message:', error);
    throw error;
  }

  // Fetch the sender's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', userId)
    .single();

  return {
    ...data,
    profile: profile || { full_name: 'Unknown', avatar_url: undefined },
  };
};

/**
 * Soft delete a message (mark as deleted)
 */
export const deleteMessage = async (messageId: string): Promise<void> => {
  const { error } = await supabase
    .from('chat_messages')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', messageId);

  if (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time chat messages
 */
export const subscribeToMessages = (
  communityId: string,
  onMessage: (message: ChatMessage) => void,
  onDelete: (messageId: string) => void
): RealtimeChannel => {
  const channel = supabase
    .channel(`chat:${communityId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `community_id=eq.${communityId}`,
      },
      async (payload) => {
        // Fetch the user profile for the new message
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', payload.new.user_id)
          .single();

        const newMessage: ChatMessage = {
          ...(payload.new as any),
          profile: profile || { full_name: 'Unknown', avatar_url: undefined },
        };

        onMessage(newMessage);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_messages',
        filter: `community_id=eq.${communityId}`,
      },
      (payload) => {
        // Handle message deletion
        if (payload.new.deleted_at) {
          onDelete(payload.new.id);
        }
      }
    )
    .subscribe();

  return channel;
};

/**
 * Unsubscribe from real-time messages
 */
export const unsubscribeFromMessages = async (channel: RealtimeChannel): Promise<void> => {
  await supabase.removeChannel(channel);
};

