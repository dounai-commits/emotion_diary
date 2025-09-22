import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // GitHub Pages 项目页必须使用仓库名作为 base
  base: '/emotion_diary/',
})
