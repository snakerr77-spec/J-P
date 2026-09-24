import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    // Em desenvolvimento, o Vite serve o front-end com hot reload e encaminha
    // as chamadas de API para o Worker local (`npm run dev:worker`, porta 8787).
    proxy: {
      '/api': 'http://127.0.0.1:8787'
    }
  }
});
