import type { CloudflareVerificationResult } from '../domain/types';

const log = (...args: any[]) => console.log('[Sync]', ...args);

export async function fetchHtml(url: string): Promise<string> {
  log(`[fetchHtml] Fetching URL: ${url}`);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
    },
    credentials: 'include',
  });

  log(`[fetchHtml] Response status for ${url}: ${response.status}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }

  const html = await response.text();
  log(`[fetchHtml] Fetched ${html.length} bytes of HTML from ${url}.`);

  if (isCloudflareChallenge(html)) {
    log(`[fetchHtml] Cloudflare challenge detected for ${url}`);
    const verificationResult = await requestCloudflareVerification(url);

    if (!verificationResult.success || !verificationResult.html) {
      throw new Error(verificationResult.error || 'Cloudflare 验证失败');
    }

    log(`[fetchHtml] Received HTML from verification tab, ${verificationResult.html.length} bytes`);
    if (isCloudflareChallenge(verificationResult.html)) {
      throw new Error('验证后仍然遇到 Cloudflare 挑战，请重试');
    }

    return verificationResult.html;
  }

  return html;
}

export function isCloudflareChallenge(html: string): boolean {
  const hasSecurityVerification = html.includes('Security Verification');
  const hasCompleteSecurityCheck = html.includes('Please complete the security check');
  const hasChallengeForm = html.includes('cf-challenge') || html.includes('cf_chl_opt');

  const hasNormalContent = html.includes('video-meta')
    || html.includes('movie-list')
    || html.includes('video-detail')
    || html.includes('panel-block');

  if (hasNormalContent) {
    return false;
  }

  return (hasSecurityVerification || hasCompleteSecurityCheck) && hasChallengeForm;
}

export async function requestCloudflareVerification(url: string): Promise<CloudflareVerificationResult> {
  return new Promise((resolve) => {
    chrome.tabs.query({ url: chrome.runtime.getURL('dashboard/dashboard.html') }, (tabs) => {
      if (!tabs || tabs.length === 0 || !tabs[0].id) {
        resolve({ success: false, error: '未找到管理面板，请打开管理面板后重试' });
        return;
      }

      const dashboardTabId = tabs[0].id;
      chrome.tabs.sendMessage(dashboardTabId, {
        type: 'cloudflare-verification-request',
        url,
      }, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ success: false, error: '无法与管理面板通信' });
          return;
        }

        resolve(response || { success: false, error: '验证失败' });
      });
    });
  });
}
