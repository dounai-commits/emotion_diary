<template>
  <div class="page settings-page">
    <div class="page-inner">
      <header class="page-header">
        <button type="button" class="icon-button" @click="goBack">
          <span aria-hidden="true">←</span>
          <span class="sr-only">Back</span>
        </button>
        <h1>Settings</h1>
        <div class="header-spacer" aria-hidden="true"></div>
      </header>

      <section class="form-card settings-card">
        <div class="settings-intro">
          <h2>OpenAI API Key</h2>
          <p>
            Provide your personal OpenAI API key to enable real AI-powered analysis. Your key is only stored locally in this
            browser.
          </p>
        </div>

        <form class="settings-form" @submit.prevent="saveKey">
          <label class="form-field">
            <span>API Key</span>
            <input
              v-model.trim="localKey"
              type="password"
              inputmode="text"
              autocomplete="off"
              placeholder="sk-..."
              required
            />
          </label>

          <p class="settings-hint">
            You can create or manage keys from your
            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener">OpenAI dashboard</a>.
          </p>

          <div class="settings-actions">
            <button type="submit" class="primary-button">Save Key</button>
            <button type="button" class="primary-button ghost" @click="clearKey">Remove Key</button>
          </div>
        </form>

        <p v-if="feedback" class="form-feedback">{{ feedback }}</p>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useSettingsStore } from '../stores/settingsStore.js';

const router = useRouter();
const { apiKey, setApiKey, clearApiKey } = useSettingsStore();

const localKey = ref('');
const feedback = ref('');

watch(
  apiKey,
  value => {
    localKey.value = value;
  },
  { immediate: true },
);

function goBack() {
  router.push({ name: 'home' });
}

function saveKey() {
  if (!localKey.value) {
    feedback.value = 'Please paste a valid API key to continue.';
    return;
  }

  setApiKey(localKey.value);
  feedback.value = 'API key saved. You can now use AI analysis.';
}

function clearKey() {
  clearApiKey();
  localKey.value = '';
  feedback.value = 'API key removed.';
}
</script>
