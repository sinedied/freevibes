import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/freevibes/',
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  server: {
    port: 5173
  }
})
