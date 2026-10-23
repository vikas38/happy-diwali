import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'generateSW',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
      },
      manifest: {
        name: 'Little Lights — Your Diwali Adventure',
        short_name: 'Little Lights',
        start_url: '/',
        display: 'standalone',
        background_color: '#0B0726',
        theme_color: '#0B0726',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
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
