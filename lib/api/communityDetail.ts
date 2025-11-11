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
  console.log('[API] fetchCommunityById: Starting for ID:', communityId);
  const { data, error } = await supabase
    .from('communities')
    .select('*')
    .eq('id', communityId)
    .single();

  if (error) {
    console.error('[API] fetchCommunityById: Error:', error);
    throw error;
  }

  console.log('[API] fetchCommunityById: Success, got data:', data?.name);
  return data;
};

/**
 * Fetch members of a community
 */
export const fetchCommunityMembers = async (
  communityId: string
): Promise<CommunityMember[]> => {
  console.log('[API] fetchCommunityMembers: Starting for ID:', communityId);
  
  // Fetch community members
  const { data: members, error } = await supabase
    .from('community_members')
    .select('id, user_id, role, joined_at')
    .eq('community_id', communityId)
    .order('joined_at', { ascending: true });

  console.log('[API] fetchCommunityMembers: Got members response, count:', members?.length);

  if (error) {
    console.error('[API] fetchCommunityMembers: Error:', error);
    throw error;
  }

  if (!members || members.length === 0) {
    console.log('[API] fetchCommunityMembers: No members found');
    return [];
  }

  // Fetch profiles for all user_ids
  const userIds = [...new Set(members.map((m) => m.user_id))];
  console.log('[API] fetchCommunityMembers: Fetching profiles for user IDs:', userIds);
  
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url, bio, location')
    .in('id', userIds);

  if (profilesError) {
    console.error('[API] fetchCommunityMembers: Error fetching profiles:', profilesError);
  }

  console.log('[API] fetchCommunityMembers: Got profiles, count:', profiles?.length);

  // Create a profile map for quick lookup
  const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

  // Merge members with profiles
  const result = members.map((member) => ({
    ...member,
    profile: profileMap.get(member.user_id) || {
      full_name: 'Unknown',
      email: '',
      avatar_url: undefined,
      bio: undefined,
      location: undefined,
    },
  }));

  console.log('[API] fetchCommunityMembers: Returning merged data, count:', result.length);
  return result;
};

/**
 * Get community admin info
 */
export const fetchCommunityAdmin = async (adminId: string) => {
  console.log('[API] fetchCommunityAdmin: Starting for ID:', adminId);
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url')
    .eq('id', adminId)
    .single();

  if (error) {
    console.error('[API] fetchCommunityAdmin: Error:', error);
    return null;
  }

  console.log('[API] fetchCommunityAdmin: Success, got:', data?.full_name);
  return data;
};

