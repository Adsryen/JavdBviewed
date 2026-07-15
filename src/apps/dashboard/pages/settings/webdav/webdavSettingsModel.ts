/**
 * @file webdavSettingsModel.ts
 * @description WebDAV 设置纯数据模型：默认值、映射、校验、配置 CRUD 辅助
 * @module apps/dashboard/pages/settings/webdav
 */
import type { ExtensionSettings, WebDAVConfig } from '../../../../../types';
import { getAlistWebDavUrlHint } from '../../../../../features/webdavSync/domain/paths';

export type WebdavProvider = 'jianguoyun' | 'teracloud' | 'custom';

export type WebdavBackupRange = {
  coreData: boolean;
  actorData: boolean;
  newWorksData: boolean;
  systemConfig: boolean;
  logsData: boolean;
};

/** 表单内配置条目（对齐 WebDAVConfig） */
export type WebdavConfigItem = {
  id: string;
  name: string;
  url: string;
  username: string;
  password: string;
  provider: WebdavProvider;
  createdAt?: number;
  updatedAt: number;
  lastSync: string | null;
};

export type WebdavSettingsFormState = {
  enabled: boolean;
  autoSync: boolean;
  syncInterval: number;
  retentionDays: number;
  warningDays: number;
  backupRange: WebdavBackupRange;
  configs: WebdavConfigItem[];
  activeConfigId: string;
  /** 遗留顶层字段，跟随 activeConfig */
  url: string;
  username: string;
  password: string;
  lastSync: string | null;
  clientId: string;
  deviceLabel: string;
};

export type WebdavConfigModalDraft = {
  name: string;
  url: string;
  folder: string;
  username: string;
  password: string;
  provider: WebdavProvider;
};

export const DEFAULT_BACKUP_RANGE: WebdavBackupRange = {
  coreData: true,
  actorData: true,
  newWorksData: false,
  systemConfig: true,
  logsData: false,
};

export const DEFAULT_WEBDAV_SETTINGS_FORM: WebdavSettingsFormState = {
  enabled: false,
  autoSync: false,
  syncInterval: 30,
  retentionDays: 10,
  warningDays: 7,
  backupRange: { ...DEFAULT_BACKUP_RANGE },
  configs: [],
  activeConfigId: '',
  url: '',
  username: '',
  password: '',
  lastSync: null,
  clientId: '',
  deviceLabel: '',
};

export const EMPTY_CONFIG_MODAL_DRAFT: WebdavConfigModalDraft = {
  name: '',
  url: '',
  folder: '',
  username: '',
  password: '',
  provider: 'custom',
};

export const WEBDAV_PROVIDER_OPTIONS = [
  { value: 'custom', label: '自定义' },
  { value: 'jianguoyun', label: '坚果云' },
  { value: 'teracloud', label: 'TeraCloud' },
] as const;

export const WEBDAV_PROVIDER_URLS: Record<Exclude<WebdavProvider, 'custom'>, string> = {
  jianguoyun: 'https://dav.jianguoyun.com/dav/',
  teracloud: 'https://ogi.teracloud.jp/dav/',
};

export const BACKUP_RANGE_OPTIONS: {
  key: keyof WebdavBackupRange;
  id: string;
  label: string;
  description: string;
}[] = [
  {
    key: 'coreData',
    id: 'webdavBackupCoreData',
    label: '核心数据',
    description: '观看记录、用户资料',
  },
  {
    key: 'actorData',
    id: 'webdavBackupActorData',
    label: '演员数据',
    description: '演员库、演员订阅',
  },
  {
    key: 'newWorksData',
    id: 'webdavBackupNewWorksData',
    label: '新作品数据',
    description: '新作品订阅和记录',
  },
  {
    key: 'systemConfig',
    id: 'webdavBackupSystemConfig',
    label: '系统配置',
    description: '拓展设置、域名配置、搜索引擎等',
  },
  {
    key: 'logsData',
    id: 'webdavBackupLogsData',
    label: '日志数据',
    description: '操作日志（含 115 磁力推送记录）',
  },
];

function parseIntSafe(v: unknown, def: number): number {
  const n = typeof v === 'number' ? v : parseInt(String(v ?? '').trim(), 10);
  return Number.isFinite(n) ? n : def;
}

function asProvider(v: unknown): WebdavProvider {
  if (v === 'jianguoyun' || v === 'teracloud' || v === 'custom') return v;
  return 'custom';
}

/**
 * 规范化配置列表
 */
