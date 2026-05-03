import { Tensor } from 'onnxruntime-web';

function shannonEntropy(s: string): number {
  if (!s) return 0;
  const freq = new Map<string, number>();
  for (const c of s) freq.set(c, (freq.get(c) || 0) + 1);
  const len = s.length;
  let entropy = 0;
  for (const count of freq.values()) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

export function extractFeatures(url: string): Tensor {
  url = url.trim();
  const urlLen = url.length;
  if (urlLen === 0) return new Tensor('float32', new Float32Array(22).fill(0), [1, 22]);

  let letterCnt = 0, digitCnt = 0, specialCnt = 0;
  for (const c of url) {
    if (/[a-zA-Z]/.test(c)) letterCnt++;
    else if (/[0-9]/.test(c)) digitCnt++;
    else specialCnt++;
  }

  const eqCnt = (url.match(/=/g) || []).length;
  const qmCnt = (url.match(/\?/g) || []).length;
  const ampCnt = (url.match(/&/g) || []).length;
  const dotCnt = (url.match(/\./g) || []).length;
  const dashCnt = (url.match(/-/g) || []).length;
  const underCnt = (url.match(/_/g) || []).length;
  const slashCnt = (url.match(/\//g) || []).length;

  const letterRatio = letterCnt / urlLen;
  const digitRatio = digitCnt / urlLen;
  const specRatio = specialCnt / urlLen;

  const isHttps = url.toLowerCase().startsWith('https://') ? 1 : 0;

  const parsed = new URL(url);
  let netloc = parsed.hostname.toLowerCase();
  netloc = netloc.replace(/:\d+$/, '');
  netloc = netloc.replace(/^www\./, '');

  const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(netloc) ? 1 : 0;

  const parts = netloc.split('.');
  const tld = parts[parts.length - 1] || '';
  const tldLen = tld.length;
  const domLen = netloc.length;
  const subdomCnt = !isIp ? Math.max(0, parts.length - 2) : 0;

  const pathLen = parsed.pathname.length;
  const queryLen = parsed.search.length > 0 ? parsed.search.length - 1 : 0;

  const entropy = shannonEntropy(url);
  

  const features = new Float32Array([
    urlLen, domLen, isIp, tldLen, subdomCnt,
    letterCnt, digitCnt, specialCnt,
    eqCnt, qmCnt, ampCnt, dotCnt, dashCnt, underCnt,
    letterRatio, digitRatio, specRatio,
    isHttps, slashCnt, entropy, pathLen, queryLen
  ]);

  return new Tensor('float32', features, [1, 22]);
}