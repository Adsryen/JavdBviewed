import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const versionFilePath = path.join(__dirname, '..', 'version.json');
const viteEnvFilePath = path.join(__dirname, '..', '.env.local');

interface VersionData {
  version: string;
  major: number;
  minor: number;
  patch: number;
  build: number;
}

type VersionType = 'major' | 'minor' | 'patch';
type GitState = '-dev' | '-dirty' | '' | '-unknown';
type SimpleGitState = 'clean' | 'dev' | 'dirty' | 'unknown';

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
        if (stagedChanges !== '') return '-dev';
        return '-dirty';
    } catch (e) { return '-unknown'; }
}

function getSimpleGitState(): SimpleGitState {
    const state = getGitState();
    if (state === '') return 'clean';
    if (state === '-dev') return 'dev';
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
function generateAndWriteBuildVersion(versionData: VersionData, isReleaseCommit: boolean) {
    // 标记参数已使用（用于满足 TS noUnusedParameters）
    if (isReleaseCommit) {
        // release 构建时可添加额外逻辑；当前无特殊处理
    }

    versionData.build = (versionData.build || 0) + 1;

    // Always get the real git state, regardless of release or not.
    const gitHash = getGitHash();
    const gitState = getGitState();
    const simpleGitState = getSimpleGitState();
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 12); // YYYYMMDDHHmm
    
    const { major, minor, patch, build } = versionData;
    const fullVersion = `${major}.${minor}.${patch}.${build}+${gitHash}${gitState}-${timestamp}`;

    fs.writeFileSync(versionFilePath, JSON.stringify(versionData, null, 2), 'utf8');
    const envContent = `VITE_APP_VERSION=${fullVersion}\nVITE_APP_VERSION_STATE=${simpleGitState}\n`;
    fs.writeFileSync(viteEnvFilePath, envContent, 'utf8');
    
    console.log(`\x1b[32mVersion updated to: ${fullVersion}\x1b[0m`);
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