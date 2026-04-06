import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 前端環境變數從根目錄 .env 讀取
export default defineConfig({
  plugins: [react()],
  envDir: '../',
})
