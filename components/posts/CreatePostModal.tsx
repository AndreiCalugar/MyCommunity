import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button } from '@/components/shared/Button';
import { Ionicons } from '@expo/vector-icons';
import { pickImage } from '@/lib/api/posts';

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (content: string, imageUri?: string) => Promise<void>;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const colors = {
    background: isDark ? '#1E1F22' : '#FFFFFF',
    surface: isDark ? '#2B2D31' : '#F2F3F5',
    text: isDark ? '#FFFFFF' : '#060607',
    secondaryText: isDark ? '#B5BAC1' : '#4E5058',
    border: isDark ? '#4E5058' : '#E0E0E0',
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter some content');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(content.trim(), imageUri || undefined);
      setContent('');
      setImageUri(null);
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const uri = await pickImage();
      if (uri) {
        setImageUri(uri);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to pick image');
    }
  };

  const handleRemoveImage = () => {
    setImageUri(null);
  };

  const handleClose = () => {
    setContent('');
    setImageUri(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Create Post</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Text Input */}
          <TextInput
            style={[
              styles.textInput,
              {
                color: colors.text,
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
            placeholder="What's on your mind?"
            placeholderTextColor={colors.secondaryText}
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={1000}
            autoFocus
          />

          {/* Image Preview */}
          {imageUri && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={handleRemoveImage}
              >
                <Ionicons name="close-circle" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}

          {/* Image Picker Button */}
          <TouchableOpacity
            style={[styles.imageButton, { backgroundColor: colors.surface }]}
            onPress={handlePickImage}
          >
            <Ionicons name="image-outline" size={24} color={colors.text} />
            <Text style={[styles.imageButtonText, { color: colors.text }]}>
              {imageUri ? 'Change Image' : 'Add Image'}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Button
            title="Post"
            onPress={handleSubmit}
            loading={loading}
            disabled={!content.trim()}
            fullWidth
          />
        </View>
      </KeyboardAvoidingView>
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
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  textInput: {
    fontSize: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 150,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  imagePreview: {
    width: '100%',
    height: 250,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 14,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  imageButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
});

