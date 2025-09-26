<template>
  <div class="page insights-page">
    <div class="page-inner insights-inner">
      <header class="insights-header">
        <button type="button" class="insights-back" @click="goBack" aria-label="返回首页">
          ←
        </button>
        <h1>趋势分析</h1>
      </header>
      <p class="insights-intro">看看最近的心情节奏，找到属于自己的小趋势。</p>

      <section class="insights-card calendar-card" aria-labelledby="calendar-title">
        <div class="calendar-title-row">
          <h2 id="calendar-title">心情日历</h2>
        </div>
        <div class="calendar-toggle-row" role="tablist" aria-label="时间粒度切换">
          <button
            type="button"
            role="tab"
            :aria-selected="viewMode === 'daily'"
            :class="['toggle-button', { active: viewMode === 'daily' }]"
            @click="setViewMode('daily')"
          >
            每日
          </button>
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

        <div class="period-toolbar">
          <button type="button" class="toolbar-button" @click="goPrev" aria-label="上一周期">←</button>
          <div class="period-label">{{ periodLabel }}</div>
          <button type="button" class="toolbar-button" @click="goNext" aria-label="下一周期">→</button>
        </div>

        <div v-if="viewMode === 'daily'" class="daily-view">
          <div class="daily-axis" role="list" aria-label="当日心情时间线">
            <div class="daily-canvas">
              <div class="daily-spectrum" aria-hidden="true">
                <div
                  v-for="level in moodLevels"
                  :key="level.value"
                  class="daily-spectrum-band"
                ></div>
              </div>
              <div class="daily-track">
                <div
                  v-for="item in dailyTimeline"
                  :key="item.id"
                  class="daily-entry"
                  :style="item.style"
                  role="listitem"
                >
                  <span class="sr-only">{{ item.accessibleLabel }}</span>
                  <span class="daily-emoji" aria-hidden="true">{{ item.icon }}</span>
                </div>
              </div>
            </div>
            <div class="daily-ticks" aria-hidden="true">
              <div
                v-for="tick in dailyTicks"
                :key="tick.hour"
                class="daily-tick"
                :style="{ '--hour-index': tick.hour }"
              >
                {{ tick.label }}
              </div>
            </div>
          </div>
          <p v-if="!dailyTimeline.length" class="daily-empty">今天还没有心情记录哦～</p>
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
              <div class="mood-stack">
                <span class="sr-only">{{ day.accessibleMoodLabel }}</span>
                <span
                  v-for="item in day.moodStack"
                  :key="item.value"
                  class="mood-stack-item"
                  :style="item.style"
                  aria-hidden="true"
                >
                  {{ item.icon }}
                </span>
              </div>
              <div class="day-number">{{ day.dayNumber }}</div>
            </div>
          </div>
        </div>

        <div v-else-if="viewMode === 'monthly'" class="monthly-view">
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
                <div class="mood-stack">
                  <span class="sr-only">{{ day.accessibleMoodLabel }}</span>
                  <span
                    v-for="item in day.moodStack"
                    :key="item.value"
                    class="mood-stack-item"
                    :style="item.style"
                    aria-hidden="true"
                  >
                    {{ item.icon }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="insights-card metrics-section" aria-labelledby="metrics-title">
        <div class="insights-card-header">
          <div>
            <h2 id="metrics-title">关键指标</h2>
          </div>
        </div>
        <div class="metrics-grid" role="list">
          <article class="metric-card" role="listitem">
            <h3 class="metric-title">最常出现的心情</h3>
            <p class="metric-value" :class="{ 'metric-value--muted': topMoodState.muted }">
              {{ topMoodState.text }}
            </p>
          </article>
          <article class="metric-card" role="listitem">
            <h3 class="metric-title">最常出现的感受</h3>
            <p
              class="metric-value"
              :class="{ 'metric-value--muted': topEmotionState.muted }"
            >
              {{ topEmotionState.text }}
            </p>
          </article>
        </div>
      </section>

      <section class="insights-card ai-summary-card" aria-labelledby="ai-summary-title">
        <div class="insights-card-header">
          <h2 id="ai-summary-title">AI 总结</h2>
        </div>
        <p
          class="ai-summary-text"
          :class="{ 'ai-summary-text--muted': aiSummaryState.muted }"
        >
          {{ aiSummaryState.text }}
        </p>
      </section>

      <p v-if="!totalDiaries" class="insights-empty">目前还没有数据，先去写一篇心情日志吧～</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useDiaryStore } from '../stores/diaryStore.js';
import { useSettingsStore } from '../stores/settingsStore.js';
import { getMoodMeta, moodOptions } from '../utils/moods.js';

