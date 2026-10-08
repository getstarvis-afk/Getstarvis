import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase'))     return 'firebase'
            if (id.includes('lucide-react')) return 'lucide'
            return 'vendor'
          }
        }
      }
    }
  }
})
