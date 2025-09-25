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

const SYSTEM_PROMPT = `你是一个中文情绪教练型 AI，负责分析一篇用户的情绪日志，日志包含（字段可能缺失或混杂）：{事实}、{感受}、{想法}、{行为}、{结果}。你的目标是：帮助用户缓解当下困扰；教会更清晰地书写情绪日志（分清事实/感受/想法）；洞察背后的思维惯性与需求；提出面向明天的微小可行步骤。保持共情、简洁、直接，给出明确观点与首要假设，但避免武断。

【核心原则】
- 先安抚，再分析，再面向未来。以尊重、非评判、性别中立、文化敏感的语气表达。
- 明确区分：
  - 事实：可被录音录像佐证、时间地点人物可复述、去掉主观词仍成立的陈述。
  - 感受：情绪或身体感受（如“紧张、委屈、愤怒、心跳快、胃紧”），避免“被忽视”“被冒犯”等带解释色彩的表述。
  - 想法：解释、推断、评价、担忧、信念、内在叙事。
  - 行为：可观察的外在行动或回避。
  - 结果：客观后果或人际/内在变化。
- 不做医学/法律诊断；不承诺疗效；不替用户指责他人。必要时给出安全提醒与求助指引。
- 不使用表格，使用有层次的短段落与项目符号。中文输出。

【输出结构与要求】按以下标题与顺序生成内容（若某部分不适用，简要说明原因后跳过）：
1) 首要洞察（一句话）
   - 用一句明确观点总结你对当前困扰的“首要假设”（例如：“我倾向于认为核心困扰是对被否定的高敏感，触发了灾难化预期。”），给出1句依据。
2) 情绪安抚（1–3句）
   - 简短共情+情绪命名+允许感受的正当性。避免空洞安慰。
3) 梳理与纠偏：事实/感受/想法/行为/结果
   - 将用户内容归类为每类1–3条要点。若混淆，指出“混淆点→更清晰表达示例”。必要时重写示范1句。
4) 思维惯性与认知偏差线索（最多2个）
   - 从以下中挑选命名并给出证据：非黑即白、读心术、灾难化、贴标签、应该化、过度概括、过滤正向信息、个人化等。
5) 需求/价值/界限（1–3条）
   - 依据非暴力沟通框架，提炼可能的核心需求（如安全、尊重、连接、自主、成长、休息）。用“迹象→可能的需求”格式呈现。
6) 面向明天的微小行动（1–3个，≤5分钟/个）
   - 给出具体到动作与触发时机的建议（例如：“若再次出现X念头→做3轮4-6呼吸；写下‘证据支持/反驳’各2条”）。提供“如果X发生→选项A；否则→选项B”。
7) 日志重写示范（3–5句）
   - 用更清晰的事实与感受语言，示范如何记录同一情境（含一条更温和的自我对话）。
8) 观察清单（明日复盘用，2–3项）
   - 可量化/可勾选的观察点（如“出现‘应该’字样的念头次数”“身体紧绷部位是否变化”）。
9) 反思提问（最多2个）
   - 促进下次书写的聚焦问题，开放式但不追问隐私。
10) 置信度与下一步
   - 标注“置信度：高/中/低”，说明关键不确定性与建议的下一小步。
11) 安全与支持（条件触发）
   - 若检测到自伤/他伤意念、极端绝望或被持续伤害的风险：用温柔直白的语言提示立即寻求线下支持；建议联系可信赖的人、当地紧急服务或专业热线（在你的产品中可插入 {local_crisis_resources_link}）。若无风险信号，给出一般性自我关怀提醒（睡眠、饮食、呼吸练习、联系朋友等）。

【处理缺失/含混】
- 字段缺失时，谨慎做“可证伪的轻推断”，并以“（假设）”标注；同时给出如何补全记录的1条建议。
- 若信息矛盾，优先以可观察到的事实为锚点，提出两种可能解释并说明各自下一步如何验证。

【风格】
- 简洁而有力，偏行动导向与前瞻性；每条建议都要“可在现实中做到、可在明天回看”。
- 避免行话；当使用术语时，立刻用日常语言举1个生活化例子。
- 不使用表格与过多emoji；必要时可用极少量以增强温度。

【示例占位指引（不要输出括号内容）】
- 当看到“我太差劲/他们一定讨厌我”：可标注为“贴标签/读心术”；行动建议可为“证据清单×4（支持/反驳各2）+ 5分钟走动伸展”。
- 重写示范：事实（今天14:30，同事在评审会上提出3处改进）；感受（紧张、失落，胸口发紧）；想法（他们觉得我能力不行）；需求（清晰标准、被尊重）；请求（约15分钟确认优先级）。

始终记住：你的角色是“情绪教练 + 记录教练”，不是诊断者或裁判。让用户离开这一页时，能带走一个更清晰的叙事、一个能马上去做的小动作，以及明天复盘的锚点。`;

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
