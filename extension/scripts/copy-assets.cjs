const fs = require('fs');
const path = require('path');

const filesToCopy = [
  {
    src: 'node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.mjs',
    dest: 'dist/wasm'
  },
  {
    src: 'node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm',
    dest: 'dist/wasm'
  },
  {
    src: '../ml/output/phish_model.onnx',
    dest: 'dist/models'
  }
];

console.log('📦 Copying assets for build...');

filesToCopy.forEach(({ src, dest }) => {
  const destDir = path.resolve(__dirname, '..', dest);
  const destPath = path.join(destDir, path.basename(src));
  const srcPath = path.resolve(__dirname, '..', src);

  fs.mkdirSync(destDir, { recursive: true });

  fs.copyFileSync(srcPath, destPath);
  console.log(`  ✅ ${path.relative(process.cwd(), srcPath)} → ${path.relative(process.cwd(), destPath)}`);
});