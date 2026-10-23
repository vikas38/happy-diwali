import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    outDir: 'dist',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['test/**/*.test.{js,jsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/fsm/**', 'src/store/**'],
      reporter: ['text', 'json-summary', 'html'],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 65,
        lines: 85,
      },
    },
  },
})
