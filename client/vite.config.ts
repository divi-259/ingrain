import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Forward /api/* to the Express server so the browser only
    // ever talks to :5173 — same-origin, no CORS, cookies work.
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
