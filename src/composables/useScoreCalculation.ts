import { computed, type Ref } from 'vue'
import type { Question } from '../types'

export function useScoreCalculation(
  score: Ref<number>,
  total: Ref<number>
) {
  const scoreRate = computed(() => score.value / total.value)
  
  const scoreClass = computed(() => {
    if (scoreRate.value >= 0.8) return 'excellent'
    if (scoreRate.value >= 0.6) return 'good'
    return 'poor'
  })

  const ringColor = computed(() => {
    if (scoreRate.value >= 0.8) return '#34d399'
    if (scoreRate.value >= 0.6) return '#fbbf24'
    return '#fb7185'
  })

  const scoreText = computed(() => {
    if (scoreRate.value >= 0.9) return '太棒了！你是前端大神！'
    if (scoreRate.value >= 0.8) return '优秀！基础非常扎实！'
    if (scoreRate.value >= 0.6) return '不错，继续加油！'
    return '还需要多多练习哦~'
  })

  return { scoreRate, scoreClass, ringColor, scoreText }
}

export function useAnswerValidation(
  userAnswers: Ref<Record<number, number | number[]>>
) {
  function isCorrect(q: Question): boolean {
    const ua = userAnswers.value[q.id]
    if (ua === undefined) return false
    if (q.type === 'single') return ua === q.answer
    const ans = q.answer as number[]
    const user = ua as number[]
    return ans.length === user.length && ans.every((a) => user.includes(a))
  }

  function isAnswer(q: Question, optIndex: number): boolean {
    if (q.type === 'single') return q.answer === optIndex
    return (q.answer as number[]).includes(optIndex)
  }

  function isUserWrong(q: Question, optIndex: number): boolean {
    const ua = userAnswers.value[q.id]
    if (ua === undefined) return false
    const selected = q.type === 'single' ? ua === optIndex : (ua as number[]).includes(optIndex)
    return selected && !isAnswer(q, optIndex)
  }

  function isUserCorrect(q: Question, optIndex: number): boolean {
    const ua = userAnswers.value[q.id]
    if (ua === undefined) return false
    const selected = q.type === 'single' ? ua === optIndex : (ua as number[]).includes(optIndex)
    return selected && isAnswer(q, optIndex)
  }

  return { isCorrect, isAnswer, isUserWrong, isUserCorrect }
}
