import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// 允许通过进程环境变量强制数据源（E2E 用 mock，保证确定性）。
// process.env 的优先级高于 .env.local，便于 CI / Playwright 覆盖。
const forcedDataSource = process.env.VITE_DATA_SOURCE

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  ...(forcedDataSource
    ? { define: { 'import.meta.env.VITE_DATA_SOURCE': JSON.stringify(forcedDataSource) } }
    : {}),
  server: {
    proxy: {
      // 开发期把 /api/* 转发到后端，规避浏览器跨域。
      '/api': {
        target: 'https://ed-test.xiding.tech',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
