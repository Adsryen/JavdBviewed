import { quickDiagnose, type DiagnosticResult } from './webdavDiagnostic';
import type { WebDAVClientLog } from '../infrastructure/webdavClient';

export interface WebDAVDiagnosticOptions {
  getSettings: () => Promise<any>;
  logger?: WebDAVClientLog;
}

export function buildWebDAVDiagnosticConfig(webdav: any): { url: string; username: string; password: string } {
  return {
    url: webdav?.url,
    username: webdav?.username,
    password: webdav?.password,
  };
}

export async function testWebDAVConnection(options: WebDAVDiagnosticOptions): Promise<{ success: boolean; error?: string }> {
  const logger = options.logger;
  logger?.('INFO', 'Testing WebDAV connection.');
  const settings = await options.getSettings();
  if (!settings.webdav.url || !settings.webdav.username || !settings.webdav.password) {
    const errorMsg = 'WebDAV connection details are not fully configured.';
    logger?.('WARN', errorMsg);
    return { success: false, error: errorMsg };
  }
  return testWebDAVConnectionWithConfig(
    { url: settings.webdav.url, username: settings.webdav.username, password: settings.webdav.password },
    { logger, getSettings: options.getSettings },
  );
}

export async function testWebDAVConnectionWithConfig(
  config: { url: string; username: string; password: string },
  options: Partial<WebDAVDiagnosticOptions> = {},
): Promise<{ success: boolean; error?: string }> {
  const logger = options.logger;
  logger?.('INFO', 'Testing WebDAV connection with temporary config.');

  if (!config.url || !config.username || !config.password) {
    const errorMsg = 'WebDAV connection details are not fully configured.';
    logger?.('WARN', errorMsg);
    return { success: false, error: errorMsg };
  }

  try {
    let url = config.url;
    if (!url.endsWith('/')) url += '/';
    logger?.('INFO', `Testing connection to: ${url}`);

    const headers: Record<string, string> = {
      Authorization: 'Basic ' + btoa(`${config.username}:${config.password}`),
      Depth: '0',
      'Content-Type': 'application/xml; charset=utf-8',
      'User-Agent': 'JavDB-Extension/1.0',
    };

    const xmlBody = `<?xml version="1.0" encoding="utf-8"?>\n<D:propfind xmlns:D="DAV:">\n    <D:prop>\n        <D:resourcetype/>\n        <D:getcontentlength/>\n        <D:getlastmodified/>\n    </D:prop>\n</D:propfind>`;

    const response = await fetch(url, { method: 'PROPFIND', headers, body: xmlBody });
    logger?.('INFO', `Test response: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const responseText = await response.text();
      logger?.('DEBUG', 'Test response content:', { length: responseText.length, preview: responseText.substring(0, 200) });

      if (responseText.includes('<?xml') || responseText.includes('<multistatus') || responseText.includes('<response')) {
        logger?.('INFO', 'WebDAV connection test successful - server supports WebDAV protocol');
        return { success: true };
      }
      logger?.('WARN', 'Server responded but may not support WebDAV properly');
      return { success: false, error: '服务器响应成功但可能不支持WebDAV协议，请检查URL是否正确' };
    }

    let errorMsg = `Connection test failed with status: ${response.status} ${response.statusText}`;
    if (response.status === 401) errorMsg += ' - 认证失败，请检查用户名和密码';
    else if (response.status === 403) errorMsg += ' - 访问被拒绝，请检查账户权限';
    else if (response.status === 404) errorMsg += ' - WebDAV路径不存在，请检查URL';
    else if (response.status === 405) errorMsg += ' - 服务器不支持WebDAV';
    logger?.('WARN', errorMsg);
    return { success: false, error: errorMsg };
  } catch (error: any) {
    let errorMsg = error.message;
    if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) errorMsg = '网络连接失败，请检查网络连接和服务器地址';
    else if (errorMsg.includes('CORS')) errorMsg = 'CORS错误，可能是服务器配置问题';
    logger?.('ERROR', 'WebDAV connection test failed.', { error: errorMsg, originalError: error.message, url: config.url });
    return { success: false, error: errorMsg };
  }
}

export async function diagnoseWebDAVConnection(options: WebDAVDiagnosticOptions): Promise<{ success: boolean; error?: string; diagnostic?: DiagnosticResult }> {
  const logger = options.logger;
  logger?.('INFO', 'Starting WebDAV diagnostic.');
  const settings = await options.getSettings();
  if (!settings.webdav.url || !settings.webdav.username || !settings.webdav.password) {
    const errorMsg = 'WebDAV connection details are not fully configured.';
    logger?.('WARN', errorMsg);
    return { success: false, error: errorMsg };
  }
  try {
    const diagnostic = await quickDiagnose(buildWebDAVDiagnosticConfig(settings.webdav));
    logger?.('INFO', 'WebDAV diagnostic completed', diagnostic);
    return { success: true, diagnostic };
  } catch (error: any) {
    logger?.('ERROR', 'WebDAV diagnostic failed.', { error: error.message });
    return { success: false, error: error.message };
  }
}
