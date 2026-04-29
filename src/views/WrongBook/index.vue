<!--
  WrongBook.vue - 错题本页面视图
  功能：
  1. 顶部导航栏：返回首页、清空错题按钮
  2. 空状态提示：无错题时显示鼓励信息
  3. 分类统计条：按 JS/Vue2/Vue3 统计错题数量
  4. 错题列表：展示题目内容、正确答案、错误次数、最后错误时间
  5. 操作：全部错题练习、单条移除
-->
<template>
  <div class="wrong-book">
    <!-- 顶部导航栏：返回首页 + 标题 + 清空按钮 -->
    <div class="page-header">
      <button class="back-btn" @click="router.push('/')">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 4L6 9L11 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span>首页</span>
      </button>
      <h2 class="page-title">错题本</h2>
      <button v-if="wrongRecords.length > 0" class="clear-btn" @click="handleClear">清空</button>
      <span v-else style="width:60px"></span>
    </div>

    <!-- 空状态：无错题时显示鼓励信息 -->
    <div v-if="wrongRecords.length === 0" class="empty-state">
      <div class="empty-icon">🎉</div>
      <p class="empty-text">暂无错题，继续保持！</p>
      <button class="action-btn" @click="router.push('/')">去答题</button>
    </div>

    <template v-else>
      <!-- 分类统计条：按分类显示错题数量 + 全部错题练习按钮 -->
      <div class="stats-bar">
        <div
          v-for="item in categoryStats"
          :key="item.key"
          class="stat-chip"
          :class="[`chip-${item.key}`, { 'chip-active': selectedCategory === item.key }]"
          @click="toggleCategory(item.key)"
        >
          {{ item.name }} <strong>{{ item.count }}</strong>
        </div>
        <button class="start-wrong-btn" @click="startAll">全部错题练习</button>
      </div>

      <!-- 错题列表：逐条展示题目、正确答案、错误次数、时间 -->
      <div class="wrong-list">
        <div v-for="(record, i) in wrongWithQuestion" :key="record.questionId" class="wrong-card">
          <!-- 错题卡片头部：序号 + 分类标签 + 错误次数 -->
          <div class="wrong-header">
            <span class="wrong-index">{{ i + 1 }}</span>
            <span class="cat-badge" :class="`badge-${record.category}`">{{ categoryNames[record.category] }}</span>
            <span class="wrong-count">错 {{ record.wrongCount }} 次</span>
          </div>
          <!-- 题目内容（支持代码高亮渲染） -->
          <div class="wrong-question" v-html="renderQuestion(record.question!.question)"></div>
          <!-- 选项列表（单选/多选/排序题显示） -->
          <div v-if="record.question!.options" class="wrong-options">
            <div
              v-for="(opt, idx) in record.question!.options"
              :key="idx"
              class="wrong-option"
              :class="{
                'option-correct': isAnswer(record.question!, idx),
                'option-user-wrong': isUserWrong(record, idx),
              }"
            >
              <span class="option-label">{{ labels[idx] }}.</span>
              <span class="option-text">{{ opt }}</span>
            </div>
          </div>
          <!-- 正确答案 -->
          <div class="wrong-answer">
            <span class="answer-label">正确答案：</span>
            <span class="answer-value">{{ formatAnswer(record.question!) }}</span>
          </div>
          <!-- 用户的错误答案 -->
          <div v-if="record.userAnswer !== undefined" class="wrong-user-answer">
            <span class="answer-label">你的答案：</span>
            <span class="answer-value user-wrong">{{ formatUserAnswer(record) }}</span>
          </div>
          <!-- 底部：最后错误时间 + 移除按钮 -->
          <div class="wrong-footer">
            <span class="wrong-time">{{ formatTime(record.lastWrongTime) }}</span>
            <button class="remove-btn" @click="removeRecord(record.questionId)">移除</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuizStore } from '../../stores/quiz'
import { useQuestionRenderer } from '../../composables/useQuestionRenderer'
import type { Category, Question, WrongRecord } from '../../types'
import { javascriptQuestions } from '../../data/javascript'
import { vue2Questions } from '../../data/vue2'
import { vue3Questions } from '../../data/vue3'
import { miniprogramQuestions } from '../../data/miniprogram'
import { advancedQuestions } from '../../data/advanced'
import { ElMessageBox } from 'element-plus'

