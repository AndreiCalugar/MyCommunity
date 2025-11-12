import * as Linking from 'expo-linking';
import { router } from 'expo-router';

// Deep link URL patterns
export const DeepLinkPatterns = {
  COMMUNITY: /\/(c|community)\/([a-zA-Z0-9-]+)/,
  EVENT: /\/(e|event)\/([a-zA-Z0-9-]+)/,
  USER: /\/(u|user)\/([a-zA-Z0-9-]+)/,
  CHAT: /\/chat\/([a-zA-Z0-9-]+)/,
  DM: /\/dm\/([a-zA-Z0-9-]+)/,
};

export interface ParsedDeepLink {
  type: 'community' | 'event' | 'user' | 'chat' | 'dm' | 'unknown';
  id: string | null;
}

/**
 * Parse a deep link URL to extract the type and ID
 * Supports both deep links (mycommunityapp://) and web URLs (https://mycommunity.app/)
 */
export const parseLinkingURL = (url: string): ParsedDeepLink => {
  try {
    // Normalize the URL
    const normalizedUrl = url.toLowerCase();

    // Check each pattern
    for (const [key, pattern] of Object.entries(DeepLinkPatterns)) {
      const match = normalizedUrl.match(pattern);
      if (match) {
        const id = match[2] || match[1]; // Get the ID from the capture group
        return {
          type: key.toLowerCase() as ParsedDeepLink['type'],
          id,
        };
      }
    }

    return { type: 'unknown', id: null };
  } catch (error) {
    console.error('Error parsing deep link:', error);
    return { type: 'unknown', id: null };
  }
};

/**
 * Handle incoming deep links and navigate to the appropriate screen
 */
export const handleDeepLink = async (url: string | null) => {
  if (!url) return;

  console.log('Handling deep link:', url);

  const parsed = parseLinkingURL(url);

  if (!parsed.id) {
    console.warn('No ID found in deep link:', url);
    return;
  }

  try {
    switch (parsed.type) {
      case 'community':
        router.push(`/community/${parsed.id}/timeline`);
        break;
      case 'event':
        // Navigate to event details (you can create this screen if needed)
        router.push(`/community/${parsed.id}/events`);
        break;
      case 'user':
        router.push(`/user/${parsed.id}`);
        break;
      case 'chat':
      case 'dm':
        router.push(`/chat/${parsed.id}`);
        break;
      default:
        console.warn('Unknown deep link type:', parsed.type);
    }
  } catch (error) {
    console.error('Error navigating from deep link:', error);
  }
};

/**
 * Get the initial URL when the app is opened via deep link
 */
export const getInitialURL = async (): Promise<string | null> => {
  try {
    const url = await Linking.getInitialURL();
    return url;
  } catch (error) {
    console.error('Error getting initial URL:', error);
    return null;
  }
};

/**
 * Subscribe to URL changes (when app is already open)
 */
export const subscribeToURLChanges = (handler: (url: string) => void) => {
  const subscription = Linking.addEventListener('url', ({ url }) => {
    handler(url);
  });

  return subscription;
};

/**
 * Generate a shareable URL for a resource
 */
export const generateShareURL = (
  type: 'community' | 'event' | 'user',
  id: string
): string => {
  // Use web URLs for better shareability (they'll open the app if installed)
  const baseURL = 'https://mycommunity.app';

  switch (type) {
    case 'community':
      return `${baseURL}/c/${id}`;
    case 'event':
      return `${baseURL}/e/${id}`;
    case 'user':
      return `${baseURL}/u/${id}`;
    default:
      return baseURL;
  }
};

/**
 * Generate a deep link (app-specific URL)
 */
export const generateDeepLink = (
  type: 'community' | 'event' | 'user' | 'chat',
  id: string
): string => {
  const scheme = 'mycommunityapp://';

  switch (type) {
    case 'community':
      return `${scheme}community/${id}`;
    case 'event':
      return `${scheme}event/${id}`;
    case 'user':
      return `${scheme}user/${id}`;
    case 'chat':
      return `${scheme}chat/${id}`;
    default:
      return scheme;
  }
};