const { diaries } = useDiaryStore();
const router = useRouter();
const { apiKey } = useSettingsStore();
const hasApiKey = computed(() => Boolean(apiKey.value));

const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
const moodScores = moodOptions.reduce((acc, option, index) => {
  acc[option.value] = index + 1;
  return acc;
}, {});

const moodLevels = moodOptions.map((option, index) => ({
  ...option,
  level: index + 1,
}));

const moodLevelMap = moodLevels.reduce((acc, option) => {
  acc[option.value] = option;
  return acc;
}, {});

const defaultMoodLevel = moodLevelMap.neutral || moodLevels[Math.floor(moodLevels.length / 2)];

const dailyTickHours = [4, 8, 12, 16, 20];
const dailyTicks = dailyTickHours.map(hour => ({
  hour,
  label: `${String(hour).padStart(2, '0')}:00`,
}));

const today = new Date();
const viewMode = ref('daily');
const referenceDate = ref(new Date(today.getFullYear(), today.getMonth(), today.getDate()));

const dayStart = date => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const dayEnd = date => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

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

function summarizeDayMoods(entries, limit = 3) {
  if (!entries.length) {
    return {
      stack: [],
      label: '暂无心情记录',
    };
  }

  const counts = entries.reduce((acc, entry) => {
    const mood = entry.mood || 'neutral';
    acc.set(mood, (acc.get(mood) || 0) + 1);
    return acc;
  }, new Map());

  const sorted = [...counts.entries()].sort((a, b) => {
    if (b[1] === a[1]) {
      return (moodScores[b[0]] || 0) - (moodScores[a[0]] || 0);
    }
    return b[1] - a[1];
  });

  const stackSource = sorted.slice(0, limit).map(([value]) => getMoodMeta(value));
  const stackSize = stackSource.length;
  const stack = stackSource.map((meta, index) => {
    const offset = (index - (stackSize - 1) / 2) * 12;
    return {
      ...meta,
      style: {
        backgroundColor: meta.background,
        color: meta.color,
        zIndex: stackSize - index,
        transform: `translate(-50%, -50%) translateX(${offset}px)`,
      },
    };
  });

  const label = sorted
    .map(([value, count]) => {
      const meta = getMoodMeta(value);
      return `${meta.label} ${count}次`;
    })
    .join('、');

  return { stack, label };
}

function formatAccessibleDate(date) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = weekdays[date.getDay()];
  return `${month}月${day}日（周${weekday}）`;
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
  if (viewMode.value === 'daily') {
    current.setDate(current.getDate() - 1);
  } else if (viewMode.value === 'weekly') {
    current.setDate(current.getDate() - 7);
  } else {
    current.setMonth(current.getMonth() - 1);
  }
  referenceDate.value = current;
}

function goNext() {
  const current = new Date(referenceDate.value);
  if (viewMode.value === 'daily') {
    current.setDate(current.getDate() + 1);
  } else if (viewMode.value === 'weekly') {
    current.setDate(current.getDate() + 7);
  } else {
    current.setMonth(current.getMonth() + 1);
  }
  referenceDate.value = current;
}

