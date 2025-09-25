export const moodOptions = [
  {
    value: 'awful',
    label: 'Awful',
    icon: '😭',
    background: '#E8EDFF',
    color: '#4F46E5',
  },
  {
    value: 'bad',
    label: 'Bad',
    icon: '😢',
    background: '#FFE9EC',
    color: '#EF4444',
  },
  {
    value: 'neutral',
    label: 'Neutral',
    icon: '😐',
    background: '#EFF1F5',
    color: '#6B7280',
  },
  {
    value: 'good',
    label: 'Good',
    icon: '🙂',
    background: '#E7F8F1',
    color: '#0EA5E9',
  },
  {
    value: 'great',
    label: 'Great',
    icon: '😁',
    background: '#FFF4D6',
    color: '#F59E0B',
  },
];

export function getMoodMeta(value) {
  return moodOptions.find(option => option.value === value) || moodOptions[2];
}
