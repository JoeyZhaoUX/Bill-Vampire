/* global process */
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
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.png', 'icons/icon-192x192.png', 'icons/icon-512x512.png'],
      manifest: false,
      workbox: {
        cleanupOutdatedCaches: true,
        // Keep the interactive app lightweight without pinning SEO pages in
        // visitors' browsers. Guides must always come from the network so
        // corrections, offer copy, and sourced images publish immediately.
        globPatterns: ['assets/**/*.{js,css,woff2}'],
        navigateFallback: null,
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
