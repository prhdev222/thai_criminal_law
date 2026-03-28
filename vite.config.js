import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  server: {
    proxy: {
      // รัน `npm run pages:dev` คู่กับ `npm run dev` เพื่อทดสอบ Turso ผ่าน Functions บน localhost:8788
      '/api': { target: 'http://127.0.0.1:8788', changeOrigin: true },
    },
  },
})
