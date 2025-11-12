import { supabase } from '../supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Conversation {
  id: string;
  type: 'community' | 'direct';
  community_id: string | null;
  created_at: string;
  updated_at: string;
  last_message?: {
    message: string;
    created_at: string;
    user_id: string;
  };
  participant_count: number;
  // For display purposes
  name?: string;
  avatar_url?: string;
  unread_count?: number;
  participants?: ConversationParticipant[];
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  last_read_at: string;
  is_muted: boolean;
  profile?: {
    full_name: string;
    avatar_url?: string;
  };
}

export interface Message {
  id: string;
  conversation_id: string;
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
 * Get or create a direct conversation between two users
 */
export const getOrCreateDirectConversation = async (
  currentUserId: string,
  otherUserId: string
): Promise<string> => {
  try {
    const { data, error } = await supabase.rpc('get_or_create_direct_conversation', {
      user1_id: currentUserId,
      user2_id: otherUserId,
    });

    if (error) {
      console.error('Error getting/creating conversation:', error);
      throw error;
    }

    return data as string;
  } catch (error) {
    console.error('Error in getOrCreateDirectConversation:', error);
    throw error;
  }
};

/**
 * Fetch all conversations for a user
 */
export const fetchConversations = async (userId: string): Promise<Conversation[]> => {
  try {
    // Get all conversations the user is part of
    const { data: participantData, error: participantError } = await supabase
      .from('conversation_participants')
      .select('conversation_id, last_read_at')
      .eq('user_id', userId);

    if (participantError) throw participantError;
    if (!participantData || participantData.length === 0) return [];

    const conversationIds = participantData.map((p) => p.conversation_id);
    const lastReadMap = new Map(
      participantData.map((p) => [p.conversation_id, p.last_read_at])
    );

    // Fetch conversation details
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id, type, community_id, created_at, updated_at')
      .in('id', conversationIds)
      .order('updated_at', { ascending: false });

    if (convError) throw convError;
    if (!conversations) return [];

    // Fetch community info for community conversations
    const communityIds = conversations
      .filter((c) => c.type === 'community' && c.community_id)
      .map((c) => c.community_id!);

    let communityMap = new Map();
    if (communityIds.length > 0) {
      const { data: communities } = await supabase
        .from('communities')
        .select('id, name, image_url')
        .in('id', communityIds);
      if (communities) {
        communityMap = new Map(communities.map((c) => [c.id, c]));
      }
    }

    // Fetch participants for direct conversations
    const directConvIds = conversations
      .filter((c) => c.type === 'direct')
      .map((c) => c.id);

    let participantsMap = new Map<string, ConversationParticipant[]>();
    if (directConvIds.length > 0) {
      const { data: allParticipants } = await supabase
        .from('conversation_participants')
        .select('id, conversation_id, user_id, joined_at, last_read_at, is_muted')
        .in('conversation_id', directConvIds);

      if (allParticipants) {
        // Fetch profiles for all participants
        const userIds = [...new Set(allParticipants.map((p) => p.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

        // Group participants by conversation
        allParticipants.forEach((p) => {
          const profile = profileMap.get(p.user_id);
          const participant: ConversationParticipant = {
            ...p,
            profile: profile
              ? { full_name: profile.full_name, avatar_url: profile.avatar_url }
              : { full_name: 'Unknown User' },
          };

          if (!participantsMap.has(p.conversation_id)) {
            participantsMap.set(p.conversation_id, []);
          }
          participantsMap.get(p.conversation_id)!.push(participant);
        });
      }
    }

    // Fetch last message for each conversation
    const { data: lastMessages } = await supabase
      .from('chat_messages')
      .select('conversation_id, message, created_at, user_id')
      .in('conversation_id', conversationIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    const lastMessageMap = new Map();
    lastMessages?.forEach((msg) => {
      if (!lastMessageMap.has(msg.conversation_id)) {
        lastMessageMap.set(msg.conversation_id, msg);
      }
    });

    // Count unread messages for each conversation
    const unreadCountsMap = new Map<string, number>();
    for (const conv of conversations) {
      const lastReadAt = lastReadMap.get(conv.id);
      if (lastReadAt) {
        const { count } = await supabase
          .from('chat_messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .is('deleted_at', null)
          .neq('user_id', userId) // Don't count own messages
          .gt('created_at', lastReadAt);

        unreadCountsMap.set(conv.id, count || 0);
      }
    }

    // Build result
    const result: Conversation[] = conversations.map((conv) => {
      const lastMessage = lastMessageMap.get(conv.id);
      const participants = participantsMap.get(conv.id) || [];
      const unreadCount = unreadCountsMap.get(conv.id) || 0;

      let name = '';
      let avatar_url = '';

      if (conv.type === 'community') {
        const community = communityMap.get(conv.community_id!);
        name = community?.name || 'Unknown Community';
        avatar_url = community?.image_url || '';
      } else {
        // For direct messages, show the other person's info
        const otherParticipant = participants.find((p) => p.user_id !== userId);
        name = otherParticipant?.profile?.full_name || 'Unknown User';
        avatar_url = otherParticipant?.profile?.avatar_url || '';
      }

      return {
        ...conv,
        last_message: lastMessage,
        participant_count: participants.length || 0,
        name,
        avatar_url,
        unread_count: unreadCount,
        participants,
      };
    });

    return result;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
};

/**
 * Fetch messages for a conversation
 */
export const fetchConversationMessages = async (
  conversationId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Message[]> => {
  try {
    // Fetch messages
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('id, conversation_id, user_id, message, created_at, updated_at, deleted_at')
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    if (!messages || messages.length === 0) return [];

    // Fetch profiles
    const userIds = [...new Set(messages.map((m) => m.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', userIds);

    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    // Merge profiles with messages
    const result: Message[] = messages.map((m) => {
      const profile = profileMap.get(m.user_id);
      return {
        ...m,
        profile: profile
          ? { full_name: profile.full_name, avatar_url: profile.avatar_url }
          : { full_name: 'Unknown User' },
      };
    });

    return result.reverse(); // Return in chronological order
  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    throw error;
  }
};

/**
 * Send a message to a conversation
 */
export const sendMessageToConversation = async (
  conversationId: string,
  userId: string,
  message: string
): Promise<Message> => {
  try {
    // Insert message
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        user_id: userId,
        message,
        community_id: null, // Legacy field, keep null
      })
      .select()
      .single();

    if (error) throw error;

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', userId)
      .single();

    // Update conversation updated_at
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return {
      ...data,
      profile: profile || { full_name: 'Unknown User' },
    };
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Mark conversation as read
 */
export const markConversationAsRead = async (
  conversationId: string,
  userId: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    throw error;
  }
};

/**
 * Get total unread message count for a user
 */
export const getUnreadCount = async (userId: string): Promise<number> => {
  try {
    const { data: participants } = await supabase
      .from('conversation_participants')
      .select('conversation_id, last_read_at')
      .eq('user_id', userId);

    if (!participants || participants.length === 0) return 0;

    let totalUnread = 0;

    for (const p of participants) {
      const { count } = await supabase
        .from('chat_messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', p.conversation_id)
        .is('deleted_at', null)
        .neq('user_id', userId)
        .gt('created_at', p.last_read_at);

      totalUnread += count || 0;
    }

    return totalUnread;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

/**
 * Delete a message (soft delete)
 */
export const deleteConversationMessage = async (messageId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('chat_messages')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', messageId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

/**
 * Subscribe to conversation updates (real-time)
 */
export const subscribeToConversation = (
  conversationId: string,
  callback: (payload: any) => void
): RealtimeChannel => {
  const channel = supabase
    .channel(`conversation:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chat_messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      callback
    )
    .subscribe();

  return channel;
};

/**
 * Unsubscribe from conversation updates
 */
export const unsubscribeFromConversation = (channel: RealtimeChannel): void => {
  channel.unsubscribe();
};

/**
 * Get conversation details
 */
export const getConversationDetails = async (
  conversationId: string,
  userId: string
): Promise<Conversation | null> => {
  try {
    const { data: conv, error } = await supabase
      .from('conversations')
      .select('id, type, community_id, created_at, updated_at')
      .eq('id', conversationId)
      .single();

    if (error) throw error;
    if (!conv) return null;

    // Fetch participants
    const { data: participants } = await supabase
      .from('conversation_participants')
      .select('id, conversation_id, user_id, joined_at, last_read_at, is_muted')
      .eq('conversation_id', conversationId);

    if (participants) {
      const userIds = participants.map((p) => p.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      const participantsWithProfiles = participants.map((p) => {
        const profile = profileMap.get(p.user_id);
        return {
          ...p,
          profile: profile
            ? { full_name: profile.full_name, avatar_url: profile.avatar_url }
            : { full_name: 'Unknown User' },
        };
      });

      let name = '';
      let avatar_url = '';

      if (conv.type === 'community' && conv.community_id) {
        const { data: community } = await supabase
          .from('communities')
          .select('name, image_url')
          .eq('id', conv.community_id)
          .single();
        name = community?.name || 'Unknown Community';
        avatar_url = community?.image_url || '';
      } else {
        const otherParticipant = participantsWithProfiles.find((p) => p.user_id !== userId);
        name = otherParticipant?.profile?.full_name || 'Unknown User';
        avatar_url = otherParticipant?.profile?.avatar_url || '';
      }

      return {
        ...conv,
        participant_count: participants.length,
        name,
        avatar_url,
        participants: participantsWithProfiles,
      };
    }

    return { ...conv, participant_count: 0, name: '', avatar_url: '' };
  } catch (error) {
    console.error('Error getting conversation details:', error);
    return null;
  }
};

