import { build } from 'vite';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import archiver from 'archiver';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const distDir = resolve(root, 'dist');
const zipPath = resolve(distDir, 'javdb-extension.zip');

async function main() {
    try {
        console.log('Starting Vite build...');
        // 1. Run Vite build
        await build();
        console.log('Vite build finished successfully.');

        // 2. Create a zip file of the dist directory
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

        // Append files from the 'dist' directory, putting them at the root of the zip
        archive.directory(distDir, '/');

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