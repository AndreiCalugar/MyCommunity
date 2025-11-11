import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { Event } from '@/lib/api/events';
import { EventCard } from './EventCard';

interface EventCalendarProps {
  events: Event[];
  selectedDate: string;
  onDateSelect: (date: string) => void;
  onRSVP?: (eventId: string, status: 'going' | 'maybe' | 'not_going') => void;
  onEventPress?: (event: Event) => void;
  colorScheme: 'light' | 'dark';
}

export const EventCalendar: React.FC<EventCalendarProps> = ({
  events,
  selectedDate,
  onDateSelect,
  onRSVP,
  onEventPress,
  colorScheme,
}) => {
  const isDark = colorScheme === 'dark';

  const colors = {
    background: isDark ? '#1E1F22' : '#FFFFFF',
    calendarBackground: isDark ? '#2B2D31' : '#F2F3F5',
    text: isDark ? '#FFFFFF' : '#060607',
    secondaryText: isDark ? '#B5BAC1' : '#4E5058',
    selectedDay: '#5865F2',
    todayText: '#5865F2',
  };

  // Create marked dates object for calendar
  const markedDates = useMemo(() => {
    const marked: any = {};

    events.forEach((event) => {
      const dateKey = event.event_date.split('T')[0];
      
      if (!marked[dateKey]) {
        marked[dateKey] = { dots: [] };
      }

      // Add dot based on RSVP status
      const dotColor = event.user_rsvp_status === 'going' 
        ? '#23A559' 
        : event.user_rsvp_status === 'maybe'
        ? '#F0B232'
        : '#5865F2';

      marked[dateKey].dots.push({
        color: dotColor,
      });
    });

    // Mark selected date
    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: colors.selectedDay,
      };
    }

    return marked;
  }, [events, selectedDate, colors.selectedDay]);

  // Filter events for selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter(
      (event) => event.event_date.split('T')[0] === selectedDate
    );
  }, [events, selectedDate]);

  const handleDayPress = (day: DateData) => {
    onDateSelect(day.dateString);
  };

  return (
    <View style={styles.container}>
      <Calendar
        current={selectedDate || new Date().toISOString().split('T')[0]}
        onDayPress={handleDayPress}
        markingType="multi-dot"
        markedDates={markedDates}
        theme={{
          backgroundColor: colors.background,
          calendarBackground: colors.calendarBackground,
          textSectionTitleColor: colors.secondaryText,
          selectedDayBackgroundColor: colors.selectedDay,
          selectedDayTextColor: '#FFFFFF',
          todayTextColor: colors.todayText,
          dayTextColor: colors.text,
          textDisabledColor: colors.secondaryText,
          monthTextColor: colors.text,
          arrowColor: colors.selectedDay,
          textDayFontWeight: '400',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '600',
          textDayFontSize: 15,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 13,
        }}
        style={styles.calendar}
      />

      <ScrollView style={styles.eventsContainer}>
        {selectedDate && (
          <View style={styles.header}>
            <Text style={[styles.headerText, { color: colors.text }]}>
              Events on {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
        )}

        {selectedDateEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
              {selectedDate 
                ? 'No events on this day'
                : 'Select a date to view events'}
            </Text>
          </View>
        ) : (
          selectedDateEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              colorScheme={colorScheme}
              onPress={onEventPress ? () => onEventPress(event) : undefined}
              onRSVP={onRSVP ? (status) => onRSVP(event.id, status) : undefined}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  calendar: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  eventsContainer: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});

