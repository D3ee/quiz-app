<template>
  <div class="history-page">
    <div class="page-header">
      <button class="back-btn" @click="router.push('/')">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 4L6 9L11 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span>首页</span>
      </button>
      <h2 class="page-title">答题记录</h2>
      <button v-if="history.length > 0" class="clear-btn" @click="handleClear">清空</button>
      <span v-else style="width:60px"></span>
    </div>

    <div v-if="history.length === 0" class="empty-state">
      <div class="empty-icon">📋</div>
      <p class="empty-text">暂无答题记录</p>
      <button class="action-btn" @click="router.push('/')">去答题</button>
    </div>

    <template v-else>
      <div class="trend-section">
        <h3 class="section-label">正确率趋势（最近 10 次）</h3>
        <div class="trend-chart">
          <div class="chart-y-axis">
            <span>100%</span><span>50%</span><span>0%</span>
          </div>
          <div class="chart-bars">
            <div v-for="(item, i) in trendData" :key="i" class="bar-wrap">
              <div class="bar-track">
                <div class="bar-fill" :class="getBarClass(item.scoreRate)" :style="{ height: `${item.scoreRate * 100}%` }">
                  <span class="bar-value">{{ Math.round(item.scoreRate * 100) }}%</span>
                </div>
              </div>
              <span class="bar-label">{{ formatDate(item.date) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="history-list">
        <div v-for="item in history" :key="item.id" class="history-card">
          <div class="history-left">
            <span class="cat-badge" :class="`badge-${item.category}`">{{ categoryNames[item.category] }}</span>
            <span class="mode-badge">{{ modeNames[item.mode] }}</span>
          </div>
          <div class="history-center">
            <div class="history-score">
              <span class="score-num" :class="getScoreClass(item.scoreRate)">{{ item.correctCount }}/{{ item.totalCount }}</span>
              <span class="score-rate">{{ Math.round(item.scoreRate * 100) }}%</span>
            </div>
          </div>
          <div class="history-right">
            <span class="history-time">{{ formatDuration(item.timeUsed) }}</span>
            <span class="history-date">{{ formatFullDate(item.date) }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuizStore } from '../stores/quiz'
import type { Category, QuizMode } from '../types'
import { ElMessageBox } from 'element-plus'

const router = useRouter()
const store = useQuizStore()

const categoryNames: Record<Category, string> = { javascript: 'JavaScript', vue2: 'Vue 2', vue3: 'Vue 3' }
const modeNames: Record<QuizMode, string> = { random: '随机', timed: '限时', challenge: '闯关', sequential: '顺序' }

const history = computed(() => store.quizHistory)
const trendData = computed(() => [...history.value].reverse().slice(-10))

function getBarClass(rate: number) {
  if (rate >= 0.8) return 'bar-excellent'
  if (rate >= 0.6) return 'bar-good'
  return 'bar-poor'
}

function getScoreClass(rate: number) {
  if (rate >= 0.8) return 'score-excellent'
  if (rate >= 0.6) return 'score-good'
  return 'score-poor'
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function formatFullDate(ts: number): string {
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`
}

function formatDuration(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

async function handleClear() {
  try {
    await ElMessageBox.confirm('确定清空所有答题记录吗？', '提示', {
      confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning',
    })
    store.clearHistory()
  } catch {}
}
</script>

<style scoped>
.history-page { max-width: 800px; margin: 0 auto; padding: 24px 20px 48px; position: relative; z-index: 1; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
.page-title { margin: 0; font-size: 20px; font-weight: 700; color: var(--text-primary); }
.back-btn { display: flex; align-items: center; gap: 4px; padding: 8px 14px; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); background: var(--bg-card); color: var(--text-secondary); font-size: 14px; cursor: pointer; transition: all 0.2s; font-family: inherit; backdrop-filter: blur(8px); }
.back-btn:hover { border-color: var(--border-glow); color: var(--text-primary); }
.clear-btn { padding: 8px 14px; border: 1px solid rgba(251,113,133,0.3); border-radius: var(--radius-sm); background: rgba(251,113,133,0.08); color: var(--accent-rose); font-size: 13px; cursor: pointer; font-family: inherit; transition: all 0.2s; }
.clear-btn:hover { background: rgba(251,113,133,0.15); }

.empty-state { text-align: center; padding: 80px 20px; }
.empty-icon { font-size: 48px; margin-bottom: 16px; }
.empty-text { color: var(--text-secondary); font-size: 16px; margin-bottom: 24px; }
.action-btn { padding: 12px 32px; border-radius: var(--radius-sm); background: var(--gradient-primary); border: none; color: #fff; font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit; }

/* Trend Chart */
.trend-section { margin-bottom: 32px; padding: 24px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); backdrop-filter: blur(12px); }
.section-label { font-size: 14px; font-weight: 600; color: var(--text-secondary); margin: 0 0 20px; }
.trend-chart { display: flex; gap: 12px; }
.chart-y-axis { display: flex; flex-direction: column; justify-content: space-between; font-size: 11px; color: var(--text-muted); padding-bottom: 20px; }
.chart-bars { display: flex; gap: 8px; flex: 1; align-items: flex-end; }
.bar-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; }
.bar-track { width: 100%; height: 120px; background: rgba(99,102,241,0.06); border-radius: 4px; display: flex; align-items: flex-end; position: relative; }
.bar-fill { width: 100%; border-radius: 4px; transition: height 0.8s ease; position: relative; min-height: 4px; }
.bar-excellent { background: var(--gradient-success); }
.bar-good { background: var(--gradient-warm); }
.bar-poor { background: var(--gradient-danger); }
.bar-value { position: absolute; top: -18px; left: 50%; transform: translateX(-50%); font-size: 10px; font-weight: 600; color: var(--text-secondary); white-space: nowrap; }
.bar-label { font-size: 11px; color: var(--text-muted); }

/* History List */
.history-list { display: flex; flex-direction: column; gap: 10px; }
.history-card { display: flex; align-items: center; padding: 16px 20px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); backdrop-filter: blur(12px); gap: 16px; }
.history-left { display: flex; gap: 8px; min-width: 140px; }
.cat-badge { padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; }
.badge-javascript { background: rgba(251,191,36,0.12); color: var(--accent-amber); }
.badge-vue2 { background: rgba(52,211,153,0.12); color: var(--accent-emerald); }
.badge-vue3 { background: rgba(34,211,238,0.12); color: var(--accent-cyan); }
.mode-badge { padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; background: rgba(99,102,241,0.12); color: var(--accent-indigo); }
.history-center { flex: 1; }
.history-score { display: flex; align-items: baseline; gap: 8px; }
.score-num { font-size: 18px; font-weight: 700; }
.score-excellent { color: var(--accent-emerald); }
.score-good { color: var(--accent-amber); }
.score-poor { color: var(--accent-rose); }
.score-rate { font-size: 13px; color: var(--text-muted); }
.history-right { text-align: right; min-width: 80px; }
.history-time { display: block; font-size: 14px; font-weight: 600; color: var(--text-secondary); font-variant-numeric: tabular-nums; }
.history-date { display: block; font-size: 12px; color: var(--text-muted); margin-top: 2px; }

@media (max-width: 768px) {
  .history-card { flex-wrap: wrap; }
  .history-left { min-width: auto; }
}
</style>
