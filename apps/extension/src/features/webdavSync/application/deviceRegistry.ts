/**
 * @file deviceRegistry.ts
 * @description WebDAV 本地已知设备清单合并逻辑
 * @module features/webdavSync
 */
import type {
  WebDAVClientProfile,
  WebDAVKnownDevice,
  WebDAVKnownDeviceView,
  WebDAVKnownDeviceSource,
  WebDAVUploadIndexItem,
} from '../domain/types';

export interface WebDAVKnownDeviceSourceInput {
  configId?: string;
  configName?: string;
  urlFingerprint?: string;
  seenAt?: number | string;
  firstSeenAt?: number | string;
  lastSeenAt?: number | string;
  hasClientProfile?: boolean;
  hasBackup?: boolean;
  lastUploadId?: string;
  lastUploadAt?: number | string;
}

export interface WebDAVKnownDeviceInput {
  profile: WebDAVClientProfile;
  source?: WebDAVKnownDeviceSourceInput;
  preferDeviceLabel?: boolean;
}

export interface MergeKnownDevicesOptions {
  now?: number;
  currentProfile?: WebDAVClientProfile;
  currentSource?: WebDAVKnownDeviceSourceInput;
}

export interface BuildKnownDeviceInputsFromRemoteStateOptions {
  profiles: readonly WebDAVClientProfile[];
  uploadItems: readonly WebDAVUploadIndexItem[];
  source: WebDAVKnownDeviceSourceInput;
  now?: number;
}

export function mergeKnownDevices(
  existingDevices: readonly WebDAVKnownDevice[],
  incomingDevices: readonly WebDAVKnownDeviceInput[],
  options: MergeKnownDevicesOptions = {},
): WebDAVKnownDevice[] {
  const now = normalizeMillis(options.now, Date.now());
  const devicesById = new Map<string, WebDAVKnownDevice>();

  for (const existing of existingDevices) {
    const normalized = normalizeKnownDevice(existing, now);
    if (normalized) {
      const current = devicesById.get(normalized.clientId);
      devicesById.set(normalized.clientId, current ? mergeKnownDeviceRecord(current, normalized) : normalized);
    }
  }

  for (const incoming of incomingDevices) {
    mergeIncomingDevice(devicesById, incoming, now);
  }

  if (options.currentProfile) {
    mergeIncomingDevice(devicesById, {
      profile: options.currentProfile,
      source: options.currentSource,
      preferDeviceLabel: true,
    }, now);
  }

  return Array.from(devicesById.values())
    .sort((left, right) => {
      if (right.lastKnownAt !== left.lastKnownAt) return right.lastKnownAt - left.lastKnownAt;
      return left.deviceLabel.localeCompare(right.deviceLabel, 'zh-Hans-CN');
    });
}

export function buildKnownDeviceInputsFromRemoteState(
  options: BuildKnownDeviceInputsFromRemoteStateOptions,
): WebDAVKnownDeviceInput[] {
  const now = normalizeMillis(options.now, Date.now());
  const source = normalizeSourceInput(options.source, now);
  const remoteDevicesById = new Map<string, {
    profile?: WebDAVClientProfile;
    hasClientProfile: boolean;
    latestUpload?: WebDAVUploadIndexItem;
  }>();

  for (const profile of options.profiles) {
    const normalizedProfile = normalizeProfile(profile);
    if (!normalizedProfile) continue;
    remoteDevicesById.set(normalizedProfile.clientId, {
      ...(remoteDevicesById.get(normalizedProfile.clientId) || {}),
      profile: normalizedProfile,
      hasClientProfile: true,
    });
  }

  for (const item of options.uploadItems) {
    if (!isSuccessfulUploadIndexItem(item)) continue;
    const clientId = String(item.clientId || '').trim();
    if (!clientId) continue;

    const existing = remoteDevicesById.get(clientId);
    const latestUpload = chooseLatestUpload(existing?.latestUpload, item);
    remoteDevicesById.set(clientId, {
      ...(existing || { hasClientProfile: false }),
      latestUpload,
    });
  }

  const inputs: WebDAVKnownDeviceInput[] = [];
  for (const entry of remoteDevicesById.values()) {
    const profile = buildRemoteStateProfile(entry);
    if (!profile) continue;
    const uploadAt = parseMillis(entry.latestUpload?.uploadedAt);
    const lastSeenAt = Math.max(
      source?.lastSeenAt ?? now,
      uploadAt ?? 0,
      parseMillis(profile.lastSeenAt) ?? 0,
      parseMillis(profile.lastSyncAt) ?? 0,
    );
    inputs.push({
      profile,
      source: {
        ...options.source,
        seenAt: lastSeenAt,
        hasClientProfile: entry.hasClientProfile === true,
        hasBackup: !!entry.latestUpload,
        lastUploadId: entry.latestUpload?.uploadId,
        lastUploadAt: uploadAt,
      },
    });
  }
  return inputs;
}

