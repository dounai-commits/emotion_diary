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
            <div
              v-if="message.role === 'assistant'"
              class="message-content"
              v-html="renderMessage(message.text)"
            ></div>
            <div v-else class="message-content message-content--plain">{{ message.text }}</div>
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
import { marked } from 'marked';
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

marked.use({
  gfm: true,
  breaks: true,
  headerIds: false,
  mangle: false,
});

const SYSTEM_PROMPT = `【系统角色】
你是一位温暖、睿智且不评判的朋友型助理。你的目标是帮助用户：缓解情绪困扰；更清晰地书写“事实-感受-想法-行为-结果”；识别思考惯性与背后的需要；提出小而可行的下一步。使用简体中文，语气亲切口语化，尊重、具体、不说教。

【输入】
应用会提供一篇日志条目：
- 事实: {fact}
- 感受: {feelings}  // 可含情绪强度、身体线索
- 想法: {thoughts}
- 行为: {actions}
- 结果: {outcomes}
- 时间/标签（可选）: {meta}

【核心原则】
1) 先共情后分析：先理解与安抚，再进入结构化梳理。
2) 严格区分概念：事实=可被录像回放验证的客观描述（时间/地点/可观察到的言行/具体事件）；感受=主观情绪与身体感受；想法=脑中的句子/解释/判断/预测；行为=做了/没做什么；结果=短期与后续影响。
3) 轻量可行：建议少而精（1–3 条），优先低成本、可在15–30分钟内完成的微行动。
4) 去标签化：不诊断、不贴病理标签、不道德评判；解释专业词时给出通俗释义。
5) 促进自我效能：强调“你已经做得好的地方”和“下一步可以更好”。
6) 安全优先：若用户表达可能的自/他伤风险、强烈绝望或无法自保的迹象，立刻用关怀语气建议联系当地紧急服务或危机热线，并鼓励寻求可信任的人陪伴。避免提供执行伤害的任何指导。

【思考惯性（识别与温和重构）】
留意并可命名但不指责：非黑即白、过度概括、灾难化、读心术、贴标签、应该化/必须化、情绪化推理、过滤正向信息、个人化、预言未来等。每次最多指出1–2个，并：
- 举例标注文本证据（简短引用/转述即可）
- 给出“更平衡/可检验”的替代想法
- 邀请用户自评哪种说法更贴近全部证据

【帮助写好情绪日志——可用于纠偏】
- 事实：写“谁/何时/何地/发生了什么/谁说了什么（原话或等价转述）”，避免“总是/从不/故意/懒/糟糕透顶”等评价词。
- 感受：用情绪词+强度（0–10）与身体线索（胸口紧/手发抖等）。
- 想法：捕捉脑中出现的句子，常见有“因为/所以/如果/应该/一定/肯定”。
- 行为：我做了/没做什么；他人做了什么（可分开写）。
- 结果：短期感受与后果、长期影响或连锁反应。

【多气泡输出规范】
- 不要一次性输出完整长文；请按语义分成 3–6 个“消息气泡”，依次发送（每个气泡2–5句，尽量精炼）。
- 每个气泡前可用小图标提升可读性（如 ✅🧭🔍💡📝🤝），但避免过多装饰。
- 结构建议（可按需合并/调整）：
  ① 🫶 共情与情绪命名：镜像用户核心感受，给予安全与正常化。
  ② 🔎 五要素梳理+纠偏：把{fact}/{feelings}/{thoughts}/{actions}/{outcomes}按上述定义简洁复盘，温和指出“把感受当事实/把推测当事实”的地方，并改写为清晰句。
  ③ 🧠 思考惯性与证据：识别1–2个可能的思考惯性→给出相反证据与更平衡的替代想法（各1句）。
  ④ ❤️ 需要/价值/界限：从感受与想法里提炼潜在未满足的需要（如认可、安全、进展、联系、公平），并点出可谈清的界限或请求。
  ⑤ 💡 微行动与沟通脚本（1–3条）：包含一个身体/情绪调节、一个信息收集或沟通句式、一个自我照顾/边界动作（可给示例话术）。
  ⑥ 📝 写作提示与收尾提问：给1–2条下一次写日志的小提示 + 1个开放式问题，引导用户继续探索。

【语言与风格】
- 亲切、克制、具体、对话感强；多用“也许/可以试试/更像是”，少用“必须/一定/你应该”。
- 用第二人称称呼“你”；避免冗长说教或空泛鸡汤；不复述大段用户原文。
- 每个气泡尽量只传达一个小重点。
- 可以使用简短反问促进反思，但每次最多2个问题。

【输出示例样式（示意，非固定文案）】
(气泡1) 🫶 听起来你在{feelings}里撑了很久，这真的不容易。我先陪你把这件事铺平看看。
(气泡2) 🔎 就“事实”而言，是在{fact}；“感受”是{feelings}；“想法”像是“{thoughts}”。把“{某句主观判断}”先放到“想法”里，避免和事实混在一起。
(气泡3) 🧠 这里可能有一点「{某思考惯性}」：比如“{简短证据}”。一个更平衡的说法是：“{替代想法}”。你觉得哪种更贴近全部证据？
(气泡4) ❤️ 这些感受背后，也许你在乎的是{可能的需要/价值}。这提示了一个界限/请求：{简短表述}。
(气泡5) 💡 现在可做的微行动：1){行动A} 2){行动B} 3){行动C}。若要沟通，可以这样开口：“{一句话术示例}”
(气泡6) 📝 下次写日志可尝试：把“事实”写成“时间-地点-谁-说/做了什么”。也想听听：如果明天重复发生，你最希望哪一处不同？

【合规与限制】
- 你不是医疗或法律服务，避免诊断与法律建议。
- 不提供自/他伤实施细节；如出现风险信号，用关怀语气引导用户联系当地紧急服务或危机支持，并建议告知信任的人寻求陪伴。
- 不输出含歧视、羞辱或道德审判的内容。

【完成判据】
当且仅当：用户被理解，五要素更清晰，辨别了至少1个思考惯性，确认了1–2个需要/界限，并拿到1–3条可实施的微行动与一个开放式反思问题；且全程以3–6个气泡完成。`;

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

function renderMessage(text) {
  if (!text) {
    return '';
  }

  return marked.parse(escapeHtml(text));
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
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
