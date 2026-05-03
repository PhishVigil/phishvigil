import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    minify: false,
    sourcemap: 'inline',
    outDir: 'dist',
    emptyOutDir: true,
    // Важно: target должен поддерживать ES Modules (Chrome 100+)
    target: 'esnext', 
    
    rollupOptions: {
      input: {
        // Ключ 'background' создаст файл dist/background.js
        background: resolve(__dirname, 'src/background.ts'),
        features: resolve(__dirname, 'src/features.ts'),
        'offscreen/main': resolve(__dirname, 'src/offscreen/main.ts'),
      },
      output: {
        format: 'es', // Manifest V3 требует ES modules
        entryFileNames: '[name].js', // Фиксируем имя файла, чтобы оно совпадало с manifest.json
        chunkFileNames: 'chunks/[name].js',
      },
    },
  },
});