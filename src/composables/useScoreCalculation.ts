/**
 * 分数计算与展示相关的组合式函数
 */
import { computed, type Ref } from 'vue'
import type { Question } from '../types'

/**
 * 分数计算 - 根据得分和总数计算正确率、评级、颜色和评语
 * @param score - 正确题数（响应式引用）
 * @param total - 总题数（响应式引用）
 */
export function useScoreCalculation(
  score: Ref<number>,
  total: Ref<number>
) {
  /** 正确率（0-1） */
  const scoreRate = computed(() => score.value / total.value)
  
  /** 评级样式类名：excellent(≥80%) / good(≥60%) / poor(<60%) */
  const scoreClass = computed(() => {
    if (scoreRate.value >= 0.8) return 'excellent'
    if (scoreRate.value >= 0.6) return 'good'
    return 'poor'
  })

  /** 环形进度条颜色：绿色(≥80%) / 黄色(≥60%) / 红色(<60%) */
  const ringColor = computed(() => {
    if (scoreRate.value >= 0.8) return '#34d399'
    if (scoreRate.value >= 0.6) return '#fbbf24'
    return '#fb7185'
  })

  /** 根据正确率显示不同的鼓励文案 */
  const scoreText = computed(() => {
    if (scoreRate.value >= 0.9) return '太棒了！你是前端大神！'
    if (scoreRate.value >= 0.8) return '优秀！基础非常扎实！'
    if (scoreRate.value >= 0.6) return '不错，继续加油！'
    return '还需要多多练习哦~'
  })

  return { scoreRate, scoreClass, ringColor, scoreText }
}

/**
 * 答案校验 - 提供判断答案正确性的工具函数
 * @param userAnswers - 用户作答记录（响应式引用）
 */
export function useAnswerValidation(
  userAnswers: Ref<Record<number, number | number[]>>
) {
  /** 判断用户对某题的回答是否正确 */
  function isCorrect(q: Question): boolean {
    const ua = userAnswers.value[q.id]
    if (ua === undefined) return false
    if (q.type === 'single') return ua === q.answer
    const ans = q.answer as number[]
    const user = ua as number[]
    return ans.length === user.length && ans.every((a) => user.includes(a))
  }

  /** 判断某选项是否为正确答案 */
  function isAnswer(q: Question, optIndex: number): boolean {
    if (q.type === 'single') return q.answer === optIndex
    return (q.answer as number[]).includes(optIndex)
  }

  /** 判断某选项是否为用户的错误选择（选了但不是正确答案） */
  function isUserWrong(q: Question, optIndex: number): boolean {
    const ua = userAnswers.value[q.id]
    if (ua === undefined) return false
    const selected = q.type === 'single' ? ua === optIndex : (ua as number[]).includes(optIndex)
    return selected && !isAnswer(q, optIndex)
  }

  /** 判断某选项是否为用户的正确选择（选了且是正确答案） */
  function isUserCorrect(q: Question, optIndex: number): boolean {
    const ua = userAnswers.value[q.id]
    if (ua === undefined) return false
    const selected = q.type === 'single' ? ua === optIndex : (ua as number[]).includes(optIndex)
    return selected && isAnswer(q, optIndex)
  }

  return { isCorrect, isAnswer, isUserWrong, isUserCorrect }
}
