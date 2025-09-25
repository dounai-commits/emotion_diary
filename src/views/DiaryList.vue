<template>
  <div class="page home-page">
    <div class="page-inner">
      <header class="home-hero">
        <div class="home-hero-top">
          <h1>心情记事本</h1>
          <RouterLink to="/settings" class="icon-button" aria-label="打开设置面板">
            <span aria-hidden="true">⚙️</span>
          </RouterLink>
        </div>
        <p>记录心情起伏，久了就能挖出自己的小秘密～</p>
      </header>

      <div v-if="!diaries.length" class="empty-card">
        <div class="empty-illustration">📝</div>
        <h2>心情记事本还空着呢</h2>
        <p>不如现在就写一笔，看看今天的你是什么颜色。</p>
        <RouterLink to="/new" class="primary-button">马上写第一篇</RouterLink>
      </div>

      <div v-else class="entries">
        <ul class="entry-list">
          <li v-for="entry in diaries" :key="entry.id" class="entry-item">
            <RouterLink :to="`/diary/${entry.id}`" class="entry-card">
              <div
                class="entry-avatar"
                :style="{ backgroundColor: getMoodMeta(entry.mood).background, color: getMoodMeta(entry.mood).color }"
                aria-hidden="true"
              >
                {{ getMoodMeta(entry.mood).icon }}
              </div>
              <div class="entry-body">
                <h3 class="entry-title">{{ entry.fact || '未命名日记' }}</h3>
                <div class="entry-tags" v-if="extractTags(entry).length">
                  <span v-for="tag in extractTags(entry)" :key="tag" class="tag">{{ tag }}</span>
                </div>
                <time class="entry-date">{{ formatDate(entry.createdAt) }}</time>
              </div>
            </RouterLink>
            <button type="button" class="icon-button" @click="requestDelete(entry.id)">
              <span aria-hidden="true">🗑️</span>
              <span class="sr-only">删除这篇日志</span>
            </button>
          </li>
        </ul>
      </div>

      <RouterLink v-if="diaries.length" to="/new" class="fab" aria-label="新建心情日志">
        <span class="fab-icon">✏️</span>
      </RouterLink>
    </div>

    <ConfirmDialog
      :open="confirmOpen"
      title="要把这条日志删掉吗？"
      message="删除后就找不回啦～"
      confirm-text="删除"
      cancel-text="再想想"
      @cancel="closeConfirm"
      @confirm="handleDelete"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { RouterLink } from 'vue-router';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import { useDiaryStore } from '../stores/diaryStore.js';
import { getMoodMeta } from '../utils/moods.js';

const { diaries, deleteDiary } = useDiaryStore();

const confirmOpen = ref(false);
const pendingDeleteId = ref('');

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  weekday: 'short',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

function formatDate(value) {
  try {
    return dateFormatter.format(new Date(value));
  } catch (error) {
    return value;
  }
}

function extractTags(entry) {
  if (!entry) {
    return [];
  }

  const presetTags = [...(entry.psychological || []), ...(entry.physiological || [])]
    .map(tag => (typeof tag === 'string' ? tag.trim() : ''))
    .filter(Boolean);

  const manualTags = (entry.emotions || '')
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean);

  const seen = new Set();

  return [...manualTags, ...presetTags].filter(tag => {
    if (seen.has(tag)) {
      return false;
    }

    seen.add(tag);
    return true;
  });
}

function requestDelete(id) {
  pendingDeleteId.value = id;
  confirmOpen.value = true;
}

function closeConfirm() {
  confirmOpen.value = false;
  pendingDeleteId.value = '';
}

function handleDelete() {
  if (pendingDeleteId.value) {
    deleteDiary(pendingDeleteId.value);
  }
  closeConfirm();
}
</script>
