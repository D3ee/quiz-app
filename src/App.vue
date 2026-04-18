<!--
  App.vue - 应用根组件
  功能：
  1. 提供全局背景装饰（三个渐变光球动画）
  2. 使用 <router-view> 渲染当前路由页面
  3. 页面切换时带有淡入淡出过渡动画
  4. 定义全局 CSS 变量（暗色主题色板）
  5. 覆盖 Element Plus 组件的暗色样式
-->
<template>
  <!-- 应用外壳容器 -->
  <div class="app-shell">
    <!-- 背景装饰光球（纯视觉效果，不影响交互） -->
    <div class="bg-orb bg-orb--1"></div>
    <div class="bg-orb bg-orb--2"></div>
    <div class="bg-orb bg-orb--3"></div>
    <!-- 路由视图：使用 out-in 模式的淡入淡出过渡 -->
    <router-view v-slot="{ Component }">
      <transition name="page-fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<!-- 全局样式（非 scoped），定义 CSS 变量和基础样式重置 -->
<style>
/* ==================== 全局 CSS 变量（暗色主题色板） ==================== */
:root {
  --bg-primary: #0a0e1a;                                          /* 主背景色 */
  --bg-secondary: #111827;                                        /* 次级背景色 */
  --bg-card: rgba(17, 24, 39, 0.8);                               /* 卡片背景色（半透明） */
  --bg-card-hover: rgba(30, 41, 59, 0.9);                         /* 卡片悬停背景色 */
  --border-subtle: rgba(99, 102, 241, 0.15);                      /* 微妙边框色 */
  --border-glow: rgba(99, 102, 241, 0.4);                         /* 发光边框色 */
  --text-primary: #f1f5f9;                                        /* 主文字色 */
  --text-secondary: #94a3b8;                                      /* 次级文字色 */
  --text-muted: #64748b;                                          /* 弱化文字色 */
  --accent-indigo: #818cf8;                                       /* 靛蓝强调色 */
  --accent-cyan: #22d3ee;                                         /* 青色强调色 */
  --accent-emerald: #34d399;                                      /* 翡翠绿强调色 */
  --accent-rose: #fb7185;                                         /* 玫红强调色 */
  --accent-amber: #fbbf24;                                        /* 琥珀黄强调色 */
  --gradient-primary: linear-gradient(135deg, #818cf8, #22d3ee);  /* 主渐变（靛蓝→青色） */
  --gradient-success: linear-gradient(135deg, #34d399, #22d3ee);  /* 成功渐变（绿→青） */
  --gradient-danger: linear-gradient(135deg, #fb7185, #f472b6);   /* 危险渐变（红→粉） */
  --gradient-warm: linear-gradient(135deg, #fbbf24, #fb923c);     /* 暖色渐变（黄→橙） */
  --shadow-glow: 0 0 30px rgba(99, 102, 241, 0.15);              /* 发光阴影 */
  --shadow-card: 0 4px 24px rgba(0, 0, 0, 0.3);                  /* 卡片阴影 */
  --radius-lg: 16px;                                              /* 大圆角 */
  --radius-md: 12px;                                              /* 中圆角 */
  --radius-sm: 8px;                                               /* 小圆角 */
}

/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  min-height: 100vh;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(99, 102, 241, 0.3);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(99, 102, 241, 0.5);
}

/* 覆盖 Element Plus 暗色主题样式 */
.el-card {
  --el-card-bg-color: var(--bg-card) !important;
  --el-card-border-color: var(--border-subtle) !important;
  border: 1px solid var(--border-subtle) !important;
  backdrop-filter: blur(12px);
  color: var(--text-primary) !important;
}
.el-card__body {
  color: var(--text-primary) !important;
}
.el-button--primary {
  --el-button-bg-color: #6366f1 !important;
  --el-button-border-color: #6366f1 !important;
  --el-button-hover-bg-color: #818cf8 !important;
  --el-button-hover-border-color: #818cf8 !important;
}
.el-button--success {
  --el-button-bg-color: #059669 !important;
  --el-button-border-color: #059669 !important;
  --el-button-hover-bg-color: #34d399 !important;
  --el-button-hover-border-color: #34d399 !important;
}
.el-radio, .el-checkbox {
  --el-text-color-regular: var(--text-primary) !important;
}
.el-tag {
  border: none !important;
}
.el-progress__text {
  color: var(--text-secondary) !important;
}
.el-alert {
  border: 1px solid var(--border-subtle) !important;
}
.el-alert--info {
  --el-alert-bg-color: rgba(99, 102, 241, 0.08) !important;
  color: var(--text-secondary) !important;
}
.el-alert--success {
  --el-alert-bg-color: rgba(52, 211, 153, 0.08) !important;
}
.el-alert--error {
  --el-alert-bg-color: rgba(251, 113, 133, 0.08) !important;
}
.el-alert .el-alert__title {
  color: var(--text-primary) !important;
}
.el-alert .el-alert__description {
  color: var(--text-secondary) !important;
}
.el-select__wrapper {
  background: var(--bg-secondary) !important;
  border-color: var(--border-subtle) !important;
  color: var(--text-primary) !important;
}
.el-message-box {
  --el-messagebox-title-color: var(--text-primary);
  background: var(--bg-secondary) !important;
  border: 1px solid var(--border-subtle) !important;
}
</style>

<style scoped>
.app-shell {
  position: relative;
  min-height: 100vh;
}

.bg-orb {
  position: fixed;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.3;
  pointer-events: none;
  z-index: 0;
  animation: float 20s ease-in-out infinite;
}
.bg-orb--1 {
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, #6366f1, transparent 70%);
  top: -200px;
  right: -100px;
}
.bg-orb--2 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, #22d3ee, transparent 70%);
  bottom: -150px;
  left: -100px;
  animation-delay: -7s;
}
.bg-orb--3 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, #f472b6, transparent 70%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: -14s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0); }
  33% { transform: translate(30px, -30px); }
  66% { transform: translate(-20px, 20px); }
}

/* 页面切换动画 */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.page-fade-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}
</style>
