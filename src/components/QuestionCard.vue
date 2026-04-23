<!--
  QuestionCard 组件 - 答题卡片
  核心答题交互组件，支持：
  - 单选题：点击选项即提交答案
  - 多选题：勾选多个选项后点击"确认选择"提交
  - 判断题：点击对/错按钮提交
  - 填空题：输入答案后点击提交
  - 简答题/代码题：输入答案后点击提交
  - 排序题：拖拽排序后点击提交
  - 答题后显示正确/错误反馈和解析
  - 支持已保存答案的回显（切题时恢复状态）
  - 通过插槽 #header-extra 扩展头部（如收藏按钮）
-->
<template>
  <div class="question-card">
    <!-- 题目头部：题型标签 + 题号 + 答题结果 + 扩展插槽 -->
    <div class="question-header">
      <span class="type-badge" :class="typeBadgeClass">
        {{ typeLabel }}
      </span>
      <span class="question-index">第 {{ index + 1 }} / {{ total }} 题</span>
      <span v-if="answered" class="result-badge" :class="isCorrect ? 'badge-correct' : 'badge-wrong'">
        {{ isCorrect ? '回答正确' : '回答错误' }}
      </span>
      <!-- 头部扩展插槽（用于放置收藏按钮等） -->
      <slot name="header-extra" />
    </div>

    <!-- 题目文本（支持代码高亮渲染） -->
    <div class="question-text" v-html="renderedQuestion"></div>

    <!-- 选项/答题区域 -->
    <div class="options">
      <!-- ===== 单选题选项 ===== -->
      <template v-if="question.type === 'single'">
        <div
          v-for="(opt, i) in question.options"
          :key="i"
          class="option-item"
          :class="[
            !answered && singleAnswer === i ? 'option-selected' : '',
            answered ? optionClass(i) : '',
            answered ? 'option-locked' : 'option-hoverable',
          ]"
          @click="!answered && onSingleSelect(i)"
        >
          <span class="option-letter">{{ labels[i] }}</span>
          <span class="option-text">{{ opt }}</span>
          <span v-if="answered && isAnswerIndex(i)" class="option-tag tag-correct">正确</span>
          <span v-if="answered && isWrongSelect(i)" class="option-tag tag-wrong">你选</span>
          <span v-if="answered && isCorrectSelect(i)" class="option-tag tag-right">你选</span>
        </div>
      </template>

      <!-- ===== 多选题选项 ===== -->
      <template v-else-if="question.type === 'multiple'">
        <div
          v-for="(opt, i) in question.options"
          :key="i"
          class="option-item"
          :class="[
            !answered && multiAnswer.includes(i) ? 'option-selected' : '',
            answered ? optionClass(i) : '',
            answered ? 'option-locked' : 'option-hoverable',
          ]"
          @click="!answered && onMultiToggle(i)"
        >
          <span class="option-check" :class="{ checked: multiAnswer.includes(i) }">
            <svg v-if="multiAnswer.includes(i)" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6L5 9L10 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <span class="option-text">{{ opt }}</span>
          <span v-if="answered && isAnswerIndex(i)" class="option-tag tag-correct">正确</span>
          <span v-if="answered && isWrongSelect(i)" class="option-tag tag-wrong">你选</span>
          <span v-if="answered && isCorrectSelect(i)" class="option-tag tag-right">你选</span>
        </div>
        <button
          v-if="!answered && multiAnswer.length > 0"
          class="confirm-btn"
          @click="onMultiConfirm"
        >
          确认选择 ({{ multiAnswer.length }})
        </button>
      </template>

      <!-- ===== 判断题 ===== -->
      <template v-else-if="question.type === 'judge'">
        <div class="judge-buttons">
          <button
            class="judge-btn"
            :class="{ 'judge-selected': judgeAnswer === true, 'judge-correct': answered && question.answer === true, 'judge-wrong': answered && judgeAnswer === true && question.answer !== true }"
            :disabled="answered"
            @click="!answered && onJudgeSelect(true)"
          >
            <span class="judge-icon">✓</span>
            <span>正确</span>
          </button>
          <button
            class="judge-btn"
            :class="{ 'judge-selected': judgeAnswer === false, 'judge-correct': answered && question.answer === false, 'judge-wrong': answered && judgeAnswer === false && question.answer !== false }"
            :disabled="answered"
            @click="!answered && onJudgeSelect(false)"
          >
            <span class="judge-icon">✗</span>
            <span>错误</span>
          </button>
        </div>
      </template>

      <!-- ===== 填空题 ===== -->
      <template v-else-if="question.type === 'fill'">
        <div class="fill-inputs">
          <div v-for="i in (question.blanks || 1)" :key="i" class="fill-item">
            <label class="fill-label">空格 {{ i }}：</label>
            <input
              v-model="fillAnswers[i - 1]"
              type="text"
              class="fill-input"
              :class="{ 'input-correct': answered && isFillCorrect(i - 1), 'input-wrong': answered && !isFillCorrect(i - 1) }"
              :disabled="answered"
              :placeholder="`请输入第 ${i} 个答案`"
            />
          </div>
          <button
            v-if="!answered && fillAnswers.some(a => a.trim())"
            class="confirm-btn"
            @click="onFillConfirm"
          >
            提交答案
          </button>
        </div>
      </template>

      <!-- ===== 简答题 ===== -->
      <template v-else-if="question.type === 'short'">
        <div class="text-answer">
          <textarea
            v-model="textAnswer"
            class="text-input"
            :class="{ 'input-correct': answered && isCorrect, 'input-wrong': answered && !isCorrect }"
            :disabled="answered"
            placeholder="请输入你的答案..."
            rows="4"
          ></textarea>
          <button
            v-if="!answered && textAnswer.trim()"
            class="confirm-btn"
            @click="onTextConfirm"
          >
            提交答案
          </button>
        </div>
      </template>

      <!-- ===== 代码题 ===== -->
      <template v-else-if="question.type === 'code'">
        <div class="code-answer">
          <div v-if="question.codeTemplate" class="code-template">
            <div class="template-label">代码模板：</div>
            <pre><code>{{ question.codeTemplate }}</code></pre>
          </div>
          <textarea
            v-model="codeAnswer"
            class="code-input"
            :class="{ 'input-correct': answered && isCorrect, 'input-wrong': answered && !isCorrect }"
            :disabled="answered"
            placeholder="请输入你的代码..."
            rows="8"
          ></textarea>
          <button
            v-if="!answered && codeAnswer.trim()"
            class="confirm-btn"
            @click="onCodeConfirm"
          >
            提交代码
          </button>
        </div>
      </template>

      <!-- ===== 排序题 ===== -->
      <template v-else-if="question.type === 'order'">
        <div class="order-items">
          <div class="order-hint">请输入正确的顺序（例如：1324）</div>
          <div class="order-options">
            <div v-for="(option, idx) in question.options" :key="idx" class="order-option">
              <span class="option-number">{{ idx + 1 }}.</span>
              <span class="option-text">{{ option }}</span>
            </div>
          </div>
          <input
            v-model="orderInput"
            :disabled="answered"
            class="order-input"
            placeholder="输入顺序，如：1324"
            maxlength="10"
          />
          <button
            v-if="!answered"
            class="confirm-btn"
            @click="onOrderConfirm"
          >
            提交排序
          </button>
        </div>
      </template>
    </div>

    <!-- 答题反馈区域（提交答案后显示） -->
    <div v-if="answered" class="feedback">
      <!-- 正确/错误提示框 -->
      <div class="feedback-box" :class="isCorrect ? 'fb-correct' : 'fb-wrong'">
        <div class="fb-icon">{{ isCorrect ? '✓' : '✗' }}</div>
        <div class="fb-content">
          <div class="fb-title">{{ isCorrect ? '回答正确！' : '回答错误' }}</div>
          <div v-if="!isCorrect" class="fb-answer">正确答案：{{ correctAnswerText }}</div>
        </div>
      </div>
      <!-- 答案解析 -->
      <div class="explanation-box">
        <div class="explanation-label">解析</div>
        <div class="explanation-text">{{ question.explanation }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Question } from '../types'