export function buildKnownDeviceViews(
  knownDevices: readonly WebDAVKnownDevice[],
  currentClientId: string,
  currentSource: WebDAVKnownDeviceSourceInput,
): WebDAVKnownDeviceView[] {
  const now = Date.now();
  const normalizedSource = normalizeSourceInput(currentSource, now);
  const sourceKey = normalizedSource ? getSourceKey(normalizedSource) : '';
  const safeCurrentClientId = String(currentClientId || '').trim();

  return knownDevices.map((device) => {
    const remoteSource = sourceKey
      ? device.sources.find((source) => getSourceKey(source) === sourceKey)
      : undefined;

    return {
      ...device,
      isCurrent: !!safeCurrentClientId && device.clientId === safeCurrentClientId,
      currentRemote: {
        configId: normalizedSource?.configId ?? '',
        configName: normalizedSource?.configName,
        hasClientProfile: remoteSource?.hasClientProfile === true,
        hasBackup: remoteSource?.hasBackup === true,
        lastUploadId: remoteSource?.lastUploadId,
        lastUploadAt: remoteSource?.lastUploadAt,
      },
    };
  });
}

export function buildMissingRemoteClientProfiles(
  knownDevices: readonly WebDAVKnownDevice[],
  remoteProfiles: readonly WebDAVClientProfile[],
): WebDAVClientProfile[] {
  const remoteClientIds = new Set(
    remoteProfiles
      .map((profile) => String(profile.clientId || '').trim())
      .filter(Boolean),
  );

  return knownDevices
    .filter((device) => {
      const clientId = String(device.clientId || '').trim();
      return !!clientId && !remoteClientIds.has(clientId);
    })
    .map((device) => toClientProfile(device));
}

function mergeIncomingDevice(
  devicesById: Map<string, WebDAVKnownDevice>,
  incoming: WebDAVKnownDeviceInput,
  now: number,
): void {
  const profile = normalizeProfile(incoming.profile);
  if (!profile) return;

  const existing = devicesById.get(profile.clientId);
  const source = normalizeSourceInput(incoming.source, now);
  const profileKnownAt = getProfileKnownAt(profile, now);
  const sourceKnownAt = source?.lastSeenAt ?? now;
  const incomingKnownAt = Math.max(profileKnownAt, sourceKnownAt);

  if (!existing) {
    const firstSource = source ?? undefined;
    devicesById.set(profile.clientId, {
      ...profile,
      firstSeenAt: getFirstSeenAt(profile, firstSource, now),
      lastKnownAt: incomingKnownAt,
      sources: source ? [source] : [],
    });
    return;
  }

  devicesById.set(profile.clientId, {
    ...mergeProfiles(existing, profile, incoming.preferDeviceLabel === true),
    firstSeenAt: Math.min(existing.firstSeenAt, getFirstSeenAt(profile, source ?? undefined, now)),
    lastKnownAt: Math.max(existing.lastKnownAt, incomingKnownAt),
    sources: mergeSources(existing.sources, source),
  });
}

