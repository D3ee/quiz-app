/**
 * 路由配置
 * 使用 Vue Router 的 HTML5 History 模式
 * 所有页面组件均采用懒加载（动态 import）以优化首屏性能
 */
import { createRouter, createWebHistory } from 'vue-router'
import type { Category } from '../types'

/** 合法的题目分类列表，用于路由守卫校验 */
const validCategories: Category[] = ['javascript', 'vue2', 'vue3', 'miniprogram']

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // 首页 - 分类选择与模式设置
    { path: '/', name: 'home', component: () => import('../views/Home/index.vue') },
    {
      // 答题页 - 动态路由参数 :category 指定分类
      path: '/quiz/:category',
      name: 'quiz',
      component: () => import('../views/Quiz/index.vue'),
      // 路由守卫：校验分类参数是否合法，非法则重定向首页
      beforeEnter: (to) => {
        if (!validCategories.includes(to.params.category as Category)) {
          return '/'
        }
      },
    },
    {
      // 结果页 - 展示答题成绩和题目解析
      path: '/result/:category',
      name: 'result',
      component: () => import('../views/Result/index.vue'),
      beforeEnter: (to) => {
        if (!validCategories.includes(to.params.category as Category)) {
          return '/'
        }
      },
    },
    // 题目列表页面
    {
      path: '/questions/:category',
      name: 'questionList',
      component: () => import('../views/QuestionList/index.vue'),
      beforeEnter: (to) => {
        if (!validCategories.includes(to.params.category as Category)) {
          return '/'
        }
      },
    },
    // 错题本页面
    { path: '/wrong-book', name: 'wrongBook', component: () => import('../views/WrongBook/index.vue') },
    // 答题历史记录页面
    { path: '/history', name: 'history', component: () => import('../views/History/index.vue') },
    // 兜底路由：未匹配的路径重定向到首页
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

export default router
