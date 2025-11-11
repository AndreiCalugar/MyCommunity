export const COMMUNITY_CATEGORIES = [
  { id: 'hobbies', label: 'Hobbies', icon: '🎨' },
  { id: 'music', label: 'Music', icon: '🎵' },
  { id: 'money', label: 'Money & Finance', icon: '💰' },
  { id: 'spirituality', label: 'Spirituality', icon: '🧘' },
  { id: 'tech', label: 'Tech', icon: '💻' },
  { id: 'health', label: 'Health & Wellness', icon: '🏥' },
  { id: 'sports', label: 'Sports & Fitness', icon: '⚽' },
  { id: 'self-improvement', label: 'Self-Improvement', icon: '📚' },
  { id: 'gaming', label: 'Gaming', icon: '🎮' },
  { id: 'food', label: 'Food & Cooking', icon: '🍳' },
] as const;

export type CategoryId = typeof COMMUNITY_CATEGORIES[number]['id'];

