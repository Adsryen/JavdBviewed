import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS, STORAGE_KEYS } from '../../src/utils/config';
import { getChromeStorageSnapshot, setChromeStorage } from '../setup/chrome';

describe('telemetry settings defaults', () => {
  it('uses the Cloudflare API endpoint by default', () => {
    expect((DEFAULT_SETTINGS as any).telemetry.endpoint).toBe('https://jbd-server.we-together.club/v1/telemetry/report');
  });

  it('fills the Cloudflare endpoint for legacy settings with an empty endpoint', async () => {
    const { getSettings } = await import('../../src/utils/storage');
    setChromeStorage({
      [STORAGE_KEYS.SETTINGS]: {
        telemetry: {
          enabled: true,
          endpoint: '',
          channel: 'stable',
        },
      },
    });

    const settings = await getSettings();

    expect(settings.telemetry.endpoint).toBe('https://jbd-server.we-together.club/v1/telemetry/report');
  });
});

describe('telemetry client state', () => {
  it('uses existing Device ID as the first installId and persists it separately', async () => {
    const { getTelemetryClientState, TELEMETRY_CLIENT_STATE_KEY } = await import('../../src/features/telemetry');

    const state = await getTelemetryClientState({
      webdav: { clientId: 'existing-device-id' },
    });

    expect(state.installId).toBe('existing-device-id');
    expect(state.sessionId).toMatch(/^session-/);
    expect(getChromeStorageSnapshot()[TELEMETRY_CLIENT_STATE_KEY]).toEqual(expect.objectContaining({
      installId: 'existing-device-id',
      sessionId: state.sessionId,
    }));
  });

  it('keeps a persisted installId even when settings Device ID changes', async () => {
    const { getTelemetryClientState, TELEMETRY_CLIENT_STATE_KEY } = await import('../../src/features/telemetry');
    setChromeStorage({
      [TELEMETRY_CLIENT_STATE_KEY]: {
        installId: 'persisted-install-id',
        sessionId: 'session-existing',
        sessionStartedAt: '2026-05-26T01:00:00.000Z',
      },
    });

    const state = await getTelemetryClientState({
      webdav: { clientId: 'new-device-id' },
    });

    expect(state.installId).toBe('persisted-install-id');
    expect(state.sessionId).toBe('session-existing');
  });
});

