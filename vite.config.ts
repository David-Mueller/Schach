import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Für GitHub Pages (Hosting unter /Schach/) setzt der Workflow BASE_PATH;
  // lokal und auf Coolify bleibt es die Site-Root.
  base: process.env.BASE_PATH ?? '/',
  define: {
    // Build-Zeitpunkt für die Versionsanzeige in den Einstellungen
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    vue(),
    VitePWA({
      // 'prompt': kein Zwangs-Reload mitten in Lektion oder Partie – die App
      // wendet Updates an, wenn gerade nichts verloren gehen kann (siehe App.vue).
      registerType: 'prompt',
      includeAssets: ['icons/icon.svg'],
      manifest: {
        name: 'SchachTrainer',
        short_name: 'Schach',
        description: 'Schach spielen und lernen – mit Tipps vom Computer',
        lang: 'de',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#1e1b16',
        theme_color: '#1e1b16',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Engine-WASM (~7 MB) muss mit in den Precache, sonst kein Offline-Betrieb.
        globPatterns: ['**/*.{js,css,html,svg,png,wasm,woff2}'],
        maximumFileSizeToCacheInBytes: 16 * 1024 * 1024,
      },
    }),
  ],
  build: {
    target: 'es2022',
  },
  test: {
    // Nur Unit-Tests; die Playwright-Specs unter tests/e2e laufen via pnpm test:e2e.
    include: ['src/**/*.test.ts'],
  },
})