import { useQuestionRenderer } from '../composables/useQuestionRenderer'
import { useQuizStore } from '../stores/quiz'

/** 组件 Props */
const props = defineProps<{
  question: Question              // 当前题目数据
  index: number                   // 当前题目索引（从0开始）
  total: number                   // 总题数
  savedAnswer?: number | number[] | boolean | string | string[] // 已保存的答案（用于切题时回显）
}>()

/** 组件事件 */
const emit = defineEmits<{
  answer: [questionId: string, answer: number | number[] | boolean | string | string[]]  // 提交答案事件
  'multi-select': [selections: number[]]                   // 多选选项变化事件（实时同步）
}>()

const quizStore = useQuizStore()
const labels = ['A', 'B', 'C', 'D']                       // 选项字母标签
const singleAnswer = ref<number | undefined>(undefined)    // 单选题用户选择
const multiAnswer = ref<number[]>([])                      // 多选题用户选择列表
const judgeAnswer = ref<boolean | undefined>(undefined)    // 判断题用户选择
const fillAnswers = ref<string[]>([])                      // 填空题答案数组
const textAnswer = ref('')                                 // 简答题答案
const codeAnswer = ref('')                                 // 代码题答案
const orderInput = ref('')                                 // 排序题输入（如：1324）
const answered = ref(false)                                // 是否已提交答案

