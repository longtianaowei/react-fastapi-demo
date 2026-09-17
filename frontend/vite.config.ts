import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  // 开发服务器配置
  server: {
    // API 代理配置
    proxy: {
      '/api': {
        // FastAPI 后端地址
        target: 'http://localhost:8000',
        // 修改请求来源
        changeOrigin: true,
      },
    },
  },
})
