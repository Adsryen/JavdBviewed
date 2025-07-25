import { build } from 'vite';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import archiver from 'archiver';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const distDir = resolve(root, 'dist');
const distZipDir = resolve(root, 'dist-zip'); // New directory for zip files

async function getVersion() {
    const packageJsonPath = resolve(root, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
        const packageJson = await fs.readJson(packageJsonPath);
        return packageJson.version;
    }
    const versionJsonPath = resolve(root, 'version.json');
    if (fs.existsSync(versionJsonPath)) {
        const versionJson = await fs.readJson(versionJsonPath);
        return versionJson.version;
    }
    throw new Error('Could not find version information.');
}

async function main() {
    try {
        // 0. Clean up previous builds
        console.log('Cleaning up old build directories...');
        await fs.emptyDir(distDir);
        await fs.emptyDir(distZipDir);

        console.log('Starting Vite build...');
        // 1. Run Vite build
        await build();
        console.log('Vite build finished successfully.');

        // 2. Get version and define zip path
        const version = await getVersion();
        const zipName = `javdb-extension-v${version}.zip`;
        const zipPath = resolve(distZipDir, zipName);

        // 3. Create a zip file of the dist directory contents
        console.log(`\nCreating zip file at ${zipPath}...`);
        
        // Ensure dist directory exists
        if (!fs.existsSync(distDir)) {
            console.error('ERROR: dist directory not found. Cannot create zip.');
            process.exit(1);
        }

        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', {
            zlib: { level: 9 } // Set the compression level
        });

        // Listen for all archive data to be written
        output.on('close', () => {
            console.log(`Zip file created successfully: ${archive.pointer()} total bytes`);
        });

        archive.on('warning', (err) => {
            if (err.code === 'ENOENT') {
                console.warn('Warning during archiving:', err);
            } else {
                throw err;
            }
        });

        archive.on('error', (err) => {
            throw err;
        });

        // Pipe archive data to the file
        archive.pipe(output);

        // Append files from the 'dist' directory, excluding any potential zips
        archive.glob('**/*', {
            cwd: distDir,
            ignore: ['*.zip'] // Exclude any zip files from being included
        });

        // Finalize the archive (this is when the zip is actually written)
        await archive.finalize();

        console.log('\nBuild and packaging process completed.');

    } catch (e) {
        console.error('\nAn error occurred during the build process:');
        console.error(e);
        process.exit(1);
    }
}

main(); 