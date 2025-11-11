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
    bio?: string;
    location?: string;
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
  // Fetch community members
  const { data: members, error } = await supabase
    .from('community_members')
    .select('id, user_id, role, joined_at')
    .eq('community_id', communityId)
    .order('joined_at', { ascending: true });

  if (error) {
    console.error('Error fetching community members:', error);
    throw error;
  }

  if (!members || members.length === 0) {
    return [];
  }

  // Fetch profiles for all user_ids
  const userIds = [...new Set(members.map((m) => m.user_id))];
  
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url, bio, location')
    .in('id', userIds);

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
  }

  // Create a profile map for quick lookup
  const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

  // Merge members with profiles
  return members.map((member) => ({
    ...member,
    profile: profileMap.get(member.user_id) || {
      full_name: 'Unknown',
      email: '',
      avatar_url: undefined,
      bio: undefined,
      location: undefined,
    },
  }));
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

