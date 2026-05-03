// apps/extension/src/background.ts
console.log('[PhishVigil] Background worker loaded');

const checkedUrls = new Map<string, number>();
const OFFSCREEN_URL = chrome.runtime.getURL('offscreen.html');

// 🔥 Promise-кэш для offscreen: гарантирует однократную инициализацию
let offscreenPromise: Promise<void> | null = null;

async function ensureOffscreen(): Promise<void> {
  if (offscreenPromise) return offscreenPromise;
  
  offscreenPromise = (async () => {
    console.log('[PhishVigil] Creating offscreen document...');
    
    try {
      await chrome.offscreen.createDocument({
        url: OFFSCREEN_URL,
        reasons: [chrome.offscreen.Reason.WORKERS],
        justification: 'ML inference for phishing detection'
      });
    } catch (err: any) {
      // Chrome бросает ошибку, если offscreen уже существует — это нормально
      if (!err.message?.includes('Only one offscreen document')) {
        console.error('[PhishVigil] Offscreen create error:', err);
        throw err;
      }
      console.log('[PhishVigil] Offscreen already exists');
    }
    
    // Ждём сигнал готовности с таймаутом
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        chrome.runtime.onMessage.removeListener(handler);
        reject(new Error('Offscreen did not send OFFSCREEN_READY within 5s'));
      }, 5000);
      
      const handler = (msg: any) => {
        if (msg.type === 'OFFSCREEN_READY') {
          clearTimeout(timeout);
          chrome.runtime.onMessage.removeListener(handler);
          console.log('[PhishVigil] ✅ Offscreen ready');
          resolve();
        }
      };
      chrome.runtime.onMessage.addListener(handler);
    });
  })();
  
  return offscreenPromise;
}

async function runInference(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: 'PREDICT_PHISHING', url },
      (response) => {
        // 🔥 Обязательно проверяем lastError в MV3
        if (chrome.runtime.lastError) {
          console.error('[PhishVigil] Messaging error:', chrome.runtime.lastError.message);
          resolve(false);
          return;
        }
        if (response?.success) {
          resolve(response.isPhishing);
        } else {
          console.error('[PhishVigil] Inference failed:', response?.error);
          resolve(false);
        }
      }
    );
  });
}

async function checkUrl(url: string, tabId: number, source: string) {
  if (
    url.startsWith('chrome://') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('chrome-untrusted://') ||
    !url.startsWith('http')
  ) return;

  const key = `${tabId}:${url}`;
  const lastCheck = checkedUrls.get(key);
  const now = Date.now();
  if (lastCheck && now - lastCheck < 500) return;
  checkedUrls.set(key, now);

  console.log(`[PhishVigil] Check: ${url} (Source: ${source})`);

  try {
    await ensureOffscreen(); // ← теперь надёжно ждёт готовности
    const isPhishing = await runInference(url);
    
    if (isPhishing) {
      console.warn(`[PhishVigil] 🚫 PHISHING: ${url}`);
      await blockTab(tabId);
    }
  } catch (err) {
    console.error('[PhishVigil] Check error:', err);
  }
}

async function blockTab(tabId: number) {
  try {
    await chrome.tabs.update(tabId, { url: 'about:blank' });
  } catch (e) {
    console.error('[PhishVigil] Block error:', e);
  }
}

// Слушатели
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url) await checkUrl(changeInfo.url, tabId, 'tabs.onUpdated');
});

chrome.webNavigation.onCommitted.addListener(async (details) => {
  if (details.frameId === 0) await checkUrl(details.url, details.tabId, 'webNavigation');
});

// Очистка кэша
setInterval(() => {
  const now = Date.now();
  for (const [key, time] of checkedUrls.entries()) {
    if (now - time > 60_000) checkedUrls.delete(key);
  }
}, 60_000);

// 🔥 Keep-alive для отладки: не даёт воркеру уснуть
chrome.runtime.onConnect.addListener(() => {});