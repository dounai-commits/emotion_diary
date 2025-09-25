<template>
  <div class="page home-page">
    <div class="page-inner">
      <header class="home-hero">
        <h1>Mood Log</h1>
        <p>Track how you feel and notice patterns over time.</p>
      </header>

      <div v-if="!diaries.length" class="empty-card">
        <div class="empty-illustration">📝</div>
        <h2>Your Mood Log is Empty</h2>
        <p>Start by logging your mood to see your patterns over time.</p>
        <RouterLink to="/new" class="primary-button">Create First Log</RouterLink>
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
                <h3 class="entry-title">{{ entry.fact || 'Untitled Entry' }}</h3>
                <div class="entry-tags" v-if="extractTags(entry).length">
                  <span v-for="tag in extractTags(entry)" :key="tag" class="tag">{{ tag }}</span>
                </div>
                <time class="entry-date">{{ formatDate(entry.createdAt) }}</time>
              </div>
            </RouterLink>
            <button type="button" class="icon-button" @click="requestDelete(entry.id)">
              <span aria-hidden="true">🗑️</span>
              <span class="sr-only">Delete log</span>
            </button>
          </li>
        </ul>
      </div>

      <RouterLink v-if="diaries.length" to="/new" class="fab" aria-label="Create a new mood log">
        <span class="fab-icon">✏️</span>
      </RouterLink>
    </div>

    <ConfirmDialog
      :open="confirmOpen"
      title="Delete this log?"
      message="This action cannot be undone."
      confirm-text="Delete"
      cancel-text="Cancel"
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

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
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
  if (!entry || !entry.emotions) {
    return [];
  }

  return entry.emotions
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean)
    .slice(0, 3);
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
