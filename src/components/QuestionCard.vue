<template>
  <div class="question-card">
    <div class="question-header">
      <span class="type-badge" :class="question.type === 'single' ? 'badge-single' : 'badge-multi'">
        {{ question.type === 'single' ? '单选' : '多选' }}
      </span>
      <span class="question-index">第 {{ index + 1 }} / {{ total }} 题</span>
      <span v-if="answered" class="result-badge" :class="isCorrect ? 'badge-correct' : 'badge-wrong'">
        {{ isCorrect ? '回答正确' : '回答错误' }}
      </span>
    </div>

    <div class="question-text" v-html="renderedQuestion"></div>

    <div class="options">
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
      <template v-else>
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
    </div>

    <div v-if="answered" class="feedback">
      <div class="feedback-box" :class="isCorrect ? 'fb-correct' : 'fb-wrong'">
        <div class="fb-icon">{{ isCorrect ? '✓' : '✗' }}</div>
        <div class="fb-content">
          <div class="fb-title">{{ isCorrect ? '回答正确！' : '回答错误' }}</div>
          <div v-if="!isCorrect" class="fb-answer">正确答案：{{ correctAnswerText }}</div>
        </div>
      </div>
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

const props = defineProps<{
  question: Question
  index: number
  total: number
  savedAnswer?: number | number[]
}>()

const emit = defineEmits<{
  answer: [questionId: number, answer: number | number[]]
  'multi-select': [selections: number[]]
}>()

const labels = ['A', 'B', 'C', 'D']
const singleAnswer = ref<number | undefined>(undefined)
const multiAnswer = ref<number[]>([])
const answered = ref(false)

const { renderQuestion } = useQuestionRenderer()

const renderedQuestion = computed(() => renderQuestion(props.question.question))

const isCorrect = computed(() => {
  if (!answered.value) return false
  const q = props.question
  if (q.type === 'single') return singleAnswer.value === q.answer
  const ans = q.answer as number[]
  return ans.length === multiAnswer.value.length && ans.every((a) => multiAnswer.value.includes(a))
})

const correctAnswerText = computed(() => {
  const q = props.question
  if (q.type === 'single') return labels[q.answer as number]
  return (q.answer as number[]).map((i) => labels[i]).join('、')
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

watch(() => props.question, (q) => {
  if (props.savedAnswer !== undefined) {
    answered.value = true
    if (q.type === 'single') {
      singleAnswer.value = props.savedAnswer as number
    } else {
      multiAnswer.value = [...(props.savedAnswer as number[])]
    }
  } else {
    answered.value = false
    singleAnswer.value = undefined
    multiAnswer.value = []
  }
}, { immediate: true })

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
</style>