const router = useRouter()
const store = useQuizStore()
const { renderQuestion } = useQuestionRenderer()

const categoryNames: Record<Category, string> = { javascript: 'JavaScript', vue2: 'Vue 2', vue3: 'Vue 3', miniprogram: '小程序', advanced: '进阶' }
const labels = ['A', 'B', 'C', 'D']

const allQuestions: Question[] = [...javascriptQuestions, ...vue2Questions, ...vue3Questions, ...miniprogramQuestions, ...advancedQuestions]
const questionMap = new Map(allQuestions.map(q => [q.id, q]))

const wrongRecords = computed(() => store.wrongRecords)

// 当前选中的分类过滤，null 表示显示全部
const selectedCategory = ref<Category | null>(null)

/** 点击分类标签：切换过滤，再次点击取消 */
function toggleCategory(key: Category) {
  selectedCategory.value = selectedCategory.value === key ? null : key
}

const wrongWithQuestion = computed(() =>
  wrongRecords.value
    .filter(r => selectedCategory.value === null || r.category === selectedCategory.value)
    .map(r => ({ ...r, question: questionMap.get(r.questionId) }))
    .filter(r => r.question)
)

const categoryStats = computed(() =>
  (['javascript', 'vue2', 'vue3', 'miniprogram', 'advanced'] as Category[]).map(key => ({
    key,
    name: categoryNames[key],
    count: wrongRecords.value.filter(r => r.category === key).length,
  })).filter(s => s.count > 0)
)

function formatAnswer(q: Question): string {
  switch (q.type) {
    case 'single':
      return labels[q.answer as number]
    case 'multiple':
    case 'order':
      return (q.answer as number[]).map(i => labels[i]).join('、')
    case 'judge':
      return q.answer ? '正确' : '错误'
    case 'fill':
    case 'short':
    case 'code':
      return String(q.answer)
    default:
      return String(q.answer)
  }
}

/** 格式化用户答案显示 */
function formatUserAnswer(record: WrongRecord & { question?: Question }): string {
  const ua = record.userAnswer
  const q = record.question
  if (!q) return String(ua)
  switch (q.type) {
    case 'single':
      return labels[ua as number] ?? String(ua)
    case 'multiple':
    case 'order':
      return (ua as number[]).map(i => labels[i]).join('、')
    case 'judge':
      return ua ? '正确' : '错误'
    case 'fill':
    case 'short':
    case 'code':
      return String(ua)
    default:
      return String(ua)
  }
}

/** 判断某选项是否为正确答案 */
function isAnswer(q: Question, optIndex: number): boolean {
  if (q.type === 'single') return q.answer === optIndex
  if (q.type === 'multiple' || q.type === 'order') return (q.answer as number[]).includes(optIndex)
  return false
}

/** 判断某选项是否为用户的错误选择 */
function isUserWrong(record: WrongRecord & { question?: Question }, optIndex: number): boolean {
  const ua = record.userAnswer
  if (ua === undefined) return false
  const q = record.question
  if (!q) return false
  const selected = q.type === 'single' ? ua === optIndex : (ua as number[]).includes(optIndex)
  return selected && !isAnswer(q, optIndex)
}

