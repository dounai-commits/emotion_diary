<template>
  <div class="page detail-page">
    <div class="page-inner">
      <header class="page-header detail-header">
        <button type="button" class="icon-button" @click="goBack">
          <span aria-hidden="true">←</span>
          <span class="sr-only">Back</span>
        </button>
        <h1>Log Entry</h1>
        <div class="header-actions">
          <RouterLink v-if="diary" :to="`/diary/${diary.id}/edit`" class="icon-button">
            <span aria-hidden="true">✏️</span>
            <span class="sr-only">Edit log</span>
          </RouterLink>
          <button v-if="diary" type="button" class="icon-button danger" @click="requestDelete">
            <span aria-hidden="true">🗑️</span>
            <span class="sr-only">Delete log</span>
          </button>
        </div>
      </header>

      <section v-if="!diary" class="missing-card">
        <p>This log is no longer available.</p>
        <RouterLink to="/" class="primary-button ghost">Back to list</RouterLink>
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
          <h2>Event</h2>
          <p>{{ diary.fact || 'No details provided.' }}</p>
        </div>

        <div class="detail-section">
          <h2>Feelings</h2>
          <div v-if="emotionTags.length" class="tag-row">
            <span v-for="tag in emotionTags" :key="tag" class="tag">{{ tag }}</span>
          </div>
          <p v-else class="muted-text">No feelings captured.</p>

          <div v-if="diary.psychological.length" class="detail-group">
            <span class="group-label">Psychological</span>
            <div class="tag-row">
              <span v-for="item in diary.psychological" :key="item" class="chip small">{{ item }}</span>
            </div>
          </div>

          <div v-if="diary.physiological.length" class="detail-group">
            <span class="group-label">Physiological</span>
            <div class="tag-row">
              <span v-for="item in diary.physiological" :key="item" class="chip small">{{ item }}</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h2>Thoughts</h2>
          <p>{{ diary.thoughts || 'No thoughts noted.' }}</p>
        </div>

        <div class="detail-section">
          <h2>Behaviors</h2>
          <p>{{ diary.behaviors || 'No behaviors noted.' }}</p>
        </div>

        <div class="detail-section">
          <h2>Consequences</h2>
          <p>{{ diary.consequences || 'No consequences recorded.' }}</p>
        </div>
      </article>

      <button v-if="diary" type="button" class="analysis-button" @click="goToAnalysis">
        <span aria-hidden="true">✨</span>
        <span>AI Analysis</span>
      </button>
    </div>

    <ConfirmDialog
      :open="confirmOpen"
      title="Delete this log entry?"
      message="This action cannot be undone."
      confirm-text="Delete"
      cancel-text="Cancel"
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

const longDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

const emotionTags = computed(() => {
  if (!diary.value || !diary.value.emotions) {
    return [];
  }
  return diary.value.emotions
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean);
});

function formatFullDate(value) {
  try {
    return longDateFormatter.format(new Date(value));
  } catch (error) {
    return value;
  }
}

function goBack() {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push({ name: 'home' });
  }
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
