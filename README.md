# 前端知识答题系统

一个基于 Vue 3 + TypeScript + Element Plus 的在线答题应用，支持 JavaScript、Vue2、Vue3 三个分类的题目练习。

## 功能特性

- 📝 **多分类题库** - JavaScript、Vue2、Vue3 三大技术栈题目
- 🎲 **智能随机** - 题目随机抽取，避免重复，题库抽完自动重置
- 💾 **答题记录** - 自动保存答题进度，刷新页面不丢失
- 📊 **详细解析** - 每道题提供正确答案和详细解释
- ⏱️ **答题计时** - 记录答题用时
- 🎯 **成绩统计** - 实时显示正确率和得分
- 📕 **错题本** - 自动收集答错题目，支持错题专项练习，答对自动移除
- 📈 **答题历史** - 记录每次答题成绩，展示正确率趋势图
- ⭐ **收藏功能** - 答题时收藏重要题目，支持收藏题目专项练习
- 🎮 **多种模式** - 随机模式、顺序模式、限时模式（每题倒计时）、闯关模式（答错即止）

## 技术栈

- Vue 3.5 + Composition API
- TypeScript 6.0
- Element Plus 2.13
- Vue Router 5.0
- Pinia 3.0 + pinia-plugin-persistedstate (状态持久化)
- Vite 8.0
- unplugin-auto-import + unplugin-vue-components (自动导入)

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 预览生产构建
pnpm preview
```

## 项目结构

```
src/
├── assets/             # 静态资源
├── components/         # 公共组件
│   ├── AnalysisCard.vue    # 答案解析卡片
│   ├── QuestionCard.vue    # 题目展示卡片
│   └── ScoreRing.vue       # 环形得分组件
├── composables/        # 组合式函数
│   ├── useQuestionRenderer.ts  # 题目渲染逻辑
│   └── useScoreCalculation.ts  # 分数计算逻辑
├── data/               # 题库数据
│   ├── javascript.ts
│   ├── vue2.ts
│   └── vue3.ts
├── router/             # 路由配置
│   └── index.ts
├── stores/             # Pinia 状态管理
│   └── quiz.ts
├── types/              # TypeScript 类型定义
│   └── index.ts
├── views/              # 页面组件
│   ├── Home.vue        # 首页 - 选择分类和模式
│   ├── Quiz.vue        # 答题页
│   ├── Result.vue      # 结果页
│   ├── WrongBook.vue   # 错题本页
│   └── History.vue     # 答题历史页
├── App.vue             # 根组件
└── main.ts             # 入口文件
```

## 核心功能说明

### 题目去重机制
- 每次答题会记录已抽取的题目 ID
- 下次答题自动过滤已做过的题目
- 题库全部做完后自动清空记录，重新开始

### 数据持久化
使用 `pinia-plugin-persistedstate` 插件，以下数据会自动保存到 localStorage：
- 已做题目记录
- 当前答题进度
- 用户答案
- 答题时间
- 错题本记录
- 答题历史（最近 50 次）
- 收藏题目

### 错题本
- 答题提交后自动收集错题，记录错误次数
- 再次答对该题后自动从错题本移除
- 支持按分类查看和专项练习

### 答题历史
- 记录每次答题的分类、模式、得分、用时
- 展示最近 10 次答题的正确率趋势柱状图

### 收藏功能
- 答题时点击 ⭐ 收藏/取消收藏题目
- 首页可一键开始收藏题目练习

### 答题模式
- **随机模式**：默认模式，随机抽题
- **顺序模式**：按题目 ID 顺序做题
- **限时模式**：每道题 30 秒倒计时，超时自动跳过
- **闯关模式**：答错即止，看能连对多少题

## 添加题目

在 `src/data/` 目录下对应的文件中添加题目：

```typescript
{
  id: 1,                    // 唯一 ID
  type: 'single',           // 'single' 单选 | 'multiple' 多选
  category: 'javascript',   // 分类
  question: '题目内容',
  options: ['选项A', '选项B', '选项C', '选项D'],
  answer: 0,                // 单选：索引数字 | 多选：索引数组 [0, 2]
  explanation: '答案解析'
}
```

## License

MIT
