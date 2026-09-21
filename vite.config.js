import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const pkg = JSON.parse(readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf-8'))

export default defineConfig({
  define: {
    // 빌드된 화면 코드가 실제로 최신인지 눈으로 바로 확인할 수 있도록, 설정 화면에 버전을 찍는다.
    __APP_VERSION__: JSON.stringify(pkg.version)
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa-icon.png'],
      manifest: {
        name: 'mossy',
        short_name: 'mossy',
        description: '조용한 할 일 / 프로젝트 관리 앱',
        lang: 'ko',
        start_url: '.',
        display: 'standalone',
        background_color: '#f9fafb',
        theme_color: '#4a8a2a',
        icons: [
          { src: 'pwa-icon.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-icon.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-icon.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ],
  base: './',
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      // src-tauri/target은 Rust 빌드 산출물 — 컴파일 중에 파일이 계속 생성/잠기므로
      // Vite가 같이 감시하면 Windows에서 EBUSY로 죽는다.
      ignored: ['**/src-tauri/**']
    }
  }
})
