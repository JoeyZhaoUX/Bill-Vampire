import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/Bill-Vampire/' : '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/icon.png', 'icons/icon-192x192.png', 'icons/icon-512x512.png'],
      manifest: false,
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'react-vendor': ['react', 'react-dom'],
          // Chart library (large, lazy-loaded)
          'chart': ['chart.js', 'react-chartjs-2'],
          // FontAwesome icons (large)
          'icons': [
            '@fortawesome/fontawesome-svg-core',
            '@fortawesome/free-solid-svg-icons',
            '@fortawesome/react-fontawesome'
          ],
          // Utilities
          'utils': ['html-to-image']
        }
      }
    },
    chunkSizeWarningLimit: 600
  }
})
