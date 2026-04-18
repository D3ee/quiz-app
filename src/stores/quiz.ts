import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Question, Category } from '../types'
import { javascriptQuestions } from '../data/javascript'
import { vue2Questions } from '../data/vue2'
import { vue3Questions } from '../data/vue3'

const questionPool: Record<Category, Question[]> = {
  javascript: javascriptQuestions,
  vue2: vue2Questions,
  vue3: vue3Questions,
}

export function getPoolSize(category: Category): number {
  return questionPool[category].length
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const useQuizStore = defineStore('quiz', () => {
  const currentCategory = ref<Category>('javascript')
  const currentIndex = ref(0)
  const userAnswers = ref<Record<number, number | number[]>>({})
  const submitted = ref(false)
  const questions = ref<Question[]>([])
  const startTime = ref(0)
  const usedQuestionIds = ref<Record<Category, number[]>>({
    javascript: [],
    vue2: [],
    vue3: [],
  })

  const currentQuestion = computed(() => questions.value[currentIndex.value])
  const total = computed(() => questions.value.length)

  const score = computed(() => {
    let correct = 0
    questions.value.forEach((q) => {
      const ua = userAnswers.value[q.id]
      if (ua === undefined) return
      if (q.type === 'single') {
        if (ua === q.answer) correct++
      } else {
        const ans = q.answer as number[]
        const user = ua as number[]
        if (ans.length === user.length && ans.every((a) => user.includes(a))) correct++
      }
    })
    return correct
  })

function startQuiz(category: Category, count?: number) {
    currentCategory.value = category
    currentIndex.value = 0
    userAnswers.value = {}
    submitted.value = false
    startTime.value = Date.now()
    
    const allQuestions = questionPool[category]
    const usedIds = new Set(usedQuestionIds.value[category])
    
    // 过滤出未抽过的题目
    let availableQuestions = allQuestions.filter(q => !usedIds.has(q.id))
    
    // 如果题库已抽完,清空记录重新开始
    if (availableQuestions.length === 0) {
      usedQuestionIds.value[category] = []
      availableQuestions = [...allQuestions]
    }
    
    // 随机打乱并选择题目
    const shuffled = shuffle(availableQuestions)
    const selected = count ? shuffled.slice(0, Math.min(count, shuffled.length)) : shuffled
    questions.value = selected
    
    // 记录本次抽取的题目ID
    usedQuestionIds.value[category] = [...usedQuestionIds.value[category], ...selected.map(q => q.id)]
  }

  function setAnswer(questionId: number, answer: number | number[]) {
    userAnswers.value[questionId] = answer
  }

  function nextQuestion() {
    if (currentIndex.value < total.value - 1) currentIndex.value++
  }

  function prevQuestion() {
    if (currentIndex.value > 0) currentIndex.value--
  }

  function submit() {
    submitted.value = true
  }

  return {
    currentCategory, currentIndex, userAnswers, submitted,
    questions, currentQuestion, total, score, usedQuestionIds, startTime,
    startQuiz, setAnswer, nextQuestion, prevQuestion, submit,
  }
}, {
  persist: {
    paths: ['usedQuestionIds', 'currentCategory', 'currentIndex', 'questions', 'userAnswers', 'submitted', 'startTime'],
  } as any,
})
