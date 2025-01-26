import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'quiz-self-6giftzniy-mjs-projects-75381399.vercel.app',
        changeOrigin: true,
      },
    },
  },
});