const { renderQuestion } = useQuestionRenderer()

/** 渲染题目文本为 HTML */
const renderedQuestion = computed(() => renderQuestion(props.question.question))

/** 题型标签文本 */
const typeLabel = computed(() => {
  const typeMap = {
    single: '单选',
    multiple: '多选',
    judge: '判断',
    fill: '填空',
    short: '简答',
    code: '代码',
    order: '排序'
  }
  return typeMap[props.question.type] || '未知'
})

/** 题型标签样式类 */
const typeBadgeClass = computed(() => {
  const classMap = {
    single: 'badge-single',
    multiple: 'badge-multi',
    judge: 'badge-judge',
    fill: 'badge-fill',
    short: 'badge-short',
    code: 'badge-code',
    order: 'badge-order'
  }
  return classMap[props.question.type] || ''
})

/** 判断当前回答是否正确 */
const isCorrect = computed(() => {
  if (!answered.value) return false
  const q = props.question
  
  switch (q.type) {
    case 'single':
      return singleAnswer.value === q.answer
    case 'multiple':
      const ans = q.answer as number[]
      return ans.length === multiAnswer.value.length && ans.every((a) => multiAnswer.value.includes(a))
    case 'judge':
      return judgeAnswer.value === q.answer
    case 'fill':
      return quizStore.isAnswerCorrect(q, fillAnswers.value)
    case 'short':
    case 'code':
      return quizStore.isAnswerCorrect(q, q.type === 'short' ? textAnswer.value : codeAnswer.value)
    case 'order':
      return quizStore.isAnswerCorrect(q, orderInput.value.trim().split('').map(n => parseInt(n) - 1).filter(n => !isNaN(n)))
    default:
      return false
  }
})

const correctAnswerText = computed(() => {
  const q = props.question
  if (q.type === 'single') return labels[q.answer as number]
  if (q.type === 'multiple') return (q.answer as number[]).map((i) => labels[i]).join('、')
  if (q.type === 'judge') return q.answer ? '正确' : '错误'
  if (q.type === 'fill') return (q.answer as string[]).join('、')
  if (q.type === 'short' || q.type === 'code') return q.answer as string
  if (q.type === 'order') return (q.answer as number[]).map(i => labels[i]).join(' → ')
  return ''
})

function isAnswerIndex(i: number): boolean {
  const q = props.question
  return q.type === 'single' ? q.answer === i : (q.answer as number[]).includes(i)
}

function isWrongSelect(i: number): boolean {
  const q = props.question
  const isSelected = q.type === 'single' ? singleAnswer.value === i : multiAnswer.value.includes(i)
  return isSelected && !isAnswerIndex(i)
}

