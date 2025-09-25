export const moodOptions = [
  {
    value: 'awful',
    label: '糟透了',
    icon: '😭',
    background: '#E8EDFF',
    color: '#4F46E5',
  },
  {
    value: 'bad',
    label: '不太好',
    icon: '😢',
    background: '#FFE9EC',
    color: '#EF4444',
  },
  {
    value: 'neutral',
    label: '平平无奇',
    icon: '😐',
    background: '#EFF1F5',
    color: '#6B7280',
  },
  {
    value: 'good',
    label: '挺不错',
    icon: '🙂',
    background: '#E7F8F1',
    color: '#0EA5E9',
  },
  {
    value: 'great',
    label: '好棒棒',
    icon: '😁',
    background: '#FFF4D6',
    color: '#F59E0B',
  },
];

export function getMoodMeta(value) {
  return moodOptions.find(option => option.value === value) || moodOptions[2];
}
