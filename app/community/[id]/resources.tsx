import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Text,
  Alert,
  Pressable,
} from 'react-native';
import { useGlobalSearchParams, useFocusEffect } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/lib/stores/authStore';
import {
  fetchResources,
  createLinkResource,
  createFileResource,
  uploadResourceFile,
  deleteResource,
  Resource,
} from '@/lib/api/resources';
import { ResourceCard } from '@/components/resources/ResourceCard';
import { AddResourceModal } from '@/components/resources/AddResourceModal';
import { Ionicons } from '@expo/vector-icons';

export default function CommunityResourcesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useGlobalSearchParams<{ id: string }>();
  const { user } = useAuthStore();

  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  const colors = {
    background: isDark ? '#1E1F22' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#060607',
    secondaryText: isDark ? '#B5BAC1' : '#4E5058',
    fab: '#5865F2',
  };

  useEffect(() => {
    if (params.id) {
      loadResources();
    }
  }, [params.id]);

  // Reload resources when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (params.id) {
        loadResources();
      }
    }, [params.id])
  );

  const loadResources = async () => {
    if (!params.id) return;

    try {
      setLoading(true);
      const data = await fetchResources(params.id as string);
      setResources(data);
    } catch (error: any) {
      console.error('Error loading resources:', error);
      if (error.message?.includes('permission') || error.code === 'PGRST301') {
        Alert.alert('Join Required', 'You need to join this community to view resources.');
      } else {
        Alert.alert('Error', 'Failed to load resources');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddLink = async (data: {
    title: string;
    description: string;
    url: string;
    category: string;
  }) => {
    if (!params.id || !user) return;

    try {
      setUploading(true);
      const newResource = await createLinkResource(params.id as string, user.id, data);
      setResources([newResource, ...resources]);
      setShowAddModal(false);
      Alert.alert('Success', 'Link added successfully!');
    } catch (error: any) {
      console.error('Error adding link:', error);
      Alert.alert('Error', error.message || 'Failed to add link');
    } finally {
      setUploading(false);
    }
  };

  const handleAddFile = async (data: {
    title: string;
    description: string;
    fileUri: string;
    fileName: string;
    fileType: string;
    category: string;
  }) => {
    if (!params.id || !user) return;

    try {
      setUploading(true);

      // Upload file first
      const { file_url, file_size } = await uploadResourceFile(
        params.id as string,
        data.fileUri,
        data.fileName,
        data.fileType
      );

      // Create resource record
      const newResource = await createFileResource(params.id as string, user.id, {
        title: data.title,
        description: data.description,
        file_url,
        file_name: data.fileName,
        file_size,
        file_type: data.fileType,
        category: data.category,
      });

      setResources([newResource, ...resources]);
      setShowAddModal(false);
      Alert.alert('Success', 'File uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading file:', error);
      Alert.alert('Error', error.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    const resource = resources.find((r) => r.id === resourceId);
    if (!resource) return;

    try {
      await deleteResource(resource);
      setResources(resources.filter((r) => r.id !== resourceId));
      Alert.alert('Success', 'Resource deleted');
    } catch (error: any) {
      console.error('Error deleting resource:', error);
      Alert.alert('Error', 'Failed to delete resource');
    }
  };

  const renderResource = ({ item }: { item: Resource }) => (
    <ResourceCard
      resource={item}
      colorScheme={colorScheme}
      onDelete={handleDeleteResource}
      canDelete={item.created_by === user?.id}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="folder-open-outline" size={64} color={colors.secondaryText} />
      <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
        No resources yet
      </Text>
      <Text style={[styles.emptySubtext, { color: colors.secondaryText }]}>
        Add useful links and files for your community
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#5865F2" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={resources}
        keyExtractor={(item) => item.id}
        renderItem={renderResource}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
      />

      {/* FAB to add resources */}
      <Pressable
        style={[styles.fab, { backgroundColor: colors.fab }]}
        onPress={() => setShowAddModal(true)}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>

      <AddResourceModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddLink={handleAddLink}
        onAddFile={handleAddFile}
        colorScheme={colorScheme}
        loading={uploading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});