function normalizeKnownDevice(value: WebDAVKnownDevice, now: number): WebDAVKnownDevice | null {
  const profile = normalizeProfile(value);
  if (!profile) return null;

  const firstSeenAt = normalizeMillis(value.firstSeenAt, getFirstSeenAt(profile, undefined, now));
  const lastKnownAt = normalizeMillis(value.lastKnownAt, Math.max(getProfileKnownAt(profile, now), firstSeenAt));
  const sources = Array.isArray(value.sources)
    ? value.sources
      .map((source) => normalizeSourceInput(source, now))
      .filter((source): source is WebDAVKnownDeviceSource => source !== null)
    : [];

  return {
    ...profile,
    firstSeenAt,
    lastKnownAt,
    sources,
  };
}

function mergeKnownDeviceRecord(existing: WebDAVKnownDevice, incoming: WebDAVKnownDevice): WebDAVKnownDevice {
  return {
    ...mergeProfiles(existing, incoming, false),
    firstSeenAt: Math.min(existing.firstSeenAt, incoming.firstSeenAt),
    lastKnownAt: Math.max(existing.lastKnownAt, incoming.lastKnownAt),
    sources: mergeSourceCollection(existing.sources, incoming.sources),
  };
}

function normalizeProfile(profile: WebDAVClientProfile): WebDAVClientProfile | null {
  const clientId = String(profile?.clientId || '').trim();
  if (!clientId) return null;

  return {
    clientId,
    deviceLabel: String(profile.deviceLabel || clientId).trim() || clientId,
    browserName: String(profile.browserName || 'Unknown Chromium').trim() || 'Unknown Chromium',
    platform: trimOptional(profile.platform),
    extensionVersion: trimOptional(profile.extensionVersion),
    installedAt: trimOptional(profile.installedAt),
    lastSeenAt: trimOptional(profile.lastSeenAt),
    lastSyncAt: trimOptional(profile.lastSyncAt),
    lastSyncStatus: profile.lastSyncStatus,
    lastUploadId: trimOptional(profile.lastUploadId),
    disabled: profile.disabled === true,
  };
}

function mergeProfiles(
  existing: WebDAVKnownDevice,
  incoming: WebDAVClientProfile,
  preferIncomingDeviceLabel: boolean,
): WebDAVClientProfile {
  return {
    clientId: existing.clientId,
    deviceLabel: chooseDeviceLabel(existing.deviceLabel, incoming.deviceLabel, existing.clientId, preferIncomingDeviceLabel),
    browserName: chooseString(incoming.browserName, existing.browserName, 'Unknown Chromium') || 'Unknown Chromium',
    platform: chooseString(incoming.platform, existing.platform),
    extensionVersion: chooseString(incoming.extensionVersion, existing.extensionVersion),
    installedAt: chooseEarlierIso(existing.installedAt, incoming.installedAt),
    lastSeenAt: chooseLaterIso(existing.lastSeenAt, incoming.lastSeenAt),
    lastSyncAt: chooseLaterIso(existing.lastSyncAt, incoming.lastSyncAt),
    lastSyncStatus: incoming.lastSyncStatus ?? existing.lastSyncStatus,
    lastUploadId: chooseString(incoming.lastUploadId, existing.lastUploadId),
    disabled: incoming.disabled === true || existing.disabled === true,
  };
}

function buildRemoteStateProfile(entry: {
  profile?: WebDAVClientProfile;
  hasClientProfile: boolean;
  latestUpload?: WebDAVUploadIndexItem;
}): WebDAVClientProfile | null {
  if (entry.profile && !entry.latestUpload) return entry.profile;

  if (entry.profile && entry.latestUpload) {
    return {
      ...entry.profile,
      lastSyncAt: chooseLaterIso(entry.profile.lastSyncAt, entry.latestUpload.uploadedAt),
      lastSyncStatus: entry.latestUpload.status,
      lastUploadId: entry.latestUpload.uploadId,
    };
  }

  const upload = entry.latestUpload;
  const clientId = String(upload?.clientId || '').trim();
  if (!upload || !clientId) return null;

  return {
    clientId,
    deviceLabel: String(upload.deviceLabel || clientId).trim() || clientId,
    browserName: String(upload.browserName || 'Unknown Chromium').trim() || 'Unknown Chromium',
    lastSeenAt: upload.uploadedAt,
    lastSyncAt: upload.uploadedAt,
    lastSyncStatus: upload.status,
    lastUploadId: upload.uploadId,
  };
}

