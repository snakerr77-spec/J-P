import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // base relativa: funciona em qualquer subcaminho (GitHub Pages) e abrindo o build localmente
  base: './',
  resolve: {
    alias: { '@': '/src' }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts']
  }
});
