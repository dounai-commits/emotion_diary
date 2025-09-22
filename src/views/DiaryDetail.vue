<template>
  <section class="view-container">
    <header class="detail-header">
      <div class="detail-header-bar">
        <button type="button" class="button ghost" @click="goBack">← 返回列表</button>
        <div class="header-actions" v-if="diary">
          <RouterLink :to="`/diary/${diary.id}/edit`" class="button primary">编辑</RouterLink>
          <button type="button" class="button danger" @click="handleDelete">删除</button>
        </div>
      </div>
      <div class="detail-header-text">
        <h2>情绪日记详情</h2>
        <p v-if="diary" class="view-subtitle">记录于 {{ formatDate(diary.createdAt) }} · 主要情绪：{{ diary.feeling }}</p>
      </div>
    </header>

    <div v-if="!diary" class="empty-state">
      <p>找不到对应的日记，可能已经被删除。</p>
      <RouterLink to="/" class="button ghost">返回列表</RouterLink>
    </div>

    <article v-else class="diary-detail">
      <dl class="detail-grid">
        <div class="detail-row">
          <dt>创建时间</dt>
          <dd>{{ formatDate(diary.createdAt) }}</dd>
        </div>
        <div class="detail-row">
          <dt>事件</dt>
          <dd>{{ diary.event }}</dd>
        </div>
        <div class="detail-row">
          <dt>感受</dt>
          <dd>{{ diary.feeling }}</dd>
        </div>
        <div class="detail-row">
          <dt>想法</dt>
          <dd>{{ diary.thought }}</dd>
        </div>
        <div class="detail-row">
          <dt>行为</dt>
          <dd>{{ diary.behavior }}</dd>
        </div>
        <div class="detail-row">
          <dt>后果</dt>
          <dd>{{ diary.result }}</dd>
        </div>
      </dl>
    </article>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useDiaryStore } from '../stores/diaryStore.js';

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
});

const router = useRouter();
const { getDiaryById, deleteDiary } = useDiaryStore();

const diary = computed(() => getDiaryById(props.id));

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

function goBack() {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push({ name: 'home' });
  }
}

function handleDelete() {
  if (!diary.value) {
    return;
  }
  if (window.confirm('确定删除这条日记吗？此操作无法撤销。')) {
    deleteDiary(diary.value.id);
    router.push({ name: 'home' });
  }
}
</script>
