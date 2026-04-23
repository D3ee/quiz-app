/**
 * Quiz Store - 答题系统核心状态管理
 * 使用 Pinia Composition API 风格定义
 * 管理答题流程、错题本、答题历史、收藏等所有核心状态
 * 通过 pinia-plugin-persistedstate 将关键数据持久化到 localStorage
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Question, Category, QuizMode, WrongRecord, QuizHistory } from '../types'
import { javascriptQuestions } from '../data/javascript'
import { vue2Questions } from '../data/vue2'
import { vue3Questions } from '../data/vue3'
import { miniprogramQuestions } from '../data/miniprogram'

/** 题库池：按分类索引所有题目 */
const questionPool: Record<Category, Question[]> = {
  javascript: javascriptQuestions,
  vue2: vue2Questions,
  vue3: vue3Questions,
  miniprogram: miniprogramQuestions,
}

/** 获取指定分类的题库总数 */
export function getPoolSize(category: Category): number {
  return questionPool[category].length
}

/**
 * Fisher-Yates 洗牌算法
 * 将数组随机打乱顺序，返回新数组（不修改原数组）
 */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const useQuizStore = defineStore('quiz', () => {
  // ==================== 核心答题状态 ====================
  const currentCategory = ref<Category>('javascript')  // 当前答题分类
  const currentIndex = ref(0)                           // 当前题目索引
  const userAnswers = ref<Record<string, number | number[]>>({}) // 用户作答记录 { 题目ID: 答案 }
  const submitted = ref(false)                          // 是否已提交答卷
  const questions = ref<Question[]>([])                 // 当前答题的题目列表
  const startTime = ref(0)                              // 答题开始时间戳
  const endTime = ref(0)                                // 答题结束时间戳
  // 已抽过的题目ID记录（按分类），用于随机模式避免重复抽题
  const usedQuestionIds = ref<Record<Category, string[]>>({
    javascript: [],
    vue2: [],
    vue3: [],
    miniprogram: [],
  })

  // ==================== 答题模式相关 ====================
  const currentMode = ref<QuizMode>('random')           // 当前答题模式
  const timeLimitPerQuestion = ref(30)                  // 限时模式 - 每题限时（秒）
  const challengeFailed = ref(false)                    // 闯关模式 - 是否已失败（答错即止）
  const challengeStreak = ref(0)                        // 闯关模式 - 连续答对题数

  // ==================== 持久化数据 ====================
  const wrongRecords = ref<WrongRecord[]>([])           // 错题本记录
  const quizHistory = ref<QuizHistory[]>([])            // 答题历史记录
  const favoriteIds = ref<string[]>([])                 // 收藏的题目ID列表

  // ==================== 计算属性 ====================
  /** 当前题目对象 */
  const currentQuestion = computed(() => questions.value[currentIndex.value])
  /** 当前答题总题数 */
  const total = computed(() => questions.value.length)

  /** 计算正确题数：遍历所有题目，比对用户答案与正确答案 */
  const score = computed(() => {
    let correct = 0
    questions.value.forEach((q) => {
      const ua = userAnswers.value[q.id]
      if (ua === undefined) return
      if (q.type === 'single') {
        // 单选题：直接比较答案索引
        if (ua === q.answer) correct++
      } else {
        // 多选题：比较数组长度和每个元素是否匹配
        const ans = q.answer as number[]
        const user = ua as number[]
        if (ans.length === user.length && ans.every((a) => user.includes(a))) correct++
      }
    })
    return correct
  })

  /**
   * 开始答题
   * @param category - 题目分类
   * @param count - 抽取题目数量（可选，不传则使用全部）
   * @param mode - 答题模式，默认随机
   */
function startQuiz(category: Category, count?: number, mode: QuizMode = 'random') {
    // 重置答题状态
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
      // 顺序模式：按题目原始顺序（题目文件中的顺序）
      questions.value = count ? allQuestions.slice(0, count) : [...allQuestions]
      return
    }
    
    if (mode === 'challenge') {
      // 闯关模式：随机打乱全部题目，不过滤已做过的
      const shuffled = shuffle([...allQuestions])
      questions.value = shuffled
      return
    }
    
    // ===== 随机/限时模式：避免重复抽题 =====
    const usedIds = new Set<string>(usedQuestionIds.value[category])
    
    // 过滤出未抽过的题目
    let availableQuestions = allQuestions.filter(q => !usedIds.has(q.id))
    
    // 如果题库已全部抽完，清空记录重新开始
    if (availableQuestions.length === 0) {
      usedQuestionIds.value[category] = []
      availableQuestions = [...allQuestions]
    }
    
    // 随机打乱并按需截取指定数量
    const shuffled = shuffle(availableQuestions)
    const selected = count ? shuffled.slice(0, Math.min(count, shuffled.length)) : shuffled
    questions.value = selected
    
    // 记录本次抽取的题目ID，下次抽题时排除
    usedQuestionIds.value[category] = [...usedQuestionIds.value[category], ...selected.map(q => q.id)]
  }

  /**
   * 从错题本开始答题
   * @param category - 可选，指定分类的错题；不传则使用全部错题
   * @returns 是否成功开始（无错题时返回 false）
   */
  function startWrongQuiz(category?: Category) {
    let records = wrongRecords.value
    if (category) records = records.filter(r => r.category === category)
    if (records.length === 0) return false

    // 从所有题库中查找错题对应的完整题目信息
    const ids = records.map(r => r.questionId)
    const allQ: Question[] = [
      ...questionPool.javascript,
      ...questionPool.vue2,
      ...questionPool.vue3,
      ...questionPool.miniprogram,
    ]
    const selected = allQ.filter(q => ids.includes(q.id))
    if (selected.length === 0) return false

    // 重置答题状态并随机打乱错题顺序
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

  /** 记录用户对某题的作答 */
  function setAnswer(questionId: string, answer: number | number[]) {
    userAnswers.value[questionId] = answer
  }

  /** 切换到下一题 */
  function nextQuestion() {
    if (currentIndex.value < total.value - 1) currentIndex.value++
  }

  /** 切换到上一题 */
  function prevQuestion() {
    if (currentIndex.value > 0) currentIndex.value--
  }

  /** 提交答卷：标记完成、记录结束时间、收集错题、保存历史 */
  function submit() {
    submitted.value = true
    endTime.value = Date.now()
    collectWrongAnswers()
    saveHistory()
  }

  /**
   * 收集错题：遍历本次答题的所有题目
   * - 答错的题目加入/更新错题本
   * - 之前答错但本次答对的题目从错题本移除
   */
  function collectWrongAnswers() {
    questions.value.forEach((q) => {
      const ua = userAnswers.value[q.id]
      if (ua === undefined) return
      // 判断用户答案是否正确
      const correct = q.type === 'single'
        ? ua === q.answer
        : (() => { const ans = q.answer as number[]; const user = ua as number[]; return ans.length === user.length && ans.every(a => user.includes(a)) })()
      
      if (!correct) {
        // 答错：更新已有错题记录或新增
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
        // 答对了：如果之前在错题本中则移除（说明已掌握）
        const idx = wrongRecords.value.findIndex(r => r.questionId === q.id)
        if (idx >= 0) wrongRecords.value.splice(idx, 1)
      }
    })
  }

  /** 保存本次答题历史记录，最多保留 50 条 */
  function saveHistory() {
    const elapsed = endTime.value && startTime.value ? Math.floor((endTime.value - startTime.value) / 1000) : 0
    quizHistory.value.unshift({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), // 生成唯一ID
      category: currentCategory.value,
      mode: currentMode.value,
      totalCount: total.value,
      correctCount: score.value,
      scoreRate: total.value > 0 ? score.value / total.value : 0,
      timeUsed: elapsed,
      date: Date.now(),
    })
    // 限制历史记录最多 50 条，超出则截断
    if (quizHistory.value.length > 50) quizHistory.value = quizHistory.value.slice(0, 50)
  }

  /**
   * 获取错题数量
   * @param category - 可选，指定分类；不传则返回全部错题数
   */
  function getWrongCount(category?: Category): number {
    if (category) return wrongRecords.value.filter(r => r.category === category).length
    return wrongRecords.value.length
  }

  /** 清空错题记录，可按分类清空或全部清空 */
  function clearWrongRecords(category?: Category) {
    if (category) {
      wrongRecords.value = wrongRecords.value.filter(r => r.category !== category)
    } else {
      wrongRecords.value = []
    }
  }

  /** 切换题目收藏状态（已收藏则取消，未收藏则添加） */
  function toggleFavorite(questionId: string) {
    const idx = favoriteIds.value.indexOf(questionId)
    if (idx >= 0) {
      favoriteIds.value.splice(idx, 1)
    } else {
      favoriteIds.value.push(questionId)
    }
  }

  /** 判断题目是否已收藏 */
  function isFavorite(questionId: string): boolean {
    return favoriteIds.value.includes(questionId)
  }

  /**
   * 从收藏题目开始答题
   * @param category - 可选，指定分类的收藏题
   * @returns 是否成功开始（无收藏题时返回 false）
   */
  function startFavoriteQuiz(category?: Category) {
    // 从所有题库中查找收藏的题目
    const allQ: Question[] = [
      ...questionPool.javascript,
      ...questionPool.vue2,
      ...questionPool.vue3,
      ...questionPool.miniprogram,
    ]
    let selected = allQ.filter(q => favoriteIds.value.includes(q.id))
    if (category) selected = selected.filter(q => q.category === category)
    if (selected.length === 0) return false

    // 重置答题状态并随机打乱
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

  /** 闯关模式：标记答错失败，记录结束时间 */
  function challengeFailAt() {
    challengeFailed.value = true
    endTime.value = Date.now()
  }

  /** 清空所有答题历史记录 */
  function clearHistory() {
    quizHistory.value = []
  }

  // ==================== 导出所有状态和方法 ====================
  return {
    // 状态
    currentCategory, currentIndex, userAnswers, submitted,
    questions, currentQuestion, total, score, usedQuestionIds, startTime, endTime,
    currentMode, timeLimitPerQuestion, challengeFailed, challengeStreak,
    wrongRecords, quizHistory, favoriteIds,
    // 方法
    startQuiz, startWrongQuiz, setAnswer, nextQuestion, prevQuestion, submit,
    collectWrongAnswers, getWrongCount, clearWrongRecords,
    toggleFavorite, isFavorite, startFavoriteQuiz,
    challengeFailAt, saveHistory, clearHistory,
  }
}, {
  // Pinia 持久化配置：指定需要持久化到 localStorage 的字段
  persist: {
    pick: [
      'usedQuestionIds', 'currentCategory', 'currentIndex', 'questions',
      'userAnswers', 'submitted', 'startTime', 'endTime', 'currentMode',
      'wrongRecords', 'quizHistory', 'favoriteIds',
      'challengeFailed', 'challengeStreak',
    ],
  },
})
