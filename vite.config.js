import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'public/index.html'),
        reader: resolve(__dirname, 'public/reader.html'),
        calendar: resolve(__dirname, 'public/calendar.html'),
      },
    },
  },
  server: {
    port: 3000,
  },
});
