import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 7001,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Ganti localhost dengan IP server jika backend di PC terpisah
        changeOrigin: true,
      }
    }
  }
})