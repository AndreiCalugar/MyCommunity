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
  fetchEvents,
  createEvent,
  rsvpToEvent,
  Event,
} from '@/lib/api/events';
import { checkMembership } from '@/lib/api/communities';
import { EventCard } from '@/components/events/EventCard';
import { EventCalendar } from '@/components/events/EventCalendar';
import { CreateEventModal } from '@/components/events/CreateEventModal';
import { Ionicons } from '@expo/vector-icons';

export default function CommunityEventsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useGlobalSearchParams<{ id: string }>();
  const { user } = useAuthStore();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const colors = {
    background: isDark ? '#1E1F22' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#060607',
    secondaryText: isDark ? '#B5BAC1' : '#4E5058',
    fab: '#5865F2',
  };

  useEffect(() => {
    if (params.id && user) {
      loadEvents();
      checkUserRole();
    }
  }, [params.id, user]);

  // Reload events when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (params.id && user) {
        loadEvents();
      }
    }, [params.id, user])
  );

  const loadEvents = async () => {
    if (!params.id || !user) return;

    try {
      setLoading(true);
      const eventsData = await fetchEvents(params.id as string, user.id);
      setEvents(eventsData);
    } catch (error: any) {
      console.error('Error loading events:', error);
      if (error.message?.includes('permission') || error.code === 'PGRST301') {
        Alert.alert(
          'Join Required',
          'You need to join this community to view events.'
        );
      } else {
        Alert.alert('Error', 'Failed to load events');
      }
    } finally {
      setLoading(false);
    }
  };

  const checkUserRole = async () => {
    if (!params.id || !user) return;

    try {
      const memberStatus = await checkMembership(user.id, params.id as string);
      setIsMember(memberStatus);

      // Check if user is admin or moderator (simplified - you might want to fetch actual role)
      // For now, we'll just check membership. You can enhance this later.
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const handleCreateEvent = async (eventData: {
    title: string;
    description: string;
    event_date: string;
    end_date?: string;
    location?: string;
    max_attendees?: number;
  }) => {
    if (!params.id || !user) return;

    try {
      setCreating(true);
      await createEvent(params.id as string, user.id, eventData);
      setShowCreateModal(false);
      // Reload events from server to ensure consistency
      await loadEvents();
      Alert.alert('Success', 'Event created successfully!');
    } catch (error: any) {
      console.error('Error creating event:', error);
      Alert.alert('Error', error.message || 'Failed to create event');
    } finally {
      setCreating(false);
    }
  };

  const handleRSVP = async (eventId: string, status: 'going' | 'maybe' | 'not_going') => {
    if (!user) return;

    try {
      await rsvpToEvent(eventId, user.id, status);

      // Update local state
      setEvents((prev) =>
        prev.map((event) => {
          if (event.id === eventId) {
            const oldStatus = event.user_rsvp_status;
            const newCount = event.attendee_count || 0;

            // Calculate new attendee count
            let updatedCount = newCount;
            if (oldStatus === 'going' && status !== 'going') {
              updatedCount -= 1;
            } else if (oldStatus !== 'going' && status === 'going') {
              updatedCount += 1;
            }

            return {
              ...event,
              user_rsvp_status: status,
              attendee_count: Math.max(0, updatedCount),
            };
          }
          return event;
        })
      );
    } catch (error: any) {
      console.error('Error RSVPing to event:', error);
      Alert.alert('Error', 'Failed to update RSVP');
    }
  };

  const renderEvent = ({ item }: { item: Event }) => (
    <EventCard
      event={item}
      colorScheme={colorScheme}
      onRSVP={(status) => handleRSVP(item.id, status)}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={64} color={colors.secondaryText} />
      <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
        No upcoming events
      </Text>
      <Text style={[styles.emptySubtext, { color: colors.secondaryText }]}>
        {isAdmin ? 'Create an event to get started!' : 'Check back later'}
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
      {/* View Toggle */}
      <View style={styles.viewToggle}>
        <Pressable
          style={[
            styles.toggleButton,
            viewMode === 'list' && styles.activeToggle,
            { backgroundColor: viewMode === 'list' ? colors.fab : 'transparent' },
          ]}
          onPress={() => setViewMode('list')}
        >
          <Ionicons
            name="list"
            size={20}
            color={viewMode === 'list' ? '#FFFFFF' : colors.secondaryText}
          />
          <Text
            style={[
              styles.toggleText,
              { color: viewMode === 'list' ? '#FFFFFF' : colors.secondaryText },
            ]}
          >
            List
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.toggleButton,
            viewMode === 'calendar' && styles.activeToggle,
            { backgroundColor: viewMode === 'calendar' ? colors.fab : 'transparent' },
          ]}
          onPress={() => setViewMode('calendar')}
        >
          <Ionicons
            name="calendar"
            size={20}
            color={viewMode === 'calendar' ? '#FFFFFF' : colors.secondaryText}
          />
          <Text
            style={[
              styles.toggleText,
              { color: viewMode === 'calendar' ? '#FFFFFF' : colors.secondaryText },
            ]}
          >
            Calendar
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      {viewMode === 'list' ? (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={renderEvent}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
        />
      ) : (
        <EventCalendar
          events={events}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          onRSVP={handleRSVP}
          colorScheme={colorScheme}
        />
      )}

      {/* FAB for admins/moderators to create events */}
      {isMember && (
        <Pressable
          style={[styles.fab, { backgroundColor: colors.fab }]}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </Pressable>
      )}

      <CreateEventModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateEvent}
        colorScheme={colorScheme}
        loading={creating}
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
  viewToggle: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeToggle: {
    // Active state handled by backgroundColor
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
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

