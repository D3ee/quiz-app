<!--
  Home.vue - 首页视图
  功能：
  1. 展示应用标题和简介（Hero 区域）
  2. 三大分类卡片（JavaScript / Vue2 / Vue3），可选择抽题数量
  3. 四种答题模式切换（随机 / 顺序 / 限时 / 闯关）
  4. 快捷入口：错题本、答题记录、收藏练习
  5. 底部统计信息展示
-->
<template>
  <div class="home">
    <!-- Hero 区域：应用标题、副标题 -->
    <div class="hero">
      <div class="hero-badge">Frontend Quiz</div>
      <h1 class="title">
        <span class="title-line">前端知识</span>
        <span class="title-highlight">答题挑战</span>
      </h1>
      <p class="subtitle">选择一个分类，设置题目数量，检验你的前端功力</p>
    </div>

    <!-- 分类卡片区域：遍历 JS/Vue2/Vue3 三大分类 -->
    <div class="categories">
      <div
        v-for="(item, idx) in categories"
        :key="item.key"
        class="category-card"
        :class="`card-${item.key}`"
        :style="{ animationDelay: `${idx * 0.1}s` }"
      >
        <!-- 卡片悬浮光效层 -->
        <div class="card-glow"></div>
        <div class="card-content">
          <!-- 分类图标 -->
          <div class="card-icon" :class="`icon-${item.key}`">
            <span>{{ item.icon }}</span>
          </div>
          <h2 class="card-title">{{ item.name }}</h2>
          <p class="card-desc">{{ item.desc }}</p>
          <!-- 题库数量标签 -->
          <div class="card-meta">
            <span class="pool-badge">{{ item.pool }} 题</span>
          </div>
          <!-- 抽题数量选择：闯关模式显示全部题数，其他模式显示下拉选择 -->
          <div class="count-select" @click.stop>
            <template v-if="selectedMode === 'challenge'">
              <span class="count-label">闯关模式</span>
              <span class="challenge-hint">全部 {{ item.pool }} 题</span>
            </template>
            <template v-else>
              <span class="count-label">抽取数量</span>
              <el-select v-model="item.selected" size="small" class="dark-select">
                <el-option
                  v-for="n in item.options"
                  :key="n"
                  :label="n === item.pool ? `全部 (${n})` : `${n} 道`"
                  :value="n"
                />
              </el-select>
            </template>
          </div>
          <!-- 按钮组 -->
          <div class="btn-group">
            <button class="browse-btn" @click="router.push(`/questions/${item.key}`)">
              <span>📋 浏览题目</span>
            </button>
            <button class="start-btn" @click="startQuiz(item.key, item.selected)">
              <span>开始答题</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 3L11 8L6 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 快捷入口区域：错题本、答题记录、收藏练习 -->
    <div class="quick-links">
      <!-- 错题本入口 -->
      <div class="link-card link-wrong" @click="router.push('/wrong-book')">
        <span class="link-icon">📕</span>
        <div class="link-info">
          <span class="link-title">错题本</span>
          <span class="link-count">{{ wrongCount }} 题</span>
        </div>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3L11 8L6 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <!-- 答题记录入口 -->
      <div class="link-card link-history" @click="router.push('/history')">
        <span class="link-icon">📊</span>
        <div class="link-info">
          <span class="link-title">答题记录</span>
          <span class="link-count">{{ historyCount }} 次</span>
        </div>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3L11 8L6 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <!-- 收藏练习入口 -->
      <div class="link-card link-fav" @click="startFav">
        <span class="link-icon">⭐</span>
        <div class="link-info">
          <span class="link-title">收藏练习</span>
          <span class="link-count">{{ favCount }} 题</span>
        </div>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3L11 8L6 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
    </div>

    <!-- 答题模式选择区域：随机/顺序/限时/闯关 -->
    <div class="mode-section">
      <h3 class="mode-title">答题模式</h3>
      <div class="mode-cards">
        <div v-for="m in modes" :key="m.key" class="mode-card" :class="{ 'mode-active': selectedMode === m.key }" @click="selectedMode = m.key">
          <span class="mode-icon">{{ m.icon }}</span>
          <span class="mode-name">{{ m.name }}</span>
          <span class="mode-desc">{{ m.desc }}</span>
        </div>
      </div>
    </div>

    <!-- 底部统计信息 -->
    <div class="footer-hint">
      <span>共 {{ totalQuestions }} 道题目</span>
      <span class="dot-sep"></span>
      <span>涵盖 JavaScript / Vue 2 / Vue 3</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuizStore, getPoolSize } from '../../stores/quiz'
