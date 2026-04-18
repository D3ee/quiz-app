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

    <div v-if="wrongCount > 0" class="wrong-tip">
      <span class="wrong-tip-icon">📕</span>
      <span>本次有 <strong>{{ wrongCount }}</strong> 道错题已自动加入错题本</span>
      <button class="wrong-tip-btn" @click="router.push('/wrong-book')">查看错题本</button>
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

const wrongCount = computed(() => {
  return store.questions.filter(q => !isCorrect(q)).length
})

const timeUsed = computed(() => {
  if (!store.startTime || !store.endTime) return '0:00'
  const elapsed = Math.floor((store.endTime - store.startTime) / 1000)
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
.wrong-tip {
  display: flex; align-items: center; gap: 10px; padding: 14px 20px;
  background: rgba(251,113,133,0.06); border: 1px solid rgba(251,113,133,0.2);
  border-radius: var(--radius-md); margin-bottom: 24px; font-size: 14px; color: var(--text-secondary);
}
.wrong-tip-icon { font-size: 18px; }
.wrong-tip strong { color: var(--accent-rose); }
.wrong-tip-btn {
  margin-left: auto; padding: 6px 14px; border: 1px solid rgba(251,113,133,0.3);
  border-radius: var(--radius-sm); background: transparent; color: var(--accent-rose);
  font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.2s; white-space: nowrap;
}
.wrong-tip-btn:hover { background: rgba(251,113,133,0.1); }

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
