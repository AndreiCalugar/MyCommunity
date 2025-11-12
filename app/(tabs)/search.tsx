import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  ScrollView,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/lib/stores/authStore';
import {
  performSearch,
  getSearchHistory,
  deleteSearchHistory,
  clearSearchHistory,
  SearchType,
  SearchResult,
  SearchHistoryItem,
  getResultCount,
} from '@/lib/api/search';
import { Avatar } from '@/components/shared/Avatar';
import { DesignSystem } from '@/constants/designSystem';

export default function SearchScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuthStore();

  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('all');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(true);

  const colors = {
    background: isDark ? '#1E1F22' : '#FFFFFF',
    surface: isDark ? '#2B2D31' : '#F2F3F5',
    text: isDark ? '#FFFFFF' : '#060607',
    secondaryText: isDark ? '#B5BAC1' : '#4E5058',
    border: isDark ? '#4E5058' : '#E0E0E0',
    active: '#5865F2',
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    if (!user) return;
    try {
      const data = await getSearchHistory(user.id);
      setHistory(data);
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  const handleSearch = async () => {
    if (!query.trim() || !user) return;

    try {
      setLoading(true);
      setShowHistory(false);
      const data = await performSearch(query.trim(), user.id, searchType);
      setResults(data);
      await loadHistory(); // Refresh history
    } catch (error: any) {
      console.error('Error searching:', error);
      Alert.alert('Error', 'Failed to perform search');
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery);
    setShowHistory(false);
    // Trigger search with the clicked query
    performSearch(historyQuery, user!.id, searchType).then((data) => {
      setResults(data);
    });
  };

  const handleDeleteHistory = async (id: string) => {
    try {
      await deleteSearchHistory(id);
      setHistory(history.filter((h) => h.id !== id));
    } catch (error) {
      console.error('Error deleting history:', error);
    }
  };

  const handleClearHistory = async () => {
    if (!user) return;
    Alert.alert('Clear History', 'Are you sure you want to clear all search history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          try {
            await clearSearchHistory(user.id);
            setHistory([]);
          } catch (error) {
            console.error('Error clearing history:', error);
          }
        },
      },
    ]);
  };

  const SearchTypeFilters = () => {
    const types: { value: SearchType; label: string }[] = [
      { value: 'all', label: 'All' },
      { value: 'communities', label: 'Communities' },
      { value: 'posts', label: 'Posts' },
      { value: 'events', label: 'Events' },
      { value: 'resources', label: 'Resources' },
    ];

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        {types.map((type) => (
          <Pressable
            key={type.value}
            style={[
              styles.filterChip,
              searchType === type.value && styles.filterChipActive,
              {
                backgroundColor: searchType === type.value 
                  ? DesignSystem.colors.primary 
                  : isDark ? 'rgba(88, 101, 242, 0.1)' : colors.surface,
              },
            ]}
            onPress={() => setSearchType(type.value)}
            android_ripple={{ color: 'rgba(88, 101, 242, 0.3)' }}
          >
            <Text
              style={[
                styles.filterText,
                { color: searchType === type.value ? '#FFFFFF' : DesignSystem.colors.primary },
              ]}
            >
              {type.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={DesignSystem.colors.gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        <Text style={styles.headerTitle}>Search</Text>
      </LinearGradient>

      {/* Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
        <Ionicons name="search" size={20} color={colors.secondaryText} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search communities, posts, events..."
          placeholderTextColor={colors.secondaryText}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          onFocus={() => setShowHistory(true)}
        />
        {query.length > 0 && (
          <Pressable
            onPress={() => {
              setQuery('');
              setResults(null);
              setShowHistory(true);
            }}
          >
            <Ionicons name="close-circle" size={20} color={colors.secondaryText} />
          </Pressable>
        )}
      </View>

      {/* Filters */}
      <SearchTypeFilters />

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.active} />
          </View>
        ) : showHistory && history.length > 0 ? (
          <View>
            <View style={styles.historyHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Searches</Text>
              <Pressable onPress={handleClearHistory}>
                <Text style={[styles.clearText, { color: colors.active }]}>Clear All</Text>
              </Pressable>
            </View>
            {history.map((item) => (
              <Pressable
                key={item.id}
                style={[styles.historyItem, { backgroundColor: colors.surface }]}
                onPress={() => handleHistoryClick(item.query)}
              >
                <Ionicons name="time-outline" size={20} color={colors.secondaryText} />
                <Text style={[styles.historyText, { color: colors.text }]}>{item.query}</Text>
                <Pressable onPress={() => handleDeleteHistory(item.id)}>
                  <Ionicons name="close" size={20} color={colors.secondaryText} />
                </Pressable>
              </Pressable>
            ))}
          </View>
        ) : results ? (
          <SearchResults results={results} colors={colors} colorScheme={colorScheme} />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={64} color={colors.secondaryText} />
            <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
              Search for communities, posts, events, and resources
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

interface SearchResultsProps {
  results: SearchResult;
  colors: any;
  colorScheme: 'light' | 'dark';
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, colors, colorScheme }) => {
  const totalResults = getResultCount(results);

  if (totalResults === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search-outline" size={64} color={colors.secondaryText} />
        <Text style={[styles.emptyText, { color: colors.secondaryText }]}>No results found</Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={[styles.resultCount, { color: colors.secondaryText }]}>
        {totalResults} result{totalResults !== 1 ? 's' : ''}
      </Text>

      {/* Communities */}
      {results.communities.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Communities ({results.communities.length})
          </Text>
          {results.communities.map((community) => (
            <Pressable
              key={community.id}
              style={[styles.resultItem, { backgroundColor: colors.surface }]}
              onPress={() => router.push(`/community/${community.id}/timeline`)}
            >
              <Avatar imageUrl={community.image_url} name={community.name} size="medium" />
              <View style={styles.resultContent}>
                <Text style={[styles.resultTitle, { color: colors.text }]}>{community.name}</Text>
                <Text style={[styles.resultSubtitle, { color: colors.secondaryText }]}>
                  {community.member_count} members
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />
            </Pressable>
          ))}
        </View>
      )}

      {/* Posts */}
      {results.posts.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Posts ({results.posts.length})
          </Text>
          {results.posts.map((post) => (
            <Pressable
              key={post.id}
              style={[styles.resultItem, { backgroundColor: colors.surface }]}
              onPress={() => router.push(`/community/${post.community_id}/timeline`)}
            >
              <Ionicons name="newspaper-outline" size={24} color={colors.active} />
              <View style={styles.resultContent}>
                <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={2}>
                  {post.content}
                </Text>
                <Text style={[styles.resultSubtitle, { color: colors.secondaryText }]}>
                  {post.profile?.full_name} • {post.community?.name}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {/* Events */}
      {results.events.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Events ({results.events.length})
          </Text>
          {results.events.map((event) => (
            <Pressable
              key={event.id}
              style={[styles.resultItem, { backgroundColor: colors.surface }]}
              onPress={() => router.push(`/community/${event.community_id}/events`)}
            >
              <Ionicons name="calendar-outline" size={24} color={colors.active} />
              <View style={styles.resultContent}>
                <Text style={[styles.resultTitle, { color: colors.text }]}>{event.title}</Text>
                <Text style={[styles.resultSubtitle, { color: colors.secondaryText }]}>
                  {new Date(event.event_date).toLocaleDateString()} • {event.community?.name}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {/* Resources */}
      {results.resources.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Resources ({results.resources.length})
          </Text>
          {results.resources.map((resource) => (
            <Pressable
              key={resource.id}
              style={[styles.resultItem, { backgroundColor: colors.surface }]}
              onPress={() => router.push(`/community/${resource.community_id}/resources`)}
            >
              <Ionicons
                name={resource.type === 'link' ? 'link' : 'document'}
                size={24}
                color={colors.active}
              />
              <View style={styles.resultContent}>
                <Text style={[styles.resultTitle, { color: colors.text }]}>{resource.title}</Text>
                <Text style={[styles.resultSubtitle, { color: colors.secondaryText }]}>
                  {resource.type} • {resource.community?.name}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientHeader: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingTop: 48,
    paddingBottom: DesignSystem.spacing.lg,
  },
  headerTitle: {
    fontSize: DesignSystem.typography.fontSize.xxxl,
    fontWeight: DesignSystem.typography.fontWeight.extrabold,
    color: '#FFFFFF',
    letterSpacing: DesignSystem.typography.letterSpacing.tight,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  filtersContainer: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.sm,
  },
  filterChip: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.round,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipActive: {
    ...DesignSystem.shadows.small,
  },
  filterText: {
    fontSize: DesignSystem.typography.fontSize.sm,
    fontWeight: DesignSystem.typography.fontWeight.semibold as any,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    paddingVertical: 64,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 64,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '600',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  historyText: {
    flex: 1,
    fontSize: 15,
  },
  resultCount: {
    fontSize: 14,
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: 13,
  },
});

