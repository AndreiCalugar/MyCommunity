import { supabase } from '../supabase';

export type SearchType = 'all' | 'communities' | 'posts' | 'events' | 'resources';

export interface SearchResult {
  communities: CommunitySearchResult[];
  posts: PostSearchResult[];
  events: EventSearchResult[];
  resources: ResourceSearchResult[];
}

export interface CommunitySearchResult {
  id: string;
  name: string;
  description: string;
  short_description: string;
  image_url: string;
  member_count: number;
}

export interface PostSearchResult {
  id: string;
  community_id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  community?: { name: string };
  profile?: { full_name: string; avatar_url?: string };
}

export interface EventSearchResult {
  id: string;
  community_id: string;
  title: string;
  description: string | null;
  location: string | null;
  event_date: string;
  created_at: string;
  community?: { name: string };
}

export interface ResourceSearchResult {
  id: string;
  community_id: string;
  type: 'link' | 'file';
  title: string;
  description: string | null;
  url: string | null;
  file_url: string | null;
  created_at: string;
  community?: { name: string };
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  search_type: string | null;
  created_at: string;
}

/**
 * Perform a comprehensive search across all content types
 */
export const performSearch = async (
  query: string,
  userId: string,
  searchType: SearchType = 'all'
): Promise<SearchResult> => {
  const results: SearchResult = {
    communities: [],
    posts: [],
    events: [],
    resources: [],
  };

  if (!query.trim()) {
    return results;
  }

  try {
    // Search communities (always public)
    if (searchType === 'all' || searchType === 'communities') {
      const { data: communities, error: commError } = await supabase.rpc('search_communities', {
        search_query: query,
      });
      if (!commError && communities) {
        results.communities = communities;
      }
    }

    // Search posts (user's communities only)
    if (searchType === 'all' || searchType === 'posts') {
      const { data: posts, error: postsError } = await supabase.rpc('search_posts', {
        search_query: query,
        user_uuid: userId,
      });

      if (!postsError && posts) {
        // Fetch community names and profiles
        const communityIds = [...new Set(posts.map((p: any) => p.community_id))];
        const userIds = [...new Set(posts.map((p: any) => p.user_id))];

        const [{ data: communities }, { data: profiles }] = await Promise.all([
          supabase.from('communities').select('id, name').in('id', communityIds),
          supabase.from('profiles').select('id, full_name, avatar_url').in('id', userIds),
        ]);

        const communityMap = new Map(communities?.map((c) => [c.id, c]) || []);
        const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

        results.posts = posts.map((p: any) => ({
          ...p,
          community: communityMap.get(p.community_id),
          profile: profileMap.get(p.user_id),
        }));
      }
    }

    // Search events (user's communities only)
    if (searchType === 'all' || searchType === 'events') {
      const { data: events, error: eventsError } = await supabase.rpc('search_events', {
        search_query: query,
        user_uuid: userId,
      });

      if (!eventsError && events) {
        // Fetch community names
        const communityIds = [...new Set(events.map((e: any) => e.community_id))];
        const { data: communities } = await supabase
          .from('communities')
          .select('id, name')
          .in('id', communityIds);

        const communityMap = new Map(communities?.map((c) => [c.id, c]) || []);

        results.events = events.map((e: any) => ({
          ...e,
          community: communityMap.get(e.community_id),
        }));
      }
    }

    // Search resources (user's communities only)
    if (searchType === 'all' || searchType === 'resources') {
      const { data: resources, error: resourcesError } = await supabase.rpc('search_resources', {
        search_query: query,
        user_uuid: userId,
      });

      if (!resourcesError && resources) {
        // Fetch community names
        const communityIds = [...new Set(resources.map((r: any) => r.community_id))];
        const { data: communities } = await supabase
          .from('communities')
          .select('id, name')
          .in('id', communityIds);

        const communityMap = new Map(communities?.map((c) => [c.id, c]) || []);

        results.resources = resources.map((r: any) => ({
          ...r,
          community: communityMap.get(r.community_id),
        }));
      }
    }

    // Save to search history
    await saveSearchHistory(userId, query, searchType);
  } catch (error) {
    console.error('Error performing search:', error);
    throw error;
  }

  return results;
};

/**
 * Save search query to history
 */
export const saveSearchHistory = async (
  userId: string,
  query: string,
  searchType: SearchType
): Promise<void> => {
  try {
    await supabase.from('search_history').insert({
      user_id: userId,
      query: query.trim(),
      search_type: searchType,
    });

    // Optionally cleanup old history
    await supabase.rpc('cleanup_search_history');
  } catch (error) {
    // Don't fail the search if history save fails
    console.error('Error saving search history:', error);
  }
};

/**
 * Get user's search history
 */
export const getSearchHistory = async (userId: string): Promise<SearchHistoryItem[]> => {
  const { data, error } = await supabase
    .from('search_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching search history:', error);
    throw error;
  }

  return data || [];
};

/**
 * Delete a search history item
 */
export const deleteSearchHistory = async (historyId: string): Promise<void> => {
  const { error } = await supabase.from('search_history').delete().eq('id', historyId);

  if (error) {
    console.error('Error deleting search history:', error);
    throw error;
  }
};

/**
 * Clear all search history for a user
 */
export const clearSearchHistory = async (userId: string): Promise<void> => {
  const { error } = await supabase.from('search_history').delete().eq('user_id', userId);

  if (error) {
    console.error('Error clearing search history:', error);
    throw error;
  }
};

/**
 * Get total count of search results
 */
export const getResultCount = (results: SearchResult): number => {
  return (
    results.communities.length +
    results.posts.length +
    results.events.length +
    results.resources.length
  );
};

