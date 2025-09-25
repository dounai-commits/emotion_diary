<template>
  <div class="page detail-page">
    <div class="page-inner">
      <header class="page-header detail-header">
        <button type="button" class="icon-button" @click="goBack">
          <span aria-hidden="true">←</span>
          <span class="sr-only">返回上一页</span>
        </button>
        <h1>日志详情</h1>
        <div class="header-actions">
          <RouterLink v-if="diary" :to="`/diary/${diary.id}/edit`" class="icon-button">
            <span aria-hidden="true">✏️</span>
            <span class="sr-only">编辑这篇日志</span>
          </RouterLink>
          <button v-if="diary" type="button" class="icon-button danger" @click="requestDelete">
            <span aria-hidden="true">🗑️</span>
            <span class="sr-only">删除这篇日志</span>
          </button>
        </div>
      </header>

      <section v-if="!diary" class="missing-card">
        <p>这篇日志找不到啦。</p>
        <RouterLink to="/" class="primary-button ghost">回到列表</RouterLink>
      </section>

      <article v-else class="detail-card">
        <div class="mood-hero">
          <div
            class="mood-avatar"
            :style="{ backgroundColor: moodMeta.background, color: moodMeta.color }"
            aria-hidden="true"
          >
            {{ moodMeta.icon }}
          </div>
          <div class="mood-info">
            <div class="mood-label">{{ moodMeta.label }}</div>
            <time class="mood-date">{{ formatFullDate(diary.createdAt) }}</time>
          </div>
        </div>

        <div class="detail-section">
          <h2>事件经过</h2>
          <p>{{ diary.fact || '暂时没有写具体内容。' }}</p>
        </div>

        <div class="detail-section">
          <h2>感受</h2>
          <div v-if="emotionTags.length" class="tag-row">
            <span v-for="tag in emotionTags" :key="tag" class="tag">{{ tag }}</span>
          </div>
          <p v-else class="muted-text">暂时没有记录感受。</p>

          <div v-if="diary.psychological.length" class="detail-group">
            <span class="group-label">心理线索</span>
            <div class="tag-row">
              <span v-for="item in diary.psychological" :key="item" class="chip small">{{ item }}</span>
            </div>
          </div>

          <div v-if="diary.physiological.length" class="detail-group">
            <span class="group-label">身体线索</span>
            <div class="tag-row">
              <span v-for="item in diary.physiological" :key="item" class="chip small">{{ item }}</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h2>想法</h2>
          <p>{{ diary.thoughts || '暂时没有记录想法。' }}</p>
        </div>

        <div class="detail-section">
          <h2>行为</h2>
          <p>{{ diary.behaviors || '暂时没有记录行为。' }}</p>
        </div>

        <div class="detail-section">
          <h2>后果</h2>
          <p>{{ diary.consequences || '暂时没有记录后果。' }}</p>
        </div>
      </article>

      <button v-if="diary" type="button" class="analysis-button" @click="goToAnalysis">
        <span aria-hidden="true">✨</span>
        <span>AI 心情解读</span>
      </button>
    </div>

    <ConfirmDialog
      :open="confirmOpen"
      title="确认删除这篇日志吗？"
      message="删除后就回不来了喔～"
      confirm-text="删除"
      cancel-text="再想想"
      @cancel="closeConfirm"
      @confirm="handleDelete"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import { useDiaryStore } from '../stores/diaryStore.js';
import { getMoodMeta } from '../utils/moods.js';

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
});

const router = useRouter();
const { getDiaryById, deleteDiary } = useDiaryStore();

const diary = computed(() => getDiaryById(props.id));
const moodMeta = computed(() => getMoodMeta(diary.value?.mood));
const confirmOpen = ref(false);

const longDateFormatter = new Intl.DateTimeFormat('zh-CN', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

const emotionTags = computed(() => {
  const entry = diary.value;
  if (!entry || !entry.emotions) {
    return [];
  }

  const presetTags = new Set([...(entry.psychological || []), ...(entry.physiological || [])]);

  return entry.emotions
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag && !presetTags.has(tag));
});

function formatFullDate(value) {
  try {
    return longDateFormatter.format(new Date(value));
  } catch (error) {
    return value;
  }
}

function goBack() {
  router.push({ name: 'home' });
}

function requestDelete() {
  confirmOpen.value = true;
}

function closeConfirm() {
  confirmOpen.value = false;
}

function handleDelete() {
  if (diary.value) {
    deleteDiary(diary.value.id);
    router.push({ name: 'home' });
  }
  closeConfirm();
}

function goToAnalysis() {
  router.push({ name: 'diaryAnalysis', params: { id: props.id } });
}
</script>
