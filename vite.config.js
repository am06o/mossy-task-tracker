import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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
