import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/lib/stores/authStore';
import { fetchEvents, rsvpToEvent, deleteEvent, Event } from '@/lib/api/events';
import { supabase } from '@/lib/supabase';
import { Avatar } from '@/components/shared/Avatar';
import { Button } from '@/components/shared/Button';

interface EventAttendee {
  user_id: string;
  status: 'going' | 'maybe' | 'not_going';
  profile: {
    full_name: string;
    avatar_url?: string;
  };
}

export default function EventDetailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useLocalSearchParams<{ id: string; communityId: string }>();
  const { user } = useAuthStore();

  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [showAttendeesModal, setShowAttendeesModal] = useState(false);

  const colors = {
    background: isDark ? '#1E1F22' : '#FFFFFF',
    surface: isDark ? '#2B2D31' : '#F2F3F5',
    text: isDark ? '#FFFFFF' : '#060607',
    secondaryText: isDark ? '#B5BAC1' : '#4E5058',
    border: isDark ? '#4E5058' : '#E0E0E0',
    primary: '#5865F2',
    success: '#23A559',
    warning: '#F0B232',
    danger: '#ED4245',
  };

  useEffect(() => {
    loadEventDetails();
  }, [params.id]);

  const loadEventDetails = async () => {
    if (!params.id || !params.communityId || !user) return;

    try {
      setLoading(true);

      // Fetch event
      const events = await fetchEvents(params.communityId as string, user.id);
      const eventData = events.find((e) => e.id === params.id);

      if (eventData) {
        setEvent(eventData);
        await loadAttendees(params.id as string);
      } else {
        Alert.alert('Error', 'Event not found');
        router.back();
      }
    } catch (error) {
      console.error('Error loading event details:', error);
      Alert.alert('Error', 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const loadAttendees = async (eventId: string) => {
    try {
      const { data: rsvps, error } = await supabase
        .from('event_rsvps')
        .select('user_id, status')
        .eq('event_id', eventId);

      if (error) throw error;

      if (rsvps && rsvps.length > 0) {
        // Fetch profiles
        const userIds = rsvps.map((r) => r.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

        const attendeeList = rsvps
          .map((rsvp) => ({
            user_id: rsvp.user_id,
            status: rsvp.status as 'going' | 'maybe' | 'not_going',
            profile: profileMap.get(rsvp.user_id) || {
              full_name: 'Unknown',
              avatar_url: undefined,
            },
          }))
          .filter((a) => a.status !== 'not_going'); // Don't show "not going"

        setAttendees(attendeeList);
      }
    } catch (error) {
      console.error('Error loading attendees:', error);
    }
  };

  const handleRSVP = async (status: 'going' | 'maybe' | 'not_going') => {
    if (!params.id || !user) return;

    try {
      setRsvpLoading(true);
      await rsvpToEvent(params.id as string, user.id, status);

      // Reload event and attendees
      await loadEventDetails();

      if (status === 'going') {
        Alert.alert('Success', "You're going to this event!");
      } else if (status === 'maybe') {
        Alert.alert('Success', "You're interested in this event!");
      }
    } catch (error: any) {
      console.error('Error updating RSVP:', error);
      Alert.alert('Error', 'Failed to update RSVP');
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;

    Alert.alert('Delete Event', 'Are you sure you want to delete this event?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteEvent(event.id);
            Alert.alert('Success', 'Event deleted');
            router.back();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete event');
          }
        },
      },
    ]);
  };

  const getGoingAttendees = () => attendees.filter((a) => a.status === 'going');
  const getInterestedAttendees = () => attendees.filter((a) => a.status === 'maybe');

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.secondaryText }]}>Event not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={28} color={colors.text} />
        </Pressable>
        {event.created_by === user?.id && (
          <Pressable onPress={handleDelete} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={24} color={colors.danger} />
          </Pressable>
        )}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Event Title */}
        <Text style={[styles.title, { color: colors.text }]}>{event.title}</Text>

        {/* Date & Time */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="calendar" size={24} color={colors.primary} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: colors.secondaryText }]}>Date & Time</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {new Date(event.event_date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {new Date(event.event_date).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>

        {/* Location */}
        {event.location && (
          <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="location" size={24} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.secondaryText }]}>Location</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{event.location}</Text>
            </View>
          </View>
        )}

        {/* Description */}
        {event.description && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
            <Text style={[styles.description, { color: colors.secondaryText }]}>
              {event.description}
            </Text>
          </View>
        )}

        {/* Attendees */}
        <View style={styles.section}>
          <Pressable
            style={styles.sectionHeader}
            onPress={() => setShowAttendeesModal(true)}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Attendees ({attendees.length})
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />
          </Pressable>

          {attendees.length > 0 ? (
            <View>
              {/* Going */}
              {getGoingAttendees().length > 0 && (
                <View style={styles.attendeeSection}>
                  <Text style={[styles.attendeeLabel, { color: colors.success }]}>
                    ✓ Going ({getGoingAttendees().length})
                  </Text>
                  <View style={styles.avatarRow}>
                    {getGoingAttendees().slice(0, 5).map((attendee) => (
                      <Avatar
                        key={attendee.user_id}
                        imageUrl={attendee.profile.avatar_url}
                        name={attendee.profile.full_name}
                        size="small"
                      />
                    ))}
                    {getGoingAttendees().length > 5 && (
                      <View style={[styles.moreCount, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.moreText, { color: colors.text }]}>
                          +{getGoingAttendees().length - 5}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Interested */}
              {getInterestedAttendees().length > 0 && (
                <View style={styles.attendeeSection}>
                  <Text style={[styles.attendeeLabel, { color: colors.warning }]}>
                    ⭐ Interested ({getInterestedAttendees().length})
                  </Text>
                  <View style={styles.avatarRow}>
                    {getInterestedAttendees().slice(0, 5).map((attendee) => (
                      <Avatar
                        key={attendee.user_id}
                        imageUrl={attendee.profile.avatar_url}
                        name={attendee.profile.full_name}
                        size="small"
                      />
                    ))}
                    {getInterestedAttendees().length > 5 && (
                      <View style={[styles.moreCount, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.moreText, { color: colors.text }]}>
                          +{getInterestedAttendees().length - 5}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>
          ) : (
            <Text style={[styles.noAttendees, { color: colors.secondaryText }]}>
              Be the first to RSVP!
            </Text>
          )}
        </View>
      </ScrollView>

      {/* RSVP Actions */}
      <View style={[styles.actions, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Pressable
          style={[
            styles.rsvpButton,
            event.user_rsvp_status === 'going' && { backgroundColor: colors.success },
            !event.user_rsvp_status && { backgroundColor: colors.surface },
          ]}
          onPress={() => handleRSVP('going')}
          disabled={rsvpLoading}
        >
          <Ionicons
            name={event.user_rsvp_status === 'going' ? 'checkmark-circle' : 'checkmark-circle-outline'}
            size={24}
            color={event.user_rsvp_status === 'going' ? '#FFFFFF' : colors.text}
          />
          <Text
            style={[
              styles.rsvpText,
              {
                color: event.user_rsvp_status === 'going' ? '#FFFFFF' : colors.text,
              },
            ]}
          >
            Going
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.rsvpButton,
            event.user_rsvp_status === 'maybe' && { backgroundColor: colors.warning },
            !event.user_rsvp_status && { backgroundColor: colors.surface },
          ]}
          onPress={() => handleRSVP('maybe')}
          disabled={rsvpLoading}
        >
          <Ionicons
            name={event.user_rsvp_status === 'maybe' ? 'star' : 'star-outline'}
            size={24}
            color={event.user_rsvp_status === 'maybe' ? '#FFFFFF' : colors.text}
          />
          <Text
            style={[
              styles.rsvpText,
              {
                color: event.user_rsvp_status === 'maybe' ? '#FFFFFF' : colors.text,
              },
            ]}
          >
            Interested
          </Text>
        </Pressable>

        {event.user_rsvp_status && (
          <Pressable
            style={[styles.rsvpButton, { backgroundColor: colors.surface }]}
            onPress={() => handleRSVP('not_going')}
            disabled={rsvpLoading}
          >
            <Ionicons name="close-circle-outline" size={24} color={colors.danger} />
            <Text style={[styles.rsvpText, { color: colors.danger }]}>Remove</Text>
          </Pressable>
        )}
      </View>

      {/* Attendees Modal */}
      <AttendeesModal
        visible={showAttendeesModal}
        onClose={() => setShowAttendeesModal(false)}
        attendees={attendees}
        colorScheme={colorScheme}
      />
    </View>
  );
}

interface AttendeesModalProps {
  visible: boolean;
  onClose: () => void;
  attendees: EventAttendee[];
  colorScheme: 'light' | 'dark';
}

const AttendeesModal: React.FC<AttendeesModalProps> = ({
  visible,
  onClose,
  attendees,
  colorScheme,
}) => {
  const isDark = colorScheme === 'dark';

  const colors = {
    background: isDark ? '#1E1F22' : '#FFFFFF',
    surface: isDark ? '#2B2D31' : '#F2F3F5',
    text: isDark ? '#FFFFFF' : '#060607',
    secondaryText: isDark ? '#B5BAC1' : '#4E5058',
    border: isDark ? '#4E5058' : '#E0E0E0',
    success: '#23A559',
    warning: '#F0B232',
  };

  const goingAttendees = attendees.filter((a) => a.status === 'going');
  const interestedAttendees = attendees.filter((a) => a.status === 'maybe');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            Attendees ({attendees.length})
          </Text>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={28} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView style={styles.modalContent}>
          {goingAttendees.length > 0 && (
            <View style={styles.modalSection}>
              <Text style={[styles.modalSectionTitle, { color: colors.success }]}>
                ✓ Going ({goingAttendees.length})
              </Text>
              {goingAttendees.map((attendee) => (
                <View key={attendee.user_id} style={[styles.attendeeItem, { backgroundColor: colors.surface }]}>
                  <Avatar
                    imageUrl={attendee.profile.avatar_url}
                    name={attendee.profile.full_name}
                    size="medium"
                  />
                  <Text style={[styles.attendeeName, { color: colors.text }]}>
                    {attendee.profile.full_name}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {interestedAttendees.length > 0 && (
            <View style={styles.modalSection}>
              <Text style={[styles.modalSectionTitle, { color: colors.warning }]}>
                ⭐ Interested ({interestedAttendees.length})
              </Text>
              {interestedAttendees.map((attendee) => (
                <View key={attendee.user_id} style={[styles.attendeeItem, { backgroundColor: colors.surface }]}>
                  <Avatar
                    imageUrl={attendee.profile.avatar_url}
                    name={attendee.profile.full_name}
                    size="medium"
                  />
                  <Text style={[styles.attendeeName, { color: colors.text }]}>
                    {attendee.profile.full_name}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  attendeeSection: {
    marginBottom: 16,
  },
  attendeeLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: -8,
  },
  moreCount: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  moreText: {
    fontSize: 12,
    fontWeight: '600',
  },
  noAttendees: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  rsvpButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  rsvpText: {
    fontSize: 15,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  attendeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  attendeeName: {
    fontSize: 15,
    fontWeight: '500',
  },
});