function isCorrectSelect(i: number): boolean {
  const q = props.question
  const isSelected = q.type === 'single' ? singleAnswer.value === i : multiAnswer.value.includes(i)
  return isSelected && isAnswerIndex(i)
}

function optionClass(i: number) {
  if (isAnswerIndex(i)) return 'option-correct'
  if (isWrongSelect(i)) return 'option-wrong'
  return ''
}

function isFillCorrect(index: number): boolean {
  if (!answered.value) return false
  const correctAnswers = props.question.answer as string[]
  return fillAnswers.value[index]?.trim().toLowerCase() === correctAnswers[index]?.trim().toLowerCase()
}

watch(() => props.question, (q) => {
  if (props.savedAnswer !== undefined) {
    // 排序题不在恢复时设置 answered，只有确认后才算已回答
    if (q.type !== 'order') {
      answered.value = true
    }
    restoreSavedAnswer(q.type, props.savedAnswer)
  } else {
    resetAnswers()
  }
}, { immediate: true })

function restoreSavedAnswer(type: string, saved: any) {
  switch (type) {
    case 'single':
      singleAnswer.value = saved as number
      break
    case 'multiple':
      multiAnswer.value = [...(saved as number[])]
      break
    case 'judge':
      judgeAnswer.value = saved as boolean
      break
    case 'fill':
      fillAnswers.value = [...(saved as string[])]
      break
    case 'short':
      textAnswer.value = saved as string
      break
    case 'code':
      codeAnswer.value = saved as string
      break
    case 'order':
      orderInput.value = (saved as number[]).map(i => i + 1).join('')
      break
  }
}

function resetAnswers() {
  answered.value = false
  singleAnswer.value = undefined
  multiAnswer.value = []
  judgeAnswer.value = undefined
  fillAnswers.value = Array(props.question.blanks || 1).fill('')
  textAnswer.value = ''
  codeAnswer.value = props.question.codeTemplate || ''
  orderInput.value = ''
}

function onSingleSelect(val: number) {
  singleAnswer.value = val
  answered.value = true
  emit('answer', props.question.id, val)
}

function onMultiToggle(val: number) {
  const idx = multiAnswer.value.indexOf(val)
  if (idx >= 0) {
    multiAnswer.value.splice(idx, 1)
  } else {
    multiAnswer.value.push(val)
  }
  emit('multi-select', [...multiAnswer.value])
}

function onMultiConfirm() {
  answered.value = true
  emit('answer', props.question.id, [...multiAnswer.value])
}

function onJudgeSelect(val: boolean) {
  judgeAnswer.value = val
  answered.value = true
  emit('answer', props.question.id, val)
}

function onFillConfirm() {
  answered.value = true
  emit('answer', props.question.id, [...fillAnswers.value])
}

function onTextConfirm() {
  answered.value = true
  emit('answer', props.question.id, textAnswer.value)
}

function onCodeConfirm() {
  answered.value = true
  emit('answer', props.question.id, codeAnswer.value)
}

function onOrderConfirm() {
  const order = orderInput.value.trim().split('').map(n => parseInt(n) - 1).filter(n => !isNaN(n))
  answered.value = true
  emit('answer', props.question.id, order)
}
</script>

<style scoped>
.question-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 28px;
  backdrop-filter: blur(12px);
  animation: card-appear 0.4s ease;
}

@keyframes card-appear {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Header */
.question-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}
.type-badge, .result-badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}
.badge-single {
  background: rgba(99, 102, 241, 0.12);
  color: var(--accent-indigo);
}
.badge-multi {
  background: rgba(251, 191, 36, 0.12);
  color: var(--accent-amber);
}
.badge-judge {
  background: rgba(168, 85, 247, 0.12);
  color: #a855f7;
}
.badge-fill {
  background: rgba(59, 130, 246, 0.12);
  color: #3b82f6;
}
.badge-short {
  background: rgba(34, 197, 94, 0.12);
  color: #22c55e;
}
.badge-code {
  background: rgba(236, 72, 153, 0.12);
  color: #ec4899;
}
.badge-order {
  background: rgba(20, 184, 166, 0.12);
  color: #14b8a6;
}
.badge-correct {
  background: rgba(52, 211, 153, 0.12);
  color: var(--accent-emerald);
}
.badge-wrong {
  background: rgba(251, 113, 133, 0.12);
  color: var(--accent-rose);
}
.question-index {
  color: var(--text-muted);
  font-size: 13px;
  margin-left: auto;
}

