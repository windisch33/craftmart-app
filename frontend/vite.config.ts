import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
const config = {
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    allowedHosts: [
      'localhost',
      'www.cmioe.com',
      'cmioe.com'
    ]
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true
      }
    }
  }
};

export default defineConfig(config as any);
