// apps/extension/src/background.ts

console.log('[PhishVigil] Background worker loaded');

// Кэш для предотвращения повторной проверки одного и того же URL за короткое время
const checkedUrls = new Map<string, number>();


// === 1. Самый надежный способ для SPA (GitHub, React, Vue и т.д.) ===
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Событие срабатывает много раз (loading, complete и т.д.)
  // Нас интересует только момент, когда изменился URL
  if (changeInfo.url) {
    await checkUrl(changeInfo.url, tabId, 'tabs.onUpdated');
  }
});

// === 2. Перехват навигации для обычных сайтов и iframe ===
chrome.webNavigation.onCommitted.addListener(async (details) => {
  // Проверяем только главный фрейм (не рекламу и не виджеты)
  if (details.frameId !== 0) return;
  
  // Если URL уже был проверен через tabs.onUpdated, пропускаем (чтобы не дублировать)
  // Но иногда webNavigation срабатывает быстрее, так что лучше использовать debounce
  await checkUrl(details.url, details.tabId, 'webNavigation');
});

// === Основная логика проверки ===
async function checkUrl(url: string, tabId: number, source: string) {
  // Игнорируем системные страницы Chrome
  if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) return;

  // Защита от спама (debounce): не проверяем URL чаще чем раз в 500мс для одной вкладки
  const key = `${tabId}:${url}`;
  const lastCheck = checkedUrls.get(key);
  const now = Date.now();

  if (lastCheck && now - lastCheck < 500) {
    return; 
  }

  checkedUrls.set(key, now);

  console.log(` [PhishVigil] Check: ${url} (Source: ${source})`);
  
  // TODO: Здесь будет вызов ML
  // const isPhishing = await runModel(url);
  // if (isPhishing) blockTab(tabId);
}

// Функция блокировки
async function blockTab(tabId: number) {
  console.warn(` [PhishVigil] BLOCKED tab ${tabId}`);
  // Пока просто перенаправляем на пустую страницу
  try {
    await chrome.tabs.update(tabId, { url: 'about:blank' });
  } catch (e) {
    console.error(e);
  }
}