console.log('[PhishVigil] Background worker loaded');

const checkedUrls = new Map<string, number>();
const OFFSCREEN_URL = chrome.runtime.getURL('offscreen/main.html');

let offscreenPromise: Promise<void> | null = null;

ensureOffscreen();

chrome.runtime.onStartup.addListener(() => {
  ensureOffscreen();
});

chrome.runtime.onInstalled.addListener(() => {
  ensureOffscreen();
});

async function ensureOffscreen(): Promise<void> {
  if (offscreenPromise) return offscreenPromise;

  offscreenPromise = (async () => {

    const alreadyExists = await chrome.offscreen.hasDocument();
    if (alreadyExists) {
      // console.log('[PhishVigil] Offscreen already exists');
      return;
    }

    console.log('[PhishVigil] Creating offscreen document...');
    try {
      await chrome.offscreen.createDocument({
        url: OFFSCREEN_URL,
        reasons: [chrome.offscreen.Reason.WORKERS],
        justification: 'ML inference for phishing detection'
      });
    } catch (err: any) {
      if (!err.message?.includes('Only one offscreen document')) {
        console.error('[PhishVigil] Offscreen create error:', err);
        throw err;
      }
      console.log('[PhishVigil] Offscreen already exists');
    }

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
    await ensureOffscreen();
    const isPhishing = await runInference(url);

    if (isPhishing) {
      console.warn(`[PhishVigil] 🚫 PHISHING: ${url}`);
      await blockTab(tabId);
    }
  } catch (err) {
    console.error('[PhishVigil] Check error:', err);
  }
}

async function showPhishingOverlay(tabId: number) {
  await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      if (document.getElementById('phishvigil-overlay')) return;

      const overlay = document.createElement('div');
      overlay.id = 'phishvigil-overlay';
      overlay.style.cssText = `
        position: fixed; inset: 0; z-index: 2147483647;
        background: rgba(20,0,0,0.85); display: flex; align-items: center; justify-content: center;
        font-family: system-ui, sans-serif; color: white;
      `;
      overlay.innerHTML = `
        <div style="background:#222; padding:24px; border-radius:12px; text-align:center; max-width:400px;">
          <h2 style="margin:0 0 12px; color:#ff6b6b;">⚠️ Suspicious page</h2>
          <p>PhishVigil detected phishing. Do NOT enter passwords or any secure data.</p>
          <button id="pv-continue" style="margin-top:16px; padding:8px 16px; background:#555; border:none; color:white; border-radius:6px; cursor:pointer;">Continue at your own risk</button>
          <button id="pv-leave" style="margin-left:8px; padding:8px 16px; background:#ff4444; border:none; color:white; border-radius:6px; cursor:pointer;">Leave</button>
        </div>
      `;
      document.body.appendChild(overlay);

      const pv_leave = document.getElementById('pv-leave');
      if (pv_leave) pv_leave.onclick = () => window.history.back();

      const pv_continue = document.getElementById('pv-continue');
      if (pv_continue) pv_continue.onclick = () => overlay.remove();
    }
  });
}

async function systemNotification(tabId: number) {
  chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon128.png',
      title: '⚠️ PhishVigil: Обнаружен фишинг!',
      message: 'Эта страница может быть опасной. Не вводите данные.',
      priority: 2,
      buttons: [{ title: 'Закрыть вкладку' }]
    });

    chrome.notifications.onButtonClicked.addListener((id) => {
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (tab) chrome.tabs.remove(tabId);
      });
    });
}

async function blockTab(tabId: number) {
  try {
    // await chrome.tabs.update(tabId, { url: 'about:blank' });
    // await systemNotification(tabId);

    await showPhishingOverlay(tabId);

  } catch (e) {
    console.error('[PhishVigil] Block error:', e);
  }
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url) await checkUrl(changeInfo.url, tabId, 'tabs.onUpdated');
});

chrome.webNavigation.onCommitted.addListener(async (details) => {
  if (details.frameId === 0) await checkUrl(details.url, details.tabId, 'webNavigation');
});

setInterval(() => {
  const now = Date.now();
  for (const [key, time] of checkedUrls.entries()) {
    if (now - time > 60_000) checkedUrls.delete(key);
  }
}, 60_000);

chrome.runtime.onConnect.addListener(() => { });