/* Question Text */
.question-text {
  font-size: 16px;
  line-height: 1.8;
  color: var(--text-primary);
  margin-bottom: 24px;
}
.question-text :deep(pre) {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-subtle);
  padding: 16px;
  border-radius: var(--radius-sm);
  overflow-x: auto;
  margin: 12px 0;
}
.question-text :deep(code) {
  font-family: 'Fira Code', Consolas, monospace;
  font-size: 14px;
  color: var(--accent-cyan);
}
.question-text :deep(.inline-code) {
  background: rgba(99, 102, 241, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
  color: var(--accent-indigo);
  font-size: 14px;
}

/* Options */
.options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.option-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: rgba(17, 24, 39, 0.5);
  transition: all 0.2s ease;
  cursor: pointer;
  user-select: none;
}
.option-hoverable:hover {
  border-color: var(--border-glow);
  background: rgba(99, 102, 241, 0.06);
}
.option-locked {
  cursor: default;
}
.option-selected {
  border-color: var(--accent-indigo) !important;
  background: rgba(99, 102, 241, 0.08) !important;
}
.option-correct {
  border-color: var(--accent-emerald) !important;
  background: rgba(52, 211, 153, 0.08) !important;
}
.option-wrong {
  border-color: var(--accent-rose) !important;
  background: rgba(251, 113, 133, 0.08) !important;
}

.option-letter {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: rgba(99, 102, 241, 0.1);
  color: var(--accent-indigo);
  font-weight: 700;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.option-correct .option-letter {
  background: rgba(52, 211, 153, 0.15);
  color: var(--accent-emerald);
}
.option-wrong .option-letter {
  background: rgba(251, 113, 133, 0.15);
  color: var(--accent-rose);
}

.option-check {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 2px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
  color: #fff;
}
.option-check.checked {
  background: var(--accent-indigo);
  border-color: var(--accent-indigo);
}

.option-text {
  flex: 1;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-primary);
}

.option-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}
.tag-correct {
  background: rgba(52, 211, 153, 0.12);
  color: var(--accent-emerald);
}
.tag-wrong {
  background: rgba(251, 113, 133, 0.12);
  color: var(--accent-rose);
}
.tag-right {
  background: rgba(52, 211, 153, 0.12);
  color: var(--accent-emerald);
}

.confirm-btn {
  margin-top: 8px;
  padding: 10px 24px;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--gradient-primary);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  align-self: flex-start;
}
.confirm-btn:hover {
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
}

/* Feedback */
.feedback {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: fade-in 0.3s ease;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.feedback-box {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: var(--radius-sm);
}
.fb-correct {
  background: rgba(52, 211, 153, 0.08);
  border: 1px solid rgba(52, 211, 153, 0.2);
}
.fb-wrong {
  background: rgba(251, 113, 133, 0.08);
  border: 1px solid rgba(251, 113, 133, 0.2);
}
.fb-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
}
.fb-correct .fb-icon {
  background: rgba(52, 211, 153, 0.15);
  color: var(--accent-emerald);
}
.fb-wrong .fb-icon {
  background: rgba(251, 113, 133, 0.15);
  color: var(--accent-rose);
}
.fb-title {
  font-weight: 600;
  font-size: 15px;
  color: var(--text-primary);
}
.fb-answer {
  margin-top: 4px;
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 600;
}

.explanation-box {
  padding: 16px;
  border-radius: var(--radius-sm);
  background: rgba(99, 102, 241, 0.06);
  border: 1px solid rgba(99, 102, 241, 0.12);
}
.explanation-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--accent-indigo);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}
.explanation-text {
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-secondary);
}

