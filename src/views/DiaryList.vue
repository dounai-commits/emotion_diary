<template>
  <div class="page home-page" @click="handleBackgroundTap">
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
          <li
            v-for="entry in diaries"
            :key="entry.id"
            class="entry-item"
            :data-entry-id="entry.id"
            :class="{ 'entry-item--actions': isMobile && openActionId === entry.id }"
          >
            <div
              class="entry-swipe-wrapper"
              :data-entry-id="entry.id"
              @touchstart="handleTouchStart(entry.id, $event)"
              @touchmove="handleTouchMove(entry.id, $event)"
              @touchend="handleTouchEnd(entry.id)"
              @touchcancel="resetTouchState"
            >
              <RouterLink
                :to="`/diary/${entry.id}`"
                class="entry-card"
                @click="handleCardClick(entry.id, $event)"
              >
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

              <div v-if="isMobile" class="entry-actions" :aria-hidden="openActionId !== entry.id">
                <button type="button" class="entry-action-button" @click.stop="goToEdit(entry.id)">✏️ 编辑</button>
                <button type="button" class="entry-action-button danger" @click.stop="requestDelete(entry.id)">🗑️ 删除</button>
              </div>
            </div>
          </li>
        </ul>
      </div>

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
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import { useDiaryStore } from '../stores/diaryStore.js';
import { getMoodMeta } from '../utils/moods.js';
import { splitTags } from '../utils/tags.js';

const { diaries, deleteDiary } = useDiaryStore();
const router = useRouter();

const confirmOpen = ref(false);
const pendingDeleteId = ref('');
const openActionId = ref('');
const isMobile = ref(false);

let touchStartX = 0;
let touchStartY = 0;
let touchActiveId = '';
let lastDeltaX = 0;
let horizontalSwipe = false;

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function updateIsMobile() {
  if (typeof window === 'undefined') {
    isMobile.value = false;
    return;
  }

  isMobile.value = window.matchMedia('(max-width: 768px)').matches;

  if (!isMobile.value) {
    closeSwipeActions();
  }
}

onMounted(() => {
  updateIsMobile();
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', updateIsMobile);
  }
});

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateIsMobile);
  }
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

  const manualTags = splitTags(entry.emotions);

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
  closeSwipeActions();
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

function handleTouchStart(entryId, event) {
  if (!isMobile.value) {
    return;
  }

  if (openActionId.value && openActionId.value !== entryId) {
    closeSwipeActions();
  }

  const touch = event.touches?.[0];
  if (!touch) {
    return;
  }

  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  touchActiveId = entryId;
  lastDeltaX = 0;
  horizontalSwipe = false;
}

function handleTouchMove(entryId, event) {
  if (!isMobile.value || touchActiveId !== entryId) {
    return;
  }

  const touch = event.touches?.[0];
  if (!touch) {
    return;
  }

  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;

  if (!horizontalSwipe) {
    if (Math.abs(deltaX) > 15 && Math.abs(deltaY) < 20) {
      horizontalSwipe = true;
    } else if (Math.abs(deltaY) > 20) {
      resetTouchState();
      return;
    }
  }

  if (horizontalSwipe) {
    lastDeltaX = deltaX;
  }
}

function handleTouchEnd(entryId) {
  if (!isMobile.value || touchActiveId !== entryId) {
    resetTouchState();
    return;
  }

  if (horizontalSwipe && lastDeltaX > 50) {
    openActionId.value = entryId;
  } else if (horizontalSwipe && lastDeltaX < -30 && openActionId.value === entryId) {
    closeSwipeActions();
  }

  resetTouchState();
}

function resetTouchState() {
  touchActiveId = '';
  lastDeltaX = 0;
  horizontalSwipe = false;
}

function closeSwipeActions() {
  openActionId.value = '';
}

function handleCardClick(entryId, event) {
  if (!isMobile.value || !openActionId.value) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  if (openActionId.value !== entryId) {
    closeSwipeActions();
    return;
  }

  closeSwipeActions();
}

function handleBackgroundTap(event) {
  if (!isMobile.value || !openActionId.value) {
    return;
  }

  const item = event.target.closest('[data-entry-id]');
  if (!item || item.dataset.entryId !== openActionId.value) {
    closeSwipeActions();
  }
}

function goToEdit(id) {
  closeSwipeActions();
  router.push({ name: 'editDiary', params: { id } });
}
</script>
