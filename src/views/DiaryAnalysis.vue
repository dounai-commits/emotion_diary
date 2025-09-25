<template>
  <div class="page analysis-page">
    <div class="page-inner">
      <header class="page-header analysis-header">
        <button type="button" class="icon-button" @click="goBack">
          <span aria-hidden="true">←</span>
          <span class="sr-only">Back</span>
        </button>
        <h1>AI Analysis</h1>
        <div class="header-spacer" aria-hidden="true"></div>
      </header>

      <section v-if="!diary" class="missing-card">
        <p>This log is no longer available.</p>
        <RouterLink to="/" class="primary-button ghost">Back to list</RouterLink>
      </section>

      <div v-else class="analysis-card">
        <div ref="messageList" class="message-list">
          <div
            v-for="message in messages"
            :key="message.id"
            class="message"
            :class="message.role"
          >
            <div class="message-icon" v-if="message.role === 'assistant'">✨</div>
            <div class="message-content">{{ message.text }}</div>
          </div>
        </div>

        <form class="follow-up" @submit.prevent="submitQuestion">
          <label class="sr-only" for="follow-up-input">Ask a follow-up</label>
          <input
            id="follow-up-input"
            v-model="question"
            type="text"
            placeholder="Ask a follow-up question..."
          />
          <button type="submit" class="send-button" :disabled="!question.trim()">
            <span aria-hidden="true">➤</span>
            <span class="sr-only">Send</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useDiaryStore } from '../stores/diaryStore.js';
import { getMoodMeta } from '../utils/moods.js';

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
});

const router = useRouter();
const { getDiaryById } = useDiaryStore();

const diary = computed(() => getDiaryById(props.id));
const question = ref('');
const messages = ref([]);
const messageList = ref(null);

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildInsights(entry) {
  if (!entry) {
    return [];
  }

  const mood = getMoodMeta(entry.mood);
  const feelings = entry.emotions || 'the feelings you experienced';
  const thoughts = entry.thoughts || 'the thoughts you noted';
  const behaviors = entry.behaviors || 'the actions you described';
  const consequences = entry.consequences || 'the outcomes you mentioned';

  return [
    {
      id: createMessageId(),
      role: 'assistant',
      text: `It seems ${entry.fact || 'this moment'} left you feeling ${feelings}. Your mood was noted as ${mood.label.toLowerCase()}, suggesting a strong emotional impact.`,
    },
    {
      id: createMessageId(),
      role: 'assistant',
      text: `You described ${behaviors.toLowerCase()} and linked it with ${consequences.toLowerCase()}. How might these reactions have been shaped by ${thoughts.toLowerCase()}?`,
    },
    {
      id: createMessageId(),
      role: 'assistant',
      text: `Consider one small way to respond differently if a similar situation happens again. What support or self-talk could help you move from feeling ${mood.label.toLowerCase()} toward a more balanced state?`,
    },
  ];
}

watch(
  diary,
  value => {
    messages.value = buildInsights(value);
    scrollToBottom();
  },
  { immediate: true },
);

function scrollToBottom() {
  nextTick(() => {
    if (messageList.value) {
      messageList.value.scrollTop = messageList.value.scrollHeight;
    }
  });
}

function goBack() {
  if (window.history.length > 1) {
    router.back();
  } else if (diary.value) {
    router.push({ name: 'diaryDetail', params: { id: diary.value.id } });
  } else {
    router.push({ name: 'home' });
  }
}

function buildFollowUpResponse(query, entry) {
  const mood = getMoodMeta(entry.mood);
  return {
    id: createMessageId(),
    role: 'assistant',
    text: `Thanks for sharing more. When you think about "${query}", notice how it relates to feeling ${mood.label.toLowerCase()}. What gentle step could you take to care for yourself before, during, or after a similar moment?`,
  };
}

function submitQuestion() {
  if (!question.value.trim() || !diary.value) {
    return;
  }

  const content = question.value.trim();
  messages.value = [
    ...messages.value,
    { id: createMessageId(), role: 'user', text: content },
    buildFollowUpResponse(content, diary.value),
  ];
  question.value = '';
  scrollToBottom();
}
</script>
