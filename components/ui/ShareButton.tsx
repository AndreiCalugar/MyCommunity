import React from 'react';
import { Pressable, StyleSheet, View, Text, Modal, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DesignSystem, getColors } from '@/constants/designSystem';
import { shareResource, copyShareLink, ShareOptions } from '@/lib/linking/share';
import { EnhancedCard } from './EnhancedCard';

interface ShareButtonProps {
  type: 'community' | 'event' | 'user';
  id: string;
  title: string;
  message?: string;
  iconOnly?: boolean;
  size?: number;
  style?: ViewStyle;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  type,
  id,
  title,
  message,
  iconOnly = false,
  size = 24,
  style,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getColors(isDark);
  const [showModal, setShowModal] = React.useState(false);

  const shareOptions: ShareOptions = { type, id, title, message };

  const handleShare = async () => {
    await shareResource(shareOptions);
    setShowModal(false);
  };

  const handleCopyLink = async () => {
    await copyShareLink(shareOptions);
    setShowModal(false);
  };

  if (iconOnly) {
    return (
      <>
        <Pressable
          style={[styles.iconButton, style]}
          onPress={() => setShowModal(true)}
          android_ripple={{ color: colors.border }}
        >
          <Ionicons name="share-social-outline" size={size} color={colors.text} />
        </Pressable>

        <Modal
          visible={showModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowModal(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowModal(false)}>
            <EnhancedCard
              shadow="xlarge"
              style={styles.modalContent}
              pressable={false}
            >
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Share {type}
              </Text>

              <Pressable
                style={[styles.option, { borderBottomColor: colors.border }]}
                onPress={handleShare}
                android_ripple={{ color: colors.border }}
              >
                <Ionicons name="share-outline" size={24} color={DesignSystem.colors.primary} />
                <Text style={[styles.optionText, { color: colors.text }]}>
                  Share via...
                </Text>
              </Pressable>

              <Pressable
                style={styles.option}
                onPress={handleCopyLink}
                android_ripple={{ color: colors.border }}
              >
                <Ionicons name="link-outline" size={24} color={DesignSystem.colors.primary} />
                <Text style={[styles.optionText, { color: colors.text }]}>
                  Copy Link
                </Text>
              </Pressable>
            </EnhancedCard>
          </Pressable>
        </Modal>
      </>
    );
  }

  return (
    <Pressable
      style={[styles.button, { backgroundColor: colors.surface }, style]}
      onPress={() => setShowModal(true)}
      android_ripple={{ color: colors.border }}
    >
      <Ionicons name="share-social-outline" size={20} color={colors.text} />
      <Text style={[styles.buttonText, { color: colors.text }]}>Share</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  iconButton: {
    padding: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.medium,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borderRadius.medium,
    gap: DesignSystem.spacing.sm,
  },
  buttonText: {
    fontSize: DesignSystem.typography.fontSize.md,
    fontWeight: DesignSystem.typography.fontWeight.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: DesignSystem.spacing.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: DesignSystem.typography.fontSize.xl,
    fontWeight: DesignSystem.typography.fontWeight.bold,
    marginBottom: DesignSystem.spacing.lg,
    textTransform: 'capitalize',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DesignSystem.spacing.lg,
    borderBottomWidth: 1,
    gap: DesignSystem.spacing.lg,
  },
  optionText: {
    fontSize: DesignSystem.typography.fontSize.md,
    fontWeight: DesignSystem.typography.fontWeight.medium,
  },
});

