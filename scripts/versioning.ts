export interface VersionParts {
    version: string;
    build?: number | string | null;
}

export function normalizeBuildNumber(build: number | string | null | undefined): number | null {
    if (build === null || build === undefined || build === '') return null;
    const buildNumber = Number(build);
    return Number.isFinite(buildNumber) ? buildNumber : null;
}

export function formatManifestVersion(versionParts: VersionParts): string {
    return versionParts.version;
}

export function formatArtifactVersion(versionParts: VersionParts): string {
    const buildNumber = normalizeBuildNumber(versionParts.build);
    return buildNumber === null
        ? versionParts.version
        : `${versionParts.version}-build-${buildNumber}`;
}

export function formatReleaseTag(version: string): string {
    return `v${version}`;
}

export function formatReleaseTitle(version: string): string {
    return `Release ${version}`;
}
