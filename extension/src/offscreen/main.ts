// apps/extension/src/offscreen/main.ts
import * as ort from 'onnxruntime-web';
import { extractFeatures } from '../features';

console.log('[PhishVigil] Offscreen context loaded');

let session: ort.InferenceSession | null = null;

async function loadModel(): Promise<void> {
  if (session) return;
  
  ort.env.wasm.wasmPaths = {
    wasm: chrome.runtime.getURL('wasm/ort-wasm-simd-threaded.wasm'),
    mjs: chrome.runtime.getURL('wasm/ort-wasm-simd-threaded.mjs')
  };
  ort.env.wasm.numThreads = 2;
  ort.env.wasm.simd = true;
  
  const modelUrl = chrome.runtime.getURL('models/phish_model.onnx');
  session = await ort.InferenceSession.create(modelUrl, {
    executionProviders: ['wasm']
  });
  
  console.log('[PhishVigil] ✅ Model loaded');
  console.log('[DEBUG] Input names:', session.inputNames);
  console.log('[DEBUG] Output names:', session.outputNames);
}

function extractScalar(output: ort.Tensor): number {
  const data = Array.from(output.data) as number[];
  if (data.length === 1) return data[0];
  if (data.length === 2) return data[1]; // P(phishing)
  throw new Error(`Unexpected output shape: ${output.dims}`);
}

async function predict(url: string): Promise<boolean> {
  await loadModel();
  if (!session) throw new Error('Model not loaded');
  
  const inputTensor = extractFeatures(url);
  const feeds: Record<string, ort.Tensor> = { [session.inputNames[0]]: inputTensor };
  const results = await session.run(feeds);
  
  const probTensor = results['probabilities'] as ort.Tensor;
  if (!(probTensor instanceof ort.Tensor)) {
    throw new Error(`Expected tensor for "probabilities"`);
  }
  
  const phishingProb = extractScalar(probTensor);
  console.log(`[DEBUG] Phishing probability: ${phishingProb}`);
  
  return phishingProb > 0.7;
}

// 🔥 1. Сначала регистрируем обработчик сообщений
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'PREDICT_PHISHING') {
    predict(msg.url)
      .then(result => sendResponse({ success: true, isPhishing: result }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // важно: держим канал открытым для асинхронного ответа
  }
});

// 🔥 2. Только потом загружаем модель и шлём READY
(async () => {
  try {
    await loadModel();
    chrome.runtime.sendMessage({ type: 'OFFSCREEN_READY' });
  } catch (err) {
    console.error('[PhishVigil] Offscreen init failed:', err);
  }
})();