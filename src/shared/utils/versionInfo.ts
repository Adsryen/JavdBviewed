/**
 * @file versionInfo.ts
 * @description 版本信息解析与展示工具
 * @module shared/utils（跨上下文：background + UI）
 *
 * 从 Vite 注入的环境变量中提取版本号、构建时间、Git 状态等信息，
 * 同时兼容旧版 BUILD_ID 格式（`+{hash}-{state}-{timestamp}`）。
 */

/** 版本状态：clean=无修改, staged=有暂存, dirty=有未提交修改, unknown=未知 */
export type VersionState = 'clean' | 'staged' | 'dirty' | 'unknown';

/** Vite 注入的版本相关环境变量 */
export interface VersionInfoEnv {
    readonly VITE_APP_VERSION?: string;                 // 语义化版本号（如 1.20.3）
    readonly VITE_APP_BUILD_ID?: string;                // 旧版构建标识（兼容用）
    readonly VITE_APP_BUILD_NUMBER?: string;             // 构建序号
    readonly VITE_APP_GIT_HASH?: string;                // Git commit hash
    readonly VITE_APP_VERSION_STATE?: VersionState;     // 代码仓库状态
    readonly VITE_APP_BUILD_TIME?: string;              // 构建时间（ISO 8601）
}

/** 用于 UI 展示的版本信息 */
export interface DisplayVersionInfo {
    version: string;                                    // 语义化版本号
    buildNumber?: string;
    commit?: string;                                    // Git commit short hash
    state: VersionState;
    builtAt?: string;                                   // 格式化的构建时间
}

/** getDisplayVersionInfo 的输入参数 */
interface DisplayVersionInfoInput {
    manifestVersion?: string;                           // manifest.json 中的版本号
    env: VersionInfoEnv;
}

/** 旧版 BUILD_ID 解析结果（`+{hash}-{state}-{timestamp}` 格式） */
interface LegacyBuildId {
    commit?: string;
    state?: VersionState;
    builtAt?: string;
}

/** 语义化版本号正则：捕获 x.y.z，忽略第四段 */
const VERSION_PATTERN = /^(\d+\.\d+\.\d+)(?:\.\d+)?$/;
/** 旧版 BUILD_ID 正则：+hash-state-YYYYMMDDHHmm */
const LEGACY_BUILD_ID_PATTERN = /^\+([^-]+)(?:-(dev|staged|dirty|unknown))?-(\d{12})$/;

/** 将版本号标准化为 x.y.z 格式（去掉第四段） */
export function normalizeSemanticVersion(version: string | undefined): string {
    if (!version) return '';
    const match = version.match(VERSION_PATTERN);
    return match?.[1] || version;
}

/** 将 ISO 8601 构建时间格式化为 `YYYY-MM-DD HH:mm UTC` */
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

/** 解析旧版时间戳格式 `YYYYMMDDHHmm` → `YYYY-MM-DD HH:mm UTC` */
function formatLegacyTimestamp(value: string): string | undefined {
    const match = value.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})$/);
    if (!match) return undefined;
    return `${match[1]}-${match[2]}-${match[3]} ${match[4]}:${match[5]} UTC`;
}

/** 解析旧版 BUILD_ID 字符串 */
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

/** 字符串转 VersionState，`dev` 映射为 `staged` */
function toVersionState(value: string | undefined): VersionState {
    if (value === 'staged' || value === 'dirty' || value === 'unknown') return value;
    if (value === 'dev') return 'staged';
    return 'clean';
}

/** 汇总版本信息用于 UI 展示（优先用新环境变量，回退到旧版 BUILD_ID） */
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