const currentRange = computed(() => {
  const ref = referenceDate.value;
  if (viewMode.value === 'daily') {
    const start = dayStart(ref);
    const end = dayEnd(ref);
    return { start, end };
  }
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
    const summary = summarizeDayMoods(entries);
    days.push({
      key,
      date,
      dayNumber: date.getDate(),
      weekday: date.getDay(),
      isToday: isSameDay(date, today),
      hasEntries: entries.length > 0,
      moodStack: summary.stack,
      accessibleMoodLabel: `${formatAccessibleDate(date)}：${summary.label}`,
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
    const summary = summarizeDayMoods(entries);
    days.push({
      key,
      date,
      dayNumber: date.getDate(),
      inCurrentMonth: date.getMonth() === startMonth.getMonth(),
      isToday: isSameDay(date, today),
      hasEntries: entries.length > 0,
      moodStack: summary.stack,
      accessibleMoodLabel: `${formatAccessibleDate(date)}：${summary.label}`,
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
  if (viewMode.value === 'daily') {
    const weekday = weekdays[start.getDay()];
    return `${start.getFullYear()}年${start.getMonth() + 1}月${start.getDate()}日 · 周${weekday}`;
  }
  if (viewMode.value === 'weekly') {
    return formatRange(start, end);
  }
  return `${start.getFullYear()}年${start.getMonth() + 1}月`;
});

const dailyEntries = computed(() => {
  const key = toDateKey(referenceDate.value);
  const list = diariesByDate.value.get(key) || [];
  return list
    .map(entry => {
      const parsed = new Date(entry.createdAt);
      return { entry, parsed };
    })
    .filter(item => !Number.isNaN(item.parsed.getTime()))
    .sort((a, b) => a.parsed - b.parsed);
});

const dailyTimeline = computed(() => {
  const buckets = new Map();

  dailyEntries.value.forEach(({ entry, parsed }) => {
    const hour = parsed.getHours();
    const moodValue = moodLevelMap[entry.mood] ? entry.mood : 'neutral';
    const moodMeta = moodLevelMap[moodValue] || defaultMoodLevel;

    if (!buckets.has(hour)) {
      buckets.set(hour, new Map());
    }

    const hourBucket = buckets.get(hour);
    const existing = hourBucket.get(moodValue);

    if (!existing || parsed > existing.parsed) {
      hourBucket.set(moodValue, { entry, parsed, moodMeta });
    }
  });

  const hours = [...buckets.keys()].sort((a, b) => a - b);

  return hours.flatMap(hour => {
    const moodEntries = [...(buckets.get(hour)?.values() || [])].sort(
      (a, b) => a.moodMeta.level - b.moodMeta.level,
    );
    const timeLabel = `${String(hour).padStart(2, '0')}:00`;

    return moodEntries.map(({ moodMeta }) => ({
      id: `hour-${hour}-${moodMeta.value}`,
      icon: moodMeta.icon,
      timeLabel,
      accessibleLabel: `${timeLabel} · ${moodMeta.label}`,
      style: {
        '--hour-index': hour,
        '--mood-level': moodMeta.level,
      },
    }));
  });
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

const topMoodState = computed(() => {
  const entries = rangeDiaries.value;
  if (!entries.length) {
    return { text: '暂无数据', muted: true };
  }

  const moodCounts = entries.reduce((acc, entry) => {
    const value = entry.mood || 'neutral';
    acc.set(value, (acc.get(value) || 0) + 1);
    return acc;
  }, new Map());

  if (!moodCounts.size) {
    return { text: '暂无数据', muted: true };
  }

  const sorted = [...moodCounts.entries()].sort((a, b) => {
    if (b[1] === a[1]) {
      return (moodScores[b[0]] || 0) - (moodScores[a[0]] || 0);
    }
    return b[1] - a[1];
  });

  const topCount = sorted[0][1];
  const topMoods = sorted
    .filter(([, count]) => count === topCount)
    .map(([value, count]) => {
      const moodMeta = getMoodMeta(value);
      const icon = moodMeta?.icon || '';
      const label = moodMeta?.label || '未知心情';
      return `${icon ? `${icon} ` : ''}${label} · ${count}次`;
    });

  return { text: topMoods.join(' / '), muted: false };
});

const topEmotionState = computed(() => {
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
    return { text: '暂无数据', muted: true };
  }

  const sorted = [...emotionCounts.entries()].sort((a, b) => {
    if (b[1] === a[1]) {
      return a[0].localeCompare(b[0], 'zh-Hans-CN');
    }
    return b[1] - a[1];
  });

  const topCount = sorted[0][1];
  const topEmotions = sorted
    .filter(([, count]) => count === topCount)
    .map(([emotion, count]) => `${emotion} · ${count}次`);

  return { text: topEmotions.join(' / '), muted: false };
});

const aiSummary = ref('');
const aiLoading = ref(false);
const aiError = ref('');
let aiRequestId = 0;

const aiSummaryState = computed(() => {
  if (!rangeDiaries.value.length) {
    return { text: '暂无数据', muted: true };
  }
  if (!hasApiKey.value) {
    return { text: '需要配置 API Key', muted: true };
  }
  if (aiLoading.value) {
    return { text: 'AI 分析中…', muted: true };
  }
  if (aiError.value) {
    return { text: aiError.value, muted: true };
  }
  if (!aiSummary.value) {
    return { text: '暂无结果', muted: true };
  }
  return { text: aiSummary.value, muted: false };
});

const AI_SYSTEM_PROMPT = `你是一名心理助理。请用温和、中立的语气，结合提供的情绪日志进行中文分析，并严格按照指定格式输出。`;

watch(
  [() => rangeDiaries.value, () => hasApiKey.value, () => periodLabel.value],
  async ([entries, keyAvailable, label]) => {
    aiError.value = '';
    aiSummary.value = '';

    if (!entries.length || !keyAvailable) {
      aiLoading.value = false;
      return;
    }

    aiLoading.value = true;
    const requestId = ++aiRequestId;

    try {
      const insights = await requestAiInsights(entries, label);
      if (requestId !== aiRequestId) {
        return;
      }
      aiSummary.value = normalizeSummary(insights.summary);
      aiError.value = '';
    } catch (error) {
      if (requestId !== aiRequestId) {
        return;
      }
      aiError.value = error instanceof Error ? error.message : 'AI 分析失败，请稍后再试试～';
    } finally {
      if (requestId === aiRequestId) {
        aiLoading.value = false;
      }
    }
  },
  { immediate: true, deep: true },
);

function truncateText(value, limit = 400) {
  if (!value) {
    return '';
  }
  return value.length > limit ? value.slice(0, limit) : value;
}

function normalizeSummary(value) {
  if (!value) {
    return '';
  }

  const sanitized = value
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return sanitized;
}

function formatDiaryForPrompt(entry, index) {
  const date = new Date(entry.createdAt);
  const dateLabel = Number.isNaN(date.getTime())
    ? '未知日期'
    : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date
        .getDate())
        .padStart(2, '0')}`;

  const moodMeta = getMoodMeta(entry.mood || 'neutral');
  return `日志${index}：\n日期：${dateLabel}\n心情：${moodMeta.label}（${entry.mood || 'neutral'}）\n事件：${
    entry.fact || '未填写'
  }\n感受：${entry.emotions || '未填写'}\n心理线索：${
    (entry.psychological || []).join('、') || '未填写'
  }\n身体线索：${(entry.physiological || []).join('、') || '未填写'}\n想法：${
    entry.thoughts || '未填写'
  }\n行为：${entry.behaviors || '未填写'}\n结果：${entry.consequences || '未填写'}`;
}

function buildAiMessages(entries, label) {
  const details = entries.map((entry, index) => formatDiaryForPrompt(entry, index + 1)).join('\n\n');
  const intro = `以下是用户在时间范围「${label}」内的 ${entries.length} 篇情绪日志，包括心情分数、事件、感受、心理/身体线索、想法和行为。`;
  const instructions = `请你：\n1. 归纳主要情绪类型和强度变化趋势。\n2. 找出高频触发因素与常见思维或行为模式。\n3. 给出简洁总结，并提供2-3条温和可行的日常建议。\n请按以下格式输出：\n【趋势总结】：用2-3句话说明整体情绪走向与特征\n【主要触发因素】：列出1-3个关键因素\n【行为/思维模式】：简要概括用户常见反应\n【建议】：提供2-3条具体可执行的改善方法`;
  return [
    { role: 'system', content: AI_SYSTEM_PROMPT },
    {
      role: 'user',
      content: `${intro}\n\n${details}\n\n${instructions}`,
    },
  ];
}

function parseAiInsights(text) {
  if (!text) {
    throw new Error('AI 没有返回内容');
  }

  const normalized = normalizeSummary(text);

  const getSection = label => {
    const pattern = new RegExp(`【${label}】：([\s\S]*?)(?=\n?【|$)`, 'u');
    const match = normalized.match(pattern);
    return match ? match[1].trim() : '';
  };

  const triggerText = getSection('主要触发因素');
  const triggers = triggerText
    .split(/(?:\n|、|；|;)/u)
    .map(item => item.trim())
    .filter(Boolean)
    .slice(0, 3)
    .map(item => (item.length > 16 ? `${item.slice(0, 15)}…` : item));

  return {
    triggers,
    summary: truncateText(normalized, 600),
  };
}

async function requestOpenAI(messages) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey.value}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.6,
    }),
  });

  let data;
  try {
    data = await response.json();
  } catch (error) {
    data = null;
  }

  if (!response.ok) {
    const message = data?.error?.message || response.statusText || 'AI 服务暂时不可用';
    throw new Error(message);
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('AI 没有返回内容');
  }

  return content.trim();
}

async function requestAiInsights(entries, label) {
  const messages = buildAiMessages(entries, label);
  const reply = await requestOpenAI(messages);
  return parseAiInsights(reply);
}

function goBack() {
  router.push({ name: 'home' });
}
</script>

<style scoped>
.insights-inner {
  gap: 24px;
}

.insights-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.insights-header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
}

.insights-back {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: 1px solid rgba(31, 26, 23, 0.1);
  background: #ffffff;
  color: #1f1a17;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.insights-back:hover {
  background: rgba(31, 26, 23, 0.06);
  border-color: rgba(31, 26, 23, 0.18);
}

.insights-intro {
  margin: 0 0 8px;
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

.calendar-card {
  padding: 20px;
  gap: 20px;
}

.calendar-title-row {
  display: flex;
  justify-content: flex-start;
}

.calendar-title-row h2 {
  margin: 0;
}

.calendar-toggle-row {
  background: rgba(31, 26, 23, 0.06);
  border-radius: 999px;
  padding: 8px;
  display: inline-flex;
  gap: 6px;
  align-items: center;
  margin: 0 auto;
}

.insights-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.toggle-button {
  border: none;
  border-radius: 999px;
  padding: 10px 22px;
  min-width: 96px;
  font-weight: 600;
  font-size: 14px;
  background: transparent;
  color: #6f665e;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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

.daily-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.daily-axis {
  position: relative;
  padding: 24px 16px 32px;
  border-radius: 20px;
  background: linear-gradient(180deg, rgba(255, 246, 214, 0.32) 0%, rgba(255, 246, 214, 0.08) 100%);
  --daily-hour-width: calc(100% / 24);
}

.daily-canvas {
  position: relative;
  height: 240px;
}

.daily-canvas::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: rgba(31, 26, 23, 0.12);
  border-radius: 999px;
  pointer-events: none;
  z-index: 3;
}

.daily-spectrum {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-rows: repeat(5, minmax(0, 1fr));
  pointer-events: none;
  z-index: 1;
}

.daily-spectrum-band {
  background: rgba(255, 246, 214, 0.14);
  border-top: 1px dashed rgba(31, 26, 23, 0.08);
}

.daily-spectrum-band:nth-child(even) {
  background: rgba(255, 246, 214, 0.24);
}

.daily-spectrum-band:first-child {
  border-top: none;
}

.daily-track {
  position: absolute;
  inset: 0;
  z-index: 2;
}

.daily-entry {
  position: absolute;
  top: calc((5 - var(--mood-level)) * 20%);
  left: clamp(
    16px,
    calc(var(--hour-index) * var(--daily-hour-width) + var(--daily-hour-width) / 2 + var(--stack-offset, 0px)),
    calc(100% - 16px)
  );
  transform: translate(-50%, -45%);
  display: flex;
  align-items: center;
  pointer-events: none;
}

.daily-emoji {
  font-size: 32px;
  filter: drop-shadow(0 8px 14px rgba(31, 26, 23, 0.16));
}

.daily-ticks {
  position: relative;
  margin-top: 16px;
  height: 32px;
}

.daily-tick {
  position: absolute;
  left: calc(var(--hour-index) * var(--daily-hour-width) + var(--daily-hour-width) / 2);
  bottom: 0;
  transform: translateX(-50%);
  font-size: 13px;
  font-weight: 600;
  color: #6f665e;
  text-align: center;
}

.daily-tick::before {
  content: '';
  display: block;
  width: 1px;
  height: 10px;
  margin: 0 auto 6px;
  background: rgba(31, 26, 23, 0.2);
  border-radius: 999px;
}

.daily-empty {
  margin: 0;
  font-size: 14px;
  color: #6f665e;
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
  margin-bottom: 10px;
}

.weekly-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 10px;
}

.weekly-cell {
  background: rgba(31, 26, 23, 0.04);
  border-radius: 18px;
  padding: 10px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.weekly-cell.has-entry {
  box-shadow: 0 16px 30px rgba(31, 26, 23, 0.08);
}

.weekly-cell.is-today {
  outline: 2px solid rgba(255, 214, 105, 0.7);
  outline-offset: 3px;
}

.mood-stack {
  position: relative;
  width: 44px;
  height: 44px;
}

.mood-stack-item {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-size: 20px;
  font-weight: 600;
  box-shadow: 0 14px 24px rgba(31, 26, 23, 0.08);
  border: 1px solid rgba(31, 26, 23, 0.06);
  transition: transform 0.2s ease;
}

.day-number {
  font-weight: 600;
  color: #3a312b;
}

.monthly-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 10px;
}

.monthly-row {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 10px;
}

.monthly-cell {
  background: rgba(31, 26, 23, 0.03);
  border-radius: 18px;
  padding: 10px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-height: 64px;
}

.monthly-cell .day-number {
  order: -1;
}

.monthly-cell .mood-stack {
  order: 1;
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

.metric-value--muted {
  color: #8a8078;
}

.metric-hint {
  margin: 0;
  font-size: 13px;
  color: #9a918a;
}

.ai-summary-text {
  margin: 0;
  color: #3a312b;
  font-size: 15px;
  line-height: 1.6;
  white-space: pre-line;
}

.ai-summary-text--muted {
  color: #8a8078;
}

.ai-summary-card,
.metrics-section {
  gap: 16px;
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
    grid-template-columns: 1fr;
  }
}
</style>
