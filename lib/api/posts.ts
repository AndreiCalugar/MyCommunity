import { supabase } from '../supabase';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

export interface Post {
  id: string;
  community_id: string;
  user_id: string;
  content: string;
  image_url?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  profile?: {
    full_name: string;
    avatar_url?: string;
  };
  user_has_liked?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile: {
    full_name: string;
    avatar_url?: string;
  };
}

/**
 * Fetch posts for a community
 */
export const fetchPosts = async (
  communityId: string,
  userId?: string,
  limit: number = 20,
  offset: number = 0
): Promise<Post[]> => {
  // Fetch posts
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }

  if (!posts || posts.length === 0) {
    return [];
  }

  // Fetch profiles for all user_ids
  const userIds = [...new Set(posts.map((p) => p.user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', userIds);

  // Create a profile map for quick lookup
  const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

  // Check if user has liked each post
  let likedPostIds = new Set<string>();
  if (userId) {
    const postIds = posts.map((p) => p.id);
    const { data: likes } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', userId)
      .in('post_id', postIds);

    likedPostIds = new Set(likes?.map((l) => l.post_id) || []);
  }

  // Merge posts with profiles
  return posts.map((post) => ({
    ...post,
    profile: profileMap.get(post.user_id) || {
      full_name: 'Unknown User',
      avatar_url: null,
    },
    user_has_liked: likedPostIds.has(post.id),
  }));
};

/**
 * Create a new post
 */
export const createPost = async (
  communityId: string,
  userId: string,
  content: string,
  imageUri?: string
): Promise<Post> => {
  let imageUrl: string | undefined;

  // Upload image if provided
  if (imageUri) {
    imageUrl = await uploadPostImage(imageUri, userId);
  }

  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      community_id: communityId,
      user_id: userId,
      content,
      image_url: imageUrl,
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating post:', error);
    throw error;
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', userId)
    .single();

  return {
    ...post,
    profile: profile || { full_name: 'Unknown User', avatar_url: null },
  };
};

/**
 * Delete a post
 */
export const deletePost = async (postId: string): Promise<void> => {
  const { error } = await supabase.from('posts').delete().eq('id', postId);

  if (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
};

/**
 * Like a post
 */
export const likePost = async (postId: string, userId: string): Promise<void> => {
  const { error } = await supabase.from('post_likes').insert({
    post_id: postId,
    user_id: userId,
  });

  if (error) {
    console.error('Error liking post:', error);
    throw error;
  }
};

/**
 * Unlike a post
 */
export const unlikePost = async (postId: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('post_likes')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error unliking post:', error);
    throw error;
  }
};

/**
 * Fetch comments for a post
 */
export const fetchComments = async (postId: string): Promise<Comment[]> => {
  // Fetch comments
  const { data: comments, error } = await supabase
    .from('post_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }

  if (!comments || comments.length === 0) {
    return [];
  }

  // Fetch profiles for all user_ids
  const userIds = [...new Set(comments.map((c) => c.user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', userIds);

  // Create a profile map for quick lookup
  const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

  // Merge comments with profiles
  return comments.map((comment) => ({
    ...comment,
    profile: profileMap.get(comment.user_id) || {
      full_name: 'Unknown User',
      avatar_url: null,
    },
  }));
};

/**
 * Create a comment
 */
export const createComment = async (
  postId: string,
  userId: string,
  content: string
): Promise<Comment> => {
  const { data: comment, error } = await supabase
    .from('post_comments')
    .insert({
      post_id: postId,
      user_id: userId,
      content,
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating comment:', error);
    throw error;
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', userId)
    .single();

  return {
    ...comment,
    profile: profile || { full_name: 'Unknown User', avatar_url: null },
  };
};

/**
 * Delete a comment
 */
export const deleteComment = async (commentId: string): Promise<void> => {
  const { error } = await supabase.from('post_comments').delete().eq('id', commentId);

  if (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

/**
 * Upload post image to Supabase Storage
 */
const uploadPostImage = async (imageUri: string, userId: string): Promise<string> => {
  try {
    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64',
    });

    // Generate unique filename
    const fileExt = imageUri.split('.').pop()?.split('?')[0] || 'jpg';
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    // Convert base64 to Uint8Array for React Native
    const decode = (str: string): Uint8Array => {
      const binary = atob(str);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    };

    const arrayBuffer = decode(base64);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('post-images')
      .upload(fileName, arrayBuffer.buffer, {
        contentType: `image/${fileExt}`,
        upsert: false,
      });

    if (error) {
      console.error('Error uploading image:', error);
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('post-images')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadPostImage:', error);
    throw error;
  }
};

/**
 * Request image picker permissions and pick image
 */
export const pickImage = async (): Promise<string | null> => {
  // Request permissions
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  
  if (status !== 'granted') {
    throw new Error('Permission to access media library was denied');
  }

  // Pick image
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });

  if (!result.canceled && result.assets[0]) {
    return result.assets[0].uri;
  }

  return null;
};

/**
 * Subscribe to real-time updates for posts
 */
export const subscribeToPosts = (communityId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`posts-${communityId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'posts',
        filter: `community_id=eq.${communityId}`,
      },
      callback
    )
    .subscribe();
};

