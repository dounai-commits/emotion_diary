import { computed, ref } from 'vue';

const STORAGE_KEY = 'emotion-diary-entries';

function generateId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeDiary(item = {}) {
  const normalized = {
    id: item.id || generateId(),
    createdAt: item.createdAt || new Date().toISOString(),
    mood: item.mood || 'neutral',
    fact: item.fact ?? item.event ?? '',
    emotions: item.emotions ?? item.feeling ?? '',
    psychological: Array.isArray(item.psychological)
      ? [...item.psychological]
      : typeof item.psychological === 'string'
        ? item.psychological
            .split(',')
            .map(part => part.trim())
            .filter(Boolean)
        : [],
    physiological: Array.isArray(item.physiological)
      ? [...item.physiological]
      : typeof item.physiological === 'string'
        ? item.physiological
            .split(',')
            .map(part => part.trim())
            .filter(Boolean)
        : [],
    thoughts: item.thoughts ?? item.thought ?? '',
    behaviors: item.behaviors ?? item.behavior ?? '',
    consequences: item.consequences ?? item.result ?? '',
  };

  return normalized;
}

function loadFromStorage() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map(normalizeDiary);
  } catch (error) {
    console.warn('无法从本地存储读取日记：', error);
    return [];
  }
}

const diaries = ref(loadFromStorage());

function persist() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(diaries.value));
}

export function useDiaryStore() {
  const sortedDiaries = computed(() =>
    [...diaries.value].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  );

  const getDiaryById = id => diaries.value.find(item => item.id === id);

  const addDiary = diary => {
    const entry = normalizeDiary({ ...diary, id: generateId() });
    diaries.value.push(entry);
    persist();
    return entry;
  };

  const updateDiary = (id, updates) => {
    const index = diaries.value.findIndex(item => item.id === id);
    if (index === -1) {
      return null;
    }

    const updated = normalizeDiary({ ...diaries.value[index], ...updates, id });
    diaries.value[index] = updated;
    persist();
    return updated;
  };

  const deleteDiary = id => {
    const index = diaries.value.findIndex(item => item.id === id);
    if (index === -1) {
      return false;
    }

    diaries.value.splice(index, 1);
    persist();
    return true;
  };

  return {
    diaries: sortedDiaries,
    getDiaryById,
    addDiary,
    updateDiary,
    deleteDiary,
  };
}
