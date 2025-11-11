import { supabase } from '../supabase';
import * as ImagePicker from 'expo-image-picker';

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
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id (
        full_name,
        avatar_url
      )
    `)
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }

  // Check if user has liked each post
  if (userId && data) {
    const postIds = data.map((p) => p.id);
    const { data: likes } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', userId)
      .in('post_id', postIds);

    const likedPostIds = new Set(likes?.map((l) => l.post_id) || []);

    return data.map((post) => ({
      ...post,
      profile: post.profiles,
      user_has_liked: likedPostIds.has(post.id),
    }));
  }

  return data?.map((post) => ({ ...post, profile: post.profiles })) || [];
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

  const { data, error } = await supabase
    .from('posts')
    .insert({
      community_id: communityId,
      user_id: userId,
      content,
      image_url: imageUrl,
    })
    .select(`
      *,
      profiles:user_id (
        full_name,
        avatar_url
      )
    `)
    .single();

  if (error) {
    console.error('Error creating post:', error);
    throw error;
  }

  return { ...data, profile: data.profiles };
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
  const { data, error } = await supabase
    .from('post_comments')
    .select(`
      *,
      profiles:user_id (
        full_name,
        avatar_url
      )
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }

  return data?.map((comment) => ({ ...comment, profile: comment.profiles })) || [];
};

/**
 * Create a comment
 */
export const createComment = async (
  postId: string,
  userId: string,
  content: string
): Promise<Comment> => {
  const { data, error } = await supabase
    .from('post_comments')
    .insert({
      post_id: postId,
      user_id: userId,
      content,
    })
    .select(`
      *,
      profiles:user_id (
        full_name,
        avatar_url
      )
    `)
    .single();

  if (error) {
    console.error('Error creating comment:', error);
    throw error;
  }

  return { ...data, profile: data.profiles };
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
    // Convert image URI to blob
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Generate unique filename
    const fileExt = imageUri.split('.').pop() || 'jpg';
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('post-images')
      .upload(fileName, blob, {
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
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

