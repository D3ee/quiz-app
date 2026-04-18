<template>
  <div class="result">
    <div class="result-header">
      <button class="back-btn" @click="router.push('/')">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M11 4L6 9L11 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>首页</span>
      </button>
      <h2 class="result-title">答题结果</h2>
      <button class="retry-btn" @click="retry">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 8C2 4.686 4.686 2 8 2C11.314 2 14 4.686 14 8C14 11.314 11.314 14 8 14C5.8 14 3.87 12.84 2.76 11.1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M2 14V11H5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>重新答题</span>
      </button>
    </div>

    <div class="score-section">
      <ScoreRing 
        :score="store.score" 
        :total="store.total" 
        :score-class="scoreClass" 
        :ring-color="ringColor" 
      />
      <div class="score-info">
        <p class="score-text">{{ scoreText }}</p>
        <div class="score-rate-bar">
          <span class="rate-label">正确率</span>
          <div class="rate-track">
            <div class="rate-fill" :class="scoreClass" :style="{ width: `${Math.round(scoreRate * 100)}%` }"></div>
          </div>
          <span class="rate-value">{{ Math.round(scoreRate * 100) }}%</span>
        </div>
        <div class="score-rate-bar">
          <span class="rate-label">用时</span>
          <span class="rate-value">{{ timeUsed }}</span>
        </div>
      </div>
    </div>

    <div class="section-header">
      <div class="section-line"></div>
      <h3 class="section-title">题目解析</h3>
      <div class="section-line"></div>
    </div>

    <AnalysisCard
      v-for="(q, i) in store.questions"
      :key="q.id"
      :question="q"
      :index="i"
      :is-correct="isCorrect(q)"
      :is-answer="isAnswer"
      :is-user-wrong="isUserWrong"
      :is-user-correct="isUserCorrect"
    />

    <div class="bottom-actions">
      <button class="action-btn action-home" @click="router.push('/')">返回首页</button>
      <button class="action-btn action-retry" @click="retry">重新答题</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toRef, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuizStore } from '../stores/quiz'
import { useScoreCalculation, useAnswerValidation } from '../composables/useScoreCalculation'
import ScoreRing from '../components/ScoreRing.vue'
import AnalysisCard from '../components/AnalysisCard.vue'
import type { Category } from '../types'

const router = useRouter()
const route = useRoute()
const store = useQuizStore()

const category = route.params.category as Category
if (!store.submitted || store.currentCategory !== category) {
  router.push('/')
}

const score = toRef(store, 'score')
const total = toRef(store, 'total')
const userAnswers = toRef(store, 'userAnswers')

const { scoreRate, scoreClass, ringColor, scoreText } = useScoreCalculation(score, total)
const { isCorrect, isAnswer, isUserWrong, isUserCorrect } = useAnswerValidation(userAnswers)

const timeUsed = computed(() => {
  if (!store.startTime) return '0:00'
  const elapsed = Math.floor((Date.now() - store.startTime) / 1000)
  const m = Math.floor(elapsed / 60)
  const s = elapsed % 60
  return `${m}:${s.toString().padStart(2, '0')}`
})

function retry() {
  store.startQuiz(store.currentCategory)
  router.push(`/quiz/${store.currentCategory}`)
}
</script>

<style scoped>
.result {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 20px 48px;
  position: relative;
  z-index: 1;
}
.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
}
.result-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}
.back-btn, .retry-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  backdrop-filter: blur(8px);
}
.back-btn:hover, .retry-btn:hover {
  border-color: var(--border-glow);
  color: var(--text-primary);
}

