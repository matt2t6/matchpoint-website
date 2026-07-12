import { defineConfig } from 'vite'

const backend = 'http://127.0.0.1:5000'

export default defineConfig({
  server: {
    host: '127.0.0.1',
    port: 8000,
    strictPort: true,
    proxy: {
      '/api': {
        target: backend,
        changeOrigin: true
      },
      '/sse': {
        target: backend,
        changeOrigin: true
      },
      '/stream': {
        target: backend,
        changeOrigin: true
      },
      '/metrics': {
        target: backend,
        changeOrigin: true
      },
      '/health': {
        target: backend,
        changeOrigin: true
      }
    }
  }
})