describe('telemetry payload', () => {
  it('builds a strict whitelist payload with bucketed metrics', async () => {
    const { buildTelemetryPayload } = await import('../../src/features/telemetry');
    setChromeStorage({
      [STORAGE_KEYS.VIEWED_RECORDS]: Object.fromEntries(Array.from({ length: 12 }, (_v, index) => [`ID-${index}`, { title: `Title ${index}` }])),
      [STORAGE_KEYS.ACTOR_RECORDS]: Object.fromEntries(Array.from({ length: 51 }, (_v, index) => [`actor-${index}`, { name: `Actor ${index}` }])),
      [STORAGE_KEYS.NEW_WORKS_SUBSCRIPTIONS]: {
        a: {},
        b: {},
      },
    });

    const payload = await buildTelemetryPayload({
      event: 'startup',
      settings: {
        ...DEFAULT_SETTINGS,
        webdav: {
          ...DEFAULT_SETTINGS.webdav,
          enabled: true,
          url: 'https://example.invalid/dav',
          username: 'sensitive-user',
          password: 'sensitive-password',
          clientId: 'existing-device-id',
        },
        drive115: {
          ...(DEFAULT_SETTINGS as any).drive115,
          enabled: true,
          v2AccessToken: 'sensitive-115-token',
        },
        ai: {
          ...(DEFAULT_SETTINGS as any).ai,
          enabled: true,
          apiKey: 'sensitive-ai-key',
        },
        userExperience: {
          ...(DEFAULT_SETTINGS as any).userExperience,
          enableMagnetSearch: true,
          enableListEnhancement: true,
          enableActorEnhancement: true,
        },
        magnetSearch: {
          ...(DEFAULT_SETTINGS as any).magnetSearch,
          autoSearch: true,
          sources: {
            sukebei: true,
            btdig: true,
            btsow: false,
            javbus: true,
          },
        },
        videoEnhancement: {
          ...(DEFAULT_SETTINGS as any).videoEnhancement,
          enabled: true,
          enableExternalEntryPanel: true,
          enableExternalSearch: true,
          enableOnlineAvailability: true,
          enableSubtitleSearch: true,
          enableFC2Breaker: true,
          enableReviewBreaker: true,
          enableRelatedLists: true,
          enableActorRemarks: true,
          onlineAvailabilitySites: {
            fanza: false,
            jable: true,
            missav: true,
          },
        },
        listEnhancement: {
          ...(DEFAULT_SETTINGS as any).listEnhancement,
          enabled: true,
        },
        actorEnhancement: {
          ...(DEFAULT_SETTINGS as any).actorEnhancement,
          enabled: true,
        },
        emby: {
          ...(DEFAULT_SETTINGS as any).emby,
          enabled: true,
        },
        telemetry: {
          enabled: true,
          endpoint: 'https://telemetry.example.invalid/v1/telemetry/report',
          channel: 'stable',
        },
      },
      state: {
        installId: 'existing-device-id',
        sessionId: 'session-test',
        sessionStartedAt: '2026-05-26T01:00:00.000Z',
      },
      now: new Date('2026-05-26T02:00:00.000Z'),
      runtime: {
        version: '1.20.2',
        build: 68,
        browser: 'Chrome',
        browserVersion: '125',
        platform: 'windows',
        locale: 'zh-CN',
        timezone: 'Asia/Shanghai',
      },
    });

    expect(payload).toEqual(expect.objectContaining({
      schemaVersion: 1,
      deviceId: 'existing-device-id',
      anonymous: true,
      event: 'startup',
      client: expect.objectContaining({
        extensionVersion: '1.20.2',
        build: 68,
        channel: 'stable',
      }),
      features: {
        webdavEnabled: true,
        drive115Enabled: true,
        aiEnabled: true,
        remoteConfigEnabled: false,
        magnetSearchEnabled: true,
        magnetAutoSearchEnabled: true,
        videoEnhancementEnabled: true,
        externalEntryPanelEnabled: true,
        externalSearchEnabled: true,
        onlineAvailabilityEnabled: true,
        subtitleSearchEnabled: true,
        fc2BreakerEnabled: true,
        reviewBreakerEnabled: true,
        relatedListsEnabled: true,
        actorRemarksEnabled: true,
        listEnhancementEnabled: true,
        actorEnhancementEnabled: true,
        embyEnabled: true,
      },
      metrics: {
        viewedCountBucket: '10-49',
        actorCountBucket: '50-99',
        newWorksSubscriptionCountBucket: '1-9',
        enabledSearchEngineCountBucket: '10-49',
        enabledExternalSearchEngineCountBucket: '10-49',
        enabledSubtitleSearchEngineCountBucket: '1-9',
        enabledOnlineAvailabilitySiteCountBucket: '1-9',
        enabledMagnetSourceCountBucket: '1-9',
      },
    }));
    expect(payload).not.toHaveProperty('installId');
    expect(JSON.stringify(payload)).not.toContain('sensitive-user');
    expect(JSON.stringify(payload)).not.toContain('sensitive-password');
    expect(JSON.stringify(payload)).not.toContain('sensitive-115-token');
    expect(JSON.stringify(payload)).not.toContain('sensitive-ai-key');
    expect(JSON.stringify(payload)).not.toContain('Title 1');
    expect(JSON.stringify(payload)).not.toContain('Actor 1');
  });
});

