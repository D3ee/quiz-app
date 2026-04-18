/**
 * Vite 构建配置
 * - 使用 Vue 插件支持 .vue 单文件组件
 * - 使用 AutoImport 自动导入 Vue/Vue Router/Pinia API（无需手动 import ref、computed 等）
 * - 使用 Components 自动按需注册 Element Plus 组件（无需手动 import ElButton 等）
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // 自动导入 Vue、Vue Router、Pinia 的常用 API，并按需导入 Element Plus 函数
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia'],
      resolvers: [ElementPlusResolver()],
      dts: 'src/auto-imports.d.ts', // 生成类型声明文件
    }),
    // 自动按需注册 Element Plus 组件
    Components({
      resolvers: [ElementPlusResolver()],
      dts: 'src/components.d.ts', // 生成组件类型声明文件
    }),
  ],
  server: {
    host: '0.0.0.0' // 允许局域网访问
  }
})