function toClientProfile(device: WebDAVKnownDevice): WebDAVClientProfile {
  return {
    clientId: device.clientId,
    deviceLabel: device.deviceLabel,
    browserName: device.browserName,
    platform: device.platform,
    extensionVersion: device.extensionVersion,
    installedAt: device.installedAt,
    lastSeenAt: device.lastSeenAt,
    lastSyncAt: device.lastSyncAt,
    lastSyncStatus: device.lastSyncStatus,
    lastUploadId: device.lastUploadId,
    disabled: device.disabled,
  };
}

function isSuccessfulUploadIndexItem(item: WebDAVUploadIndexItem): boolean {
  return item?.status === 'success' && !!String(item.file || '').trim();
}

function chooseLatestUpload(
  left: WebDAVUploadIndexItem | undefined,
  right: WebDAVUploadIndexItem,
): WebDAVUploadIndexItem {
  const leftMillis = parseMillis(left?.uploadedAt) ?? 0;
  const rightMillis = parseMillis(right.uploadedAt) ?? 0;
  return rightMillis >= leftMillis ? right : left ?? right;
}

function normalizeSourceInput(
  source: WebDAVKnownDeviceSourceInput | undefined,
  now: number,
): WebDAVKnownDeviceSource | null {
  if (!source) return null;
  const configId = String(source.configId || '').trim() || 'local';
  const urlFingerprint = String(source.urlFingerprint || '').trim() || configId;
  const seenAt = normalizeMillis(source.seenAt, now);
  const firstSeenAt = normalizeMillis(source.firstSeenAt, seenAt);
  const lastSeenAt = normalizeMillis(source.lastSeenAt, seenAt);
  const lastUploadAt = source.lastUploadAt === undefined ? undefined : normalizeMillis(source.lastUploadAt, 0);

  return {
    configId,
    configName: trimOptional(source.configName),
    urlFingerprint,
    firstSeenAt,
    lastSeenAt,
    hasClientProfile: source.hasClientProfile === true,
    hasBackup: source.hasBackup === true,
    lastUploadId: trimOptional(source.lastUploadId),
    lastUploadAt: lastUploadAt && lastUploadAt > 0 ? lastUploadAt : undefined,
  };
}

function mergeSources(
  existingSources: readonly WebDAVKnownDeviceSource[],
  incomingSource: WebDAVKnownDeviceSource | null,
): WebDAVKnownDeviceSource[] {
  const sourcesByKey = new Map<string, WebDAVKnownDeviceSource>();

  for (const source of existingSources) {
    const normalized = normalizeSourceInput(source, Date.now());
    if (!normalized) continue;
    sourcesByKey.set(getSourceKey(normalized), normalized);
  }

  if (incomingSource) {
    const key = getSourceKey(incomingSource);
    const existing = sourcesByKey.get(key);
    sourcesByKey.set(key, existing ? mergeSource(existing, incomingSource) : incomingSource);
  }

  return Array.from(sourcesByKey.values())
    .sort((left, right) => right.lastSeenAt - left.lastSeenAt);
}

function mergeSourceCollection(
  existingSources: readonly WebDAVKnownDeviceSource[],
  incomingSources: readonly WebDAVKnownDeviceSource[],
): WebDAVKnownDeviceSource[] {
  let merged = [...existingSources];
  for (const source of incomingSources) {
    merged = mergeSources(merged, source);
  }
  return merged;
}

