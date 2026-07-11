/**
 * @file firefoxManifest.ts
 * @description 将 Chromium 构建产物 manifest 转为 Firefox 可安装形态
 * @module scripts
 */

export const FIREFOX_GECKO_ID = 'jav-assistant@self-hosted.local';
export const FIREFOX_STRICT_MIN_VERSION = '121.0';

/** 与 src/manifest.json 对齐的封面 referer 静态 ruleset 声明 */
export const COVERS_REFERER_RULESET = {
  id: 'covers_referer',
  enabled: true,
  path: 'rules/covers_referer.json',
} as const;

/** DNR 修改请求头所需权限（与 src/manifest.json 对齐） */
export const DECLARATIVE_NET_REQUEST_PERMISSION = 'declarativeNetRequest';

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

type DnrRuleResource = {
  id: string;
  enabled: boolean;
  path: string;
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
  declarative_net_request?: {
    rule_resources?: DnrRuleResource[];
    [key: string]: unknown;
  };
  permissions?: string[];
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
 * 保证 declarativeNetRequest 权限存在（与 rule_resources 配套）。
 */
function ensureDeclarativeNetRequestPermission(
  manifest: ExtensionManifest,
): void {
  const permissions = Array.isArray(manifest.permissions)
    ? [...manifest.permissions]
    : [];
  if (!permissions.includes(DECLARATIVE_NET_REQUEST_PERMISSION)) {
    permissions.push(DECLARATIVE_NET_REQUEST_PERMISSION);
    manifest.permissions = permissions;
  }
}

/**
 * 保证 declarative_net_request.rule_resources 存在，并配套权限。
 * Firefox 部分版本在缺少静态 ruleset 声明时，动态 DNR API 可能不可用或重启后失效。
 */
export function ensureDeclarativeNetRequest(
  manifest: ExtensionManifest,
): ExtensionManifest {
  const existing = manifest.declarative_net_request;
  const resources = existing?.rule_resources;

  if (Array.isArray(resources) && resources.length > 0) {
    // 已有资源：确保 covers_referer 条目存在（路径可被构建复制）
    const hasCovers = resources.some((r) => r?.id === COVERS_REFERER_RULESET.id);
    if (!hasCovers) {
      manifest.declarative_net_request = {
        ...existing,
        rule_resources: [...resources, { ...COVERS_REFERER_RULESET }],
      };
    }
  } else {
    manifest.declarative_net_request = {
      ...(existing || {}),
      rule_resources: [{ ...COVERS_REFERER_RULESET }],
    };
  }

  ensureDeclarativeNetRequestPermission(manifest);
  return manifest;
}

/**
 * 从已构建的 Chromium dist manifest 生成 Firefox 版。
 * - background.service_worker → background.scripts（event page）
 * - 写入 gecko.id 与 strict_min_version
 * - 去掉 Firefox 不识别的 WAR 字段
 * - 保证 declarative_net_request.rule_resources（Firefox DNR 动态 API 前置条件）
 * - 保证 declarativeNetRequest 权限与 ruleset 配套
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

  ensureDeclarativeNetRequest(next);

  return next;
}
