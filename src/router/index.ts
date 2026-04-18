import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: () => import('../views/Home.vue') },
    { path: '/quiz/:category', name: 'quiz', component: () => import('../views/Quiz.vue') },
    { path: '/result/:category', name: 'result', component: () => import('../views/Result.vue') },
  ],
})

export default router
