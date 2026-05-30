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

export interface TelemetryPayload {
  schemaVersion: 1;
  eventId: string;
  deviceId: string;
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
    aiEnabled: boolean;
    remoteConfigEnabled: boolean;
    magnetSearchEnabled: boolean;
    magnetAutoSearchEnabled: boolean;
    videoEnhancementEnabled: boolean;
    externalEntryPanelEnabled: boolean;
    externalSearchEnabled: boolean;
    onlineAvailabilityEnabled: boolean;
    subtitleSearchEnabled: boolean;
    fc2BreakerEnabled: boolean;
    reviewBreakerEnabled: boolean;
    relatedListsEnabled: boolean;
    actorRemarksEnabled: boolean;
    listEnhancementEnabled: boolean;
    actorEnhancementEnabled: boolean;
    embyEnabled: boolean;
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
  sentAt: string;
}

export interface TelemetryReportResult {
  sent: boolean;
  reason?: 'disabled' | 'missing-endpoint' | 'throttled' | 'network-error' | 'http-error';
  status?: number;
}
