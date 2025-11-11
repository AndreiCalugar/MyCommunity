import { supabase } from '../supabase';
import { Community } from '../stores/communityStore';

/**
 * Fetch all communities from the database
 */
export const fetchCommunities = async (): Promise<Community[]> => {
  const { data, error } = await supabase
    .from('communities')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching communities:', error);
    throw error;
  }

  return data || [];
};

/**
 * Fetch communities that the current user is a member of
 */
export const fetchMyCommunities = async (userId: string): Promise<Community[]> => {
  const { data, error } = await supabase
    .from('community_members')
    .select(`
      community_id,
      communities (*)
    `)
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching my communities:', error);
    throw error;
  }

  // Extract communities from the join result
  const communities = data
    ?.map((item: any) => item.communities)
    .filter(Boolean) as Community[];

  return communities || [];
};

/**
 * Check if user is a member of a community
 */
export const checkMembership = async (
  userId: string,
  communityId: string
): Promise<boolean> => {
  const { data, error } = await supabase
    .from('community_members')
    .select('id')
    .eq('user_id', userId)
    .eq('community_id', communityId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 is "not found" error, which is expected
    console.error('Error checking membership:', error);
    return false;
  }

  return !!data;
};

/**
 * Join a community
 */
export const joinCommunity = async (
  userId: string,
  communityId: string
): Promise<void> => {
  // Insert membership
  const { error: memberError } = await supabase
    .from('community_members')
    .insert({
      user_id: userId,
      community_id: communityId,
      role: 'member',
    });

  if (memberError) {
    console.error('Error joining community:', memberError);
    throw memberError;
  }

  // Increment member count
  const { error: updateError } = await supabase.rpc('increment_member_count', {
    community_id: communityId,
  });

  // If RPC doesn't exist, update manually
  if (updateError) {
    const { data: community } = await supabase
      .from('communities')
      .select('member_count')
      .eq('id', communityId)
      .single();

    if (community) {
      await supabase
        .from('communities')
        .update({ member_count: (community.member_count || 0) + 1 })
        .eq('id', communityId);
    }
  }
};

/**
 * Leave a community
 */
export const leaveCommunity = async (
  userId: string,
  communityId: string
): Promise<void> => {
  // Delete membership
  const { error: deleteError } = await supabase
    .from('community_members')
    .delete()
    .eq('user_id', userId)
    .eq('community_id', communityId);

  if (deleteError) {
    console.error('Error leaving community:', deleteError);
    throw deleteError;
  }

  // Decrement member count
  const { error: updateError } = await supabase.rpc('decrement_member_count', {
    community_id: communityId,
  });

  // If RPC doesn't exist, update manually
  if (updateError) {
    const { data: community } = await supabase
      .from('communities')
      .select('member_count')
      .eq('id', communityId)
      .single();

    if (community) {
      await supabase
        .from('communities')
        .update({ member_count: Math.max(0, (community.member_count || 0) - 1) })
        .eq('id', communityId);
    }
  }
};

/**
 * Subscribe to real-time updates for communities
 */
export const subscribeToCommunities = (
  callback: (payload: any) => void
) => {
  return supabase
    .channel('communities-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'communities',
      },
      callback
    )
    .subscribe();
};

