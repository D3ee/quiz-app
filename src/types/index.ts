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

export interface UserAnswer {
  questionId: number
  answer: number | number[]
}
