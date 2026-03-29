import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/predict': 'http://localhost:8080/',
      '/status': 'http://localhost:8080/',
      '/result': 'http://localhost:8080/',
    },
  },
  build: {
    outDir: 'app/ui',
    emptyOutDir: true,
  },
})
