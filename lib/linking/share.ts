import { Share, Alert, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { generateShareURL } from './deepLinks';

export interface ShareOptions {
  type: 'community' | 'event' | 'user';
  id: string;
  title: string;
  message?: string;
}

/**
 * Share a resource using the native share dialog
 */
export const shareResource = async (options: ShareOptions): Promise<void> => {
  try {
    const url = generateShareURL(options.type, options.id);
    const message = options.message || getDefaultMessage(options);

    const result = await Share.share(
      {
        message: Platform.OS === 'ios' ? message : `${message}\n\n${url}`,
        url: Platform.OS === 'ios' ? url : undefined,
        title: options.title,
      },
      {
        subject: options.title, // For email sharing
        dialogTitle: `Share ${options.type}`, // Android only
      }
    );

    if (result.action === Share.sharedAction) {
      console.log('Resource shared successfully');
    } else if (result.action === Share.dismissedAction) {
      console.log('Share dialog dismissed');
    }
  } catch (error) {
    console.error('Error sharing resource:', error);
    Alert.alert('Error', 'Failed to share. Please try again.');
  }
};

/**
 * Copy the share link to clipboard
 */
export const copyShareLink = async (options: ShareOptions): Promise<void> => {
  try {
    const url = generateShareURL(options.type, options.id);
    await Clipboard.setStringAsync(url);
    Alert.alert('Link Copied!', 'The link has been copied to your clipboard.');
  } catch (error) {
    console.error('Error copying link:', error);
    Alert.alert('Error', 'Failed to copy link. Please try again.');
  }
};

/**
 * Share a community
 */
export const shareCommunity = async (
  communityId: string,
  communityName: string,
  description?: string
): Promise<void> => {
  await shareResource({
    type: 'community',
    id: communityId,
    title: communityName,
    message: description
      ? `Check out "${communityName}" on MyCommunity!\n\n${description}`
      : `Check out "${communityName}" on MyCommunity!`,
  });
};

/**
 * Share an event
 */
export const shareEvent = async (
  eventId: string,
  eventTitle: string,
  eventDate?: string
): Promise<void> => {
  const dateStr = eventDate ? ` on ${new Date(eventDate).toLocaleDateString()}` : '';
  await shareResource({
    type: 'event',
    id: eventId,
    title: eventTitle,
    message: `Join me at "${eventTitle}"${dateStr}! 🎉`,
  });
};

/**
 * Share a user profile
 */
export const shareUserProfile = async (
  userId: string,
  userName: string
): Promise<void> => {
  await shareResource({
    type: 'user',
    id: userId,
    title: userName,
    message: `Connect with ${userName} on MyCommunity!`,
  });
};

/**
 * Get default share message based on type
 */
const getDefaultMessage = (options: ShareOptions): string => {
  switch (options.type) {
    case 'community':
      return `Check out "${options.title}" on MyCommunity!`;
    case 'event':
      return `Join me at "${options.title}"!`;
    case 'user':
      return `Connect with ${options.title} on MyCommunity!`;
    default:
      return 'Check this out on MyCommunity!';
  }
};

