import { computed, ref } from 'vue';

const STORAGE_KEY = 'emotion-diary-entries';

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

    return parsed.map(item => ({
      ...item,
      createdAt: item.createdAt || new Date().toISOString(),
    }));
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

function generateId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function useDiaryStore() {
  const sortedDiaries = computed(() =>
    [...diaries.value].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  );

  const getDiaryById = id => diaries.value.find(item => item.id === id);

  const addDiary = diary => {
    const entry = {
      ...diary,
      id: generateId(),
    };

    diaries.value.push(entry);
    persist();
    return entry;
  };

  const updateDiary = (id, updates) => {
    const index = diaries.value.findIndex(item => item.id === id);
    if (index === -1) {
      return null;
    }

    diaries.value[index] = { ...diaries.value[index], ...updates };
    persist();
    return diaries.value[index];
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
