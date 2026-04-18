<template>
  <div class="home">
    <div class="hero">
      <div class="hero-badge">Frontend Quiz</div>
      <h1 class="title">
        <span class="title-line">前端知识</span>
        <span class="title-highlight">答题挑战</span>
      </h1>
      <p class="subtitle">选择一个分类，设置题目数量，检验你的前端功力</p>
    </div>

    <div class="categories">
      <div
        v-for="(item, idx) in categories"
        :key="item.key"
        class="category-card"
        :class="`card-${item.key}`"
        :style="{ animationDelay: `${idx * 0.1}s` }"
      >
        <div class="card-glow"></div>
        <div class="card-content">
          <div class="card-icon" :class="`icon-${item.key}`">
            <span>{{ item.icon }}</span>
          </div>
          <h2 class="card-title">{{ item.name }}</h2>
          <p class="card-desc">{{ item.desc }}</p>
          <div class="card-meta">
            <span class="pool-badge">{{ item.pool }} 题</span>
          </div>
          <div class="count-select" @click.stop>
            <span class="count-label">抽取数量</span>
            <el-select v-model="item.selected" size="small" class="dark-select">
              <el-option
                v-for="n in item.options"
                :key="n"
                :label="n === item.pool ? `全部 (${n})` : `${n} 道`"
                :value="n"
              />
            </el-select>
          </div>
          <button class="start-btn" @click="startQuiz(item.key, item.selected)">
            <span>开始答题</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 3L11 8L6 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div class="footer-hint">
      <span>共 {{ totalQuestions }} 道题目</span>
      <span class="dot-sep"></span>
      <span>涵盖 JavaScript / Vue 2 / Vue 3</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuizStore, getPoolSize } from '../stores/quiz'
import type { Category } from '../types'

const router = useRouter()
const store = useQuizStore()

function buildOptions(pool: number): number[] {
  const opts = [5, 10, 15, 20].filter((n) => n < pool)
  opts.push(pool)
  return opts
}

const categories = reactive([
  { key: 'javascript' as Category, name: 'JavaScript', icon: 'JS', desc: '闭包、原型链、Promise、Event Loop 等核心知识', pool: getPoolSize('javascript'), options: buildOptions(getPoolSize('javascript')), selected: Math.min(10, getPoolSize('javascript')) },
  { key: 'vue2' as Category, name: 'Vue 2', icon: 'V2', desc: '生命周期、响应式原理、组件通信等', pool: getPoolSize('vue2'), options: buildOptions(getPoolSize('vue2')), selected: Math.min(10, getPoolSize('vue2')) },
  { key: 'vue3' as Category, name: 'Vue 3', icon: 'V3', desc: 'Composition API、ref/reactive、Teleport 等新特性', pool: getPoolSize('vue3'), options: buildOptions(getPoolSize('vue3')), selected: Math.min(10, getPoolSize('vue3')) },
])

const totalQuestions = computed(() => categories.reduce((sum, c) => sum + c.pool, 0))

function startQuiz(category: Category, count: number) {
  store.startQuiz(category, count)
  router.push(`/quiz/${category}`)
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
  grid-template-columns: repeat(3, 1fr);
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

.card-content {
  position: relative;
  padding: 32px 24px 24px;
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

/* Start Button */
.start-btn {
  width: 100%;
  padding: 12px 20px;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--gradient-primary);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
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
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
</style>
