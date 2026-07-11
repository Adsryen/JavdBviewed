/**
 * @file firefoxManifest.ts
 * @description 将 Chromium 构建产物 manifest 转为 Firefox 可安装形态
 * @module scripts
 */

export const FIREFOX_GECKO_ID = 'jav-assistant@self-hosted.local';
export const FIREFOX_STRICT_MIN_VERSION = '121.0';

type ManifestBackground = {
  service_worker?: string;
  scripts?: string[];
  type?: string;
  persistent?: boolean;
};

type WebAccessibleResource = {
  use_dynamic_url?: boolean;
  [key: string]: unknown;
};

export type ExtensionManifest = {
  manifest_version: number;
  background?: ManifestBackground;
  browser_specific_settings?: {
    gecko?: {
      id?: string;
      strict_min_version?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  web_accessible_resources?: WebAccessibleResource[];
  [key: string]: unknown;
};

function stripUnsupportedWarFields(
  resources: WebAccessibleResource[] | undefined,
): WebAccessibleResource[] | undefined {
  if (!Array.isArray(resources)) return resources;
  return resources.map((entry) => {
    const next = { ...entry };
    // Chrome/crxjs may emit use_dynamic_url; Firefox rejects it as unexpected.
    delete next.use_dynamic_url;
    return next;
  });
}

/**
 * 从已构建的 Chromium dist manifest 生成 Firefox 版。
 * - background.service_worker → background.scripts（event page）
 * - 写入 gecko.id 与 strict_min_version
 * - 去掉 Firefox 不识别的 WAR 字段
 * - 不改动 permissions / content_scripts 等业务字段
 */
export function toFirefoxManifest(source: ExtensionManifest): ExtensionManifest {
  if (source.manifest_version !== 3) {
    throw new Error(`Firefox transform expects MV3, got ${source.manifest_version}`);
  }

  const next: ExtensionManifest = JSON.parse(JSON.stringify(source));
  const bg = next.background;
  if (!bg) {
    throw new Error('Firefox transform requires background entry');
  }

  const worker = bg.service_worker;
  if (!worker || typeof worker !== 'string') {
    throw new Error('Firefox transform requires background.service_worker from Chromium build');
  }

  next.background = {
    scripts: [worker],
    type: bg.type === 'module' ? 'module' : undefined,
  };
  if (!next.background.type) {
    delete next.background.type;
  }

  next.browser_specific_settings = {
    ...(next.browser_specific_settings || {}),
    gecko: {
      ...(next.browser_specific_settings?.gecko || {}),
      id: FIREFOX_GECKO_ID,
      strict_min_version: FIREFOX_STRICT_MIN_VERSION,
    },
  };

  if (next.web_accessible_resources) {
    next.web_accessible_resources = stripUnsupportedWarFields(next.web_accessible_resources);
  }

  return next;
}