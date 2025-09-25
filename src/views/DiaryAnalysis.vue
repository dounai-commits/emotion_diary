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

      <div v-else class="analysis-layout">
        <p v-if="analysisError" class="analysis-alert error">{{ analysisError }}</p>

        <div ref="messageList" class="message-list">
          <p v-if="!messages.length && !isLoading && !analysisError" class="muted-text">
            Your insights will appear here once the analysis is ready.
          </p>

          <div
            v-for="message in messages"
            :key="message.id"
            class="message"
            :class="message.role"
            :data-message-id="message.id"
          >
            <div class="message-icon" v-if="message.role === 'assistant'">✨</div>
            <div class="message-content">{{ message.text }}</div>
          </div>

          <div v-if="isLoading" class="message assistant pending">
            <div class="message-icon">✨</div>
            <div class="message-content">Analyzing your entry…</div>
          </div>
        </div>

        <form class="analysis-input" @submit.prevent="submitQuestion">
          <label class="sr-only" for="follow-up-input">Ask a follow-up</label>
          <input
            id="follow-up-input"
            v-model="question"
            type="text"
            placeholder="Ask a follow-up question..."
            :disabled="isLoading"
          />
          <button type="submit" class="send-button" :disabled="!question.trim() || isLoading">
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
import { useSettingsStore } from '../stores/settingsStore.js';
import { getMoodMeta } from '../utils/moods.js';

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
});

const router = useRouter();
const { getDiaryById } = useDiaryStore();
const { apiKey } = useSettingsStore();

const diary = computed(() => getDiaryById(props.id));
const question = ref('');
const messages = ref([]);
const messageList = ref(null);
const conversation = ref([]);
const isLoading = ref(false);
const analysisError = ref('');

const SYSTEM_PROMPT = `You are a compassionate journaling coach. Offer warm, practical reflections in two or three short paragraphs. Reference the person's mood, feelings, thoughts, behaviours, and outcomes. Encourage gentle self-awareness and next steps without sounding clinical.`;

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

watch(
  diary,
  value => {
    messages.value = [];
    conversation.value = [];
    analysisError.value = '';
    question.value = '';

    if (value) {
      runInitialAnalysis();
    }
  },
  { immediate: true },
);

watch(apiKey, () => {
  if (!diary.value) {
    return;
  }

  if (!apiKey.value) {
    analysisError.value = 'Add your OpenAI API key in Settings to enable AI analysis.';
    return;
  }

  if (!messages.value.length && !isLoading.value) {
    analysisError.value = '';
    runInitialAnalysis();
  }
});

function buildInitialPrompt(entry) {
  const mood = getMoodMeta(entry.mood);
  const feelings = entry.emotions || 'Not specified';
  const thoughts = entry.thoughts || 'Not specified';
  const behaviors = entry.behaviors || 'Not specified';
  const consequences = entry.consequences || 'Not specified';

  return `Diary entry details:\nMood: ${mood.label} (${entry.mood})\nEvent: ${entry.fact || 'Not specified'}\nFeelings: ${feelings}\nPsychological notes: ${(entry.psychological || []).join(', ') || 'Not specified'}\nPhysiological notes: ${(entry.physiological || []).join(', ') || 'Not specified'}\nThoughts: ${thoughts}\nBehaviors: ${behaviors}\nConsequences: ${consequences}\n\nPlease provide a caring reflection that helps the writer process this experience.`;
}

async function runInitialAnalysis() {
  if (!diary.value) {
    return;
  }

  if (!apiKey.value) {
    analysisError.value = 'Add your OpenAI API key in Settings to enable AI analysis.';
    return;
  }

  isLoading.value = true;
  conversation.value = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: buildInitialPrompt(diary.value) },
  ];

  try {
    const reply = await requestOpenAI(conversation.value);
    const assistantMessage = { id: createMessageId(), role: 'assistant', text: reply };
    messages.value.push(assistantMessage);
    conversation.value.push({ role: 'assistant', content: reply });
    analysisError.value = '';
    scrollToMessage(assistantMessage.id, 'end');
  } catch (error) {
    analysisError.value = formatError(error);
  } finally {
    isLoading.value = false;
  }
}

function scrollToMessage(targetId, position = 'end') {
  nextTick(() => {
    const container = messageList.value;
    if (!container) {
      return;
    }

    if (targetId) {
      const element = container.querySelector(`[data-message-id="${targetId}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: position, inline: 'nearest' });
        return;
      }
    }

    if (position === 'start') {
      container.scrollTop = 0;
    } else {
      container.scrollTop = container.scrollHeight;
    }
  });
}

function formatError(error) {
  if (error instanceof Error) {
    return `AI analysis failed: ${error.message}`;
  }
  return 'AI analysis failed. Please try again later.';
}

async function requestOpenAI(payload) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey.value}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: payload,
      temperature: 0.7,
    }),
  });

  let data = null;
  try {
    data = await response.json();
  } catch (error) {
    data = null;
  }

  if (!response.ok) {
    const message = data?.error?.message || response.statusText || 'Unable to reach OpenAI.';
    throw new Error(message);
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('The AI response was empty.');
  }

  return content.trim();
}

function goBack() {
  router.push({ name: 'diaryDetail', params: { id: props.id } });
}

async function submitQuestion() {
  if (!question.value.trim() || !diary.value) {
    return;
  }

  const content = question.value.trim();
  const userMessage = { id: createMessageId(), role: 'user', text: content };
  messages.value.push(userMessage);
  conversation.value.push({ role: 'user', content });
  question.value = '';
  scrollToMessage(userMessage.id, 'start');

  if (!apiKey.value) {
    analysisError.value = 'Add your OpenAI API key in Settings to enable AI analysis.';
    return;
  }

  isLoading.value = true;

  try {
    const reply = await requestOpenAI(conversation.value);
    const assistantMessage = { id: createMessageId(), role: 'assistant', text: reply };
    messages.value.push(assistantMessage);
    conversation.value.push({ role: 'assistant', content: reply });
    analysisError.value = '';
    scrollToMessage(assistantMessage.id, 'end');
  } catch (error) {
    analysisError.value = formatError(error);
  } finally {
    isLoading.value = false;
  }
}
</script>
