// src/dashboard/loaders/partialsLoader.ts
// 通过 import.meta.glob 在构建时内联 HTML 片段，同时在运行时提供 fetch 回退

// Vite 会将匹配到的文件以 raw 文本形式打包进来（使用 ?raw 以兼容新版本）
const rawPartials = import.meta.glob('../partials/**/*.html', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

function normalizeName(name: string): string {
  return name
    .replace(/^\/*/, '')
    .replace(/^partials\//, '')
    .replace(/^\.\//, '');
}

function findByName(name: string): string | undefined {
  const keyEnd = `/partials/${normalizeName(name)}`;
  for (const key of Object.keys(rawPartials)) {
    if (key.endsWith(keyEnd)) return rawPartials[key];
  }
  return undefined;
}

export async function loadPartial(name: string): Promise<string> {
  const hit = findByName(name);
  if (typeof hit === 'string') return hit;

  // 回退：从扩展资源中读取（需确保构建产物中包含该文件）
  try {
    const url = chrome.runtime.getURL(`dashboard/partials/${normalizeName(name)}`);
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.text();
  } catch (e) {
    console.warn('[partialsLoader] Failed to fetch partial:', name, e);
    return '';
  }
}

export interface InjectOptions {
  mode?: 'replace' | 'append' | 'prepend';
}

export async function injectPartial(targetSelector: string, html: string, options: InjectOptions = {}): Promise<boolean> {
  const el = document.querySelector(targetSelector) as HTMLElement | null;
  if (!el) {
    console.warn('[partialsLoader] Target not found:', targetSelector);
    return false;
  }
  const mode = options.mode || 'replace';
  switch (mode) {
    case 'replace':
      el.innerHTML = html;
      break;
    case 'append':
      el.insertAdjacentHTML('beforeend', html);
      break;
    case 'prepend':
      el.insertAdjacentHTML('afterbegin', html);
      break;
  }
  (el as any).dataset.partialLoaded = 'true';
  return true;
}

export async function ensureMounted(targetSelector: string, name: string, options?: InjectOptions): Promise<void> {
  const el = document.querySelector(targetSelector) as HTMLElement | null;
  if (!el) return;

  // 已挂载或已有内容则不再重复注入（兼容现有 DOM）
  if ((el as any).dataset?.partialLoaded === 'true' || el.childElementCount > 0 || (el.textContent || '').trim().length > 0) {
    return;
  }

  const html = await loadPartial(name);
  if (!html) return;
  await injectPartial(targetSelector, html, options);
}
