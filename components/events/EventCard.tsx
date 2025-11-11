import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Event } from '@/lib/api/events';

interface EventCardProps {
  event: Event;
  colorScheme: 'light' | 'dark';
  onPress?: () => void;
  onRSVP?: (status: 'going' | 'maybe' | 'not_going') => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  colorScheme,
  onPress,
  onRSVP,
}) => {
  const isDark = colorScheme === 'dark';

  const colors = {
    surface: isDark ? '#2B2D31' : '#F2F3F5',
    text: isDark ? '#FFFFFF' : '#060607',
    secondaryText: isDark ? '#B5BAC1' : '#4E5058',
    going: '#23A559',
    maybe: '#F0B232',
    notGoing: '#ED4245',
  };

  const formatDate = (date: string) => {
    const eventDate = new Date(date);
    return eventDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getRSVPButtonColor = (status: 'going' | 'maybe' | 'not_going' | null) => {
    if (!status) return 'transparent';
    switch (status) {
      case 'going':
        return colors.going + '20';
      case 'maybe':
        return colors.maybe + '20';
      case 'not_going':
        return colors.notGoing + '20';
    }
  };

  const getRSVPTextColor = (status: 'going' | 'maybe' | 'not_going' | null) => {
    if (!status) return colors.secondaryText;
    switch (status) {
      case 'going':
        return colors.going;
      case 'maybe':
        return colors.maybe;
      case 'not_going':
        return colors.notGoing;
    }
  };

  return (
    <Pressable
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={onPress}
    >
      {event.image_url && (
        <Image source={{ uri: event.image_url }} style={styles.image} resizeMode="cover" />
      )}
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {event.title}
        </Text>

        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={16} color={colors.secondaryText} />
          <Text style={[styles.metaText, { color: colors.secondaryText }]}>
            {formatDate(event.event_date)}
          </Text>
        </View>

        {event.location && (
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={16} color={colors.secondaryText} />
            <Text style={[styles.metaText, { color: colors.secondaryText }]} numberOfLines={1}>
              {event.location}
            </Text>
          </View>
        )}

        {event.description && (
          <Text style={[styles.description, { color: colors.secondaryText }]} numberOfLines={2}>
            {event.description}
          </Text>
        )}

        <View style={styles.footer}>
          <View style={styles.attendeeInfo}>
            <Ionicons name="people" size={16} color={colors.secondaryText} />
            <Text style={[styles.attendeeText, { color: colors.secondaryText }]}>
              {event.attendee_count || 0} going
              {event.max_attendees && ` / ${event.max_attendees} max`}
            </Text>
          </View>

          {onRSVP && (
            <View style={styles.rsvpButtons}>
              <Pressable
                style={[
                  styles.rsvpButton,
                  {
                    backgroundColor: getRSVPButtonColor(
                      event.user_rsvp_status === 'going' ? 'going' : null
                    ),
                  },
                ]}
                onPress={() => onRSVP('going')}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={getRSVPTextColor(event.user_rsvp_status === 'going' ? 'going' : null)}
                />
              </Pressable>
              <Pressable
                style={[
                  styles.rsvpButton,
                  {
                    backgroundColor: getRSVPButtonColor(
                      event.user_rsvp_status === 'maybe' ? 'maybe' : null
                    ),
                  },
                ]}
                onPress={() => onRSVP('maybe')}
              >
                <Ionicons
                  name="help-circle"
                  size={20}
                  color={getRSVPTextColor(event.user_rsvp_status === 'maybe' ? 'maybe' : null)}
                />
              </Pressable>
              <Pressable
                style={[
                  styles.rsvpButton,
                  {
                    backgroundColor: getRSVPButtonColor(
                      event.user_rsvp_status === 'not_going' ? 'not_going' : null
                    ),
                  },
                ]}
                onPress={() => onRSVP('not_going')}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={getRSVPTextColor(
                    event.user_rsvp_status === 'not_going' ? 'not_going' : null
                  )}
                />
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 160,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  metaText: {
    fontSize: 14,
    flex: 1,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  attendeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  attendeeText: {
    fontSize: 14,
  },
  rsvpButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  rsvpButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
});

