/**
 * 应用入口文件
 * 负责创建 Vue 应用实例并注册全局插件
 */
import { createApp } from 'vue'
import 'element-plus/dist/index.css' // Element Plus 全局样式
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate' // Pinia 持久化插件，数据存入 localStorage
import router from './router'
import App from './App.vue'

// 创建 Pinia 状态管理实例，并启用持久化插件
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

// 创建 Vue 应用，注册 Pinia 和路由，挂载到 #app
const app = createApp(App)
app.use(pinia)
app.use(router)
app.mount('#app')
