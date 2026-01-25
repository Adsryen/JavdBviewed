// src/services/update/checker.ts
// 负责从 GitHub Releases 检查扩展更新，并进行版本比较

export interface UpdateCheckResult {
  currentVersion: string;
  latestVersion?: string;
  hasUpdate: boolean;
  releaseUrl?: string;
  changelog?: string;
  error?: string;
}

// 获取当前扩展版本（从 manifest 读取，适用于 background/service worker）
export function getCurrentVersion(): string {
  try {
    const manifest = chrome.runtime.getManifest();
    return manifest.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

// 语义化版本比较：a > b 返回 1，a < b 返回 -1，相等返回 0
export function compareSemver(a: string, b: string): number {
  const norm = (v: string) => v.replace(/^v/i, '');
  const [aMain, aPre = ''] = norm(a).split('-', 2);
  const [bMain, bPre = ''] = norm(b).split('-', 2);

  const aNums = aMain.split('.').map(n => parseInt(n || '0', 10));
  const bNums = bMain.split('.').map(n => parseInt(n || '0', 10));

  for (let i = 0; i < Math.max(aNums.length, bNums.length); i++) {
    const ai = aNums[i] || 0;
    const bi = bNums[i] || 0;
    if (ai > bi) return 1;
    if (ai < bi) return -1;
  }

  // 主版本相等时，处理预发布标签：无预发布 > 有预发布
  if (aPre && !bPre) return -1;
  if (!aPre && bPre) return 1;
  if (aPre === bPre) return 0;
  return aPre > bPre ? 1 : -1;
}

interface GitHubRelease {
  html_url: string;
  tag_name?: string;
  name?: string;
  prerelease?: boolean;
  body?: string;
}

// 从 GitHub 获取最新 release（默认不包含 pre-release）
export async function fetchLatestRelease(includePrerelease = false): Promise<GitHubRelease | null> {
  try {
    // 方案1: 尝试通过 jsdelivr 获取 releases 列表
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8秒超时
    
    // jsdelivr 可以访问 GitHub releases 的文件
    // 先尝试获取最新的 release tag
    const resp = await fetch(
      'https://api.github.com/repos/Adsryen/JavdBviewed/releases',
      { 
        headers: { 
          'Accept': 'application/vnd.github+json',
          'User-Agent': 'Mozilla/5.0' // 添加 User-Agent 可能有助于避免限制
        },
        cache: 'no-cache',
        signal: controller.signal
      }
    );
    
    clearTimeout(timeoutId);
    
    if (!resp.ok) {
      // 如果 API 失败，尝试备用方案：从 jsdelivr 获取 tags
      console.warn(`GitHub API ${resp.status}, trying fallback method...`);
      return await fetchLatestReleaseFromJsDelivr();
    }
    
    const releases = (await resp.json()) as GitHubRelease[];
    
    if (!releases || releases.length === 0) return null;
    
    // 过滤预发布版本
    const filteredReleases = includePrerelease 
      ? releases 
      : releases.filter(r => !r.prerelease);
    
    if (filteredReleases.length === 0) return null;
    
    // 返回第一个（最新的）release
    return filteredReleases[0];
    
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Request timeout after 8 seconds');
    }
    console.warn('Primary method failed, trying fallback:', err);
    // 尝试备用方案
    return await fetchLatestReleaseFromJsDelivr();
  }
}

// 备用方案：从 jsdelivr 获取版本信息
async function fetchLatestReleaseFromJsDelivr(): Promise<GitHubRelease | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    // 使用 jsdelivr 的 API 获取所有版本
    const resp = await fetch(
      'https://data.jsdelivr.com/v1/packages/gh/Adsryen/JavdBviewed',
      {
        signal: controller.signal,
        cache: 'no-cache'
      }
    );
    
    clearTimeout(timeoutId);
    
    if (!resp.ok) throw new Error(`jsdelivr API ${resp.status}`);
    
    const data = await resp.json();
    
    // jsdelivr 返回的数据包含 tags 数组
    if (data && data.tags && data.tags.length > 0) {
      // 获取最新的 tag（通常是第一个）
      const latestTag = data.tags[0];
      
      return {
        html_url: 'https://github.com/Adsryen/JavdBviewed/releases/latest',
        tag_name: latestTag,
        name: latestTag,
        prerelease: false,
        body: ''
      };
    }
    
    throw new Error('No tags found in jsdelivr response');
  } catch (err: any) {
    throw new Error(`Fallback method failed: ${err?.message || String(err)}`);
  }
}

export async function checkForUpdates(includePrerelease = false): Promise<UpdateCheckResult> {
  const current = getCurrentVersion();
  try {
    const release = await fetchLatestRelease(includePrerelease);
    if (!release) {
      return { currentVersion: current, hasUpdate: false };
    }
    const latest = release.tag_name || release.name || current;
    const hasUpdate = compareSemver(latest, current) > 0;
    return {
      currentVersion: current,
      latestVersion: latest,
      hasUpdate,
      releaseUrl: release.html_url,
      changelog: release.body,
    };
  } catch (err: any) {
    return { currentVersion: current, hasUpdate: false, error: err?.message || String(err) };
  }
}

