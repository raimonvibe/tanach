import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: 'public',
  publicDir: '.', // Use current directory as public dir (since root is 'public')
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    copyPublicDir: true, // Copy all static assets including data directory
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'public/index.html'),
        reader: resolve(__dirname, 'public/reader.html'),
        calendar: resolve(__dirname, 'public/calendar.html'),
        readings: resolve(__dirname, 'public/readings.html'),
        rambam: resolve(__dirname, 'public/rambam.html'),
        mishnah: resolve(__dirname, 'public/mishnah.html'),
        talmud: resolve(__dirname, 'public/talmud.html'),
      },
    },
  },
  server: {
    port: 3000,
  },
});