export function normalizeConfigs(raw: unknown): WebdavConfigItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is WebDAVConfig => !!item && typeof item === 'object')
    .map((item, index) => ({
      id: String(item.id || `config_${index}`),
      name: String(item.name || ''),
      url: String(item.url || ''),
      username: String(item.username || ''),
      password: String(item.password || ''),
      provider: asProvider(item.provider),
      createdAt: typeof item.createdAt === 'number' ? item.createdAt : undefined,
      updatedAt: typeof item.updatedAt === 'number' ? item.updatedAt : Date.now(),
      lastSync: item.lastSync == null ? null : String(item.lastSync),
    }));
}

/**
 * 根据 URL 检测厂商
 */
export function detectProviderType(url: string): WebdavProvider {
  if (url.includes('jianguoyun.com')) return 'jianguoyun';
  if (url.includes('teracloud.jp')) return 'teracloud';
  return 'custom';
}

/**
 * 拆分完整 URL 为基础地址和文件夹
 */
export function splitUrl(fullUrl: string): { baseUrl: string; folder: string } {
  if (!fullUrl) return { baseUrl: '', folder: '' };

  const knownBases = [
    WEBDAV_PROVIDER_URLS.jianguoyun,
    WEBDAV_PROVIDER_URLS.teracloud,
  ];

  for (const base of knownBases) {
    if (fullUrl.startsWith(base)) {
      const folder = fullUrl.substring(base.length).replace(/\/$/, '');
      return { baseUrl: base, folder };
    }
  }

  if (fullUrl.endsWith('/dav/')) {
    return { baseUrl: fullUrl, folder: '' };
  }

  const davIndex = fullUrl.lastIndexOf('/dav/');
  if (davIndex !== -1) {
    const baseUrl = fullUrl.substring(0, davIndex + 5);
    const folder = fullUrl.substring(davIndex + 5).replace(/\/$/, '');
    return { baseUrl, folder };
  }

  const lastSlashIndex = fullUrl.lastIndexOf('/');
  if (lastSlashIndex > 8) {
    const possibleBase = fullUrl.substring(0, lastSlashIndex + 1);
    const possibleFolder = fullUrl.substring(lastSlashIndex + 1);
    if (possibleFolder && !possibleFolder.includes('.')) {
      return { baseUrl: possibleBase, folder: possibleFolder };
    }
  }

  return { baseUrl: fullUrl, folder: '' };
}

/**
 * 合并基础地址和文件夹
 */
export function combineUrl(baseUrl: string, folder: string): string {
  if (!baseUrl) return '';
  if (!folder) return baseUrl;
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const normalizedFolder = folder.replace(/^\/+|\/+$/g, '');
  return normalizedBase + normalizedFolder;
}

/**
 * 厂商中文名
 */
export function getProviderLabel(provider: WebdavProvider | string | undefined): string {
  if (provider === 'jianguoyun') return '坚果云';
  if (provider === 'teracloud') return 'TeraCloud';
  return '自定义';
}

/**
 * 旧版单配置迁移为 configs 列表
 */
export function migrateLegacyWebdavConfig(
  webdav: Record<string, unknown> | null | undefined,
): { configs: WebdavConfigItem[]; activeConfigId: string } | null {
  if (!webdav) return null;
  const url = String(webdav.url || '').trim();
  const username = String(webdav.username || '').trim();
  const configs = normalizeConfigs(webdav.configs);
  if (!url || !username || configs.length > 0) return null;

  const oldConfig: WebdavConfigItem = {
    id: `config_${Date.now()}`,
    name: '默认配置',
    url,
    username,
    password: String(webdav.password || ''),
    provider: detectProviderType(url),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastSync: webdav.lastSync == null ? null : String(webdav.lastSync),
  };
  return { configs: [oldConfig], activeConfigId: oldConfig.id };
}

/**
 * 从完整设置映射为 WebDAV 表单
 */
