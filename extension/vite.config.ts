import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    minify: false,
    sourcemap: 'inline',
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext', 
    
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/background.ts'),
        features: resolve(__dirname, 'src/features.ts'),
        'offscreen/main': resolve(__dirname, 'src/offscreen/main.ts'),
      },
      output: {
        format: 'es',
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name].js',
      },
    },
  },
});