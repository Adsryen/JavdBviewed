import { build } from 'vite';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import archiver from 'archiver';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const distDir = resolve(root, 'dist');
const distZipDir = resolve(root, 'dist-zip');

async function getVersion() {
    // First try version.json (updated by version script)
    const versionJsonPath = resolve(root, 'version.json');
    if (fs.existsSync(versionJsonPath)) {
        const versionJson = await fs.readJson(versionJsonPath);
        const build = Number(versionJson.build);
        return Number.isFinite(build) ? `${versionJson.version}.${build}` : versionJson.version;
    }
    // Fallback to package.json
    const packageJsonPath = resolve(root, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
        const packageJson = await fs.readJson(packageJsonPath);
        return packageJson.version;
    }
    throw new Error('Could not find version information.');
}

async function main() {
    try {
        console.log('Starting build process...');

        // 0. Refresh version/build identifiers for this build
        try {
            execSync('node --import tsx scripts/version.ts', {
                cwd: root,
                stdio: 'inherit',
            });
        } catch (e) {
            console.warn('[build] Failed to refresh build id via scripts/version.ts. Proceeding with existing env/version files.');
        }
        
        // 1. Run Vite build (it will clean and create the dist directory)
        await build();
        console.log('Vite build finished successfully.');

        // 2. Ensure external runtime assets are present in dist
        const distTemplatesDir = resolve(distDir, 'assets/templates');
        await fs.ensureDir(distTemplatesDir);
        const g2plotDistPath = resolve(distTemplatesDir, 'g2plot.min.js');
        const g2plotCandidates = [
            resolve(root, 'src/assets/templates/g2plot.min.js'),
            resolve(root, 'public/assets/templates/g2plot.min.js'),
            resolve(root, 'node_modules/@antv/g2plot/dist/g2plot.min.js'),
        ];
        let copied = false;
        for (const p of g2plotCandidates) {
            if (fs.existsSync(p)) {
                await fs.copy(p, g2plotDistPath);
                console.log(`[build] Copied g2plot.min.js from: ${p}`);
                copied = true;
                break;
            }
        }
        if (!copied) {
            console.warn('[build] g2plot.min.js not found in src/public/node_modules. G2Plot will fallback to ECharts at runtime.');
        }

        // 3. Get version and define zip path
        const version = await getVersion();
        const zipName = `javdb-extension-v${version}.zip`;
        const zipPath = resolve(distZipDir, zipName);

        // 4. Create a zip file of the dist directory contents
        console.log(`\nCreating zip file at ${zipPath}...`);
        
        await fs.ensureDir(distZipDir); // Ensure the zip output directory exists

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