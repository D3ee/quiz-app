<!--
  Quiz.vue - 答题页面视图
  功能：
  1. 顶部导航栏：返回按钮、分类标题、答题进度条、计时器
  2. 核心答题区：使用 QuestionCard 组件渲染当前题目，支持收藏
  3. 限时模式倒计时条：每题 30 秒，超时自动跳题
  4. 闯关模式失败弹窗：显示连续答对题数，支持重试
  5. 底部导航：上一题/下一题按钮、题目圆点导航、提交答卷
-->
<template>
  <div class="quiz">
    <!-- 顶部导航栏：返回按钮 + 分类标题 + 进度条 + 计时器 -->
    <div class="quiz-header">
      <button class="back-btn" @click="goHome">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M11 4L6 9L11 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>返回</span>
      </button>
      <!-- 中间区域：分类名称 + 答题进度条 -->
      <div class="header-center">
        <h2 class="quiz-title">{{ categoryName }}</h2>
        <div class="progress-wrap">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${Math.round(((currentIndex + 1) / total) * 100)}%` }"></div>
          </div>
          <span class="progress-text">{{ currentIndex + 1 }} / {{ total }}</span>
        </div>
      </div>
      <!-- 右侧计时器：显示已用时间 -->
      <div class="timer">⏱ {{ timeElapsed }}</div>
    </div>

    <!-- 核心答题区：渲染当前题目，插槽中放置收藏按钮 -->
    <QuestionCard
      v-if="currentQuestion"
      :question="currentQuestion"
      :index="currentIndex"
      :total="total"
      :saved-answer="userAnswers[currentQuestion.id]"
      @answer="onAnswer"
      @multi-select="onAnswer(currentQuestion!.id, $event)"
    >
      <!-- 题目卡片右上角：收藏/取消收藏按钮 -->
      <template #header-extra>
        <button class="fav-btn" :class="{ 'is-fav': store.isFavorite(currentQuestion.id) }" @click="store.toggleFavorite(currentQuestion.id)">
          {{ store.isFavorite(currentQuestion.id) ? '★' : '☆' }}
        </button>
      </template>
    </QuestionCard>

    <!-- 限时模式倒计时进度条：未作答时显示，<=10s 变红警告 -->
    <div v-if="store.currentMode === 'timed' && !isAnswered" class="countdown-bar">
      <div class="countdown-fill" :class="{ 'countdown-warn': countdown <= 10 }" :style="{ width: `${(countdown / store.timeLimitPerQuestion) * 100}%` }"></div>
      <span class="countdown-text">{{ countdown }}s</span>
    </div>

    <!-- 闯关模式失败弹窗：显示连续答对题数，可重试或返回首页 -->
    <div v-if="store.challengeFailed" class="challenge-over">
      <div class="challenge-over-box">
        <div class="challenge-icon">💥</div>
        <h3>闯关结束！</h3>
        <p>连续答对 <strong>{{ store.challengeStreak }}</strong> 题</p>
        <div class="challenge-actions">
          <button class="action-btn action-home" @click="router.push('/')">返回首页</button>
          <button class="action-btn action-retry" @click="retryChallenge">再来一次</button>
        </div>
      </div>
    </div>

    <!-- 底部导航栏：上一题/下一题按钮 + 题目圆点导航 + 提交按钮 -->
    <div class="quiz-footer">
      <!-- 上一题按钮：第一题时禁用 -->
      <button
        class="nav-btn"
        :class="{ disabled: currentIndex === 0 }"
        :disabled="currentIndex === 0"
        @click="store.prevQuestion()"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        上一题
      </button>

      <!-- 题目圆点导航：已答题绿色、当前题高亮放大，点击可跳转 -->
      <div class="question-dots">
        <span
          v-for="(q, i) in questions"
          :key="q.id"
          class="dot"
          :class="{ active: i === currentIndex, answered: q.id in userAnswers }"
          @click="store.currentIndex = i"
        />
      </div>

      <!-- 下一题按钮 / 最后一题时显示提交按钮 -->
      <button
        v-if="currentIndex < total - 1"
        class="nav-btn nav-btn--primary"
        @click="store.nextQuestion()"
      >
        下一题
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 3L11 8L6 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <button
        v-else
        class="nav-btn nav-btn--success"
        @click="handleSubmit"
      >
        提交答卷
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 8L7 12L13 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessageBox } from 'element-plus'
import { useQuizStore } from '../stores/quiz'
import QuestionCard from '../components/QuestionCard.vue'
import type { Category } from '../types'

const router = useRouter()
const route = useRoute()
const store = useQuizStore()

/** 从 store 解构响应式状态 */
const { currentIndex, total, currentQuestion, questions, userAnswers } = storeToRefs(store)

const elapsed = ref(0)                             // 已用时间（秒）
const countdown = ref(store.timeLimitPerQuestion)   // 限时模式倒计时（秒）
let timer: number                                   // 全局计时器 ID
let countdownTimer: number                          // 倒计时定时器 ID

/** 当前题目是否已作答 */
const isAnswered = computed(() => {
  if (!currentQuestion.value) return false
  return currentQuestion.value.id in store.userAnswers
})

/** 挂载时启动全局计时器，限时模式额外启动倒计时 */
onMounted(() => {
  timer = setInterval(() => {
    elapsed.value = store.startTime ? Math.floor((Date.now() - store.startTime) / 1000) : 0
  }, 1000)

  if (store.currentMode === 'timed') {
    startCountdown()
  }
})

onUnmounted(() => {
  clearInterval(timer)
  clearInterval(countdownTimer)
})

/** 启动/重置限时倒计时，超时自动跳题或提交 */
function startCountdown() {
  clearInterval(countdownTimer)
  countdown.value = store.timeLimitPerQuestion
  countdownTimer = setInterval(() => {
    if (isAnswered.value) return
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownTimer)
      // 超时自动跳下一题
      if (currentIndex.value < total.value - 1) {
        store.nextQuestion()
      } else {
        store.submit()
        router.push(`/result/${store.currentCategory}`)
      }
    }
  }, 1000)
}

// 限时模式：切题时重置倒计时
watch(currentIndex, () => {
  if (store.currentMode === 'timed') startCountdown()
})

/** 格式化已用时间为 m:ss 格式 */
const timeElapsed = computed(() => {
  const m = Math.floor(elapsed.value / 60)
  const s = elapsed.value % 60
  return `${m}:${s.toString().padStart(2, '0')}`
})

/** 分类名称映射 */
const categoryNames: Record<Category, string> = {
  javascript: 'JavaScript',
  vue2: 'Vue 2',
  vue3: 'Vue 3',
}

const category = route.params.category as Category
if (!store.questions.length || store.currentCategory !== category) {
  store.startQuiz(category)
}

const categoryName = computed(() => categoryNames[store.currentCategory])

/** 处理用户提交答案，闯关模式下额外判断对错 */
function onAnswer(questionId: number, answer: number | number[]) {
  store.setAnswer(questionId, answer)

  // 闯关模式：判断对错
  if (store.currentMode === 'challenge') {
    const q = store.questions.find(q => q.id === questionId)
    if (q) {
      let correct = false
      if (q.type === 'single') {
        correct = answer === q.answer
      } else {
        const ans = q.answer as number[]
        const user = answer as number[]
        correct = ans.length === user.length && ans.every(a => user.includes(a))
      }
      if (correct) {
        store.challengeStreak++
      } else {
        store.challengeFailAt()
      }
    }
  }
}

function goHome() {
  router.push('/')
}

function retryChallenge() {
  store.startQuiz(store.currentCategory, store.questions.length, 'challenge')
  router.push(`/quiz/${store.currentCategory}`)
}

/** 提交答卷：有未作答题目时弹窗确认 */
async function handleSubmit() {
  const unanswered = store.questions.filter((q) => !(q.id in store.userAnswers)).length
  if (unanswered > 0) {
    try {
      await ElMessageBox.confirm(
        `还有 ${unanswered} 道题未作答，确定要提交吗？`,
        '提示',
        { confirmButtonText: '确定提交', cancelButtonText: '继续答题', type: 'warning' },
      )
    } catch {
      return
    }
  }
  store.submit()
  router.push(`/result/${store.currentCategory}`)
}
</script>

<style scoped>
.quiz {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 20px;
  position: relative;
  z-index: 1;
}

/* Header */
.quiz-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
  gap: 16px;
}
.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  backdrop-filter: blur(8px);
}
.back-btn:hover {
  border-color: var(--border-glow);
  color: var(--text-primary);
}
.header-center {
  flex: 1;
  text-align: center;
}
.timer {
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  background: rgba(99, 102, 241, 0.1);
  color: var(--accent-indigo);
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.quiz-title {
  margin: 0 0 10px;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

/* Progress */
.progress-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
}
.progress-bar {
  width: 200px;
  height: 6px;
  border-radius: 3px;
  background: rgba(99, 102, 241, 0.12);
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 3px;
  background: var(--gradient-primary);
  transition: width 0.4s ease;
}
.progress-text {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  min-width: 48px;
}

/* Footer */
.quiz-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 24px;
  padding: 16px 0;
  gap: 12px;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  backdrop-filter: blur(8px);
}
.nav-btn:hover:not(.disabled) {
  border-color: var(--border-glow);
  color: var(--text-primary);
}
.nav-btn.disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.nav-btn--primary {
  background: var(--gradient-primary);
  border: none;
  color: #fff;
}
.nav-btn--primary:hover {
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
  color: #fff !important;
}
.nav-btn--success {
  background: var(--gradient-success);
  border: none;
  color: #fff;
}
.nav-btn--success:hover {
  box-shadow: 0 4px 16px rgba(52, 211, 153, 0.3);
  color: #fff !important;
}

/* Dots */
.question-dots {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
  flex: 1;
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(99, 102, 241, 0.15);
  cursor: pointer;
  transition: all 0.25s ease;
}
.dot.answered {
  background: var(--accent-emerald);
  box-shadow: 0 0 8px rgba(52, 211, 153, 0.4);
}
.dot.active {
  background: var(--accent-indigo);
  transform: scale(1.4);
  box-shadow: 0 0 10px rgba(129, 140, 248, 0.5);
}

/* Favorite Button */
.fav-btn {
  background: none; border: none; font-size: 20px; cursor: pointer;
  color: var(--text-muted); transition: all 0.2s; padding: 4px 8px; line-height: 1;
}
.fav-btn.is-fav { color: var(--accent-amber); text-shadow: 0 0 8px rgba(251,191,36,0.5); }
.fav-btn:hover { transform: scale(1.2); }

/* Countdown Bar */
.countdown-bar {
  margin-top: 12px; height: 6px; border-radius: 3px;
  background: rgba(99,102,241,0.1); overflow: hidden; position: relative;
}
.countdown-fill {
  height: 100%; border-radius: 3px; background: var(--gradient-primary);
  transition: width 1s linear;
}
.countdown-fill.countdown-warn { background: var(--gradient-danger); }
.countdown-text {
  position: absolute; right: 0; top: -20px; font-size: 12px;
  font-weight: 600; color: var(--text-secondary); font-variant-numeric: tabular-nums;
}

/* Challenge Over */
.challenge-over {
  position: fixed; inset: 0; z-index: 100; display: flex;
  align-items: center; justify-content: center;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
}
.challenge-over-box {
  background: var(--bg-secondary); border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg); padding: 40px; text-align: center;
  max-width: 360px; width: 90%;
}
.challenge-icon { font-size: 48px; margin-bottom: 12px; }
.challenge-over-box h3 { font-size: 22px; color: var(--text-primary); margin: 0 0 8px; }
.challenge-over-box p { color: var(--text-secondary); margin: 0 0 24px; }
.challenge-over-box strong { color: var(--accent-amber); font-size: 24px; }
.challenge-actions { display: flex; gap: 12px; justify-content: center; }
.action-btn {
  padding: 10px 24px; border-radius: var(--radius-sm);
  font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.2s;
}
.action-home {
  background: var(--bg-card); border: 1px solid var(--border-subtle); color: var(--text-secondary);
}
.action-home:hover { border-color: var(--border-glow); color: var(--text-primary); }
.action-retry { background: var(--gradient-primary); border: none; color: #fff; }
.action-retry:hover { box-shadow: 0 4px 16px rgba(99,102,241,0.3); }
</style>
