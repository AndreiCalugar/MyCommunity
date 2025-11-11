import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Resource, formatFileSize } from '@/lib/api/resources';
import { Avatar } from '../shared/Avatar';

interface ResourceCardProps {
  resource: Resource;
  colorScheme: 'light' | 'dark';
  onPress?: () => void;
  onDelete?: (resourceId: string) => void;
  canDelete?: boolean;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  colorScheme,
  onPress,
  onDelete,
  canDelete = false,
}) => {
  const isDark = colorScheme === 'dark';

  const colors = {
    surface: isDark ? '#2B2D31' : '#F2F3F5',
    text: isDark ? '#FFFFFF' : '#060607',
    secondaryText: isDark ? '#B5BAC1' : '#4E5058',
    link: '#5865F2',
    file: '#23A559',
  };

  const getIcon = () => {
    if (resource.type === 'link') {
      return <Ionicons name="link" size={24} color={colors.link} />;
    }
    
    // File icons based on type
    const fileType = resource.file_type?.toLowerCase() || '';
    if (fileType.includes('pdf')) {
      return <Ionicons name="document-text" size={24} color="#ED4245" />;
    } else if (fileType.includes('image')) {
      return <Ionicons name="image" size={24} color="#F0B232" />;
    } else if (fileType.includes('video')) {
      return <Ionicons name="videocam" size={24} color="#5865F2" />;
    } else if (fileType.includes('zip') || fileType.includes('archive')) {
      return <Ionicons name="archive" size={24} color="#4E5058" />;
    }
    return <Ionicons name="document" size={24} color={colors.file} />;
  };

  // Ensure URL has a valid protocol
  const ensureProtocol = (url: string): string => {
    if (!url.match(/^[a-zA-Z]+:\/\//)) {
      return 'https://' + url;
    }
    return url;
  };

  const handlePress = () => {
    if (resource.type === 'link' && resource.url) {
      const validUrl = ensureProtocol(resource.url);
      Linking.openURL(validUrl).catch((err) => {
        console.error('Failed to open URL:', err);
        Alert.alert('Error', 'Could not open link. Please check the URL.');
      });
    } else if (resource.type === 'file' && resource.file_url) {
      Linking.openURL(resource.file_url).catch((err) => {
        console.error('Failed to open file:', err);
        Alert.alert('Error', 'Could not open file');
      });
    }
    onPress?.();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Resource',
      `Are you sure you want to delete "${resource.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete?.(resource.id),
        },
      ]
    );
  };

  return (
    <Pressable
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={handlePress}
    >
      <View style={styles.iconContainer}>{getIcon()}</View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {resource.title}
        </Text>

        {resource.description && (
          <Text style={[styles.description, { color: colors.secondaryText }]} numberOfLines={2}>
            {resource.description}
          </Text>
        )}

        <View style={styles.footer}>
          <View style={styles.meta}>
            <Avatar
              imageUrl={resource.creator_profile?.avatar_url}
              name={resource.creator_profile?.full_name || 'Unknown'}
              size="small"
            />
            <Text style={[styles.metaText, { color: colors.secondaryText }]}>
              {resource.creator_profile?.full_name}
            </Text>
            <Text style={[styles.metaText, { color: colors.secondaryText }]}>•</Text>
            <Text style={[styles.metaText, { color: colors.secondaryText }]}>
              {new Date(resource.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>

          {resource.type === 'file' && resource.file_size && (
            <Text style={[styles.fileSize, { color: colors.secondaryText }]}>
              {formatFileSize(resource.file_size)}
            </Text>
          )}
        </View>

        {resource.category && (
          <View style={[styles.categoryBadge, { backgroundColor: colors.link + '20' }]}>
            <Text style={[styles.categoryText, { color: colors.link }]}>
              {resource.category}
            </Text>
          </View>
        )}
      </View>

      {canDelete && (
        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={20} color="#ED4245" />
        </Pressable>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(88, 101, 242, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  metaText: {
    fontSize: 13,
  },
  fileSize: {
    fontSize: 12,
    fontWeight: '500',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
  },
});

