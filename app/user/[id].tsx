import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/lib/stores/authStore';
import { supabase } from '@/lib/supabase';
import { getOrCreateDirectConversation } from '@/lib/api/conversations';
import { Avatar } from '@/components/shared/Avatar';

interface UserProfile {
  id: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  created_at: string;
}

interface Community {
  id: string;
  name: string;
  image_url?: string;
}

export default function UserProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagingLoading, setMessagingLoading] = useState(false);

  const colors = {
    background: isDark ? '#1E1F22' : '#FFFFFF',
    surface: isDark ? '#2B2D31' : '#F2F3F5',
    text: isDark ? '#FFFFFF' : '#060607',
    secondaryText: isDark ? '#B5BAC1' : '#4E5058',
    border: isDark ? '#4E5058' : '#E0E0E0',
    primary: '#5865F2',
  };

  const isOwnProfile = user?.id === params.id;

  useEffect(() => {
    loadProfile();
    loadCommunities();
  }, [params.id]);

  const loadProfile = async () => {
    if (!params.id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, bio, location, created_at')
        .eq('id', params.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const loadCommunities = async () => {
    if (!params.id) return;

    try {
      // Get communities this user is a member of
      const { data: memberData, error: memberError } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('user_id', params.id);

      if (memberError) throw memberError;
      if (!memberData || memberData.length === 0) return;

      const communityIds = memberData.map((m) => m.community_id);

      const { data: communitiesData, error: communitiesError } = await supabase
        .from('communities')
        .select('id, name, image_url')
        .in('id', communityIds)
        .limit(10);

      if (communitiesError) throw communitiesError;
      setCommunities(communitiesData || []);
    } catch (error) {
      console.error('Error loading communities:', error);
    }
  };

  const handleMessage = async () => {
    if (!user || !params.id) return;
    if (isOwnProfile) {
      Alert.alert('Info', "You can't message yourself!");
      return;
    }

    try {
      setMessagingLoading(true);
      const conversationId = await getOrCreateDirectConversation(user.id, params.id);
      
      // Navigate to the chat screen
      router.push(`/chat/${conversationId}`);
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      Alert.alert('Error', 'Failed to start conversation');
    } finally {
      setMessagingLoading(false);
    }
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.secondaryText }]}>
          Profile not found
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with close button */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={28} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
        <View style={styles.closeButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar and Name */}
        <View style={styles.profileHeader}>
          <Avatar
            imageUrl={profile.avatar_url}
            name={profile.full_name}
            size="xlarge"
          />
          <Text style={[styles.name, { color: colors.text }]}>{profile.full_name}</Text>
          
          {profile.location && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color={colors.secondaryText} />
              <Text style={[styles.infoText, { color: colors.secondaryText }]}>
                {profile.location}
              </Text>
            </View>
          )}
          
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.secondaryText} />
            <Text style={[styles.infoText, { color: colors.secondaryText }]}>
              Joined {formatJoinDate(profile.created_at)}
            </Text>
          </View>
        </View>

        {/* Message Button */}
        {!isOwnProfile && (
          <Pressable
            style={[
              styles.messageButton,
              { backgroundColor: colors.primary },
              messagingLoading && styles.buttonDisabled,
            ]}
            onPress={handleMessage}
            disabled={messagingLoading}
          >
            {messagingLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="chatbubble-outline" size={20} color="#FFFFFF" />
                <Text style={styles.messageButtonText}>Message</Text>
              </>
            )}
          </Pressable>
        )}

        {/* Bio */}
        {profile.bio && (
          <View style={[styles.section, { borderTopColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
            <Text style={[styles.bio, { color: colors.text }]}>{profile.bio}</Text>
          </View>
        )}

        {/* Communities */}
        {communities.length > 0 && (
          <View style={[styles.section, { borderTopColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Communities ({communities.length})
            </Text>
            {communities.map((community) => (
              <Pressable
                key={community.id}
                style={[styles.communityItem, { backgroundColor: colors.surface }]}
                onPress={() => router.push(`/community/${community.id}/timeline`)}
              >
                <Avatar
                  imageUrl={community.image_url}
                  name={community.name}
                  size="small"
                />
                <Text style={[styles.communityName, { color: colors.text }]}>
                  {community.name}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  infoText: {
    fontSize: 14,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  messageButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  bio: {
    fontSize: 15,
    lineHeight: 22,
  },
  communityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  communityName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
  },
});

