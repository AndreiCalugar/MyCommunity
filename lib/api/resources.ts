import { supabase } from '../supabase';
import * as FileSystem from 'expo-file-system/legacy';

export type ResourceType = 'link' | 'file';

export interface Resource {
  id: string;
  community_id: string;
  type: ResourceType;
  title: string;
  description: string | null;
  url: string | null;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  file_type: string | null;
  category: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator_profile?: {
    full_name: string;
    avatar_url?: string;
  };
}

/**
 * Fetch resources for a community
 */
export const fetchResources = async (communityId: string): Promise<Resource[]> => {
  const { data: resources, error } = await supabase
    .from('resources')
    .select('*')
    .eq('community_id', communityId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching resources:', error);
    throw error;
  }

  if (!resources || resources.length === 0) {
    return [];
  }

  // Fetch creator profiles
  const creatorIds = [...new Set(resources.map((r) => r.created_by))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', creatorIds);

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

  return resources.map((resource) => ({
    ...resource,
    creator_profile: profileMap.get(resource.created_by) || {
      full_name: 'Unknown',
      avatar_url: undefined,
    },
  }));
};

/**
 * Create a link resource
 */
export const createLinkResource = async (
  communityId: string,
  userId: string,
  data: {
    title: string;
    description?: string;
    url: string;
    category?: string;
  }
): Promise<Resource> => {
  const { data: resource, error } = await supabase
    .from('resources')
    .insert({
      community_id: communityId,
      created_by: userId,
      type: 'link',
      title: data.title,
      description: data.description || null,
      url: data.url,
      category: data.category || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating link resource:', error);
    throw error;
  }

  // Fetch creator profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', userId)
    .single();

  return {
    ...resource,
    creator_profile: profile || { full_name: 'Unknown', avatar_url: undefined },
  };
};

/**
 * Sanitize filename for storage (remove special characters, spaces)
 */
const sanitizeFileName = (fileName: string): string => {
  // Get file extension
  const lastDotIndex = fileName.lastIndexOf('.');
  const name = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
  const extension = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : '';

  // Remove special characters and replace spaces with hyphens
  const sanitized = name
    .normalize('NFD') // Normalize unicode characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-zA-Z0-9-_]/g, '-') // Replace special chars with hyphen
    .replace(/--+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .toLowerCase();

  return sanitized + extension.toLowerCase();
};

/**
 * Upload file to Supabase Storage
 */
export const uploadResourceFile = async (
  communityId: string,
  fileUri: string,
  fileName: string,
  fileType: string
): Promise<{ file_url: string; file_size: number }> => {
  try {
    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: 'base64',
    });

    // Convert base64 to Uint8Array
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Sanitize and generate unique filename
    const timestamp = Date.now();
    const sanitizedFileName = sanitizeFileName(fileName);
    const uniqueFileName = `${communityId}/${timestamp}-${sanitizedFileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('community-resources')
      .upload(uniqueFileName, bytes, {
        contentType: fileType,
        upsert: false,
      });

    if (error) {
      console.error('Error uploading file:', error);
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('community-resources')
      .getPublicUrl(data.path);

    return {
      file_url: urlData.publicUrl,
      file_size: bytes.length,
    };
  } catch (error) {
    console.error('Error in uploadResourceFile:', error);
    throw error;
  }
};

/**
 * Create a file resource
 */
export const createFileResource = async (
  communityId: string,
  userId: string,
  data: {
    title: string;
    description?: string;
    file_url: string;
    file_name: string;
    file_size: number;
    file_type: string;
    category?: string;
  }
): Promise<Resource> => {
  const { data: resource, error } = await supabase
    .from('resources')
    .insert({
      community_id: communityId,
      created_by: userId,
      type: 'file',
      title: data.title,
      description: data.description || null,
      file_url: data.file_url,
      file_name: data.file_name,
      file_size: data.file_size,
      file_type: data.file_type,
      category: data.category || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating file resource:', error);
    throw error;
  }

  // Fetch creator profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', userId)
    .single();

  return {
    ...resource,
    creator_profile: profile || { full_name: 'Unknown', avatar_url: undefined },
  };
};

/**
 * Update a resource
 */
export const updateResource = async (
  resourceId: string,
  updates: {
    title?: string;
    description?: string;
    url?: string;
    category?: string;
  }
): Promise<void> => {
  const { error } = await supabase
    .from('resources')
    .update(updates)
    .eq('id', resourceId);

  if (error) {
    console.error('Error updating resource:', error);
    throw error;
  }
};

/**
 * Delete a resource
 */
export const deleteResource = async (resource: Resource): Promise<void> => {
  // If it's a file, delete from storage first
  if (resource.type === 'file' && resource.file_url) {
    try {
      // Extract file path from URL
      const urlParts = resource.file_url.split('/community-resources/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1].split('?')[0]; // Remove query params
        await supabase.storage.from('community-resources').remove([filePath]);
      }
    } catch (error) {
      console.error('Error deleting file from storage:', error);
      // Continue with database deletion even if storage deletion fails
    }
  }

  // Delete from database
  const { error } = await supabase.from('resources').delete().eq('id', resource.id);

  if (error) {
    console.error('Error deleting resource:', error);
    throw error;
  }
};

/**
 * Get resource categories
 */
export const RESOURCE_CATEGORIES = [
  { value: 'documents', label: 'Documents', icon: '📄' },
  { value: 'videos', label: 'Videos', icon: '🎥' },
  { value: 'articles', label: 'Articles', icon: '📰' },
  { value: 'tools', label: 'Tools', icon: '🔧' },
  { value: 'guides', label: 'Guides', icon: '📚' },
  { value: 'other', label: 'Other', icon: '📦' },
] as const;

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

