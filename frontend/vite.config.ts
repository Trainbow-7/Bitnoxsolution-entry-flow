import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import fs from 'node:fs'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'spa-404-fallback',
      closeBundle() {
        try {
          const distDir = path.resolve(process.cwd(), 'dist')
          const indexPath = path.join(distDir, 'index.html')
          const fallbackPath = path.join(distDir, '404.html')
          if (fs.existsSync(indexPath)) {
            fs.copyFileSync(indexPath, fallbackPath)
          }
        } catch {
          // ignore
        }
      },
    },
  ],
  server: {
    port: 5180,
    strictPort: true,
    host: true,
    allowedHosts: true,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
})
