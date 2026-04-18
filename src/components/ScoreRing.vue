<!--
  ScoreRing 组件 - 环形分数展示
  使用 SVG 圆环动画展示答题得分，通过 stroke-dashoffset 控制进度
  颜色和样式类由父组件根据评级传入
-->
<template>
  <div class="score-ring" :class="scoreClass">
    <svg viewBox="0 0 120 120" class="ring-svg">
      <!-- 背景圆环（灰色底色） -->
      <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(99,102,241,0.1)" stroke-width="8"/>
      <!-- 进度圆环（根据正确率填充） -->
      <circle cx="60" cy="60" r="52" fill="none" :stroke="ringColor" stroke-width="8" stroke-linecap="round" :stroke-dasharray="circumference" :stroke-dashoffset="dashOffset" class="ring-progress"/>
    </svg>
    <!-- 中心分数文字 -->
    <div class="score-inner">
      <span class="score-num">{{ score }}</span>
      <span class="score-divider">/</span>
      <span class="score-total">{{ total }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  score: number       // 正确题数
  total: number       // 总题数
  scoreClass: string  // 评级样式类（excellent/good/poor）
  ringColor: string   // 环形进度条颜色
}>()

/** 圆环周长 = 2πr */
const circumference = 2 * Math.PI * 52

/** 根据正确率计算 stroke-dashoffset（偏移量越小，显示的弧越长） */
const dashOffset = computed(() => {
  const rate = props.score / props.total
  return circumference * (1 - rate)
})
</script>

<style scoped>
.score-ring {
  position: relative;
  width: 120px;
  height: 120px;
  flex-shrink: 0;
}
.ring-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}
.ring-progress {
  transition: stroke-dashoffset 1s ease;
}
.score-inner {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: baseline;
  justify-content: center;
  padding-top: 42px;
}
.score-num {
  font-size: 36px;
  font-weight: 800;
}
.excellent .score-num { color: var(--accent-emerald); }
.good .score-num { color: var(--accent-amber); }
.poor .score-num { color: var(--accent-rose); }
.score-divider {
  font-size: 20px;
  color: var(--text-muted);
  margin: 0 2px;
}
.score-total {
  font-size: 20px;
  color: var(--text-muted);
}
</style>
