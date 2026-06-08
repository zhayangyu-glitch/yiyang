import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/yiyang/', // 👈 核心：加上这一行，前后都有斜杠，名字必须和仓库名一致
  plugins: [react()],
})
