/**
 * 全局类型定义
 * 定义答题系统中所有核心数据结构
 */

/** 题目接口 */
export interface Question {
  id: string                                    // 题目唯一标识（格式：数字-分类，如 "1-javascript"）
  type: 'single' | 'multiple'                   // 题型：单选 | 多选
  category: 'javascript' | 'vue2' | 'vue3' | 'miniprogram'      // 所属分类
  question: string                               // 题目文本（支持 Markdown 代码块）
  options: string[]                              // 选项列表（最多4个）
  answer: number | number[]                      // 正确答案索引（单选为数字，多选为数组）
  explanation: string                            // 答案解析
}

/** 题目分类类型 */
export type Category = Question['category']

/** 答题模式类型：随机 | 限时 | 闯关 | 顺序 */
export type QuizMode = 'random' | 'timed' | 'challenge' | 'sequential'

/** 用户作答记录 */
export interface UserAnswer {
  questionId: string                             // 题目ID
  answer: number | number[]                      // 用户选择的答案索引
}

/** 错题记录 */
export interface WrongRecord {
  questionId: string                             // 题目ID
  category: Category                             // 所属分类
  userAnswer: number | number[]                  // 用户的错误答案
  wrongCount: number                             // 累计答错次数
  lastWrongTime: number                          // 最近一次答错的时间戳
}

/** 答题历史记录 */
export interface QuizHistory {
  id: string                                     // 记录唯一标识（时间戳+随机数）
  category: Category                             // 答题分类
  mode: QuizMode                                 // 答题模式
  totalCount: number                             // 总题数
  correctCount: number                           // 正确题数
  scoreRate: number                              // 正确率（0-1）
  timeUsed: number                               // 用时（秒）
  date: number                                   // 答题日期时间戳
}
