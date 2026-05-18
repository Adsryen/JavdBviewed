export type VersionState = 'clean' | 'staged' | 'dirty' | 'unknown';

export interface VersionInfoEnv {
    readonly VITE_APP_VERSION?: string;
    readonly VITE_APP_BUILD_ID?: string;
    readonly VITE_APP_BUILD_NUMBER?: string;
    readonly VITE_APP_GIT_HASH?: string;
    readonly VITE_APP_VERSION_STATE?: VersionState;
    readonly VITE_APP_BUILD_TIME?: string;
}

export interface DisplayVersionInfo {
    version: string;
    buildNumber?: string;
    commit?: string;
    state: VersionState;
    builtAt?: string;
}

interface DisplayVersionInfoInput {
    manifestVersion?: string;
    env: VersionInfoEnv;
}

interface LegacyBuildId {
    commit?: string;
    state?: VersionState;
    builtAt?: string;
}

const VERSION_PATTERN = /^(\d+\.\d+\.\d+)(?:\.\d+)?$/;
const LEGACY_BUILD_ID_PATTERN = /^\+([^-]+)(?:-(dev|staged|dirty|unknown))?-(\d{12})$/;

export function normalizeSemanticVersion(version: string | undefined): string {
    if (!version) return '';
    const match = version.match(VERSION_PATTERN);
    return match?.[1] || version;
}

export function formatUtcBuildTime(value: string | undefined): string | undefined {
    if (!value) return undefined;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return undefined;

    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hour = String(date.getUTCHours()).padStart(2, '0');
    const minute = String(date.getUTCMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hour}:${minute} UTC`;
}

function formatLegacyTimestamp(value: string): string | undefined {
    const match = value.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})$/);
    if (!match) return undefined;
    return `${match[1]}-${match[2]}-${match[3]} ${match[4]}:${match[5]} UTC`;
}

function parseLegacyBuildId(buildId: string | undefined): LegacyBuildId {
    if (!buildId) return {};

    const match = buildId.match(LEGACY_BUILD_ID_PATTERN);
    if (!match) return {};

    return {
        commit: match[1],
        state: toVersionState(match[2]),
        builtAt: formatLegacyTimestamp(match[3]),
    };
}

function toVersionState(value: string | undefined): VersionState {
    if (value === 'staged' || value === 'dirty' || value === 'unknown') return value;
    if (value === 'dev') return 'staged';
    return 'clean';
}

export function getDisplayVersionInfo(input: DisplayVersionInfoInput): DisplayVersionInfo {
    const legacyBuild = parseLegacyBuildId(input.env.VITE_APP_BUILD_ID);
    const version = normalizeSemanticVersion(input.env.VITE_APP_VERSION)
        || normalizeSemanticVersion(input.manifestVersion)
        || 'N/A';

    return {
        version,
        buildNumber: input.env.VITE_APP_BUILD_NUMBER,
        commit: input.env.VITE_APP_GIT_HASH || legacyBuild.commit,
        state: input.env.VITE_APP_VERSION_STATE || legacyBuild.state || 'unknown',
        builtAt: formatUtcBuildTime(input.env.VITE_APP_BUILD_TIME) || legacyBuild.builtAt,
    };
}
