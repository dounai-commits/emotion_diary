<template>
  <div class="page insights-page">
    <div class="page-inner insights-inner">
      <header class="insights-hero">
        <h1>趋势分析</h1>
        <p>看看最近的心情节奏，找到属于自己的小趋势。</p>
      </header>

      <section class="insights-card" aria-labelledby="calendar-title">
        <div class="insights-card-header">
          <div>
            <h2 id="calendar-title">心情日历</h2>
            <p class="insights-card-subtitle">切换周/月视图，追踪每天的心情波动。</p>
          </div>
          <div class="view-toggle" role="tablist" aria-label="时间粒度切换">
            <button
              type="button"
              role="tab"
              :aria-selected="viewMode === 'weekly'"
              :class="['toggle-button', { active: viewMode === 'weekly' }]"
              @click="setViewMode('weekly')"
            >
              每周
            </button>
            <button
              type="button"
              role="tab"
              :aria-selected="viewMode === 'monthly'"
              :class="['toggle-button', { active: viewMode === 'monthly' }]"
              @click="setViewMode('monthly')"
            >
              每月
            </button>
          </div>
        </div>

        <div class="period-toolbar">
          <button type="button" class="toolbar-button" @click="goPrev" aria-label="上一周期">←</button>
          <div class="period-label">{{ periodLabel }}</div>
          <button type="button" class="toolbar-button" @click="goNext" aria-label="下一周期">→</button>
        </div>

        <div v-if="viewMode === 'weekly'" class="weekly-view">
          <div class="weekday-row">
            <span v-for="name in weekdays" :key="name" class="weekday-name">周{{ name }}</span>
          </div>
          <div class="weekly-grid">
            <div
              v-for="day in weeklyDays"
              :key="day.key"
              class="weekly-cell"
              :class="{ 'is-today': day.isToday, 'has-entry': day.hasEntries }"
            >
              <div class="mood-bubble" :style="day.moodStyle" aria-hidden="true">
                <span>{{ day.moodIcon }}</span>
              </div>
              <div class="day-number">{{ day.dayNumber }}</div>
            </div>
          </div>
        </div>

        <div v-else class="monthly-view">
          <div class="weekday-row">
            <span v-for="name in weekdays" :key="`month-${name}`" class="weekday-name">周{{ name }}</span>
          </div>
          <div class="monthly-grid">
            <div v-for="(week, weekIndex) in monthlyGrid" :key="weekIndex" class="monthly-row">
              <div
                v-for="day in week"
                :key="day.key"
                class="monthly-cell"
                :class="{
                  'is-outside': !day.inCurrentMonth,
                  'is-today': day.isToday,
                  'has-entry': day.hasEntries,
                }"
              >
                <span class="day-number">{{ day.dayNumber }}</span>
                <div class="mood-bubble" :style="day.moodStyle" aria-hidden="true">
                  <span>{{ day.moodIcon }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="insights-card" aria-labelledby="metrics-title">
        <div class="insights-card-header">
          <div>
            <h2 id="metrics-title">关键指标</h2>
            <p class="insights-card-subtitle">这些数据来自当前所选时间段。</p>
          </div>
        </div>
        <div class="metrics-grid" role="list">
          <article class="metric-card" role="listitem">
            <h3 class="metric-title">平均心情</h3>
            <p class="metric-value">{{ averageMoodDisplay }}</p>
            <p class="metric-hint">数字越高说明整体心情越晴朗。</p>
          </article>
          <article class="metric-card" role="listitem">
            <h3 class="metric-title">常见情绪词</h3>
            <p class="metric-value">{{ frequentEmotionDisplay }}</p>
            <p class="metric-hint">来自日志中提到的感受关键词。</p>
          </article>
          <article class="metric-card" role="listitem">
            <h3 class="metric-title">高频影响因素</h3>
            <p class="metric-value">{{ topFactorsDisplay }}</p>
            <p class="metric-hint">结合心理与身体线索的出现频次。</p>
          </article>
        </div>
      </section>

      <p v-if="!totalDiaries" class="insights-empty">目前还没有数据，先去写一篇心情日志吧～</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useDiaryStore } from '../stores/diaryStore.js';
import { getMoodMeta, moodOptions } from '../utils/moods.js';

const { diaries } = useDiaryStore();

const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
const moodScores = moodOptions.reduce((acc, option, index) => {
  acc[option.value] = index + 1;
  return acc;
}, {});

const viewMode = ref('weekly');
const referenceDate = ref(new Date());

const today = new Date();

const diaryList = computed(() => diaries.value || []);
const totalDiaries = computed(() => diaryList.value.length);

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function cloneDate(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date) {
  const copy = cloneDate(date);
  const day = copy.getDay();
  copy.setDate(copy.getDate() - day);
  return copy;
}

