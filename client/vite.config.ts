import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // GitHub Pages serves this as a project page at /ingrain/, so built
  // asset URLs need that prefix. Dev keeps serving from / as usual.
  base: command === 'build' ? '/ingrain/' : '/',
}))
