import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/midtrans-sandbox': {
        target: 'https://app.sandbox.midtrans.com/snap/v1/transactions',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/midtrans-sandbox/, '')
      },
      '/midtrans-prod': {
        target: 'https://app.midtrans.com/snap/v1/transactions',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/midtrans-prod/, '')
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 1000, // Meningkatkan batas notifikasi menjadi 1MB
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['@supabase/supabase-js', 'lucide-react', 'date-fns']
        }
      }
    }
  }
})