describe('telemetry reporter', () => {
  it('does not schedule heartbeat alarms while the endpoint is empty', async () => {
    const { TELEMETRY_HEARTBEAT_ALARM, syncTelemetryHeartbeatAlarm } = await import('../../src/features/telemetry');

    syncTelemetryHeartbeatAlarm({
      telemetry: {
        enabled: true,
        endpoint: '',
        channel: 'stable',
      },
    });

    expect(chrome.alarms.clear).toHaveBeenCalledWith(TELEMETRY_HEARTBEAT_ALARM);
    expect(chrome.alarms.create).not.toHaveBeenCalled();
  });

  it('schedules heartbeat alarms every 3 hours when reporting is configured', async () => {
    const { TELEMETRY_HEARTBEAT_ALARM, syncTelemetryHeartbeatAlarm } = await import('../../src/features/telemetry');

    syncTelemetryHeartbeatAlarm({
      telemetry: {
        enabled: true,
        endpoint: 'https://jbd-server.we-together.club/v1/telemetry/report',
        channel: 'stable',
      },
    });

    expect(chrome.alarms.create).toHaveBeenCalledWith(TELEMETRY_HEARTBEAT_ALARM, {
      delayInMinutes: 180,
      periodInMinutes: 180,
    });
  });

  it('allows another heartbeat after 3 hours', async () => {
    const { reportTelemetryEvent, TELEMETRY_CLIENT_STATE_KEY } = await import('../../src/features/telemetry');
    setChromeStorage({
      [TELEMETRY_CLIENT_STATE_KEY]: {
        installId: 'persisted-install-id',
        sessionId: 'session-existing',
        sessionStartedAt: '2026-05-26T00:00:00.000Z',
        lastHeartbeatAt: Date.parse('2026-05-26T00:00:00.000Z'),
      },
    });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });

    const result = await reportTelemetryEvent('heartbeat', {
      settings: {
        ...DEFAULT_SETTINGS,
        telemetry: {
          enabled: true,
          endpoint: 'https://jbd-server.we-together.club/v1/telemetry/report',
          channel: 'stable',
        },
      },
      fetchImpl: fetchMock,
      now: new Date('2026-05-26T03:00:00.000Z'),
    });

    expect(result).toEqual({ sent: true, status: 200 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('reports immediately for dashboard open even when heartbeat was just sent', async () => {
    const { reportTelemetryForDashboardOpen, TELEMETRY_CLIENT_STATE_KEY } = await import('../../src/features/telemetry');
    setChromeStorage({
      [TELEMETRY_CLIENT_STATE_KEY]: {
        installId: 'persisted-install-id',
        sessionId: 'session-existing',
        sessionStartedAt: '2026-05-26T00:00:00.000Z',
        lastHeartbeatAt: Date.parse('2026-05-26T02:59:00.000Z'),
      },
    });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });

    const result = await reportTelemetryForDashboardOpen({
      settings: {
        ...DEFAULT_SETTINGS,
        telemetry: {
          enabled: true,
          endpoint: 'https://jbd-server.we-together.club/v1/telemetry/report',
          channel: 'stable',
        },
      },
      fetchImpl: fetchMock,
      now: new Date('2026-05-26T03:00:00.000Z'),
    });

    expect(result).toEqual({ sent: true, status: 200 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('handles dashboard open runtime messages silently', async () => {
    const { handleTelemetryRuntimeMessage, TELEMETRY_DASHBOARD_OPEN_MESSAGE } = await import('../../src/features/telemetry');
    const reporter = vi.fn().mockResolvedValue({ sent: true, status: 200 });
    const sendResponse = vi.fn();

    const handled = handleTelemetryRuntimeMessage(
      { type: TELEMETRY_DASHBOARD_OPEN_MESSAGE },
      sendResponse,
      reporter,
    );
    await Promise.resolve();

    expect(handled).toBe(true);
    expect(reporter).toHaveBeenCalledTimes(1);
    expect(sendResponse).toHaveBeenCalledWith({ ok: true });
  });

  it('skips reporting when telemetry is disabled', async () => {
    const { reportTelemetryEvent } = await import('../../src/features/telemetry');
    const fetchMock = vi.fn();

    const result = await reportTelemetryEvent('startup', {
      settings: {
        ...DEFAULT_SETTINGS,
        telemetry: {
          enabled: false,
          endpoint: 'https://telemetry.example.invalid/v1/telemetry/report',
          channel: 'stable',
        },
      },
      fetchImpl: fetchMock,
      now: new Date('2026-05-26T02:00:00.000Z'),
    });

    expect(result).toEqual({ sent: false, reason: 'disabled' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('skips reporting when endpoint is empty', async () => {
    const { reportTelemetryEvent } = await import('../../src/features/telemetry');
    const fetchMock = vi.fn();

    const result = await reportTelemetryEvent('startup', {
      settings: {
        ...DEFAULT_SETTINGS,
        telemetry: {
          enabled: true,
          endpoint: '',
          channel: 'stable',
        },
      },
      fetchImpl: fetchMock,
      now: new Date('2026-05-26T02:00:00.000Z'),
    });

    expect(result).toEqual({ sent: false, reason: 'missing-endpoint' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('silently handles server failures', async () => {
    const { reportTelemetryEvent } = await import('../../src/features/telemetry');
    const fetchMock = vi.fn().mockRejectedValue(new Error('server is still in development'));

    const result = await reportTelemetryEvent('heartbeat', {
      settings: {
        ...DEFAULT_SETTINGS,
        telemetry: {
          enabled: true,
          endpoint: 'https://telemetry.example.invalid/v1/telemetry/report',
          channel: 'stable',
        },
      },
      fetchImpl: fetchMock,
      now: new Date('2026-05-26T02:00:00.000Z'),
    });

    expect(result).toEqual({ sent: false, reason: 'network-error' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