/* Score Section */
.score-section {
  display: flex;
  align-items: center;
  gap: 40px;
  padding: 36px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(12px);
  margin-bottom: 40px;
  justify-content: center;
}
.score-ring {
  position: relative;
  width: 120px;
  height: 120px;
  flex-shrink: 0;
}
.ring-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}
.ring-progress {
  transition: stroke-dashoffset 1s ease;
}
.score-inner {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: baseline;
  justify-content: center;
  padding-top: 42px;
}
.score-num {
  font-size: 36px;
  font-weight: 800;
}
.excellent .score-num { color: var(--accent-emerald); }
.good .score-num { color: var(--accent-amber); }
.poor .score-num { color: var(--accent-rose); }
.score-divider {
  font-size: 20px;
  color: var(--text-muted);
  margin: 0 2px;
}
.score-total {
  font-size: 20px;
  color: var(--text-muted);
}
.score-info { flex: 1; }
.score-text {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 16px;
}
.score-rate-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}
.rate-label {
  font-size: 13px;
  color: var(--text-muted);
  flex-shrink: 0;
}
.rate-track {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: rgba(99, 102, 241, 0.1);
  overflow: hidden;
}
.rate-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 1s ease;
}
.rate-fill.excellent { background: var(--gradient-success); }
.rate-fill.good { background: var(--gradient-warm); }
.rate-fill.poor { background: var(--gradient-danger); }
.rate-value {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-secondary);
  min-width: 36px;
}

/* Section Header */
.section-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}
.section-line {
  flex: 1;
  height: 1px;
  background: var(--border-subtle);
}
.section-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
}

/* Analysis Cards */
.analysis-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 24px;
  margin-bottom: 16px;
  backdrop-filter: blur(12px);
  border-left: 3px solid var(--border-subtle);
}
.analysis-card.correct { border-left-color: var(--accent-emerald); }
.analysis-card.wrong { border-left-color: var(--accent-rose); }

.analysis-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}
.q-number {
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
}
.result-badge, .type-badge {
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}
.badge-correct { background: rgba(52, 211, 153, 0.12); color: var(--accent-emerald); }
.badge-wrong { background: rgba(251, 113, 133, 0.12); color: var(--accent-rose); }
.badge-single { background: rgba(99, 102, 241, 0.12); color: var(--accent-indigo); }
.badge-multi { background: rgba(251, 191, 36, 0.12); color: var(--accent-amber); }

.q-text {
  font-size: 15px;
  line-height: 1.8;
  color: var(--text-primary);
  margin-bottom: 16px;
}
.q-text :deep(pre) {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-subtle);
  padding: 14px 16px;
  border-radius: var(--radius-sm);
  overflow-x: auto;
  margin: 8px 0;
}
.q-text :deep(code) {
  font-family: 'Fira Code', Consolas, monospace;
  font-size: 13px;
  color: var(--accent-cyan);
}
.q-text :deep(.inline-code) {
  background: rgba(99, 102, 241, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
  color: var(--accent-indigo);
}

/* Options Review */
.options-review {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}
.option-review {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  background: rgba(17, 24, 39, 0.5);
  border: 1px solid transparent;
}
.option-review.is-answer {
  background: rgba(52, 211, 153, 0.06);
  border-color: rgba(52, 211, 153, 0.2);
}
.option-review.is-user-wrong {
  background: rgba(251, 113, 133, 0.06);
  border-color: rgba(251, 113, 133, 0.2);
}
.option-review.is-user-correct {
  background: rgba(52, 211, 153, 0.06);
  border-color: rgba(52, 211, 153, 0.2);
}
.opt-letter {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: rgba(99, 102, 241, 0.1);
  color: var(--accent-indigo);
  font-weight: 700;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.is-answer .opt-letter { background: rgba(52, 211, 153, 0.15); color: var(--accent-emerald); }
.is-user-wrong .opt-letter { background: rgba(251, 113, 133, 0.15); color: var(--accent-rose); }
.opt-text {
  flex: 1;
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.5;
}
.opt-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}
.tag-correct { background: rgba(52, 211, 153, 0.12); color: var(--accent-emerald); }
.tag-wrong { background: rgba(251, 113, 133, 0.12); color: var(--accent-rose); }
.tag-right { background: rgba(52, 211, 153, 0.12); color: var(--accent-emerald); }

/* Explanation */
.explanation-box {
  padding: 14px 16px;
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

/* Bottom Actions */
.bottom-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-top: 40px;
}
.action-btn {
  padding: 12px 32px;
  border-radius: var(--radius-sm);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.action-home {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
}
.action-home:hover {
  border-color: var(--border-glow);
  color: var(--text-primary);
}
.action-retry {
  background: var(--gradient-primary);
  border: none;
  color: #fff;
}
.action-retry:hover {
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.35);
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .score-section {
    flex-direction: column;
    gap: 24px;
    padding: 24px;
  }
}
</style>
