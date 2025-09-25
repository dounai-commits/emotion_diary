<template>
  <div class="page form-page">
    <div class="page-inner">
      <header class="page-header">
        <button type="button" class="icon-button" @click="goBack">
          <span aria-hidden="true">←</span>
          <span class="sr-only">返回上一页</span>
        </button>
        <h1>{{ isEdit ? '编辑日志' : '新建日志' }}</h1>
        <div class="header-spacer" aria-hidden="true"></div>
      </header>

      <section v-if="missingDiary" class="missing-card">
        <p>我们没找到这篇日志，可能已经被删除啦。</p>
        <RouterLink to="/" class="primary-button ghost">回到列表</RouterLink>
      </section>

      <form v-else class="form-card" @submit.prevent="handleSubmit">
        <div class="section-heading">现在心情几分？</div>
        <div class="mood-axis" :style="{ '--mood-accent': activeMood.color }">
          <div class="mood-axis-header">
            <span class="mood-axis-current">
              <span class="mood-axis-current-icon">{{ activeMood.icon }}</span>
              <span>{{ activeMood.label }}</span>
            </span>
            <span class="mood-axis-hint">从“糟糕”滑到“好棒棒”试试看</span>
          </div>
          <div class="mood-axis-slider">
            <input
              class="mood-range"
              type="range"
              :min="0"
              :max="moodOptions.length - 1"
              step="1"
              v-model.number="moodIndex"
              :aria-valuetext="currentMoodLabel"
            />
          </div>
          <div class="mood-axis-labels">
            <button
              v-for="(option, index) in moodOptions"
              :key="option.value"
              type="button"
              class="mood-axis-label"
              :class="{ active: form.mood === option.value }"
              @click="moodIndex = index"
            >
              <span class="mood-axis-icon">{{ option.icon }}</span>
              <span class="mood-axis-text">{{ option.label }}</span>
            </button>
          </div>
        </div>

        <label class="form-field">
          <span>发生了什么</span>
          <textarea
            v-model.trim="form.fact"
            rows="3"
            placeholder="例如：我和伴侣小吵了一架。"
            required
          ></textarea>
        </label>

        <label class="form-field">
          <span>感受 / 情绪</span>
          <textarea
            v-model.trim="form.emotions"
            rows="2"
            placeholder="例如：难过、焦虑、心跳加速…"
          ></textarea>
        </label>

        <div class="form-field">
          <span>心理线索</span>
          <div class="chip-group">
            <button
              v-for="item in psychologicalOptions"
              :key="item"
              type="button"
              class="chip"
              :class="{ selected: form.psychological.includes(item) }"
              @click="toggleSelection(form.psychological, item)"
            >
              {{ item }}
            </button>
          </div>
        </div>

        <div class="form-field">
          <span>身体线索</span>
          <div class="chip-group">
            <button
              v-for="item in physiologicalOptions"
              :key="item"
              type="button"
              class="chip"
              :class="{ selected: form.physiological.includes(item) }"
              @click="toggleSelection(form.physiological, item)"
            >
              {{ item }}
            </button>
          </div>
        </div>

        <label class="form-field">
          <span>当时脑子里的想法</span>
          <textarea
            v-model.trim="form.thoughts"
            rows="3"
            placeholder="例如：“他们不在乎我。”"
            required
          ></textarea>
        </label>

        <label class="form-field">
          <span>你的行为</span>
          <textarea v-model.trim="form.behaviors" rows="3" placeholder="例如：我也大声回喊。" required></textarea>
        </label>

        <label class="form-field">
          <span>之后发生了什么</span>
          <textarea
            v-model.trim="form.consequences"
            rows="3"
            placeholder="例如：我们都觉得受伤又变得疏远。"
            required
          ></textarea>
        </label>

        <label class="form-field">
          <span>日期</span>
          <input v-model="form.createdAt" type="date" required />
        </label>

        <p v-if="feedback" class="form-feedback">{{ feedback }}</p>

        <button type="submit" class="primary-button submit-button">{{ isEdit ? '保存修改' : '保存日志' }}</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useDiaryStore } from '../stores/diaryStore.js';
import { moodOptions } from '../utils/moods.js';

const props = defineProps({
  mode: {
    type: String,
    default: 'create',
  },
  id: {
    type: String,
    default: '',
  },
});

