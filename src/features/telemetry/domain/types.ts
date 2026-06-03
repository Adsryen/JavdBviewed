export type TelemetryEventType = 'startup' | 'heartbeat' | 'error_report';
export type TelemetryChannel = 'stable' | 'beta' | 'dev';
export type TelemetryCountBucket = '0' | '1-9' | '10-49' | '50-99' | '100-499' | '500-999' | '1000+' | 'unknown';

export interface TelemetrySettings {
  enabled: boolean;
  endpoint: string;
  channel: TelemetryChannel;
}

export interface TelemetryClientState {
  installId: string;
  sessionId: string;
  sessionStartedAt: string;
  lastStartupAt?: number;
  lastHeartbeatAt?: number;
  lastSuccessAt?: number;
}

export interface TelemetryRuntimeInfo {
  version: string;
  build?: number;
  browser?: string;
  browserVersion?: string;
  platform?: string;
  platformVersion?: string;
  locale?: string;
  timezone?: string;
}

export interface TelemetryErrorPayload {
  component?: string;
  code?: string;
  message?: string;
  stackHash?: string;
  fatal?: boolean;
}

export interface TelemetryPayload {
  schemaVersion: 1;
  eventId: string;
  deviceId: string;
  installId: string;
  anonymous: true;
  event: TelemetryEventType;
  client: {
    extensionVersion: string;
    build?: number;
    channel?: TelemetryChannel;
    browser?: string;
    browserVersion?: string;
    platform?: string;
    platformVersion?: string;
    locale?: string;
    timezone?: string;
  };
  activity: {
    sessionId: string;
    activityAt: string;
    sessionStartedAt: string;
    activeDurationSeconds: number;
    surface: 'background';
  };
  features: {
    webdavEnabled: boolean;
    drive115Enabled: boolean;
    actorSyncEnabled: boolean;
    actorAutoSyncEnabled: boolean;
    aiEnabled: boolean;
    magnetSearchEnabled: boolean;
    magnetAutoSearchEnabled: boolean;
    newWorksAutoCheckEnabled: boolean;
    videoEnhancementEnabled: boolean;
    titleTranslationEnabled: boolean;
    externalSearchEnabled: boolean;
    onlineAvailabilityEnabled: boolean;
    subtitleSearchEnabled: boolean;
    fc2BreakerEnabled: boolean;
    reviewBreakerEnabled: boolean;
    relatedListsEnabled: boolean;
    actorRemarksEnabled: boolean;
    actorNameMarksEnabled: boolean;
    videoFavoriteRatingEnabled: boolean;
    wantSyncEnabled: boolean;
    autoMarkWatchedAfter115Enabled: boolean;
    listEnhancementEnabled: boolean;
    listVideoPreviewEnabled: boolean;
    scrollPagingEnabled: boolean;
    actorWatermarkEnabled: boolean;
    actorEnhancementEnabled: boolean;
    embyEnabled: boolean;
    embyLibraryStatusEnabled: boolean;
    embyRealtimeCheckEnabled: boolean;
    privacyScreenshotModeEnabled: boolean;
    privacyPrivateModeEnabled: boolean;
    contentFilterEnabled: boolean;
    anchorOptimizationEnabled: boolean;
    passwordHelperEnabled: boolean;
    superRankingEnabled: boolean;
    insightsAutoMonthlyEnabled: boolean;
    githubProxyEnabled: boolean;
  };
  metrics: {
    viewedCountBucket: TelemetryCountBucket;
    actorCountBucket: TelemetryCountBucket;
    newWorksSubscriptionCountBucket: TelemetryCountBucket;
    enabledSearchEngineCountBucket: TelemetryCountBucket;
    enabledExternalSearchEngineCountBucket: TelemetryCountBucket;
    enabledSubtitleSearchEngineCountBucket: TelemetryCountBucket;
    enabledOnlineAvailabilitySiteCountBucket: TelemetryCountBucket;
    enabledMagnetSourceCountBucket: TelemetryCountBucket;
  };
  error?: TelemetryErrorPayload;
  sentAt: string;
}

export interface TelemetryReportResult {
  sent: boolean;
  reason?: 'disabled' | 'missing-endpoint' | 'throttled' | 'network-error' | 'http-error';
  status?: number;
}
