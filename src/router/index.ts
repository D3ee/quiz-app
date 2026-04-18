import { createRouter, createWebHistory } from 'vue-router'
import type { Category } from '../types'

const validCategories: Category[] = ['javascript', 'vue2', 'vue3']

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: () => import('../views/Home.vue') },
    {
      path: '/quiz/:category',
      name: 'quiz',
      component: () => import('../views/Quiz.vue'),
      beforeEnter: (to) => {
        if (!validCategories.includes(to.params.category as Category)) {
          return '/'
        }
      },
    },
    {
      path: '/result/:category',
      name: 'result',
      component: () => import('../views/Result.vue'),
      beforeEnter: (to) => {
        if (!validCategories.includes(to.params.category as Category)) {
          return '/'
        }
      },
    },
    { path: '/wrong-book', name: 'wrongBook', component: () => import('../views/WrongBook.vue') },
    { path: '/history', name: 'history', component: () => import('../views/History.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

export default router
