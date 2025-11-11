import { supabase } from '../supabase';
import { Community } from '../stores/communityStore';

export interface CommunityMember {
  id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
  profile: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

/**
 * Fetch a single community by ID
 */
export const fetchCommunityById = async (communityId: string): Promise<Community | null> => {
  const { data, error } = await supabase
    .from('communities')
    .select('*')
    .eq('id', communityId)
    .single();

  if (error) {
    console.error('Error fetching community:', error);
    throw error;
  }

  return data;
};

/**
 * Fetch members of a community
 */
export const fetchCommunityMembers = async (
  communityId: string
): Promise<CommunityMember[]> => {
  const { data, error } = await supabase
    .from('community_members')
    .select(`
      id,
      user_id,
      role,
      joined_at,
      profiles:user_id (
        full_name,
        email,
        avatar_url
      )
    `)
    .eq('community_id', communityId)
    .order('joined_at', { ascending: true });

  if (error) {
    console.error('Error fetching community members:', error);
    throw error;
  }

  // Transform data to match our interface
  const members = data?.map((item: any) => ({
    id: item.id,
    user_id: item.user_id,
    role: item.role,
    joined_at: item.joined_at,
    profile: {
      full_name: item.profiles?.full_name || 'Unknown',
      email: item.profiles?.email || '',
      avatar_url: item.profiles?.avatar_url,
    },
  })) || [];

  return members;
};

/**
 * Get community admin info
 */
export const fetchCommunityAdmin = async (adminId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url')
    .eq('id', adminId)
    .single();

  if (error) {
    console.error('Error fetching admin:', error);
    return null;
  }

  return data;
};

