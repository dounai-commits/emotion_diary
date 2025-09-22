<template>
  <section class="view-container">
    <header class="view-header">
      <div>
        <h2>{{ isEdit ? '编辑情绪日记' : '新建情绪日记' }}</h2>
        <p class="view-subtitle">从事件到后果，完整记录让你更了解当下的自己。</p>
      </div>
    </header>

    <div v-if="missingDiary" class="empty-state">
      <p>未找到对应的日记，可能已被删除。</p>
      <RouterLink to="/" class="button">返回日记列表</RouterLink>
    </div>

    <form v-else class="diary-form" @submit.prevent="handleSubmit">
      <div class="form-grid">
        <label class="form-field">
          <span>创建时间</span>
          <input v-model="form.createdAt" type="date" required />
        </label>
        <label class="form-field">
          <span>事件</span>
          <input v-model.trim="form.event" type="text" required placeholder="发生了什么？" />
        </label>
        <label class="form-field">
          <span>感受</span>
          <input v-model.trim="form.feeling" type="text" required placeholder="你感受到的主要情绪" />
        </label>
        <label class="form-field wide">
          <span>想法</span>
          <textarea v-model.trim="form.thought" rows="3" required placeholder="当时的念头或判断"></textarea>
        </label>
        <label class="form-field wide">
          <span>行为</span>
          <textarea v-model.trim="form.behavior" rows="3" required placeholder="你采取了什么行动"></textarea>
        </label>
        <label class="form-field wide">
          <span>后果</span>
          <textarea v-model.trim="form.result" rows="3" required placeholder="产生了哪些影响或结果"></textarea>
        </label>
      </div>

      <p v-if="feedback" class="form-feedback">{{ feedback }}</p>

      <div class="form-actions">
        <button type="submit" class="button primary">{{ isEdit ? '保存修改' : '保存日记' }}</button>
        <button type="button" class="button" @click="goBack">取消</button>
      </div>
    </form>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useDiaryStore } from '../stores/diaryStore.js';

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

const form = reactive({
  createdAt: '',
  event: '',
  feeling: '',
  thought: '',
  behavior: '',
  result: '',
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
  const today = new Date();
  const month = `${today.getMonth() + 1}`.padStart(2, '0');
  const day = `${today.getDate()}`.padStart(2, '0');
  form.createdAt = `${today.getFullYear()}-${month}-${day}`;
}

function populateForm(entry) {
  form.createdAt = formatDateForInput(entry.createdAt);
  form.event = entry.event || '';
  form.feeling = entry.feeling || '';
  form.thought = entry.thought || '';
  form.behavior = entry.behavior || '';
  form.result = entry.result || '';
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

function goBack() {
  if (isEdit.value) {
    router.push({ name: 'diaryDetail', params: { id: props.id } });
  } else {
    router.push({ name: 'home' });
  }
}

function handleSubmit() {
  feedback.value = '';

  if (!form.createdAt || !form.event || !form.feeling || !form.thought || !form.behavior || !form.result) {
    feedback.value = '请完整填写所有必填项。';
    return;
  }

  const createdAtIso = new Date(form.createdAt).toISOString();
  const payload = {
    createdAt: createdAtIso,
    event: form.event,
    feeling: form.feeling,
    thought: form.thought,
    behavior: form.behavior,
    result: form.result,
  };

  if (isEdit.value) {
    const updated = updateDiary(props.id, payload);
    if (!updated) {
      feedback.value = '未能保存修改，请稍后重试。';
      return;
    }
    router.push({ name: 'diaryDetail', params: { id: props.id } });
  } else {
    const created = addDiary(payload);
    router.push({ name: 'diaryDetail', params: { id: created.id } });
  }
}
</script>