function endOfWeek(date) {
  const start = startOfWeek(date);
  start.setDate(start.getDate() + 6);
  return start;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function isSameDay(dateA, dateB) {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

function pickDominantMood(entries) {
  if (!entries.length) {
    return null;
  }

  const counts = entries.reduce((acc, entry) => {
    const mood = entry.mood || 'neutral';
    acc[mood] = (acc[mood] || 0) + 1;
    return acc;
  }, {});

  const dominantMood = Object.entries(counts).sort((a, b) => {
    if (b[1] === a[1]) {
      return (moodScores[b[0]] || 0) - (moodScores[a[0]] || 0);
    }
    return b[1] - a[1];
  })[0][0];

  return getMoodMeta(dominantMood);
}

const diariesByDate = computed(() => {
  const map = new Map();
  diaryList.value.forEach(entry => {
    const parsed = new Date(entry.createdAt);
    if (Number.isNaN(parsed.getTime())) {
      return;
    }
    const key = toDateKey(parsed);
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key).push(entry);
  });
  return map;
});

function setViewMode(mode) {
  viewMode.value = mode;
}

function goPrev() {
  const current = new Date(referenceDate.value);
  if (viewMode.value === 'weekly') {
    current.setDate(current.getDate() - 7);
  } else {
    current.setMonth(current.getMonth() - 1);
  }
  referenceDate.value = current;
}

function goNext() {
  const current = new Date(referenceDate.value);
  if (viewMode.value === 'weekly') {
    current.setDate(current.getDate() + 7);
  } else {
    current.setMonth(current.getMonth() + 1);
  }
  referenceDate.value = current;
}

const currentRange = computed(() => {
  const ref = referenceDate.value;
  if (viewMode.value === 'weekly') {
    const start = startOfWeek(ref);
    const end = endOfWeek(ref);
    return { start, end };
  }
  const start = startOfMonth(ref);
  const end = endOfMonth(ref);
  return { start, end };
});

const weeklyDays = computed(() => {
  const start = startOfWeek(referenceDate.value);
  const days = [];
  for (let index = 0; index < 7; index += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = toDateKey(date);
    const entries = diariesByDate.value.get(key) || [];
    const mood = pickDominantMood(entries);
    days.push({
      key,
      date,
      dayNumber: date.getDate(),
      weekday: date.getDay(),
      isToday: isSameDay(date, today),
      hasEntries: entries.length > 0,
      moodIcon: mood ? mood.icon : '—',
      moodStyle: mood
        ? { backgroundColor: mood.background, color: mood.color }
        : { backgroundColor: 'rgba(31, 26, 23, 0.08)', color: '#71665d' },
    });
  }
  return days;
});

function buildMonthlyGrid() {
  const startMonth = startOfMonth(referenceDate.value);
  const endMonthValue = endOfMonth(referenceDate.value);
  const start = startOfWeek(startMonth);
  const end = endOfWeek(endMonthValue);
  const days = [];
  for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const date = new Date(cursor);
    const key = toDateKey(date);
    const entries = diariesByDate.value.get(key) || [];
    const mood = pickDominantMood(entries);
    days.push({
      key,
      date,
      dayNumber: date.getDate(),
      inCurrentMonth: date.getMonth() === startMonth.getMonth(),
      isToday: isSameDay(date, today),
      hasEntries: entries.length > 0,
      moodIcon: mood ? mood.icon : '·',
      moodStyle: mood
        ? { backgroundColor: mood.background, color: mood.color }
        : { backgroundColor: 'rgba(31, 26, 23, 0.06)', color: '#9a918a' },
    });
  }

  const grid = [];
  for (let index = 0; index < days.length; index += 7) {
    grid.push(days.slice(index, index + 7));
  }
  return grid;
}

const monthlyGrid = computed(() => buildMonthlyGrid());

function formatRange(start, end) {
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();
  const startText = `${start.getMonth() + 1}月${start.getDate()}日`;
  const endText = `${end.getMonth() + 1}月${end.getDate()}日`;
  const startLabel = `${startYear}年${startText}`;
  const endLabel = startYear === endYear ? endText : `${endYear}年${endText}`;
  return `${startLabel} - ${endLabel}`;
}

const periodLabel = computed(() => {
  const { start, end } = currentRange.value;
  if (viewMode.value === 'weekly') {
    return formatRange(start, end);
  }
  return `${start.getFullYear()}年${start.getMonth() + 1}月`;
});

const rangeDiaries = computed(() => {
  const { start, end } = currentRange.value;
  return diaryList.value.filter(entry => {
    const parsed = new Date(entry.createdAt);
    if (Number.isNaN(parsed.getTime())) {
      return false;
    }
    return parsed >= start && parsed <= end;
  });
});

