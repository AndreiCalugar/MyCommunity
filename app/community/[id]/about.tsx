import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/lib/stores/authStore';
import { Community } from '@/lib/stores/communityStore';
import { fetchCommunityById, fetchCommunityAdmin } from '@/lib/api/communityDetail';
import { checkMembership, leaveCommunity } from '@/lib/api/communities';
import { Button } from '@/components/shared/Button';
import { Avatar } from '@/components/shared/Avatar';
import { Ionicons } from '@expo/vector-icons';

export default function CommunityAboutScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();

  const [community, setCommunity] = useState<Community | null>(null);
  const [admin, setAdmin] = useState<any>(null);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [leavingCommunity, setLeavingCommunity] = useState(false);

  const colors = {
    background: isDark ? '#1E1F22' : '#FFFFFF',
    surface: isDark ? '#2B2D31' : '#F2F3F5',
    text: isDark ? '#FFFFFF' : '#060607',
    secondaryText: isDark ? '#B5BAC1' : '#4E5058',
    border: isDark ? '#4E5058' : '#E0E0E0',
  };

  useEffect(() => {
    loadCommunityData();
  }, [params.id]);

  const loadCommunityData = async () => {
    if (!params.id) return;

    try {
      setLoading(true);
      const [communityData, membershipStatus] = await Promise.all([
        fetchCommunityById(params.id),
        user ? checkMembership(user.id, params.id) : Promise.resolve(false),
      ]);

      if (communityData) {
        setCommunity(communityData);
        setIsMember(membershipStatus);

        // Fetch admin info
        if (communityData.admin_id) {
          const adminData = await fetchCommunityAdmin(communityData.admin_id);
          setAdmin(adminData);
        }
      }
    } catch (error: any) {
      console.error('Error loading community:', error);
      Alert.alert('Error', 'Failed to load community details');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveCommunity = () => {
    if (!user || !params.id) return;

    Alert.alert(
      'Leave Community',
      `Are you sure you want to leave ${community?.name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            setLeavingCommunity(true);
            try {
              await leaveCommunity(user.id, params.id!);
              Alert.alert('Success', 'You have left the community', [
                {
                  text: 'OK',
                  onPress: () => router.back(),
                },
              ]);
            } catch (error: any) {
              console.error('Error leaving community:', error);
              Alert.alert('Error', 'Failed to leave community');
            } finally {
              setLeavingCommunity(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#5865F2" />
      </View>
    );
  }

  if (!community) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.secondaryText }]}>
          Community not found
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Community Header Image */}
      <View style={styles.headerImageContainer}>
        {community.image_url ? (
          <Image
            source={{ uri: community.image_url }}
            style={styles.headerImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.headerImagePlaceholder, { backgroundColor: '#5865F2' }]}>
            <Ionicons name="people" size={64} color="#FFFFFF" />
          </View>
        )}
      </View>

      {/* Community Name & Stats */}
      <View style={styles.headerInfo}>
        <Text style={[styles.communityName, { color: colors.text }]}>
          {community.name}
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="people" size={20} color={colors.secondaryText} />
            <Text style={[styles.statText, { color: colors.secondaryText }]}>
              {community.member_count} members
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="calendar-outline" size={20} color={colors.secondaryText} />
            <Text style={[styles.statText, { color: colors.secondaryText }]}>
              Created {new Date(community.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Description */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
        <Text style={[styles.description, { color: colors.secondaryText }]}>
          {community.description || community.short_description || 'No description available'}
        </Text>
      </View>

      {/* Admin Info */}
      {admin && (
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Admin</Text>
          <View style={styles.adminRow}>
            <Avatar
              imageUrl={admin.avatar_url}
              name={admin.full_name}
              size="medium"
            />
            <View style={styles.adminInfo}>
              <Text style={[styles.adminName, { color: colors.text }]}>
                {admin.full_name || 'Unknown'}
              </Text>
              <Text style={[styles.adminRole, { color: colors.secondaryText }]}>
                Community Admin
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Leave Button */}
      {isMember && (
        <View style={styles.actionSection}>
          <Button
            title="Leave Community"
            onPress={handleLeaveCommunity}
            variant="danger"
            fullWidth
            loading={leavingCommunity}
          />
        </View>
      )}
    </ScrollView>
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
  content: {
    paddingBottom: 32,
  },
  headerImageContainer: {
    width: '100%',
    height: 200,
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    padding: 16,
  },
  communityName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  adminRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adminInfo: {
    flex: 1,
  },
  adminName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  adminRole: {
    fontSize: 14,
  },
  actionSection: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  errorText: {
    fontSize: 16,
  },
});

