import { describe, expect, it } from 'vitest';
import {
  buildMergeStorageWritePlans,
  buildRollbackStorageWritePlans,
  buildRestoreStorageKeys,
  sanitizeRestoredActorRecords,
  type RestoreStorageKeys,
} from './restoreApplyPlanModel';

const storageKeys: RestoreStorageKeys = {
  viewedRecords: 'viewed',
  actorRecords: 'actor_records',
  settings: 'settings',
  userProfile: 'user_profile',
  logs: 'persistent_logs',
  importStats: 'last_import_stats',
  newWorksSubscriptions: 'new_works_subscriptions',
  newWorksRecords: 'new_works_records',
  newWorksConfig: 'new_works_config',
};

const allEnabledOptions = {
  strategy: 'smart',
  restoreRecords: true,
  restoreActorRecords: true,
  restoreSettings: true,
  restoreUserProfile: true,
  restoreLogs: true,
  restoreImportStats: true,
  restoreNewWorks: true,
};

describe('WebDAV restore apply plan model', () => {
  it('builds restore storage keys from extension storage constants', () => {
    expect(
      buildRestoreStorageKeys({
        VIEWED_RECORDS: 'viewed',
        ACTOR_RECORDS: 'actor_records',
        SETTINGS: 'settings',
        USER_PROFILE: 'user_profile',
        LOGS: 'persistent_logs',
        LAST_IMPORT_STATS: 'last_import_stats',
        NEW_WORKS_SUBSCRIPTIONS: 'new_works_subscriptions',
        NEW_WORKS_RECORDS: 'new_works_records',
        NEW_WORKS_CONFIG: 'new_works_config',
      }),
    ).toEqual(storageKeys);
  });

  it('removes blacklist-only state before writing restored actor records', () => {
    expect(
      sanitizeRestoredActorRecords({
        actor1: { id: 'actor1', name: 'Actor 1', blacklisted: true, note: 'keep' },
        actor2: { id: 'actor2', name: 'Actor 2', blacklisted: false },
      }),
    ).toEqual({
      actor1: { id: 'actor1', name: 'Actor 1', note: 'keep' },
      actor2: { id: 'actor2', name: 'Actor 2' },
    });
  });

  it('builds storage write plans from enabled restore options', () => {
    const mergedData = {
      videoRecords: { 'AAA-001': { id: 'AAA-001' } },
      actorRecords: { actor1: { id: 'actor1', blacklisted: true } },
      settings: { display: { theme: 'dark' } },
      userProfile: { username: 'tester' },
      logs: [{ level: 'INFO' }],
      importStats: { total: 3 },
      newWorks: {
        subscriptions: { actor1: { actorId: 'actor1' } },
        records: { 'AAA-002': { id: 'AAA-002' } },
        config: { autoCheckEnabled: true },
      },
    };

    expect(buildMergeStorageWritePlans(mergedData, allEnabledOptions as any, storageKeys)).toEqual([
      { kind: 'videoRecords', key: 'viewed', value: mergedData.videoRecords },
      { kind: 'newWorksSubscriptions', key: 'new_works_subscriptions', value: mergedData.newWorks.subscriptions },
      { kind: 'newWorksRecords', key: 'new_works_records', value: mergedData.newWorks.records },
      { kind: 'newWorksConfig', key: 'new_works_config', value: mergedData.newWorks.config },
      { kind: 'actorRecords', key: 'actor_records', value: { actor1: { id: 'actor1' } } },
      { kind: 'settings', key: 'settings', value: mergedData.settings },
      { kind: 'userProfile', key: 'user_profile', value: mergedData.userProfile },
      { kind: 'logs', key: 'persistent_logs', value: mergedData.logs },
      { kind: 'importStats', key: 'last_import_stats', value: mergedData.importStats },
    ]);
  });

  it('uses the new works restore option for new works plans', () => {
    const mergedData = {
      newWorks: {
        subscriptions: { actor1: { actorId: 'actor1' } },
        records: { 'AAA-002': { id: 'AAA-002' } },
        config: { autoCheckEnabled: true },
      },
    };

    expect(
      buildMergeStorageWritePlans(
        mergedData,
        { ...allEnabledOptions, restoreRecords: false, restoreNewWorks: true } as any,
        storageKeys,
      ).map((plan) => plan.kind),
    ).toEqual(['newWorksSubscriptions', 'newWorksRecords', 'newWorksConfig']);

    expect(
      buildMergeStorageWritePlans(
        mergedData,
        { ...allEnabledOptions, restoreRecords: true, restoreNewWorks: false } as any,
        storageKeys,
      ),
    ).toEqual([]);
  });

  it('skips plans for disabled restore options', () => {
    const mergedData = {
      videoRecords: { 'AAA-001': { id: 'AAA-001' } },
      actorRecords: { actor1: { id: 'actor1' } },
      settings: { display: { theme: 'dark' } },
    };

    expect(
      buildMergeStorageWritePlans(
        mergedData,
        {
          ...allEnabledOptions,
          restoreRecords: false,
          restoreActorRecords: false,
          restoreSettings: false,
        } as any,
        storageKeys,
      ),
    ).toEqual([]);
  });

  it('builds rollback storage write plans from backup data', () => {
    const backupData = {
      viewedRecords: { 'AAA-001': { id: 'AAA-001' } },
      actorRecords: { actor1: { id: 'actor1', blacklisted: true, note: 'keep' } },
      settings: { display: { theme: 'dark' } },
      userProfile: { username: 'tester' },
      logs: [{ level: 'INFO' }],
      importStats: { total: 3 },
      newWorks: {
        subscriptions: { actor1: { actorId: 'actor1' } },
        records: { 'AAA-002': { id: 'AAA-002' } },
        config: { autoCheckEnabled: true },
      },
      magnetPushLogs: [{ id: 'magnet-log-1' }],
    };

    expect(buildRollbackStorageWritePlans(backupData, storageKeys)).toEqual([
      { kind: 'videoRecords', key: 'viewed', value: backupData.viewedRecords },
      { kind: 'actorRecords', key: 'actor_records', value: { actor1: { id: 'actor1', note: 'keep' } } },
      { kind: 'settings', key: 'settings', value: backupData.settings },
      { kind: 'userProfile', key: 'user_profile', value: backupData.userProfile },
      { kind: 'logs', key: 'persistent_logs', value: backupData.logs },
      { kind: 'importStats', key: 'last_import_stats', value: backupData.importStats },
      { kind: 'newWorksSubscriptions', key: 'new_works_subscriptions', value: backupData.newWorks.subscriptions },
      { kind: 'newWorksRecords', key: 'new_works_records', value: backupData.newWorks.records },
      { kind: 'newWorksConfig', key: 'new_works_config', value: backupData.newWorks.config },
    ]);
  });

  it('skips rollback plans for missing backup fields', () => {
    expect(buildRollbackStorageWritePlans({ magnetPushLogs: [{ id: 'log' }] }, storageKeys)).toEqual([]);
  });
});
