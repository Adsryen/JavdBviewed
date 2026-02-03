const { glob } = require('glob');
const { rimraf } = require('rimraf');
const path = require('path');

// The pattern to find all 'test' directories within node_modules
const pattern = 'node_modules/**/test';

(async () => {
    try {
        console.log(`Starting cleanup for pattern: ${pattern}`);
        const directories = await glob(pattern, { dot: true, follow: false, ignore: 'node_modules/rimraf/test' });

        if (directories.length === 0) {
            console.log('No test directories found to clean up.');
            return;
        }

        console.log(`Found ${directories.length} test directories to remove:`);
        // directories.forEach(dir => console.log(`- ${dir}`));

        await Promise.all(directories.map(dir => rimraf(dir)));

        console.log('Cleanup successful. All specified test directories have been removed.');
    } catch (err) {
        console.error('Error during cleanup:', err);
        process.exit(1);
    }
})(); 