const router = useRouter();
const { addDiary, updateDiary, getDiaryById } = useDiaryStore();

const isEdit = computed(() => props.mode === 'edit');
const feedback = ref('');
const missingDiary = ref(false);

const psychologicalOptions = [
  '焦虑不安',
  '压力山大',
  '情绪低落',
  '有点孤单',
  '有点烦躁',
];

const physiologicalOptions = [
  '头痛',
  '疲惫',
  '恶心反胃',
  '头晕',
  '心悸',
];

const defaultMoodIndex = Math.floor(moodOptions.length / 2);

const form = reactive({
  mood: 'neutral',
  fact: '',
  emotions: '',
  psychological: [],
  physiological: [],
  thoughts: '',
  behaviors: '',
  consequences: '',
  createdAt: '',
});

const activeMood = computed(
  () => moodOptions.find(option => option.value === form.mood) || moodOptions[defaultMoodIndex],
);

const currentMoodLabel = computed(() => activeMood.value.label);

const moodIndex = computed({
  get() {
    const index = moodOptions.findIndex(option => option.value === form.mood);
    return index === -1 ? defaultMoodIndex : index;
  },
  set(value) {
    const normalized = Math.min(moodOptions.length - 1, Math.max(0, Number(value)));
    const option = moodOptions[normalized];
    if (option) {
      form.mood = option.value;
    }
  },
});

function formatDateForInput(value) {
  if (!value) {
    return '';
  }

  try {
    const date = new Date(value);
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  } catch (error) {
    return value;
  }
}

function resetToToday() {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  form.createdAt = `${now.getFullYear()}-${month}-${day}`;
}

function populateForm(entry) {
  form.mood = entry.mood || 'neutral';
  form.fact = entry.fact || '';
  form.emotions = entry.emotions || '';
  form.psychological = Array.isArray(entry.psychological) ? [...entry.psychological] : [];
  form.physiological = Array.isArray(entry.physiological) ? [...entry.physiological] : [];
  form.thoughts = entry.thoughts || '';
  form.behaviors = entry.behaviors || '';
  form.consequences = entry.consequences || '';
  form.createdAt = formatDateForInput(entry.createdAt);

  if (!form.emotions) {
    const combined = [...form.psychological, ...form.physiological];
    if (combined.length) {
      form.emotions = combined.join(', ');
    }
  }
}

onMounted(() => {
  if (isEdit.value) {
    const entry = getDiaryById(props.id);
    if (!entry) {
      missingDiary.value = true;
      return;
    }
    populateForm(entry);
  } else {
    resetToToday();
  }
});

function toggleSelection(list, value) {
  const index = list.indexOf(value);
  const added = index === -1;

  if (added) {
    list.push(value);
  } else {
    list.splice(index, 1);
  }

  syncEmotionField(value, added);
}

function syncEmotionField(value, added) {
  const tokens = form.emotions
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);

  const existingIndex = tokens.findIndex(token => token === value);

  if (added) {
    if (existingIndex === -1) {
      tokens.push(value);
    }
  } else if (existingIndex !== -1) {
    tokens.splice(existingIndex, 1);
  }

  form.emotions = tokens.join(', ');
}

function goBack() {
  if (isEdit.value) {
    router.push({ name: 'diaryDetail', params: { id: props.id } });
  } else {
    router.push({ name: 'home' });
  }
}

function handleSubmit() {
  feedback.value = '';

  if (!form.fact || !form.thoughts || !form.behaviors || !form.consequences || !form.createdAt) {
    feedback.value = '必填项别漏掉呀～';
    return;
  }

  const createdAtIso = new Date(`${form.createdAt}T00:00:00`).toISOString();

  const payload = {
    mood: form.mood,
    fact: form.fact,
    emotions: form.emotions,
    psychological: [...form.psychological],
    physiological: [...form.physiological],
    thoughts: form.thoughts,
    behaviors: form.behaviors,
    consequences: form.consequences,
    createdAt: createdAtIso,
  };

  if (isEdit.value) {
    const updated = updateDiary(props.id, payload);
    if (!updated) {
      feedback.value = '保存失败，小应用可能打了个盹，请稍后再试试～';
      return;
    }
    router.push({ name: 'diaryDetail', params: { id: props.id } });
  } else {
    const created = addDiary(payload);
    router.push({ name: 'diaryDetail', params: { id: created.id } });
  }
}
</script>
