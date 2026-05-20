import { describe, expect, it } from 'vitest';

import { getDisplayVersionInfo, formatUtcBuildTime } from './versionInfo';

describe('version display helpers', () => {
    it('prefers structured build metadata for display', () => {
        const info = getDisplayVersionInfo({
            manifestVersion: '1.20.0',
            env: {
                VITE_APP_VERSION: '1.20.0',
                VITE_APP_BUILD_NUMBER: '196',
                VITE_APP_GIT_HASH: 'cc5d95f1',
                VITE_APP_VERSION_STATE: 'dirty',
                VITE_APP_BUILD_TIME: '2026-05-18T17:00:00.000Z',
                VITE_APP_BUILD_ID: '+legacy-dirty-202605181700',
            },
        });

        expect(info).toEqual({
            version: '1.20.0',
            buildNumber: '196',
            commit: 'cc5d95f1',
            state: 'dirty',
            builtAt: '2026-05-18 17:00 UTC',
        });
    });

    it('normalizes legacy four-part manifest versions for display', () => {
        const info = getDisplayVersionInfo({
            manifestVersion: '1.20.0.196',
            env: {},
        });

        expect(info.version).toBe('1.20.0');
    });

    it('parses legacy build id when structured metadata is absent', () => {
        const info = getDisplayVersionInfo({
            env: {
                VITE_APP_VERSION: '1.20.0',
                VITE_APP_BUILD_ID: '+cc5d95f1-dirty-202605181700',
            },
        });

        expect(info.commit).toBe('cc5d95f1');
        expect(info.state).toBe('dirty');
        expect(info.builtAt).toBe('2026-05-18 17:00 UTC');
    });

    it('formats UTC build time without locale dependence', () => {
        expect(formatUtcBuildTime('2026-05-18T17:00:00.000Z')).toBe('2026-05-18 17:00 UTC');
    });
});
