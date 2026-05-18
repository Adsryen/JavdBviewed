import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { formatArtifactVersion } from './versioning';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const versionFilePath = path.join(__dirname, '..', 'version.json');
const packageFilePath = path.join(__dirname, '..', 'package.json');
const manifestFilePath = path.join(__dirname, '..', 'src', 'manifest.json');
const viteEnvFilePath = path.join(__dirname, '..', '.env.local');

interface VersionData {
  version: string;
  major: number;
  minor: number;
  patch: number;
  build: number;
}

type VersionType = 'major' | 'minor' | 'patch';
type GitState = '-staged' | '-dirty' | '' | '-unknown';
type SimpleGitState = 'clean' | 'staged' | 'dirty' | 'unknown';

// --- Git Helper Functions ---
function getGitHash(): string {
    try {
        return execSync('git rev-parse --short HEAD').toString().trim();
    } catch (e) { return 'nogit'; }
}

function getGitState(): GitState {
    try {
        const status = execSync('git status --porcelain').toString().trim();
        if (status === '') return '';
        const stagedChanges = execSync('git diff --name-only --cached').toString().trim();
        if (stagedChanges !== '') return '-staged';
        return '-dirty';
    } catch (e) { return '-unknown'; }
}

function simplifyGitState(state: GitState): SimpleGitState {
    if (state === '') return 'clean';
    if (state === '-staged') return 'staged';
    if (state === '-dirty') return 'dirty';
    return 'unknown';
}

export function commitAndTagVersion(version: string) {
    try {
        console.log('Staging and committing version files...');
        execSync('git add version.json .env.local');
        execSync(`git commit -m "chore: Bump version to ${version}"`);
        const tagName = `v${version}`;
        console.log(`Creating git tag: ${tagName}`);
        execSync(`git tag ${tagName}`);
        console.log('Commit and tag successful.');
    } catch (e) {
        console.error('\nError during git operations:', e);
        console.error("Failed to commit and tag. Please check your git status and ensure there are no conflicts.");
        process.exit(1);
    }
}

// --- Version Generation Function ---
function writeJsonFile(filePath: string, data: unknown) {
    fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function syncVersionArtifacts(versionData: VersionData) {
    writeJsonFile(versionFilePath, versionData);

    if (fs.existsSync(packageFilePath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageFilePath, 'utf8'));
        packageJson.version = versionData.version;
        writeJsonFile(packageFilePath, packageJson);
    }

    if (fs.existsSync(manifestFilePath)) {
        const manifestJson = JSON.parse(fs.readFileSync(manifestFilePath, 'utf8'));
        manifestJson.version = versionData.version;
        writeJsonFile(manifestFilePath, manifestJson);
    }
}

function generateAndWriteBuildVersion(versionData: VersionData, isReleaseCommit: boolean) {
    // 标记参数已使用（用于满足 TS noUnusedParameters）
    if (isReleaseCommit) {
        // release 构建时可添加额外逻辑；当前无特殊处理
    }

    versionData.build = (versionData.build || 0) + 1;

    // Always get the real git state, regardless of release or not.
    const gitHash = getGitHash();
    const gitState = getGitState();
    const simpleGitState = simplifyGitState(gitState);
    const buildTime = new Date().toISOString();
    const timestamp = buildTime.replace(/[-:.TZ]/g, '').slice(0, 12); // YYYYMMDDHHmm

    const buildId = `+${gitHash}${gitState}-${timestamp}`;

    syncVersionArtifacts(versionData);
    const envContent = [
        `VITE_APP_VERSION=${versionData.version}`,
        `VITE_APP_BUILD_NUMBER=${versionData.build}`,
        `VITE_APP_GIT_HASH=${gitHash}`,
        `VITE_APP_VERSION_STATE=${simpleGitState}`,
        `VITE_APP_BUILD_TIME=${buildTime}`,
        `VITE_APP_BUILD_ID=${buildId}`,
        '',
    ].join('\n');
    fs.writeFileSync(viteEnvFilePath, envContent, 'utf8');
    
    const artifactVersion = formatArtifactVersion(versionData);
    console.log(`\x1b[32mVersion updated to: ${versionData.version} build ${versionData.build} (${buildId})\x1b[0m`);
    console.log(`\x1b[32mArtifact version: ${artifactVersion}\x1b[0m`);
    console.log(`\x1b[32mVersion written to ${path.basename(viteEnvFilePath)} for Vite.\x1b[0m`);
}

// --- Main Execution Logic ---
try {
    const arg = process.argv[2] as VersionType | undefined;
    let versionData: VersionData = JSON.parse(fs.readFileSync(versionFilePath, 'utf8'));

    if (arg && ['major', 'minor', 'patch'].includes(arg)) {
        // This is a version bump for a release
        if (arg === 'major') {
            versionData.major += 1;
            versionData.minor = 0;
            versionData.patch = 0;
        } else if (arg === 'minor') {
            versionData.minor += 1;
            versionData.patch = 0;
        } else if (arg === 'patch') {
            versionData.patch += 1;
        }
        versionData.build = 0; // Reset build number on new version
        versionData.version = `${versionData.major}.${versionData.minor}.${versionData.patch}`;
        
        console.log(`\x1b[32mVersion bumped to ${versionData.version}\x1b[0m`);

        // Generate versions, assuming this will be a clean commit
        generateAndWriteBuildVersion(versionData, true);

        // Commit and tag the new version
        // commitAndTagVersion(versionData.version);

    } else {
        // This is a regular build (e.g., 'pnpm build'), not a release
        generateAndWriteBuildVersion(versionData, false);
    }
} catch (e) {
    console.error("An error occurred in version.ts:", e);
    process.exit(1);
} 
