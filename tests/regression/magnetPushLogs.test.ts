import fs from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('magnet push log architecture', () => {
  it('keeps 115 push logs in an independent retention path', async () => {
    const dbSource = await fs.readFile(new URL('../../src/platform/storage/indexedDb.ts', import.meta.url), 'utf8');
    const logsTabSource = await fs.readFile(new URL('../../src/dashboard/tabs/logs.ts', import.meta.url), 'utf8');
    const drive115LoggerSource = await fs.readFile(new URL('../../src/features/drive115/app/logger.ts', import.meta.url), 'utf8');
    const configSource = await fs.readFile(new URL('../../src/utils/config.ts', import.meta.url), 'utf8');

    expect(configSource).toMatch(/maxMagnetPushEntries:\s*10000/);
    expect(dbSource).toMatch(/magnetPushLogs/);
    expect(dbSource).toMatch(/function\s+magnetPushLogsEnforceRetention/);
    expect(dbSource).toMatch(/logging\.maxMagnetPushEntries/);
    expect(drive115LoggerSource).toMatch(/DB:MAGNET_PUSH_LOGS_ADD/);
    expect(logsTabSource).toMatch(/dbMagnetPushLogsQuery/);
    expect(logsTabSource).not.toMatch(/limit:\s*1000[\s\S]*source:\s*'DRIVE115'/);
  });
});