function mergeSource(existing: WebDAVKnownDeviceSource, incoming: WebDAVKnownDeviceSource): WebDAVKnownDeviceSource {
  const hasNewerUpload = (incoming.lastUploadAt ?? 0) >= (existing.lastUploadAt ?? 0);
  return {
    configId: existing.configId || incoming.configId,
    configName: chooseString(incoming.configName, existing.configName),
    urlFingerprint: existing.urlFingerprint || incoming.urlFingerprint,
    firstSeenAt: Math.min(existing.firstSeenAt, incoming.firstSeenAt),
    lastSeenAt: Math.max(existing.lastSeenAt, incoming.lastSeenAt),
    hasClientProfile: existing.hasClientProfile || incoming.hasClientProfile,
    hasBackup: existing.hasBackup || incoming.hasBackup,
    lastUploadId: hasNewerUpload
      ? chooseString(incoming.lastUploadId, existing.lastUploadId)
      : chooseString(existing.lastUploadId, incoming.lastUploadId),
    lastUploadAt: hasNewerUpload
      ? incoming.lastUploadAt ?? existing.lastUploadAt
      : existing.lastUploadAt ?? incoming.lastUploadAt,
  };
}

function getSourceKey(source: WebDAVKnownDeviceSource): string {
  return `${source.configId}::${source.urlFingerprint}`;
}

function getFirstSeenAt(
  profile: WebDAVClientProfile,
  source: WebDAVKnownDeviceSource | undefined,
  now: number,
): number {
  const candidates = [
    parseMillis(profile.installedAt),
    parseMillis(profile.lastSeenAt),
    parseMillis(profile.lastSyncAt),
    source?.firstSeenAt,
    source?.lastSeenAt,
  ].filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0);

  if (candidates.length === 0) return now;
  return Math.min(...candidates);
}

function getProfileKnownAt(profile: WebDAVClientProfile, now: number): number {
  const candidates = [
    parseMillis(profile.lastSeenAt),
    parseMillis(profile.lastSyncAt),
  ].filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0);

  if (candidates.length === 0) return now;
  return Math.max(...candidates);
}

function chooseDeviceLabel(
  existingLabel: string | undefined,
  incomingLabel: string | undefined,
  fallback: string,
  preferIncoming: boolean,
): string {
  const existing = String(existingLabel || '').trim();
  const incoming = String(incomingLabel || '').trim();
  if (preferIncoming && incoming) return incoming;
  return existing || incoming || fallback;
}

function chooseString(
  preferred: string | undefined,
  fallback?: string,
  defaultValue = '',
): string | undefined {
  const preferredValue = String(preferred || '').trim();
  if (preferredValue) return preferredValue;
  const fallbackValue = String(fallback || '').trim();
  if (fallbackValue) return fallbackValue;
  return defaultValue || undefined;
}

function chooseLaterIso(left: string | undefined, right: string | undefined): string | undefined {
  const leftMillis = parseMillis(left);
  const rightMillis = parseMillis(right);
  if (leftMillis === undefined) return trimOptional(right);
  if (rightMillis === undefined) return trimOptional(left);
  return rightMillis >= leftMillis ? trimOptional(right) : trimOptional(left);
}

function chooseEarlierIso(left: string | undefined, right: string | undefined): string | undefined {
  const leftMillis = parseMillis(left);
  const rightMillis = parseMillis(right);
  if (leftMillis === undefined) return trimOptional(right);
  if (rightMillis === undefined) return trimOptional(left);
  return rightMillis <= leftMillis ? trimOptional(right) : trimOptional(left);
}

function normalizeMillis(value: number | string | undefined, fallback: number): number {
  const parsed = parseMillis(value);
  if (parsed !== undefined) return parsed;
  return fallback;
}

function parseMillis(value: number | string | undefined): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value;
  if (typeof value !== 'string') return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const numeric = Number(trimmed);
  if (Number.isFinite(numeric) && numeric > 0) return numeric;

  const parsed = Date.parse(trimmed);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return undefined;
}

function trimOptional(value: string | undefined): string | undefined {
  const trimmed = String(value || '').trim();
  return trimmed || undefined;
}
