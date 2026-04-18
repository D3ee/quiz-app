import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Question, Category, QuizMode, WrongRecord, QuizHistory } from '../types'
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
  const endTime = ref(0)
  const usedQuestionIds = ref<Record<Category, number[]>>({
    javascript: [],
    vue2: [],
    vue3: [],
  })

  // 答题模式
  const currentMode = ref<QuizMode>('random')
  // 限时模式 - 每题限时(秒)
  const timeLimitPerQuestion = ref(30)
  // 闯关模式 - 是否已失败
  const challengeFailed = ref(false)
  // 闯关模式 - 连对数
  const challengeStreak = ref(0)

  // 错题本
  const wrongRecords = ref<WrongRecord[]>([])
  // 答题历史
  const quizHistory = ref<QuizHistory[]>([])
  // 收藏题目
  const favoriteIds = ref<number[]>([])

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

function startQuiz(category: Category, count?: number, mode: QuizMode = 'random') {
    currentCategory.value = category
    currentIndex.value = 0
    userAnswers.value = {}
    submitted.value = false
    startTime.value = Date.now()
    endTime.value = 0
    currentMode.value = mode
    challengeFailed.value = false
    challengeStreak.value = 0
    
    const allQuestions = questionPool[category]
    
    if (mode === 'sequential') {
      // 顺序模式：按ID顺序
      const sorted = [...allQuestions].sort((a, b) => a.id - b.id)
      questions.value = count ? sorted.slice(0, count) : sorted
      return
    }
    
    // 闯关模式：使用全部题目，不过滤已做过的
    if (mode === 'challenge') {
      const shuffled = shuffle([...allQuestions])
      questions.value = shuffled
      return
    }
    
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

  // 错题本：从错题中开始答题
  function startWrongQuiz(category?: Category) {
    let records = wrongRecords.value
    if (category) records = records.filter(r => r.category === category)
    if (records.length === 0) return false

    const ids = records.map(r => r.questionId)
    const allQ: Question[] = [
      ...questionPool.javascript,
      ...questionPool.vue2,
      ...questionPool.vue3,
    ]
    const selected = allQ.filter(q => ids.includes(q.id))
    if (selected.length === 0) return false

    currentCategory.value = category || selected[0].category
    currentIndex.value = 0
    userAnswers.value = {}
    submitted.value = false
    startTime.value = Date.now()
    endTime.value = 0
    currentMode.value = 'random'
    questions.value = shuffle(selected)
    return true
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
    endTime.value = Date.now()
    collectWrongAnswers()
    saveHistory()
  }

  // 收集错题
  function collectWrongAnswers() {
    questions.value.forEach((q) => {
      const ua = userAnswers.value[q.id]
      if (ua === undefined) return
      const correct = q.type === 'single'
        ? ua === q.answer
        : (() => { const ans = q.answer as number[]; const user = ua as number[]; return ans.length === user.length && ans.every(a => user.includes(a)) })()
      
      if (!correct) {
        const existing = wrongRecords.value.find(r => r.questionId === q.id)
        if (existing) {
          existing.userAnswer = ua
          existing.wrongCount++
          existing.lastWrongTime = Date.now()
        } else {
          wrongRecords.value.push({
            questionId: q.id,
            category: q.category,
            userAnswer: ua,
            wrongCount: 1,
            lastWrongTime: Date.now(),
          })
        }
      } else {
        // 答对了就从错题本移除
        const idx = wrongRecords.value.findIndex(r => r.questionId === q.id)
        if (idx >= 0) wrongRecords.value.splice(idx, 1)
      }
    })
  }

  // 保存答题历史
  function saveHistory() {
    const elapsed = endTime.value && startTime.value ? Math.floor((endTime.value - startTime.value) / 1000) : 0
    quizHistory.value.unshift({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      category: currentCategory.value,
      mode: currentMode.value,
      totalCount: total.value,
      correctCount: score.value,
      scoreRate: total.value > 0 ? score.value / total.value : 0,
      timeUsed: elapsed,
      date: Date.now(),
    })
    // 最多保留 50 条
    if (quizHistory.value.length > 50) quizHistory.value = quizHistory.value.slice(0, 50)
  }

  // 错题本相关
  function getWrongCount(category?: Category): number {
    if (category) return wrongRecords.value.filter(r => r.category === category).length
    return wrongRecords.value.length
  }

  function clearWrongRecords(category?: Category) {
    if (category) {
      wrongRecords.value = wrongRecords.value.filter(r => r.category !== category)
    } else {
      wrongRecords.value = []
    }
  }

  // 收藏相关
  function toggleFavorite(questionId: number) {
    const idx = favoriteIds.value.indexOf(questionId)
    if (idx >= 0) {
      favoriteIds.value.splice(idx, 1)
    } else {
      favoriteIds.value.push(questionId)
    }
  }

  function isFavorite(questionId: number): boolean {
    return favoriteIds.value.includes(questionId)
  }

  function startFavoriteQuiz(category?: Category) {
    const allQ: Question[] = [
      ...questionPool.javascript,
      ...questionPool.vue2,
      ...questionPool.vue3,
    ]
    let selected = allQ.filter(q => favoriteIds.value.includes(q.id))
    if (category) selected = selected.filter(q => q.category === category)
    if (selected.length === 0) return false

    currentCategory.value = category || selected[0].category
    currentIndex.value = 0
    userAnswers.value = {}
    submitted.value = false
    startTime.value = Date.now()
    endTime.value = 0
    currentMode.value = 'random'
    questions.value = shuffle(selected)
    return true
  }

  // 闯关模式：答错时调用
  function challengeFailAt() {
    challengeFailed.value = true
    endTime.value = Date.now()
  }

  // 清除历史
  function clearHistory() {
    quizHistory.value = []
  }

  return {
    currentCategory, currentIndex, userAnswers, submitted,
    questions, currentQuestion, total, score, usedQuestionIds, startTime, endTime,
    currentMode, timeLimitPerQuestion, challengeFailed, challengeStreak,
    wrongRecords, quizHistory, favoriteIds,
    startQuiz, startWrongQuiz, setAnswer, nextQuestion, prevQuestion, submit,
    collectWrongAnswers, getWrongCount, clearWrongRecords,
    toggleFavorite, isFavorite, startFavoriteQuiz,
    challengeFailAt, saveHistory, clearHistory,
  }
}, {
  persist: {
    pick: [
      'usedQuestionIds', 'currentCategory', 'currentIndex', 'questions',
      'userAnswers', 'submitted', 'startTime', 'endTime', 'currentMode',
      'wrongRecords', 'quizHistory', 'favoriteIds',
      'challengeFailed', 'challengeStreak',
    ],
  },
})
