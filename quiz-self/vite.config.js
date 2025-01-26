import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://quizself.vercel.app', // Add https://
        changeOrigin: true,
        secure: true, // Ensure secure connection
      },
    },
  },
});