/** 格式化时间戳为 月/日 时:分 */
function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`
}

/** 移除单条错题记录 */
function removeRecord(qid: string) {
  const idx = store.wrongRecords.findIndex(r => r.questionId === qid)
  if (idx >= 0) store.wrongRecords.splice(idx, 1)
}

/** 清空所有错题记录（弹窗确认） */
async function handleClear() {
  try {
    await ElMessageBox.confirm('确定清空所有错题记录吗？', '提示', {
      confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning',
    })
    store.clearWrongRecords()
  } catch {}
}

function startAll() {
  if (store.startWrongQuiz()) {
    router.push(`/quiz/${store.currentCategory}`)
  }
}
</script>

<style scoped>
.wrong-book { max-width: 800px; margin: 0 auto; padding: 24px 20px 48px; position: relative; z-index: 1; }
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

.stats-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; flex-wrap: wrap; }
.stat-chip { padding: 6px 14px; border-radius: 20px; font-size: 13px; color: var(--text-secondary); cursor: pointer; transition: all 0.2s; border: 1px solid transparent; }
.stat-chip:hover { transform: translateY(-1px); }
.stat-chip.chip-active { border-color: currentColor; box-shadow: 0 0 12px rgba(99,102,241,0.15); }
.stat-chip strong { margin-left: 4px; }
.chip-javascript { background: rgba(251,191,36,0.1); color: var(--accent-amber); }
.chip-vue2 { background: rgba(52,211,153,0.1); color: var(--accent-emerald); }
.chip-vue3 { background: rgba(34,211,238,0.1); color: var(--accent-cyan); }
.chip-miniprogram { background: rgba(167,139,250,0.1); color: var(--accent-violet); }
.chip-advanced { background: rgba(244,114,182,0.1); color: var(--accent-pink); }
.start-wrong-btn { margin-left: auto; padding: 8px 20px; border: none; border-radius: var(--radius-sm); background: var(--gradient-primary); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.2s; }
.start-wrong-btn:hover { box-shadow: 0 4px 16px rgba(99,102,241,0.3); }

.wrong-list { display: flex; flex-direction: column; gap: 12px; }
.wrong-card { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 20px; backdrop-filter: blur(12px); border-left: 3px solid var(--accent-rose); }
.wrong-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.wrong-index { width: 28px; height: 28px; border-radius: 8px; background: rgba(251,113,133,0.1); color: var(--accent-rose); font-weight: 700; font-size: 13px; display: flex; align-items: center; justify-content: center; }
.cat-badge { padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; }
.badge-javascript { background: rgba(251,191,36,0.12); color: var(--accent-amber); }
.badge-vue2 { background: rgba(52,211,153,0.12); color: var(--accent-emerald); }
.badge-vue3 { background: rgba(34,211,238,0.12); color: var(--accent-cyan); }
.badge-miniprogram { background: rgba(167,139,250,0.12); color: var(--accent-violet); }
.badge-advanced { background: rgba(244,114,182,0.12); color: var(--accent-pink); }
.wrong-count { margin-left: auto; font-size: 12px; color: var(--accent-rose); font-weight: 600; }
.wrong-question { font-size: 14px; line-height: 1.7; color: var(--text-primary); margin-bottom: 12px; }
.wrong-question :deep(pre) { background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); padding: 12px; border-radius: var(--radius-sm); overflow-x: auto; margin: 8px 0; }
.wrong-question :deep(code) { font-family: 'Fira Code', Consolas, monospace; font-size: 13px; color: var(--accent-cyan); }
.wrong-question :deep(.inline-code) { background: rgba(99,102,241,0.1); padding: 2px 8px; border-radius: 4px; color: var(--accent-indigo); }
.wrong-options { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
.wrong-option { display: flex; align-items: flex-start; gap: 8px; padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); font-size: 13px; line-height: 1.5; transition: all 0.2s; }
.wrong-option.option-correct { border-color: rgba(52,211,153,0.4); background: rgba(52,211,153,0.06); }
.wrong-option.option-user-wrong { border-color: rgba(251,113,133,0.4); background: rgba(251,113,133,0.06); }
.option-label { color: var(--text-muted); font-weight: 600; flex-shrink: 0; }
.option-text { color: var(--text-primary); }
.wrong-option.option-correct .option-label { color: var(--accent-emerald); }
.wrong-option.option-user-wrong .option-label { color: var(--accent-rose); }
.wrong-answer { font-size: 13px; margin-bottom: 8px; }
.wrong-user-answer { font-size: 13px; margin-bottom: 12px; }
.answer-label { color: var(--text-muted); }
.answer-value { color: var(--accent-emerald); font-weight: 600; }
.answer-value.user-wrong { color: var(--accent-rose); }
.wrong-footer { display: flex; align-items: center; justify-content: space-between; }
.wrong-time { font-size: 12px; color: var(--text-muted); }
.remove-btn { padding: 4px 12px; border: 1px solid var(--border-subtle); border-radius: 4px; background: transparent; color: var(--text-muted); font-size: 12px; cursor: pointer; font-family: inherit; transition: all 0.2s; }
.remove-btn:hover { border-color: var(--accent-rose); color: var(--accent-rose); }
</style>