export function mapSettingsToWebdavForm(
  settings: Partial<ExtensionSettings> | null | undefined,
): WebdavSettingsFormState {
  const webdav = ((settings as any)?.webdav || {}) as Record<string, unknown>;
  const migrated = migrateLegacyWebdavConfig(webdav);
  const configs = migrated?.configs ?? normalizeConfigs(webdav.configs);
  const activeConfigId = String(
    migrated?.activeConfigId ??
      webdav.activeConfigId ??
      configs[0]?.id ??
      '',
  );
  const active = configs.find((c) => c.id === activeConfigId);
  const backupRaw = (webdav.backupRange || {}) as Partial<WebdavBackupRange>;

  return {
    enabled: !!webdav.enabled,
    autoSync: !!webdav.autoSync,
    // 对齐遗留 doLoadSettings：缺省 30 分钟
    syncInterval: parseIntSafe(webdav.syncInterval, 30) || 30,
    // 对齐遗留：undefined 时用 7；0 合法
    retentionDays:
      webdav.retentionDays === undefined || webdav.retentionDays === null
        ? 7
        : parseIntSafe(webdav.retentionDays, 7),
    warningDays:
      webdav.warningDays === undefined || webdav.warningDays === null
        ? 7
        : parseIntSafe(webdav.warningDays, 7),
    backupRange: {
      coreData: backupRaw.coreData !== false,
      actorData: backupRaw.actorData !== false,
      newWorksData: !!backupRaw.newWorksData,
      systemConfig: backupRaw.systemConfig !== false,
      logsData: !!backupRaw.logsData,
    },
    configs,
    activeConfigId,
    url: String(active?.url ?? webdav.url ?? ''),
    username: String(active?.username ?? webdav.username ?? ''),
    password: String(active?.password ?? webdav.password ?? ''),
    lastSync:
      active?.lastSync != null
        ? active.lastSync
        : webdav.lastSync == null
          ? null
          : String(webdav.lastSync),
    clientId: String(webdav.clientId || ''),
    deviceLabel: String(webdav.deviceLabel || ''),
  };
}

/**
 * 将表单合并回 ExtensionSettings.webdav
 */
export function applyWebdavFormToSettings(
  current: ExtensionSettings,
  form: WebdavSettingsFormState,
): ExtensionSettings {
  const active =
    form.configs.find((c) => c.id === form.activeConfigId) || form.configs[0];
  return {
    ...current,
    webdav: {
      ...((current as any).webdav || {}),
      enabled: form.enabled,
      autoSync: form.autoSync,
      syncInterval: form.syncInterval,
      retentionDays: form.retentionDays,
      warningDays: form.warningDays,
      backupRange: { ...form.backupRange },
      configs: form.configs.map((c) => ({ ...c })),
      activeConfigId: form.activeConfigId || active?.id || undefined,
      url: active?.url ?? form.url ?? '',
      username: active?.username ?? form.username ?? '',
      password: active?.password ?? form.password ?? '',
      lastSync: active?.lastSync ?? form.lastSync ?? null,
      clientId: form.clientId,
      deviceLabel: form.deviceLabel,
    },
  } as ExtensionSettings;
}

/**
 * 校验全局表单（启用时才强制完整配置）
 */
