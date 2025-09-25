import { computed, ref } from 'vue';

const STORAGE_KEY = 'emotion-diary-settings';

function loadSettings() {
  if (typeof window === 'undefined') {
    return { apiKey: '' };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { apiKey: '' };
    }

    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return { apiKey: '' };
    }

    return {
      apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
    };
  } catch (error) {
    console.warn('无法从本地存储读取设置：', error);
    return { apiKey: '' };
  }
}

const settings = ref(loadSettings());

function persist() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.value));
}

export function useSettingsStore() {
  const apiKey = computed(() => settings.value.apiKey || '');

  const setApiKey = value => {
    settings.value = {
      ...settings.value,
      apiKey: (value || '').trim(),
    };
    persist();
  };

  const clearApiKey = () => {
    if (!settings.value.apiKey) {
      return;
    }
    settings.value = {
      ...settings.value,
      apiKey: '',
    };
    persist();
  };

  return {
    apiKey,
    setApiKey,
    clearApiKey,
  };
}
