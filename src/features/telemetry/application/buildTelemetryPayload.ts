import { STORAGE_KEYS } from '../../../utils/config';
import {
  dedupeSearchEngines,
  getSearchEngineCategory,
  isSearchEngineEnabled,
  type SearchEngineTemplate,
} from '../../externalSearch/domain/searchEngines';
import { getValue } from '../../../utils/storage';
import { bucketCount, bucketViewedCount, countObjectKeys } from '../domain/buckets';
import { buildTelemetryFeatures } from '../domain/featureCatalog';
import type {
  TelemetryClientState,
  TelemetryErrorPayload,
  TelemetryEventType,
  TelemetryPayload,
  TelemetryRuntimeInfo,
} from '../domain/types';
import { createTelemetryEventId } from './clientState';
import { getTelemetryRuntimeInfo } from './runtimeInfo';

const DEFAULT_ONLINE_AVAILABILITY_SITE_KEYS = [
  'fanza',
  'jable',
  'missav',
  '123av',
  'supjav',
  'netflav',
  'avgle',
  'javhhh',
  'javguru',
  'javbus',
] as const;

const BUILTIN_MAGNET_SOURCE_KEYS = [
  'sukebei',
  'btdig',
  'btsow',
  'torrentz2',
  'javbus',
] as const;

export interface BuildTelemetryPayloadInput {
  event: TelemetryEventType;
  settings: any;
  state: TelemetryClientState;
  now?: Date;
  runtime?: TelemetryRuntimeInfo;
  error?: TelemetryErrorPayload;
}

export async function buildTelemetryPayload(input: BuildTelemetryPayloadInput): Promise<TelemetryPayload> {
  const now = input.now || new Date();
  const runtime = input.runtime || getTelemetryRuntimeInfo();
  const settings = input.settings || {};
  const [metrics, newWorksConfig] = await Promise.all([
    buildMetrics(settings),
    getValue<Record<string, unknown>>(STORAGE_KEYS.NEW_WORKS_CONFIG, {}).catch(() => undefined),
  ]);
  const sessionStartedAt = normalizeDate(input.state.sessionStartedAt, now);
  const installId = normalizeTelemetryId(input.state.installId) || 'unknown-device';
  const deviceId = normalizeTelemetryId(settings?.webdav?.clientId) || installId;

  return {
    schemaVersion: 1,
    eventId: createTelemetryEventId(),
    deviceId,
    installId,
    anonymous: true,
    event: input.event,
    client: removeUndefined({
      extensionVersion: runtime.version || 'unknown',
      build: runtime.build,
      channel: normalizeChannel(settings?.telemetry?.channel),
      browser: runtime.browser,
      browserVersion: runtime.browserVersion,
      platform: runtime.platform,
      platformVersion: runtime.platformVersion,
      locale: runtime.locale,
      timezone: runtime.timezone,
    }),
    activity: {
      sessionId: input.state.sessionId,
      activityAt: now.toISOString(),
      sessionStartedAt: sessionStartedAt.toISOString(),
      activeDurationSeconds: Math.max(0, Math.min(86400, Math.floor((now.getTime() - sessionStartedAt.getTime()) / 1000))),
      surface: 'background',
    },
    features: buildTelemetryFeatures(settings, { newWorksConfig }),
    metrics,
    error: input.error,
    sentAt: now.toISOString(),
  };
}

async function buildMetrics(settings: any): Promise<TelemetryPayload['metrics']> {
  const [viewed, actors, newWorksSubscriptions] = await Promise.all([
    getValue<Record<string, unknown>>(STORAGE_KEYS.VIEWED_RECORDS, {}).catch(() => undefined),
    getValue<Record<string, unknown>>(STORAGE_KEYS.ACTOR_RECORDS, {}).catch(() => undefined),
    getValue<Record<string, unknown>>(STORAGE_KEYS.NEW_WORKS_SUBSCRIPTIONS, {}).catch(() => undefined),
  ]);

  return {
    viewedCountBucket: bucketViewedCount(countObjectKeys(viewed)),
    actorCountBucket: bucketCount(countObjectKeys(actors)),
    newWorksSubscriptionCountBucket: bucketCount(countObjectKeys(newWorksSubscriptions)),
    ...buildConfigMetrics(settings),
  };
}

function buildConfigMetrics(settings: any): Pick<
  TelemetryPayload['metrics'],
  | 'enabledSearchEngineCountBucket'
  | 'enabledExternalSearchEngineCountBucket'
  | 'enabledSubtitleSearchEngineCountBucket'
  | 'enabledOnlineAvailabilitySiteCountBucket'
  | 'enabledMagnetSourceCountBucket'
> {
  const enabledSearchEngines = getEnabledSearchEngines(settings?.searchEngines);
  const enabledSubtitleSearchEngines = enabledSearchEngines
    .filter(engine => getSearchEngineCategory(engine) === 'subtitle');
  const enabledExternalSearchEngines = enabledSearchEngines
    .filter(engine => getSearchEngineCategory(engine) !== 'subtitle');

  return {
    enabledSearchEngineCountBucket: bucketCount(enabledSearchEngines.length),
    enabledExternalSearchEngineCountBucket: bucketCount(enabledExternalSearchEngines.length),
    enabledSubtitleSearchEngineCountBucket: bucketCount(enabledSubtitleSearchEngines.length),
    enabledOnlineAvailabilitySiteCountBucket: bucketCount(countEnabledOnlineAvailabilitySites(settings?.videoEnhancement?.onlineAvailabilitySites)),
    enabledMagnetSourceCountBucket: bucketCount(countEnabledMagnetSources(settings?.magnetSearch?.sources)),
  };
}

function getEnabledSearchEngines(searchEngines: unknown): SearchEngineTemplate[] {
  return dedupeSearchEngines(searchEngines).engines
    .filter(engine => isSearchEngineEnabled(engine));
}

function countEnabledOnlineAvailabilitySites(preferences: unknown): number {
  const sitePreferences = preferences && typeof preferences === 'object'
    ? preferences as Record<string, unknown>
    : {};

  return DEFAULT_ONLINE_AVAILABILITY_SITE_KEYS.filter((siteKey) => {
    const value = sitePreferences[siteKey];
    return typeof value === 'boolean' ? value : true;
  }).length;
}

function countEnabledMagnetSources(sources: unknown): number {
  const sourceSettings = sources && typeof sources === 'object'
    ? sources as Record<string, unknown>
    : {};

  const builtinCount = BUILTIN_MAGNET_SOURCE_KEYS.filter((sourceKey) => {
    const value = sourceSettings[sourceKey];
    return typeof value === 'boolean' ? value : sourceKey === 'sukebei' || sourceKey === 'btdig' || sourceKey === 'btsow';
  }).length;
  const customCount = Array.isArray(sourceSettings.custom)
    ? sourceSettings.custom.filter(Boolean).length
    : 0;

  return builtinCount + customCount;
}

function normalizeDate(value: string | undefined, fallback: Date): Date {
  const parsed = Date.parse(String(value || ''));
  if (Number.isNaN(parsed)) return fallback;
  return new Date(parsed);
}

function normalizeChannel(value: unknown): 'stable' | 'beta' | 'dev' {
  if (value === 'beta' || value === 'dev') return value;
  return 'stable';
}

function normalizeTelemetryId(value: unknown): string | undefined {
  const text = String(value || '').trim();
  return text || undefined;
}

function removeUndefined<T extends Record<string, any>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T;
}
