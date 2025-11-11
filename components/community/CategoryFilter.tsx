import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { COMMUNITY_CATEGORIES } from '@/constants/categories';

interface CategoryFilterProps {
  selectedCategories: string[];
  onToggleCategory: (category: string) => void;
  colorScheme: 'light' | 'dark';
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategories,
  onToggleCategory,
  colorScheme,
}) => {
  const isDark = colorScheme === 'dark';

  const colors = {
    background: isDark ? '#2B2D31' : '#F2F3F5',
    selectedBg: '#5865F2',
    text: isDark ? '#FFFFFF' : '#060607',
    selectedText: '#FFFFFF',
    border: isDark ? '#4E5058' : '#E0E0E0',
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Pressable
          style={[
            styles.chip,
            {
              backgroundColor: selectedCategories.length === 0 ? colors.selectedBg : colors.background,
              borderColor: colors.border,
            },
          ]}
          onPress={() => {
            // Clear all filters
            selectedCategories.forEach((cat) => onToggleCategory(cat));
          }}
        >
          <Text
            style={[
              styles.chipText,
              {
                color: selectedCategories.length === 0 ? colors.selectedText : colors.text,
              },
            ]}
          >
            All
          </Text>
        </Pressable>

        {COMMUNITY_CATEGORIES.map((category) => {
          const isSelected = selectedCategories.includes(category.label);
          return (
            <Pressable
              key={category.id}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected ? colors.selectedBg : colors.background,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => onToggleCategory(category.label)}
            >
              <Text style={styles.emoji}>{category.icon}</Text>
              <Text
                style={[
                  styles.chipText,
                  {
                    color: isSelected ? colors.selectedText : colors.text,
                  },
                ]}
              >
                {category.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  emoji: {
    fontSize: 16,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

