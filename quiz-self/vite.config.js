import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.NODE_ENV === 'development' 
          ? 'http://localhost:3001'
          : 'https://quizself.vercel.app',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
});