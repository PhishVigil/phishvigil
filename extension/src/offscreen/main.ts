import { env, Tensor, InferenceSession } from 'onnxruntime-web';
import { extractFeatures } from '../features';

console.log('[PhishVigil] Offscreen context loaded');

let session: InferenceSession | null = null;

async function loadModel(): Promise<void> {
  if (session) return;
  
  env.wasm.wasmPaths = {
    wasm: chrome.runtime.getURL('wasm/ort-wasm-simd-threaded.wasm'),
    mjs: chrome.runtime.getURL('wasm/ort-wasm-simd-threaded.mjs')
  };
  env.wasm.numThreads = 2;
  env.wasm.simd = true;
  
  const modelUrl = chrome.runtime.getURL('models/phish_model.onnx');
  session = await InferenceSession.create(modelUrl, {
    executionProviders: ['wasm']
  });
  
  console.log('[PhishVigil] ✅ Model loaded');
  console.log('[DEBUG] Input names:', session.inputNames);
  console.log('[DEBUG] Output names:', session.outputNames);
}

function extractScalar(output: Tensor): number {
  if (!['float32', 'int32', 'int64'].includes(output.type)) {
    throw new Error(`Expected numeric tensor, got ${output.type}`);
  }

  // Теперь можно безопасно привести к Iterable<number>
  const data = Array.from(output.data as Iterable<number>);
  if (data.length === 1) return data[0];
  if (data.length === 2) return data[1]; // P(phishing)
  throw new Error(`Unexpected output shape: ${output.dims}`);
}

async function predict(url: string): Promise<boolean> {
  await loadModel();
  if (!session) throw new Error('Model not loaded');
  
  const inputTensor = extractFeatures(url);
  const feeds: Record<string, Tensor> = { [session.inputNames[0]]: inputTensor };
  const results = await session.run(feeds);
  
  const probTensor = results['probabilities'] as Tensor;
  if (!(probTensor instanceof Tensor)) {
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