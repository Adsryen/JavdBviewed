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
  const url = 'https://api.github.com/repos/Adsryen/JavdBviewed/releases/latest';
  const resp = await fetch(url, { headers: { 'Accept': 'application/vnd.github+json' } });
  if (!resp.ok) throw new Error(`GitHub API ${resp.status}`);
  const data = (await resp.json()) as GitHubRelease;
  if (data && data.tag_name) {
    if (!includePrerelease && data.prerelease) return null;
    return data;
  }
  return null;
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

