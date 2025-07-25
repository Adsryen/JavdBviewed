const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Executes a command and prints its output. Exits the process on failure.
 * @param {string} command The command to execute.
 */
function runCommand(command) {
    try {
        console.log(`> ${command}`);
        execSync(command, { stdio: 'inherit' });
    } catch (e) {
        console.error(`\nERROR: Failed to execute command: ${command}`);
        process.exit(1);
    }
}

/**
 * Main function for the release process.
 */
function main() {
    console.log('=================================================');
    console.log(' Creating GitHub Release...');
    console.log('=================================================');
    console.log('');

    // 1. Check if gh is installed
    try {
        execSync('gh --version', { stdio: 'ignore' });
    } catch (e) {
        console.error("ERROR: GitHub CLI ('gh') is not installed or not in your PATH.");
        console.error("Please install it from https://cli.github.com/, log in, and try again.");
        process.exit(1);
    }
    
    // 2. Get version_type from args
    const versionType = process.argv[2];
    if (!versionType) {
        console.error("ERROR: Version type (major, minor, or patch) was not provided to the release script.");
        process.exit(1);
    }

    // 3. Read version from version.json
    const rootDir = path.join(__dirname, '..');
    const versionFilePath = path.join(rootDir, 'version.json');
    let versionData;
    try {
        versionData = JSON.parse(fs.readFileSync(versionFilePath, 'utf8'));
    } catch (e) {
        console.error('ERROR: Could not read or parse version.json.');
        process.exit(1);
    }
    const versionStr = versionData.version;
    if (!versionStr) {
        console.error('ERROR: The "version" field is missing in version.json.');
        process.exit(1);
    }
    
    // 4. Ensure private key exists and add to .gitignore if new
    const keyPath = path.join(rootDir, 'key.pem');
    if (!fs.existsSync(keyPath)) {
        console.log('Private key not found. Generating a new one at key.pem...');
        runCommand('npx crx3 --generate-key key.pem'); 
        
        console.log('Adding key.pem to .gitignore...');
        const gitignorePath = path.join(rootDir, '.gitignore');
        fs.appendFileSync(gitignorePath, '\n# Private key for CRX signing\nkey.pem\n');
        console.log('IMPORTANT: A new private key (key.pem) was generated. Please back it up safely!');
    }

    // 5. Package the extension into a .crx file
    const distPath = path.join(rootDir, 'dist');
    const crxName = `javdb-extension-v${versionStr}.crx`;
    const crxPath = path.join(rootDir, crxName);

    console.log(`\nPackaging extension into ${crxName}...`);
    runCommand(`npx crx3 "${distPath}" --key "${keyPath}" --output "${crxPath}"`);
    console.log('Packaging complete.');

    const tagName = `v${versionStr}`;
    const uploadFilePath = crxPath.replace(/\\/g, '/'); 

    console.log(`\nVersion: ${versionStr}`);
    console.log(`Tag: ${tagName}`);
    console.log(`CRX file: ${crxName}`);
    console.log('');
    
    // 6. Push git commits and tags
    console.log('Pushing git commits and tags...');
    runCommand('git push && git push --tags');
    console.log('');
    
    // 7. Create GitHub release
    console.log('Creating GitHub release and uploading assets...');
    const releaseNotes = `New ${versionType} release.`;
    runCommand(`gh release create ${tagName} "${uploadFilePath}" --title "Release ${tagName}" --notes "${releaseNotes}"`);

    // 8. Clean up the generated .crx file
    console.log(`\nCleaning up temporary file: ${crxName}`);
    fs.unlinkSync(crxPath);

    console.log('');
    console.log('=================================================');
    console.log(' GitHub Release created successfully!');
    console.log('=================================================');
    console.log('');
}

main(); 