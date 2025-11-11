import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/lib/stores/authStore';
import { useCommunityStore, Community } from '@/lib/stores/communityStore';
import {
  fetchCommunities,
  fetchMyCommunities,
  joinCommunity,
  leaveCommunity,
  subscribeToCommunities,
} from '@/lib/api/communities';
import { CommunityCard } from '@/components/community/CommunityCard';
import { Button } from '@/components/shared/Button';

export default function CommunitiesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuthStore();
  const { communities, myCommunities, setCommunities, setMyCommunities } =
    useCommunityStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingCommunityId, setLoadingCommunityId] = useState<string | null>(null);
  const [showMyCommunities, setShowMyCommunities] = useState(false);

  const colors = {
    background: isDark ? '#1E1F22' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#060607',
    secondaryText: isDark ? '#B5BAC1' : '#4E5058',
  };

  // Load communities on mount
  useEffect(() => {
    loadCommunities();

    // Subscribe to real-time updates
    const subscription = subscribeToCommunities((payload) => {
      console.log('Community updated:', payload);
      loadCommunities();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadCommunities = async () => {
    try {
      setLoading(true);
      const [allCommunities, userCommunities] = await Promise.all([
        fetchCommunities(),
        user ? fetchMyCommunities(user.id) : Promise.resolve([]),
      ]);

      setCommunities(allCommunities);
      setMyCommunities(userCommunities);
    } catch (error: any) {
      console.error('Error loading communities:', error);
      Alert.alert('Error', 'Failed to load communities. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadCommunities();
  };

  const handleJoin = async (communityId: string) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to join a community');
      return;
    }

    setLoadingCommunityId(communityId);
    try {
      await joinCommunity(user.id, communityId);

      // Optimistic update
      const community = communities.find((c) => c.id === communityId);
      if (community) {
        const updatedCommunity = {
          ...community,
          member_count: community.member_count + 1,
        };
        setCommunities(
          communities.map((c) => (c.id === communityId ? updatedCommunity : c))
        );
        setMyCommunities([...myCommunities, updatedCommunity]);
      }

      Alert.alert('Success', 'You have joined the community!');
    } catch (error: any) {
      console.error('Error joining community:', error);
      Alert.alert('Error', error.message || 'Failed to join community');
      // Reload to sync state
      loadCommunities();
    } finally {
      setLoadingCommunityId(null);
    }
  };

  const handleLeave = async (communityId: string) => {
    if (!user) return;

    Alert.alert(
      'Leave Community',
      'Are you sure you want to leave this community?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            setLoadingCommunityId(communityId);
            try {
              await leaveCommunity(user.id, communityId);

              // Optimistic update
              const community = communities.find((c) => c.id === communityId);
              if (community) {
                const updatedCommunity = {
                  ...community,
                  member_count: Math.max(0, community.member_count - 1),
                };
                setCommunities(
                  communities.map((c) =>
                    c.id === communityId ? updatedCommunity : c
                  )
                );
                setMyCommunities(
                  myCommunities.filter((c) => c.id !== communityId)
                );
              }

              Alert.alert('Success', 'You have left the community');
            } catch (error: any) {
              console.error('Error leaving community:', error);
              Alert.alert('Error', error.message || 'Failed to leave community');
              // Reload to sync state
              loadCommunities();
            } finally {
              setLoadingCommunityId(null);
            }
          },
        },
      ]
    );
  };

  const isMember = (communityId: string) => {
    return myCommunities.some((c) => c.id === communityId);
  };

  const displayedCommunities = showMyCommunities ? myCommunities : communities;

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
        {showMyCommunities
          ? 'You haven\'t joined any communities yet'
          : 'No communities available'}
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Communities</Text>
        <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
          Discover and join communities
        </Text>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <Button
          title="All Communities"
          onPress={() => setShowMyCommunities(false)}
          variant={!showMyCommunities ? 'primary' : 'outline'}
          size="small"
          style={styles.filterButton}
        />
        <Button
          title="My Communities"
          onPress={() => setShowMyCommunities(true)}
          variant={showMyCommunities ? 'primary' : 'outline'}
          size="small"
          style={styles.filterButton}
        />
      </View>

      {/* Communities List */}
      <FlatList
        data={displayedCommunities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CommunityCard
            community={item}
            isMember={isMember(item.id)}
            onJoin={handleJoin}
            onLeave={handleLeave}
            loading={loadingCommunityId === item.id}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#5865F2"
          />
        }
        ListEmptyComponent={renderEmpty}
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  filterButton: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