const averageMoodDisplay = computed(() => {
  const entries = rangeDiaries.value;
  if (!entries.length) {
    return '暂无数据';
  }
  const totalScore = entries.reduce((sum, entry) => sum + (moodScores[entry.mood] || moodScores.neutral), 0);
  const average = totalScore / entries.length;
  const index = Math.min(moodOptions.length - 1, Math.max(0, Math.round(average - 1)));
  const mood = moodOptions[index];
  return `${mood.icon} ${mood.label}`;
});

const frequentEmotionDisplay = computed(() => {
  const entries = rangeDiaries.value;
  const emotionCounts = new Map();

  entries.forEach(entry => {
    const raw = entry.emotions || '';
    raw
      .split(/[,，、\s]+/)
      .map(part => part.trim())
      .filter(Boolean)
      .forEach(token => {
        emotionCounts.set(token, (emotionCounts.get(token) || 0) + 1);
      });
  });

  if (!emotionCounts.size) {
    return '暂无数据';
  }

  const [topEmotion] = [...emotionCounts.entries()].sort((a, b) => b[1] - a[1]);
  return topEmotion[0];
});

const topFactorsDisplay = computed(() => {
  const entries = rangeDiaries.value;
  const factorCounts = new Map();

  entries.forEach(entry => {
    [...(entry.psychological || []), ...(entry.physiological || [])]
      .map(item => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean)
      .forEach(label => {
        factorCounts.set(label, (factorCounts.get(label) || 0) + 1);
      });
  });

  if (!factorCounts.size) {
    return '暂无记录';
  }

  const topFactors = [...factorCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(item => item[0]);

  return topFactors.join('、');
});
</script>

<style scoped>
.insights-inner {
  gap: 24px;
}

.insights-hero {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.insights-hero h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
}

.insights-hero p {
  margin: 0;
  color: #675f58;
  font-size: 15px;
}

.insights-card {
  background: #ffffff;
  border-radius: 28px;
  padding: 24px;
  box-shadow: 0 24px 60px rgba(31, 26, 23, 0.08);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.insights-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.insights-card-subtitle {
  margin: 4px 0 0;
  color: #8a8078;
  font-size: 14px;
}

.view-toggle {
  background: rgba(31, 26, 23, 0.06);
  border-radius: 999px;
  padding: 6px;
  display: inline-flex;
  gap: 6px;
}

.toggle-button {
  border: none;
  border-radius: 999px;
  padding: 8px 16px;
  font-weight: 600;
  font-size: 14px;
  background: transparent;
  color: #6f665e;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.toggle-button.active {
  background: #1f1a17;
  color: #ffd369;
  box-shadow: 0 16px 30px rgba(31, 26, 23, 0.2);
}

.period-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 4px;
}

.toolbar-button {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: none;
  background: rgba(31, 26, 23, 0.08);
  font-size: 18px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.toolbar-button:hover {
  background: rgba(31, 26, 23, 0.12);
}

.period-label {
  font-weight: 600;
  color: #3a312b;
}

.weekday-row {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  font-size: 13px;
  color: #9a918a;
  text-align: center;
  margin-bottom: 12px;
}

.weekly-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 12px;
}

.weekly-cell {
  background: rgba(31, 26, 23, 0.04);
  border-radius: 20px;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.weekly-cell.has-entry {
  box-shadow: 0 16px 30px rgba(31, 26, 23, 0.08);
}

.weekly-cell.is-today {
  outline: 2px solid rgba(255, 214, 105, 0.7);
  outline-offset: 3px;
}

.mood-bubble {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  font-size: 22px;
  font-weight: 600;
}

.day-number {
  font-weight: 600;
  color: #3a312b;
}

.monthly-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 12px;
}

.monthly-row {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 12px;
}

.monthly-cell {
  background: rgba(31, 26, 23, 0.03);
  border-radius: 18px;
  padding: 10px 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  min-height: 72px;
}

.monthly-cell.is-outside {
  opacity: 0.45;
}

.monthly-cell.is-today {
  outline: 2px solid rgba(255, 214, 105, 0.65);
  outline-offset: 3px;
}

.monthly-cell.has-entry {
  box-shadow: 0 12px 26px rgba(31, 26, 23, 0.08);
}

.metrics-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.metric-card {
  background: rgba(31, 26, 23, 0.04);
  border-radius: 24px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.metric-title {
  margin: 0;
  font-size: 15px;
  color: #85786f;
}

.metric-value {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #3a312b;
}

.metric-hint {
  margin: 0;
  font-size: 13px;
  color: #9a918a;
}

.insights-empty {
  margin: 0;
  color: #867f78;
  text-align: center;
}

@media (min-width: 640px) {
  .monthly-grid {
    gap: 16px;
  }

  .monthly-row {
    gap: 16px;
  }

  .weekly-grid {
    gap: 16px;
  }
}

@media (min-width: 768px) {
  .metrics-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
