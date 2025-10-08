// src/dashboard/loaders/stylesLoader.ts
// 动态按需加载样式，避免重复与闪烁

const loadedHrefs = new Set<string>();
const preloadedHrefs = new Set<string>();

// 通过 Vite 构建期收集 dashboard 下的所有 CSS，并将其映射为打包后的 URL
// 使用 ?url 以确保这些文件被复制到构建产物中
const cssAssets = import.meta.glob('../**/*.css', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

function resolveAssetHref(href: string): string {
  try {
    // 将传入的 href（通常形如 './styles/xxx.css' 或 './actors.css'）
    // 映射到打包后的 URL（通常在 /assets/ 下带 hash 的路径）
    const rel = href.replace(/^\.?\/+/, ''); // 去掉开头的 './' 或 '/'
    for (const [key, url] of Object.entries(cssAssets)) {
      // key 形如 '../styles/xxx.css' 或 '../actors.css'，只比较尾部相对路径
      const keyTail = key.replace(/^\.\.\//, '');
      if (keyTail.endsWith(rel)) return url;
    }
  } catch {}
  return href; // 未匹配到则回退为原始 href
}

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

function findExistingPreload(hrefAbs: string): HTMLLinkElement | null {
  const links = document.querySelectorAll<HTMLLinkElement>('head link[rel="preload" i], head link[rel="prefetch" i]');
  for (const link of Array.from(links)) {
    try {
      const linkAbs = new URL(link.getAttribute('href') || '', document.baseURI).href;
      if (linkAbs === hrefAbs) return link;
    } catch {}
  }
  return null;
}

function loadOne(href: string): Promise<void> {
  return new Promise<void>((resolve) => {
    const mapped = resolveAssetHref(href);
    const hrefAbs = normalizeHref(mapped);
    if (loadedHrefs.has(hrefAbs) || findExistingLink(hrefAbs)) {
      loadedHrefs.add(hrefAbs);
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = mapped;
    link.onload = () => {
      loadedHrefs.add(hrefAbs);
      resolve();
    };
    link.onerror = () => {
      // 出错也不要阻塞功能，记录后继续
      console.warn('[stylesLoader] Failed to load style:', mapped);
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

// 预取样式但不应用，用于悬停等提前热身缓存
export async function prefetchStyles(hrefs: string[]): Promise<void> {
  const tasks = (hrefs || [])
    .filter(Boolean)
    .map(async (href) => {
      const mapped = resolveAssetHref(href);
      const hrefAbs = normalizeHref(mapped);
      if (preloadedHrefs.has(hrefAbs) || loadedHrefs.has(hrefAbs) || findExistingLink(hrefAbs) || findExistingPreload(hrefAbs)) {
        preloadedHrefs.add(hrefAbs);
        return;
      }
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'style';
      link.href = mapped;
      link.onload = () => preloadedHrefs.add(hrefAbs);
      link.onerror = () => {
        // 预取失败不影响主流程
        preloadedHrefs.add(hrefAbs);
      };
      document.head.appendChild(link);
    });
  await Promise.all(tasks);
}
