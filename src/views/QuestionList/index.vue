<template>
  <div class="question-list">
    <div class="header">
      <button class="back-btn" @click="router.push('/')">← 返回</button>
      <h1>{{ categoryName }} 题库</h1>
      <div class="stats">共 {{ allQuestions.length }} 题</div>
    </div>

    <div class="filters">
      <select v-model="filterType" class="filter-select">
        <option value="all">全部题型</option>
        <option value="single">单选题</option>
        <option value="multiple">多选题</option>
        <option value="judge">判断题</option>
        <option value="fill">填空题</option>
        <option value="short">简答题</option>
        <option value="code">代码题</option>
        <option value="order">排序题</option>
      </select>
      <select v-model="sortOrder" class="filter-select">
        <option value="asc">正序</option>
        <option value="desc">倒序</option>
      </select>
    </div>

    <div class="questions">
      <div 
        v-for="(q, idx) in filteredQuestions" 
        :key="q.id"
        class="question-item"
        @click="startFromQuestion(idx)"
      >
        <div class="q-header">
          <span class="q-number">{{ idx + 1 }}</span>
          <span class="q-type" :class="`type-${q.type}`">{{ getTypeLabel(q.type) }}</span>
        </div>
        <div class="q-content">{{ getQuestionText(q.question) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuizStore } from '../../stores/quiz'
import { javascriptQuestions } from '../../data/javascript'
import { vue2Questions } from '../../data/vue2'
import { vue3Questions } from '../../data/vue3'
import { miniprogramQuestions } from '../../data/miniprogram'
import { advancedQuestions } from '../../data/advanced'
import type { Category, QuestionType, Question } from '../../types'

const router = useRouter()
const route = useRoute()
const store = useQuizStore()

const category = route.params.category as Category

const questionPool: Record<Category, Question[]> = {
  javascript: [...javascriptQuestions, ...advancedQuestions.filter(q => q.category === 'javascript')],
  vue2: [...vue2Questions, ...advancedQuestions.filter(q => q.category === 'vue2')],
  vue3: [...vue3Questions, ...advancedQuestions.filter(q => q.category === 'vue3')],
  miniprogram: miniprogramQuestions,
}

const allQuestions = questionPool[category]
const filterType = ref<QuestionType | 'all'>('all')
const sortOrder = ref<'asc' | 'desc'>('asc')

const categoryName = computed(() => {
  const map = { javascript: 'JavaScript', vue2: 'Vue 2', vue3: 'Vue 3', miniprogram: '小程序' }
  return map[category]
})

const filteredQuestions = computed(() => {
  let questions = filterType.value === 'all' ? allQuestions : allQuestions.filter(q => q.type === filterType.value)
  return sortOrder.value === 'desc' ? [...questions].reverse() : questions
})

function getTypeLabel(type: QuestionType): string {
  const map = { single: '单选', multiple: '多选', judge: '判断', fill: '填空', short: '简答', code: '代码', order: '排序' }
  return map[type] || '未知'
}

function getQuestionText(text: string): string {
  return text.replace(/```[\s\S]*?```/g, '[代码]').replace(/`([^`]+)`/g, '$1').substring(0, 100)
}

function startFromQuestion(index: number) {
  store.startQuiz(category, undefined, 'sequential')
  const actualIndex = sortOrder.value === 'desc' 
    ? (filterType.value === 'all' ? allQuestions.length : allQuestions.filter(q => q.type === filterType.value).length) - 1 - index
    : index
  store.currentIndex = actualIndex
  router.push(`/quiz/${category}`)
}
</script>

<style scoped>
.question-list {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  padding: 20px;
}

.header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
  color: white;
}

.back-btn {
  padding: 8px 16px;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 8px;
  color: #818cf8;
  cursor: pointer;
  font-size: 14px;
}

.back-btn:hover {
  background: rgba(99, 102, 241, 0.2);
}

h1 {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
}

.stats {
  margin-left: auto;
  font-size: 14px;
  color: #94a3b8;
}

.filters {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.filter-select {
  padding: 10px 16px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  cursor: pointer;
}

.questions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.question-item {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.question-item:hover {
  background: rgba(30, 41, 59, 0.8);
  border-color: rgba(99, 102, 241, 0.3);
  transform: translateX(4px);
}

.q-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.q-number {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: rgba(99, 102, 241, 0.1);
  color: #818cf8;
  font-weight: 700;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.q-type {
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}

.type-single { background: rgba(99, 102, 241, 0.12); color: #818cf8; }
.type-multiple { background: rgba(251, 191, 36, 0.12); color: #fbbf24; }
.type-judge { background: rgba(139, 92, 246, 0.12); color: #a78bfa; }
.type-fill { background: rgba(236, 72, 153, 0.12); color: #ec4899; }
.type-short { background: rgba(14, 165, 233, 0.12); color: #0ea5e9; }
.type-code { background: rgba(34, 197, 94, 0.12); color: #22c55e; }
.type-order { background: rgba(249, 115, 22, 0.12); color: #f97316; }

.q-content {
  font-size: 14px;
  line-height: 1.6;
  color: #cbd5e1;
}
</style>
