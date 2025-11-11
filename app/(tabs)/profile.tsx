import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/lib/stores/authStore';
import { Avatar } from '@/components/shared/Avatar';
import { Button } from '@/components/shared/Button';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user, signOut } = useAuthStore();

  const colors = {
    background: isDark ? '#1E1F22' : '#FFFFFF',
    surface: isDark ? '#2B2D31' : '#F2F3F5',
    text: isDark ? '#FFFFFF' : '#060607',
    secondaryText: isDark ? '#B5BAC1' : '#4E5058',
    border: isDark ? '#4E5058' : '#E0E0E0',
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
      </View>

      <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
        <View style={styles.avatarContainer}>
          <Avatar
            imageUrl={user?.user_metadata?.avatar_url}
            name={user?.user_metadata?.full_name || user?.email}
            size="xlarge"
          />
        </View>

        <View style={styles.infoContainer}>
          <Text style={[styles.name, { color: colors.text }]}>
            {user?.user_metadata?.full_name || 'No name set'}
          </Text>
          <Text style={[styles.email, { color: colors.secondaryText }]}>
            {user?.email}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>0</Text>
            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>
              Communities
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>0</Text>
            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>
              Posts
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {new Date(user?.created_at || '').toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric',
              })}
            </Text>
            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>
              Joined
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>
          Account
        </Text>
        <View style={[styles.menuItem, { backgroundColor: colors.surface }]}>
          <Text style={[styles.menuText, { color: colors.text }]}>
            Edit Profile
          </Text>
          <Text style={styles.menuSubtext}>Coming soon</Text>
        </View>
        <View style={[styles.menuItem, { backgroundColor: colors.surface }]}>
          <Text style={[styles.menuText, { color: colors.text }]}>
            Notification Settings
          </Text>
          <Text style={styles.menuSubtext}>Coming soon</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>
          About
        </Text>
        <View style={[styles.menuItem, { backgroundColor: colors.surface }]}>
          <Text style={[styles.menuText, { color: colors.text }]}>
            Version
          </Text>
          <Text style={[styles.menuSubtext, { color: colors.secondaryText }]}>
            1.0.0
          </Text>
        </View>
      </View>

      <View style={styles.signOutContainer}>
        <Button
          title="Sign Out"
          onPress={handleSignOut}
          variant="danger"
          fullWidth
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
    paddingTop: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  profileCard: {
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  menuItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuSubtext: {
    fontSize: 14,
    color: '#B5BAC1',
  },
  signOutContainer: {
    marginTop: 8,
    marginBottom: 32,
  },
});

