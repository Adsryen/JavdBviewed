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
        await build();
        console.log('Vite build finished successfully.');

        console.log(`\nCreating zip file at ${zipPath}...`);
        
        if (!fs.existsSync(distDir)) {
            console.error('ERROR: dist directory not found. Cannot create zip.');
            process.exit(1);
        }

        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', {
            zlib: { level: 9 }
        });

        const stream = new Promise<void>((resolve, reject) => {
            output.on('close', () => {
                console.log(`Zip file created successfully: ${archive.pointer()} total bytes`);
                resolve();
            });
            archive.on('warning', (err) => {
                if (err.code === 'ENOENT') {
                    console.warn('Warning during archiving:', err);
                } else {
                    reject(err);
                }
            });
            archive.on('error', (err) => {
                reject(err);
            });
        });

        archive.pipe(output);
        archive.directory(distDir, false);
        await archive.finalize();
        await stream;

        console.log('\nBuild and packaging process completed.');

    } catch (e) {
        console.error('\nAn error occurred during the build process:');
        console.error(e);
        process.exit(1);
    }
}

main(); 