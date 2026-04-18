export interface Question {
  id: number
  type: 'single' | 'multiple'
  category: 'javascript' | 'vue2' | 'vue3'
  question: string
  options: string[]
  answer: number | number[]
  explanation: string
}

export type Category = Question['category']

export type QuizMode = 'random' | 'timed' | 'challenge' | 'sequential'

export interface UserAnswer {
  questionId: number
  answer: number | number[]
}

export interface WrongRecord {
  questionId: number
  category: Category
  userAnswer: number | number[]
  wrongCount: number
  lastWrongTime: number
}

export interface QuizHistory {
  id: string
  category: Category
  mode: QuizMode
  totalCount: number
  correctCount: number
  scoreRate: number
  timeUsed: number
  date: number
}
