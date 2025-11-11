import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Button } from '../shared/Button';
import { RESOURCE_CATEGORIES } from '@/lib/api/resources';

interface AddResourceModalProps {
  visible: boolean;
  onClose: () => void;
  onAddLink: (data: {
    title: string;
    description: string;
    url: string;
    category: string;
  }) => void;
  onAddFile: (data: {
    title: string;
    description: string;
    fileUri: string;
    fileName: string;
    fileType: string;
    category: string;
  }) => void;
  colorScheme: 'light' | 'dark';
  loading?: boolean;
}

export const AddResourceModal: React.FC<AddResourceModalProps> = ({
  visible,
  onClose,
  onAddLink,
  onAddFile,
  colorScheme,
  loading = false,
}) => {
  const isDark = colorScheme === 'dark';
  const [activeTab, setActiveTab] = useState<'link' | 'file'>('link');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('');
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name: string;
    mimeType: string;
  } | null>(null);

  const colors = {
    background: isDark ? '#1E1F22' : '#FFFFFF',
    surface: isDark ? '#2B2D31' : '#F2F3F5',
    text: isDark ? '#FFFFFF' : '#060607',
    secondaryText: isDark ? '#B5BAC1' : '#4E5058',
    border: isDark ? '#4E5058' : '#E0E0E0',
    activeTab: '#5865F2',
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setUrl('');
    setCategory('');
    setSelectedFile(null);
    setActiveTab('link');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        setSelectedFile({
          uri: file.uri,
          name: file.name,
          mimeType: file.mimeType || 'application/octet-stream',
        });
        if (!title) {
          setTitle(file.name);
        }
      }
    } catch (error) {
      console.error('Error picking file:', error);
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (activeTab === 'link') {
      if (!url.trim()) {
        Alert.alert('Error', 'Please enter a URL');
        return;
      }
      onAddLink({
        title: title.trim(),
        description: description.trim(),
        url: url.trim(),
        category,
      });
    } else {
      if (!selectedFile) {
        Alert.alert('Error', 'Please select a file');
        return;
      }
      onAddFile({
        title: title.trim(),
        description: description.trim(),
        fileUri: selectedFile.uri,
        fileName: selectedFile.name,
        fileType: selectedFile.mimeType,
        category,
      });
    }
    resetForm();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Add Resource</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <Pressable
            style={[
              styles.tab,
              {
                backgroundColor: activeTab === 'link' ? colors.activeTab : 'transparent',
              },
            ]}
            onPress={() => setActiveTab('link')}
          >
            <Ionicons
              name="link"
              size={20}
              color={activeTab === 'link' ? '#FFFFFF' : colors.secondaryText}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'link' ? '#FFFFFF' : colors.secondaryText },
              ]}
            >
              Link
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.tab,
              {
                backgroundColor: activeTab === 'file' ? colors.activeTab : 'transparent',
              },
            ]}
            onPress={() => setActiveTab('file')}
          >
            <Ionicons
              name="document"
              size={20}
              color={activeTab === 'file' ? '#FFFFFF' : colors.secondaryText}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'file' ? '#FFFFFF' : colors.secondaryText },
              ]}
            >
              File
            </Text>
          </Pressable>
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
              placeholder="Resource title"
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
              placeholder="Add a description..."
              placeholderTextColor={colors.secondaryText}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
          </View>

          {/* Link-specific fields */}
          {activeTab === 'link' && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>URL *</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                ]}
                placeholder="https://example.com"
                placeholderTextColor={colors.secondaryText}
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                keyboardType="url"
                maxLength={500}
              />
            </View>
          )}

          {/* File-specific fields */}
          {activeTab === 'file' && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>File *</Text>
              {selectedFile ? (
                <View style={[styles.filePreview, { backgroundColor: colors.surface }]}>
                  <Ionicons name="document" size={24} color={colors.activeTab} />
                  <Text style={[styles.fileName, { color: colors.text }]}>
                    {selectedFile.name}
                  </Text>
                  <Pressable onPress={() => setSelectedFile(null)}>
                    <Ionicons name="close-circle" size={24} color={colors.secondaryText} />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  style={[styles.filePickerButton, { backgroundColor: colors.surface }]}
                  onPress={handlePickFile}
                >
                  <Ionicons name="cloud-upload-outline" size={32} color={colors.activeTab} />
                  <Text style={[styles.filePickerText, { color: colors.text }]}>
                    Tap to select a file
                  </Text>
                  <Text style={[styles.filePickerSubtext, { color: colors.secondaryText }]}>
                    Max 10MB
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Category (Optional)</Text>
            <View style={styles.categoryGrid}>
              {RESOURCE_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.value}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor:
                        category === cat.value ? colors.activeTab : colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setCategory(category === cat.value ? '' : cat.value)}
                >
                  <Text style={styles.categoryEmoji}>{cat.icon}</Text>
                  <Text
                    style={[
                      styles.categoryLabel,
                      { color: category === cat.value ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Submit Button */}
          <Button
            title={activeTab === 'link' ? 'Add Link' : 'Upload File'}
            onPress={handleSubmit}
            fullWidth
            disabled={loading}
            loading={loading}
          />
        </ScrollView>
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
  tabs: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
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
  filePickerButton: {
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(88, 101, 242, 0.3)',
    borderStyle: 'dashed',
  },
  filePickerText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  filePickerSubtext: {
    fontSize: 13,
    marginTop: 4,
  },
  filePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 12,
  },
  fileName: {
    flex: 1,
    fontSize: 15,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
});

