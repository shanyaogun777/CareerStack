import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // react-is 为纯 CJS，不预打包时会出现「does not provide an export named 'isFragment'」
  optimizeDeps: {
    include: ['react-is', 'recharts'],
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg', 'pwa-192.png', 'pwa-512.png'],
      manifest: {
        name: 'CareerStack',
        short_name: 'CareerStack',
        description: '本地优先的求职工作台：简历、岗位与面试准备',
        theme_color: '#f3f4f6',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('lucide-react')) return 'vendor-lucide'
          if (id.includes('recharts')) return 'vendor-recharts'
          if (id.includes('jspdf')) return 'vendor-jspdf'
          if (id.includes('html-to-image')) return 'vendor-html-to-image'
          if (id.includes('@dnd-kit')) return 'vendor-dnd'
          if (
            id.includes('react-markdown') ||
            id.includes('remark') ||
            id.includes('micromark') ||
            id.includes('mdast') ||
            id.includes('unist')
          ) {
            return 'vendor-markdown'
          }
          if (id.includes('dexie')) return 'vendor-dexie'
        },
      },
    },
  },
})
