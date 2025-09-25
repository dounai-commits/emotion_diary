<template>
  <div class="page settings-page">
    <div class="page-inner">
      <header class="page-header">
        <button type="button" class="icon-button" @click="goBack">
          <span aria-hidden="true">←</span>
          <span class="sr-only">返回上一页</span>
        </button>
        <h1>设置</h1>
        <div class="header-spacer" aria-hidden="true"></div>
      </header>

      <section class="form-card settings-card">
        <div class="settings-intro">
          <h2>OpenAI API 密钥</h2>
          <p>填上你的专属 OpenAI API 密钥，就能召唤真正的 AI 小助理啦。密钥只会乖乖保存在本地浏览器中。</p>
        </div>

        <form class="settings-form" @submit.prevent="saveKey">
          <label class="form-field">
            <span>密钥</span>
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
            可以前往
            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener">OpenAI 控制台</a>
            生成或管理你的密钥。
          </p>

          <div class="settings-actions">
            <button type="submit" class="primary-button">保存密钥</button>
            <button type="button" class="primary-button ghost" @click="clearKey">清除密钥</button>
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
    feedback.value = '请先粘贴有效的密钥呀～';
    return;
  }

  setApiKey(localKey.value);
  feedback.value = '密钥保存成功，AI 小助理已上线！';
}

function clearKey() {
  clearApiKey();
  localKey.value = '';
  feedback.value = '密钥已清除～';
}
</script>