export function validateWebdavForm(form: WebdavSettingsFormState): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (form.enabled) {
    if (!form.activeConfigId) {
      errors.push('请先添加并选择一个 WebDAV 配置');
    }
    if (
      !Number.isFinite(form.syncInterval) ||
      form.syncInterval < 5 ||
      form.syncInterval > 1440
    ) {
      errors.push('同步间隔必须在5-1440分钟之间');
    }
    if (
      !Number.isFinite(form.retentionDays) ||
      form.retentionDays < 0 ||
      form.retentionDays > 9999
    ) {
      errors.push('每设备保留备份数量必须在0-9999之间');
    }
    if (
      !Number.isFinite(form.warningDays) ||
      form.warningDays < 0 ||
      form.warningDays > 3650
    ) {
      errors.push('未备份预警天数必须在0-3650之间');
    }
    const range = form.backupRange;
    const hasBackupContent =
      range.coreData ||
      range.actorData ||
      range.newWorksData ||
      range.systemConfig ||
      range.logsData;
    if (!hasBackupContent) {
      errors.push('请至少选择一项要备份的数据');
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * 校验弹窗配置草稿
 */
export function validateConfigModalDraft(
  draft: WebdavConfigModalDraft,
  requireName = true,
): { ok: boolean; message?: string; fullUrl?: string } {
  const name = draft.name.trim();
  const fullUrl = combineUrl(draft.url.trim(), draft.folder.trim());
  const username = draft.username.trim();
  const password = draft.password;

  if (requireName && !name) return { ok: false, message: '请输入配置名称' };
  if (!fullUrl) return { ok: false, message: '请输入 WebDAV 地址' };
  if (!username) return { ok: false, message: '请输入用户名' };
  if (!password) return { ok: false, message: '请输入密码' };
  return { ok: true, fullUrl };
}

/**
 * 由草稿生成 / 更新配置项
 */
export function upsertConfigFromDraft(
  configs: WebdavConfigItem[],
  draft: WebdavConfigModalDraft,
  editingId: string | null,
): { configs: WebdavConfigItem[]; savedConfigId: string } {
  const fullUrl = combineUrl(draft.url.trim(), draft.folder.trim());
  const name = draft.name.trim();
  const username = draft.username.trim();
  const password = draft.password;
  const provider = draft.provider;
  const now = Date.now();

  if (editingId) {
    const next = configs.map((c) =>
      c.id === editingId
        ? {
            ...c,
            name,
            url: fullUrl,
            username,
            password,
            provider,
            updatedAt: now,
          }
        : c,
    );
    return { configs: next, savedConfigId: editingId };
  }

  const savedConfigId = `config_${now}_${Math.random().toString(36).slice(2, 8)}`;
  const newConfig: WebdavConfigItem = {
    id: savedConfigId,
    name,
    url: fullUrl,
    username,
    password,
    provider,
    createdAt: now,
    updatedAt: now,
    lastSync: null,
  };
  return { configs: [...configs, newConfig], savedConfigId };
}

/**
 * 切换默认备份端
 */
export function switchActiveConfig(
  form: WebdavSettingsFormState,
  configId: string,
): WebdavSettingsFormState {
  const config = form.configs.find((c) => c.id === configId);
  if (!config) return form;
  return {
    ...form,
    activeConfigId: configId,
    url: config.url,
    username: config.username,
    password: config.password,
    lastSync: config.lastSync || form.lastSync,
  };
}

/**
 * 删除配置并重算 active
 */
export function deleteConfig(
  form: WebdavSettingsFormState,
  configId: string,
): WebdavSettingsFormState {
  const newConfigs = form.configs.filter((c) => c.id !== configId);
  let activeConfigId = form.activeConfigId;
  if (configId === activeConfigId) {
    activeConfigId = newConfigs[0]?.id || '';
  }
  const active = newConfigs.find((c) => c.id === activeConfigId);
  return {
    ...form,
    configs: newConfigs,
    activeConfigId,
    url: active?.url || '',
    username: active?.username || '',
    password: active?.password || '',
    lastSync: active?.lastSync ?? null,
  };
}

/**
 * 厂商变更时填充 URL / 默认名
 */
export function applyProviderToDraft(
  draft: WebdavConfigModalDraft,
  provider: WebdavProvider,
  isAddMode: boolean,
): WebdavConfigModalDraft {
  const next: WebdavConfigModalDraft = { ...draft, provider };
  const currentName = draft.name.trim();
  const isDefaultName =
    !currentName || currentName === '坚果云' || currentName === 'TeraCloud';

  if (provider === 'jianguoyun') {
    next.url = WEBDAV_PROVIDER_URLS.jianguoyun;
    if (isAddMode && isDefaultName) next.name = '坚果云';
  } else if (provider === 'teracloud') {
    next.url = WEBDAV_PROVIDER_URLS.teracloud;
    if (isAddMode && isDefaultName) next.name = 'TeraCloud';
  } else if (isAddMode && (currentName === '坚果云' || currentName === 'TeraCloud')) {
    next.name = '';
  }
  return next;
}

/**
 * 从完整 URL 填充草稿的 base + folder
 */
export function draftFromConfig(config: WebdavConfigItem): WebdavConfigModalDraft {
  const { baseUrl, folder } = splitUrl(config.url);
  return {
    name: config.name,
    url: baseUrl,
    folder,
    username: config.username,
    password: config.password,
    provider: config.provider || 'custom',
  };
}

/**
 * Alist URL 提示（自定义厂商）
 */
export function getModalAlistHint(
  provider: WebdavProvider,
  baseUrl: string,
  folder: string,
): { message: string; suggestedUrl: string } | null {
  if (provider !== 'custom') return null;
  const fullUrl = combineUrl(baseUrl.trim(), folder.trim());
  const hint = getAlistWebDavUrlHint(fullUrl);
  if (!hint) return null;
  return { message: hint.message, suggestedUrl: hint.suggestedUrl };
}

/**
 * 友好化连接错误
 */
export function friendlyWebdavError(errorMsg: string): string {
  if (errorMsg.includes('401')) return '用户名或密码错误';
  if (errorMsg.includes('404')) return '服务器地址不存在';
  if (errorMsg.includes('403')) return '没有访问权限';
  if (errorMsg.includes('timeout') || errorMsg.includes('网络')) return '网络超时';
  if (errorMsg.includes('not fully configured')) return '配置信息不完整';
  return errorMsg;
}

/**
 * 格式化下次同步文案
 */
export function formatNextSyncLabel(
  enabled: boolean,
  autoSync: boolean,
  scheduledTime?: number | string | null,
): string {
  if (!enabled || !autoSync) return '（未启用）';
  if (!scheduledTime) return '';
  try {
    const d = new Date(scheduledTime);
    return `下次：${d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return '';
  }
}

/**
 * 格式化设备时间
 */
export function formatDeviceTime(value?: string | number | null): string {
  if (value == null || value === '') return '未知';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return '未知';
  }
}
