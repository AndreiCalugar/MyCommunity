import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { fetchCommunityMembers, CommunityMember } from '@/lib/api/communityDetail';
import { Avatar } from '@/components/shared/Avatar';

export default function CommunityMembersScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useLocalSearchParams<{ id: string }>();

  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);

  const colors = {
    background: isDark ? '#1E1F22' : '#FFFFFF',
    surface: isDark ? '#2B2D31' : '#F2F3F5',
    text: isDark ? '#FFFFFF' : '#060607',
    secondaryText: isDark ? '#B5BAC1' : '#4E5058',
    border: isDark ? '#4E5058' : '#E0E0E0',
  };

  useEffect(() => {
    loadMembers();
  }, [params.id]);

  const loadMembers = async () => {
    if (!params.id) return;

    try {
      setLoading(true);
      const membersData = await fetchCommunityMembers(params.id);
      setMembers(membersData);
    } catch (error: any) {
      console.error('Error loading members:', error);
      // Check if it's a permission error (not a member)
      if (error.message?.includes('permission') || error.code === 'PGRST301') {
        Alert.alert(
          'Join Required',
          'You need to join this community to view members. Go back and tap the Join button.'
        );
      } else {
        Alert.alert('Error', 'Failed to load community members');
      }
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return '#ED4245';
      case 'moderator':
        return '#5865F2';
      default:
        return colors.secondaryText;
    }
  };

  const renderMember = ({ item }: { item: CommunityMember }) => (
    <View style={[styles.memberCard, { backgroundColor: colors.surface }]}>
      <Avatar
        imageUrl={item.profile.avatar_url}
        name={item.profile.full_name}
        size="medium"
      />
      <View style={styles.memberInfo}>
        <Text style={[styles.memberName, { color: colors.text }]}>
          {item.profile.full_name || 'Unknown User'}
        </Text>
        <Text style={[styles.memberEmail, { color: colors.secondaryText }]}>
          {item.profile.email}
        </Text>
        <Text style={[styles.joinedDate, { color: colors.secondaryText }]}>
          Joined {new Date(item.joined_at).toLocaleDateString()}
        </Text>
      </View>
      {item.role !== 'member' && (
        <View
          style={[
            styles.roleBadge,
            { backgroundColor: getRoleBadgeColor(item.role) + '20' },
          ]}
        >
          <Text style={[styles.roleText, { color: getRoleBadgeColor(item.role) }]}>
            {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
          </Text>
        </View>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
        No members found
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
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {members.length} {members.length === 1 ? 'Member' : 'Members'}
        </Text>
      </View>
      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        renderItem={renderMember}
        contentContainerStyle={styles.listContent}
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
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 13,
    marginBottom: 2,
  },
  joinedDate: {
    fontSize: 12,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});