/* 判断题样式 */
.judge-buttons {
  display: flex;
  gap: 16px;
}
.judge-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  border: 2px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: rgba(17, 24, 39, 0.5);
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.judge-btn:not(:disabled):hover {
  border-color: var(--border-glow);
  background: rgba(99, 102, 241, 0.06);
}
.judge-btn:disabled {
  cursor: default;
}
.judge-btn.judge-selected {
  border-color: var(--accent-indigo);
  background: rgba(99, 102, 241, 0.08);
}
.judge-btn.judge-correct {
  border-color: var(--accent-emerald) !important;
  background: rgba(52, 211, 153, 0.08) !important;
}
.judge-btn.judge-wrong {
  border-color: var(--accent-rose) !important;
  background: rgba(251, 113, 133, 0.08) !important;
}
.judge-icon {
  font-size: 20px;
  font-weight: 700;
}

/* 填空题样式 */
.fill-inputs {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.fill-item {
  display: flex;
  align-items: center;
  gap: 12px;
}
.fill-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  min-width: 80px;
}
.fill-input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: rgba(17, 24, 39, 0.5);
  color: var(--text-primary);
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s;
}
.fill-input:focus {
  outline: none;
  border-color: var(--accent-indigo);
  background: rgba(99, 102, 241, 0.06);
}
.fill-input:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}
.fill-input.input-correct {
  border-color: var(--accent-emerald);
  background: rgba(52, 211, 153, 0.06);
}
.fill-input.input-wrong {
  border-color: var(--accent-rose);
  background: rgba(251, 113, 133, 0.06);
}

/* 简答题样式 */
.text-answer {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.text-input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: rgba(17, 24, 39, 0.5);
  color: var(--text-primary);
  font-size: 14px;
  font-family: inherit;
  line-height: 1.6;
  resize: vertical;
  transition: all 0.2s;
}
.text-input:focus {
  outline: none;
  border-color: var(--accent-indigo);
  background: rgba(99, 102, 241, 0.06);
}
.text-input:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}
.text-input.input-correct {
  border-color: var(--accent-emerald);
  background: rgba(52, 211, 153, 0.06);
}
.text-input.input-wrong {
  border-color: var(--accent-rose);
  background: rgba(251, 113, 133, 0.06);
}

/* 代码题样式 */
.code-answer {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.code-template {
  padding: 12px;
  border-radius: var(--radius-sm);
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-subtle);
}
.template-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--accent-indigo);
  margin-bottom: 8px;
}
.code-template pre {
  margin: 0;
  overflow-x: auto;
}
.code-template code {
  font-family: 'Fira Code', Consolas, monospace;
  font-size: 13px;
  color: var(--accent-cyan);
}
.code-input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: rgba(17, 24, 39, 0.5);
  color: var(--text-primary);
  font-size: 13px;
  font-family: 'Fira Code', Consolas, monospace;
  line-height: 1.6;
  resize: vertical;
  transition: all 0.2s;
}
.code-input:focus {
  outline: none;
  border-color: var(--accent-indigo);
  background: rgba(99, 102, 241, 0.06);
}
.code-input:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}
.code-input.input-correct {
  border-color: var(--accent-emerald);
  background: rgba(52, 211, 153, 0.06);
}
.code-input.input-wrong {
  border-color: var(--accent-rose);
  background: rgba(251, 113, 133, 0.06);
}

/* 排序题样式 */
.order-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.order-hint {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 4px;
}
.order-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}
.order-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: rgba(17, 24, 39, 0.3);
}
.option-number {
  color: var(--accent-indigo);
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}
.option-text {
  color: var(--text-primary);
  font-size: 14px;
}
.order-input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: rgba(17, 24, 39, 0.5);
  color: var(--text-primary);
  font-size: 14px;
  transition: all 0.2s;
}
.order-input:focus {
  outline: none;
  border-color: var(--accent-indigo);
  background: rgba(17, 24, 39, 0.7);
}
.order-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
