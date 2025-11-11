import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button } from '../shared/Button';

interface CreateEventModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (eventData: {
    title: string;
    description: string;
    event_date: string;
    end_date?: string;
    location?: string;
    max_attendees?: number;
  }) => void;
  colorScheme: 'light' | 'dark';
  loading?: boolean;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  visible,
  onClose,
  onCreate,
  colorScheme,
  loading = false,
}) => {
  const isDark = colorScheme === 'dark';
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [maxAttendees, setMaxAttendees] = useState('');

  const colors = {
    background: isDark ? '#1E1F22' : '#FFFFFF',
    surface: isDark ? '#2B2D31' : '#F2F3F5',
    text: isDark ? '#FFFFFF' : '#060607',
    secondaryText: isDark ? '#B5BAC1' : '#4E5058',
    border: isDark ? '#4E5058' : '#E0E0E0',
  };

  const handleCreate = () => {
    if (!title.trim()) return;

    onCreate({
      title: title.trim(),
      description: description.trim(),
      event_date: eventDate.toISOString(),
      location: location.trim() || undefined,
      max_attendees: maxAttendees ? parseInt(maxAttendees) : undefined,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setLocation('');
    setEventDate(new Date());
    setMaxAttendees('');
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setEventDate(selectedDate);
    }
  };

  const onTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (selectedDate) {
      setEventDate(selectedDate);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Create Event</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Title */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Title *</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
              ]}
              placeholder="Event title"
              placeholderTextColor={colors.secondaryText}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Description</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
              ]}
              placeholder="Event description..."
              placeholderTextColor={colors.secondaryText}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
          </View>

          {/* Date & Time */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Date & Time *</Text>
            <View style={styles.dateTimeRow}>
              <Pressable
                style={[styles.dateButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={colors.text} />
                <Text style={[styles.dateText, { color: colors.text }]}>
                  {eventDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.dateButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setShowTimePicker(true)}
              >
                <Ionicons name="time-outline" size={20} color={colors.text} />
                <Text style={[styles.dateText, { color: colors.text }]}>
                  {eventDate.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Location */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Location</Text>
            <View style={styles.inputWithIcon}>
              <Ionicons name="location-outline" size={20} color={colors.secondaryText} />
              <TextInput
                style={[
                  styles.input,
                  styles.inputWithIconField,
                  { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                ]}
                placeholder="Event location"
                placeholderTextColor={colors.secondaryText}
                value={location}
                onChangeText={setLocation}
                maxLength={100}
              />
            </View>
          </View>

          {/* Max Attendees */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Max Attendees (Optional)</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
              ]}
              placeholder="Leave empty for unlimited"
              placeholderTextColor={colors.secondaryText}
              value={maxAttendees}
              onChangeText={setMaxAttendees}
              keyboardType="number-pad"
              maxLength={4}
            />
          </View>

          {/* Create Button */}
          <Button
            title="Create Event"
            onPress={handleCreate}
            fullWidth
            disabled={!title.trim() || loading}
            loading={loading}
          />
        </ScrollView>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={eventDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )}

        {/* Time Picker */}
        {showTimePicker && (
          <DateTimePicker
            value={eventDate}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onTimeChange}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 36,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 15,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 15,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inputWithIconField: {
    flex: 1,
  },
});

