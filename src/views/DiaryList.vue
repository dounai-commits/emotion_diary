<template>
  <section class="view-container">
    <header class="view-header">
      <div>
        <h2>日记列表</h2>
        <p class="view-subtitle">记录你的事件、感受与想法，追踪情绪的变化。</p>
      </div>
      <RouterLink to="/new" class="button primary">新建日记</RouterLink>
    </header>

    <div v-if="!diaries.length" class="empty-state">
      <h3>欢迎开启你的情绪疗愈之旅</h3>
      <p>当情绪在心底泛起波澜，不妨写下来。点击下方按钮，记录第一条日记。</p>
      <RouterLink to="/new" class="button primary">马上记录</RouterLink>
    </div>

    <ul v-else class="diary-list">
      <li v-for="entry in diaries" :key="entry.id" class="diary-card">
        <RouterLink :to="`/diary/${entry.id}`" class="card-content">
          <span class="diary-date">{{ formatDate(entry.createdAt) }}</span>
          <h3 class="diary-event">{{ entry.event }}</h3>
          <p class="diary-feeling">
            <span class="label">主要情绪</span>
            <span class="value">{{ entry.feeling }}</span>
          </p>
        </RouterLink>
        <button
          type="button"
          class="card-delete"
          aria-label="删除日记"
          @click.stop="confirmDelete(entry.id)"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.8"
              d="M9 4h6m2 0h3m-3 0-.7 13.1a2 2 0 0 1-2 1.9H8.7a2 2 0 0 1-2-1.9L6 4h12ZM10 4V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1m-5 5v6m4-6v6"
            />
          </svg>
        </button>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { RouterLink } from 'vue-router';
import { useDiaryStore } from '../stores/diaryStore.js';

const { diaries, deleteDiary } = useDiaryStore();

const formatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function formatDate(value) {
  try {
    return formatter.format(new Date(value));
  } catch (error) {
    return value;
  }
}

function confirmDelete(id) {
  if (window.confirm('确认删除这条日记吗？删除后将无法恢复。')) {
    deleteDiary(id);
  }
}
</script>
