/**
 * @file versioning.ts
 * @description 版本号格式化工具 —— 语义化版本与构建号拼装
 * @module scripts
 */

export interface VersionParts {
    version: string;                 // 语义化版本号（如 "1.20.0"）
    build?: number | string | null;  // 构建号（可选）
}

/** 将构建号转为数字或 null（空字符串/undefined → null） */
export function normalizeBuildNumber(build: number | string | null | undefined): number | null {
    if (build === null || build === undefined || build === '') return null;
    const buildNumber = Number(build);
    return Number.isFinite(buildNumber) ? buildNumber : null;
}

/** 格式化 manifest.json 中使用的版本号（仅语义版本，不含构建号） */
export function formatManifestVersion(versionParts: VersionParts): string {
    return versionParts.version;
}

/** 格式化构建产物文件名中的版本号（如 "1.20.0-build-196"） */
export function formatArtifactVersion(versionParts: VersionParts): string {
    const buildNumber = normalizeBuildNumber(versionParts.build);
    return buildNumber === null
        ? versionParts.version
        : `${versionParts.version}-build-${buildNumber}`;
}

/** 格式化 Git tag 名称（如 "v1.20.0"） */
export function formatReleaseTag(version: string): string {
    return `v${version}`;
}

/** 格式化 Release 标题（如 "Release 1.20.0"） */
export function formatReleaseTitle(version: string): string {
    return `Release ${version}`;
}
