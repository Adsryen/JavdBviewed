import { describe, expect, it } from 'vitest';

import {
    formatArtifactVersion,
    formatReleaseTag,
    formatReleaseTitle,
    formatManifestVersion,
} from './versioning';

describe('versioning helpers', () => {
    it('formats release identity as semantic version only', () => {
        expect(formatReleaseTag('1.20.0')).toBe('v1.20.0');
        expect(formatReleaseTitle('1.20.0')).toBe('Release 1.20.0');
        expect(formatManifestVersion({ version: '1.20.0', build: 196 })).toBe('1.20.0');
    });

    it('formats release tag from semantic version', () => {
        expect(formatReleaseTag('1.20.0')).toBe('v1.20.0');
    });

    it('formats artifact identity with explicit build number', () => {
        expect(formatArtifactVersion({ version: '1.20.0', build: 196 })).toBe('1.20.0-build-196');
    });

    it('omits artifact build suffix when build number is missing', () => {
        expect(formatArtifactVersion({ version: '1.20.0' })).toBe('1.20.0');
    });
});