import type { Category, QuizMode } from '../../types'
import { ElMessage } from 'element-plus'

const router = useRouter()
const store = useQuizStore()

/** 当前选中的答题模式，默认随机 */
const selectedMode = ref<QuizMode>('random')

/** 四种答题模式配置 */
const modes = [
  { key: 'random' as QuizMode, icon: '🎲', name: '随机模式', desc: '随机抽题' },
  { key: 'sequential' as QuizMode, icon: '📋', name: '顺序模式', desc: '按序做题' },
  { key: 'timed' as QuizMode, icon: '⏱️', name: '限时模式', desc: '每题限时' },
  { key: 'challenge' as QuizMode, icon: '🔥', name: '闯关模式', desc: '答错即止' },
]

/** 根据题库大小生成可选的抽题数量（5/10/15/20/全部） */
function buildOptions(pool: number): number[] {
  const opts = [5, 10, 15, 20].filter((n) => n < pool)
  opts.push(pool)
  return opts
}

/** 三大分类配置：名称、图标、描述、题库大小、可选数量、默认选中数量 */
const categories = reactive([
  { key: 'javascript' as Category, name: 'JavaScript', icon: 'JS', desc: '闭包、原型链、Promise、Event Loop 等核心知识', pool: getPoolSize('javascript'), options: buildOptions(getPoolSize('javascript')), selected: Math.min(10, getPoolSize('javascript')) },
  { key: 'vue2' as Category, name: 'Vue 2', icon: 'V2', desc: '生命周期、响应式原理、组件通信等', pool: getPoolSize('vue2'), options: buildOptions(getPoolSize('vue2')), selected: Math.min(10, getPoolSize('vue2')) },
  { key: 'vue3' as Category, name: 'Vue 3', icon: 'V3', desc: 'Composition API、ref/reactive、Teleport 等新特性', pool: getPoolSize('vue3'), options: buildOptions(getPoolSize('vue3')), selected: Math.min(10, getPoolSize('vue3')) },
  { key: 'miniprogram' as Category, name: '小程序', icon: 'MP', desc: '原生小程序与 UniApp 跨端开发核心知识', pool: getPoolSize('miniprogram'), options: buildOptions(getPoolSize('miniprogram')), selected: Math.min(10, getPoolSize('miniprogram')) },
])

/** 所有分类题目总数 */
const totalQuestions = computed(() => categories.reduce((sum, c) => sum + c.pool, 0))
/** 错题本中的错题数量 */
const wrongCount = computed(() => store.getWrongCount())
/** 历史答题次数 */
const historyCount = computed(() => store.quizHistory.length)
/** 收藏题目数量 */
const favCount = computed(() => store.favoriteIds.length)

/** 开始答题：初始化 store 并跳转到答题页 */
function startQuiz(category: Category, count: number) {
  // 闯关模式使用全部题目，不限制题数
  const actualCount = selectedMode.value === 'challenge'
    ? undefined
    : count
  store.startQuiz(category, actualCount, selectedMode.value)
  router.push(`/quiz/${category}`)
}

/** 开始收藏练习：无收藏时提示，有收藏时启动专项练习 */
function startFav() {
  if (store.favoriteIds.length === 0) {
    ElMessage.info('暂无收藏题目，答题时点击 ⭐ 可收藏')
    return
  }
  if (store.startFavoriteQuiz()) {
    router.push(`/quiz/${store.currentCategory}`)
  }
}
</script>

<style scoped>
.home {
  max-width: 1000px;
  margin: 0 auto;
  padding: 60px 24px 40px;
  position: relative;
  z-index: 1;
}

/* Hero */
.hero {
  text-align: center;
  margin-bottom: 56px;
}
.hero-badge {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 20px;
  background: rgba(99, 102, 241, 0.12);
  border: 1px solid rgba(99, 102, 241, 0.25);
  color: var(--accent-indigo);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 20px;
}
.title {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-bottom: 16px;
}
.title-line {
  font-size: 42px;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -1px;
}
.title-highlight {
  font-size: 42px;
  font-weight: 900;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -1px;
}
.subtitle {
  color: var(--text-secondary);
  font-size: 16px;
  line-height: 1.6;
}

/* Cards Grid */
.categories {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-bottom: 48px;
}

.category-card {
  position: relative;
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  overflow: hidden;
  transition: transform 0.3s ease, border-color 0.3s ease;
  animation: card-in 0.5s ease both;
  backdrop-filter: blur(12px);
}
.category-card:hover {
  transform: translateY(-4px);
  border-color: var(--border-glow);
}
.category-card:hover .card-glow {
  opacity: 1;
}

