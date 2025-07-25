const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const versionFilePath = path.join(__dirname, '..', 'version.json');
const viteEnvFilePath = path.join(__dirname, '..', '.env.local');

/**
 * Gets the current git hash.
 * @returns {string} The short git hash.
 */
function getGitHash() {
    try {
        return execSync('git rev-parse --short HEAD').toString().trim();
    } catch (e) {
        console.error('Error getting git hash:', e);
        return 'nogit';
    }
}

/**
 * Gets the state of the git repository.
 * @returns {'-dev' | '-dirty' | ''} The state flag.
 */
function getGitState() {
    try {
        const status = execSync('git status --porcelain').toString().trim();
        if (status === '') {
            return ''; // Clean state
        }
        
        // Check for staged but not committed changes
        const stagedChanges = execSync('git diff --name-only --cached').toString().trim();
        if (stagedChanges !== '') {
            return '-dev';
        }

        // If not clean and not just staged, it's dirty
        return '-dirty';

    } catch (e) {
        console.error('Error getting git status:', e);
        return '-unknown';
    }
}

/**
 * Gets the simple state of the git repository.
 * @returns {'clean' | 'dev' | 'dirty' | 'unknown'} The simple state.
 */
function getSimpleGitState() {
    const state = getGitState();
    if (state === '') return 'clean';
    if (state === '-dev') return 'dev';
    if (state === '-dirty') return 'dirty';
    return 'unknown';
}

/**
 * Generates the timestamp string.
 * @returns {string} Timestamp in YYYYMMDDHH format.
 */
function getTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    return `${year}${month}${day}${hours}`;
}

/**
 * Main function to update and generate the version.
 */
function main() {
    // 1. Read the version file
    let versionData;
    try {
        const rawData = fs.readFileSync(versionFilePath, 'utf8');
        versionData = JSON.parse(rawData);
    } catch (e) {
        console.error('Error reading version.json:', e);
        process.exit(1);
    }

    // 2. Increment the build number
    versionData.build += 1;

    // 3. Get Git info
    const gitHash = getGitHash();
    const gitState = getGitState();
    const simpleGitState = getSimpleGitState();

    // 4. Get timestamp
    const timestamp = getTimestamp();
    
    // 5. Construct the full version string
    const { major, minor, patch, build } = versionData;
    const fullVersion = `${major}.${minor}.${patch}.${build}+${gitHash}${gitState}-${timestamp}`;

    // 6. Write the updated version data back to version.json
    try {
        fs.writeFileSync(versionFilePath, JSON.stringify(versionData, null, 2), 'utf8');
        console.log(`Version updated to: ${fullVersion}`);
    } catch (e) {
        console.error('Error writing version.json:', e);
        process.exit(1);
    }

    // 7. Write the version to a file for Vite to consume
    try {
        const envContent = `VITE_APP_VERSION=${fullVersion}\nVITE_APP_VERSION_STATE=${simpleGitState}\n`;
        fs.writeFileSync(viteEnvFilePath, envContent, 'utf8');
        console.log(`Version written to ${path.basename(viteEnvFilePath)} for Vite.`);
    } catch (e) {
        console.error('Error writing .env.local:', e);
        process.exit(1);
    }
}

// Check for command line argument to handle version bumps
const arg = process.argv[2];
if (['major', 'minor', 'patch'].includes(arg)) {
    let versionData = JSON.parse(fs.readFileSync(versionFilePath, 'utf8'));
    
    if (arg === 'major') {
        versionData.major += 1;
        versionData.minor = 0;
        versionData.patch = 0;
        versionData.build = 0;
    } else if (arg === 'minor') {
        versionData.minor += 1;
        versionData.patch = 0;
        versionData.build = 0;
    } else if (arg === 'patch') {
        versionData.patch += 1;
        versionData.build = 0;
    }
    
    fs.writeFileSync(versionFilePath, JSON.stringify(versionData, null, 2), 'utf8');
    console.log(`Version bumped to ${versionData.major}.${versionData.minor}.${versionData.patch}`);
    // After bumping, we still run main to generate the first build of the new version
    main();
} else {
    main();
} 