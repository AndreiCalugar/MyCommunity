import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
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
import { CategoryFilter } from '@/components/community/CategoryFilter';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { SkeletonList } from '@/components/ui/SkeletonLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import { DesignSystem, getColors } from '@/constants/designSystem';

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
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const colors = getColors(isDark);

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

  const handleCommunityPress = (communityId: string) => {
    router.push(`/community/${communityId}/timeline`);
  };

  const handleToggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  // Filter communities by selected categories (only for "All Communities")
  const filteredCommunities = useMemo(() => {
    // Show all "My Communities" without filtering
    if (showMyCommunities) {
      return myCommunities;
    }
    
    // Apply filters to "All Communities"
    const baseList = communities;
    
    if (selectedCategories.length === 0) {
      return baseList;
    }
    
    return baseList.filter((community) => {
      if (!community.categories || community.categories.length === 0) {
        return false;
      }
      return selectedCategories.some((selectedCat) =>
        community.categories!.includes(selectedCat)
      );
    });
  }, [communities, myCommunities, showMyCommunities, selectedCategories]);

  const displayedCommunities = filteredCommunities;

  const renderEmpty = () => (
    <EmptyState
      icon={showMyCommunities ? 'people-outline' : 'search-outline'}
      title={showMyCommunities ? 'No Communities Yet' : 'No Communities Found'}
      description={
        showMyCommunities
          ? 'Start exploring and join communities that interest you!'
          : selectedCategories.length > 0
          ? 'Try adjusting your filters or check back later'
          : 'No communities available at the moment'
      }
      actionTitle={showMyCommunities ? 'Explore Communities' : undefined}
      onAction={showMyCommunities ? () => setShowMyCommunities(false) : undefined}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={DesignSystem.colors.gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        <Text style={styles.title}>Communities</Text>
        <Text style={styles.subtitle}>
          Discover and join communities
        </Text>
      </LinearGradient>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <AnimatedButton
          title="All Communities"
          onPress={() => setShowMyCommunities(false)}
          variant={!showMyCommunities ? 'gradient' : 'secondary'}
          size="small"
          style={styles.filterButton}
        />
        <AnimatedButton
          title="My Communities"
          onPress={() => setShowMyCommunities(true)}
          variant={showMyCommunities ? 'gradient' : 'secondary'}
          size="small"
          style={styles.filterButton}
        />
      </View>

      {/* Category Filter */}
      {!showMyCommunities && (
        <View style={styles.categoryFilterContainer}>
          <CategoryFilter
            selectedCategories={selectedCategories}
            onToggleCategory={handleToggleCategory}
            colorScheme={colorScheme}
          />
        </View>
      )}

      {/* Communities List */}
      {loading ? (
        <View style={styles.listContent}>
          <SkeletonList count={4} />
        </View>
      ) : (
        <FlatList
          data={displayedCommunities}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CommunityCard
              community={item}
              isMember={isMember(item.id)}
              onJoin={handleJoin}
              onLeave={handleLeave}
              onPress={handleCommunityPress}
              loading={loadingCommunityId === item.id}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={DesignSystem.colors.primary}
            />
          }
          ListEmptyComponent={renderEmpty}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientHeader: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingTop: 48,
    paddingBottom: DesignSystem.spacing.xl,
  },
  title: {
    fontSize: DesignSystem.typography.fontSize.xxxl,
    fontWeight: DesignSystem.typography.fontWeight.extrabold,
    color: '#FFFFFF',
    marginBottom: DesignSystem.spacing.xs,
    letterSpacing: DesignSystem.typography.letterSpacing.tight,
  },
  subtitle: {
    fontSize: DesignSystem.typography.fontSize.md,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.sm,
    gap: DesignSystem.spacing.md,
  },
  filterButton: {
    flex: 1,
  },
  categoryFilterContainer: {
    paddingTop: DesignSystem.spacing.sm,
  },
  listContent: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.sm,
    paddingBottom: DesignSystem.spacing.lg,
  },
});