@keyframes card-in {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-glow {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}
.card-javascript .card-glow {
  background: radial-gradient(circle at 50% 0%, rgba(251, 191, 36, 0.08), transparent 60%);
}
.card-vue2 .card-glow {
  background: radial-gradient(circle at 50% 0%, rgba(52, 211, 153, 0.08), transparent 60%);
}
.card-vue3 .card-glow {
  background: radial-gradient(circle at 50% 0%, rgba(34, 211, 238, 0.08), transparent 60%);
}
.card-miniprogram .card-glow {
  background: radial-gradient(circle at 50% 0%, rgba(167, 139, 250, 0.08), transparent 60%);
}

.card-content {
  position: relative;
  padding: 36px 32px 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

/* Icons */
.card-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 800;
  margin-bottom: 20px;
  position: relative;
}
.icon-javascript {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(251, 146, 60, 0.15));
  color: var(--accent-amber);
  box-shadow: 0 0 24px rgba(251, 191, 36, 0.1);
}
.icon-vue2 {
  background: linear-gradient(135deg, rgba(52, 211, 153, 0.15), rgba(16, 185, 129, 0.15));
  color: var(--accent-emerald);
  box-shadow: 0 0 24px rgba(52, 211, 153, 0.1);
}
.icon-vue3 {
  background: linear-gradient(135deg, rgba(34, 211, 238, 0.15), rgba(99, 102, 241, 0.15));
  color: var(--accent-cyan);
  box-shadow: 0 0 24px rgba(34, 211, 238, 0.1);
}
.icon-miniprogram {
  background: linear-gradient(135deg, rgba(167, 139, 250, 0.15), rgba(139, 92, 246, 0.15));
  color: var(--accent-violet);
  box-shadow: 0 0 24px rgba(167, 139, 250, 0.1);
}

.card-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}
.card-desc {
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.6;
  margin-bottom: 16px;
}
.card-meta {
  margin-bottom: 16px;
}
.pool-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  background: rgba(99, 102, 241, 0.1);
  color: var(--accent-indigo);
  font-size: 12px;
  font-weight: 600;
}

/* Select */
.count-select {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}
.count-label {
  font-size: 13px;
  color: var(--text-muted);
}
.dark-select {
  width: 110px;
}
.challenge-hint {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent-amber);
}

/* Button Group */
.btn-group {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}

.browse-btn {
  flex: 0 0 auto;
  min-width: 110px;
  padding: 11px 20px;
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: var(--radius-sm);
  background: rgba(99, 102, 241, 0.08);
  color: #818cf8;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
  white-space: nowrap;
}

.browse-btn:hover {
  background: rgba(99, 102, 241, 0.15);
  border-color: rgba(99, 102, 241, 0.5);
  transform: translateY(-1px);
}

.start-btn {
  flex: 1;
  padding: 11px 20px;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--gradient-primary);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.3s ease;
  font-family: inherit;
}
.start-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.35);
}
.start-btn:active {
  transform: translateY(0);
}

/* Footer */
.footer-hint {
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
.dot-sep {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--text-muted);
}

@media (max-width: 768px) {
  .home {
    padding: 40px 16px 32px;
  }
  .title-line, .title-highlight {
    font-size: 30px;
  }
  .categories {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  .quick-links {
    grid-template-columns: 1fr !important;
  }
  .mode-cards {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}

/* Quick Links */
.quick-links {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 32px;
}
.link-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
  backdrop-filter: blur(12px);
  color: var(--text-secondary);
}
.link-card:hover {
  border-color: var(--border-glow);
  transform: translateY(-2px);
}
.link-icon { font-size: 24px; }
.link-info { flex: 1; display: flex; flex-direction: column; }
.link-title { font-size: 14px; font-weight: 600; color: var(--text-primary); }
.link-count { font-size: 12px; color: var(--text-muted); margin-top: 2px; }

/* Mode Section */
.mode-section { margin-bottom: 32px; }
.mode-title { font-size: 16px; font-weight: 600; color: var(--text-secondary); margin: 0 0 16px; text-align: center; }
.mode-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.mode-card {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 14px 8px; background: var(--bg-card); border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s; backdrop-filter: blur(12px);
}
.mode-card:hover { border-color: var(--border-glow); }
.mode-card.mode-active { border-color: var(--accent-indigo); background: rgba(99,102,241,0.08); }
.mode-icon { font-size: 22px; }
.mode-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.mode-desc { font-size: 11px; color: var(--text-muted); }
</style>
