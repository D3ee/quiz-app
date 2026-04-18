<!--
  AnalysisCard 组件 - 答题解析卡片
  用于结果页展示每道题的详细解析，包括：
  - 题目序号、正确/错误标记、题型标签
  - 题目文本（支持代码高亮）
  - 各选项的正确答案/用户选择标注
  - 答案解析说明
-->
<template>
  <!-- 根据答题正确与否添加不同的左边框颜色 -->
  <div class="analysis-card" :class="{ correct: isCorrect, wrong: !isCorrect }">
    <!-- 头部：题号 + 正确/错误标签 + 题型标签 -->
    <div class="analysis-header">
      <span class="q-number">{{ index + 1 }}</span>
      <span class="result-badge" :class="isCorrect ? 'badge-correct' : 'badge-wrong'">
        {{ isCorrect ? '正确' : '错误' }}
      </span>
      <span class="type-badge" :class="question.type === 'single' ? 'badge-single' : 'badge-multi'">
        {{ question.type === 'single' ? '单选' : '多选' }}
      </span>
    </div>
    <!-- 题目文本（v-html 渲染 Markdown 代码块） -->
    <div class="q-text" v-html="renderedQuestion"></div>
    <!-- 选项列表：标注正确答案和用户选择 -->
    <div class="options-review">
      <div 
        v-for="(opt, oi) in question.options" 
        :key="oi" 
        class="option-review" 
        :class="{ 
          'is-answer': isAnswer(question, oi), 
          'is-user-wrong': isUserWrong(question, oi), 
          'is-user-correct': isUserCorrect(question, oi) 
        }"
      >
        <span class="opt-letter">{{ labels[oi] }}</span>
        <span class="opt-text">{{ opt }}</span>
        <span v-if="isAnswer(question, oi)" class="opt-tag tag-correct">正确答案</span>
        <span v-if="isUserWrong(question, oi)" class="opt-tag tag-wrong">你的选择</span>
        <span v-if="isUserCorrect(question, oi)" class="opt-tag tag-right">你的选择</span>
      </div>
    </div>
    <!-- 答案解析 -->
    <div class="explanation-box">
      <div class="explanation-label">解析</div>
      <div class="explanation-text">{{ question.explanation }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Question } from '../types'
import { useQuestionRenderer } from '../composables/useQuestionRenderer'

/** 组件 Props */
const props = defineProps<{
  question: Question                                              // 题目数据
  index: number                                                   // 题目序号（从0开始）
  isCorrect: boolean                                              // 用户是否答对
  isAnswer: (q: Question, optIndex: number) => boolean            // 判断某选项是否为正确答案
  isUserWrong: (q: Question, optIndex: number) => boolean         // 判断某选项是否为用户的错误选择
  isUserCorrect: (q: Question, optIndex: number) => boolean       // 判断某选项是否为用户的正确选择
}>()

const labels = ['A', 'B', 'C', 'D'] // 选项字母标签
const { renderQuestion } = useQuestionRenderer()

/** 将题目文本渲染为 HTML（处理代码块等） */
const renderedQuestion = computed(() => renderQuestion(props.question.question))
</script>

<style scoped>
.analysis-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 24px;
  margin-bottom: 16px;
  backdrop-filter: blur(12px);
  border-left: 3px solid var(--border-subtle);
}
.analysis-card.correct { border-left-color: var(--accent-emerald); }
.analysis-card.wrong { border-left-color: var(--accent-rose); }

.analysis-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}
.q-number {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: rgba(99, 102, 241, 0.1);
  color: var(--accent-indigo);
  font-weight: 700;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.result-badge, .type-badge {
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}
.badge-correct { background: rgba(52, 211, 153, 0.12); color: var(--accent-emerald); }
.badge-wrong { background: rgba(251, 113, 133, 0.12); color: var(--accent-rose); }
.badge-single { background: rgba(99, 102, 241, 0.12); color: var(--accent-indigo); }
.badge-multi { background: rgba(251, 191, 36, 0.12); color: var(--accent-amber); }

.q-text {
  font-size: 15px;
  line-height: 1.8;
  color: var(--text-primary);
  margin-bottom: 16px;
}
.q-text :deep(pre) {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-subtle);
  padding: 14px 16px;
  border-radius: var(--radius-sm);
  overflow-x: auto;
  margin: 8px 0;
}
.q-text :deep(code) {
  font-family: 'Fira Code', Consolas, monospace;
  font-size: 13px;
  color: var(--accent-cyan);
}
.q-text :deep(.inline-code) {
  background: rgba(99, 102, 241, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
  color: var(--accent-indigo);
}

.options-review {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}
.option-review {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  background: rgba(17, 24, 39, 0.5);
  border: 1px solid transparent;
}
.option-review.is-answer {
  background: rgba(52, 211, 153, 0.06);
  border-color: rgba(52, 211, 153, 0.2);
}
.option-review.is-user-wrong {
  background: rgba(251, 113, 133, 0.06);
  border-color: rgba(251, 113, 133, 0.2);
}
.option-review.is-user-correct {
  background: rgba(52, 211, 153, 0.06);
  border-color: rgba(52, 211, 153, 0.2);
}
.opt-letter {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: rgba(99, 102, 241, 0.1);
  color: var(--accent-indigo);
  font-weight: 700;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.is-answer .opt-letter { background: rgba(52, 211, 153, 0.15); color: var(--accent-emerald); }
.is-user-wrong .opt-letter { background: rgba(251, 113, 133, 0.15); color: var(--accent-rose); }
.opt-text {
  flex: 1;
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.5;
}
.opt-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}
.tag-correct { background: rgba(52, 211, 153, 0.12); color: var(--accent-emerald); }
.tag-wrong { background: rgba(251, 113, 133, 0.12); color: var(--accent-rose); }
.tag-right { background: rgba(52, 211, 153, 0.12); color: var(--accent-emerald); }

.explanation-box {
  padding: 14px 16px;
  border-radius: var(--radius-sm);
  background: rgba(99, 102, 241, 0.06);
  border: 1px solid rgba(99, 102, 241, 0.12);
}
.explanation-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--accent-indigo);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}
.explanation-text {
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-secondary);
}
</style>
