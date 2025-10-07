// src/dashboard/loaders/stylesLoader.ts
// 动态按需加载样式，避免重复与闪烁

const loadedHrefs = new Set<string>();

function normalizeHref(href: string): string {
  try {
    // 统一为绝对 URL，便于与现有 <link> 对比
    return new URL(href, document.baseURI).href;
  } catch {
    return href;
  }
}

function findExistingLink(hrefAbs: string): HTMLLinkElement | null {
  const links = document.querySelectorAll<HTMLLinkElement>('head link[rel="stylesheet"][href]');
  for (const link of Array.from(links)) {
    try {
      const linkAbs = new URL(link.getAttribute('href')!, document.baseURI).href;
      if (linkAbs === hrefAbs) return link;
    } catch {}
  }
  return null;
}

function loadOne(href: string): Promise<void> {
  return new Promise<void>((resolve) => {
    const hrefAbs = normalizeHref(href);
    if (loadedHrefs.has(hrefAbs) || findExistingLink(hrefAbs)) {
      loadedHrefs.add(hrefAbs);
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => {
      loadedHrefs.add(hrefAbs);
      resolve();
    };
    link.onerror = () => {
      // 出错也不要阻塞功能，记录后继续
      console.warn('[stylesLoader] Failed to load style:', href);
      resolve();
    };
    document.head.appendChild(link);
  });
}

export async function ensureStylesLoaded(hrefs: string[]): Promise<void> {
  const tasks = (hrefs || [])
    .filter(Boolean)
    .map(h => loadOne(h));
  await Promise.all(tasks);
}
