import { build } from 'esbuild';
import { readFileSync, writeFileSync, createWriteStream, mkdirSync } from 'fs';
import archiver from 'archiver';

// Check if the --watch flag is present
const isWatch = process.argv.includes('--watch');
const isRelease = process.argv.includes('--release');

const packageJson = JSON.parse(readFileSync('package.json', { encoding: 'utf8' }));
const version = packageJson.version;

const manifestContent = `
fx_version 'cerulean'
game 'common'
lua54 'yes'
node_version '22'

name '${packageJson.name}'
author '${packageJson.name}'
version '${version}'
description '${packageJson.description}'

server_script 'dist/build.js'

client_script 'ui.lua'

files {
    'web/build/index.html',
    'web/build/**/*'
}

ui_page 'web/build/index.html'

provide 'mysql-async'
provide 'ghmattimysql'

convar_category 'kjmysql' {
    'Configuration',
    {
        { 'Connection string', 'mysql_connection_string', 'CV_STRING', 'mysql://user:password@localhost/database' },
        { 'Read-only Connection string', 'mysql_read_connection_string', 'CV_STRING', '' },
        { 'Debug', 'mysql_debug', 'CV_BOOL', 'false' },
        { 'Slow Query Warning (ms)', 'mysql_slow_query_warning', 'CV_INT', '200' },
        { 'Result Set Warning (rows)', 'mysql_resultset_warning', 'CV_INT', '1000' },
        { 'Check for Updates', 'mysql_versioncheck', 'CV_BOOL', 'true' },
        { 'Enable UI', 'mysql_ui', 'CV_BOOL', 'false' }
    }
}
`;

writeFileSync('fxmanifest.lua', manifestContent);
console.log('fxmanifest.lua generated with version', version);

const buildOptions = {
    bundle: true,
    entryPoints: ['src/index.ts'],
    outfile: 'dist/build.js',
    platform: 'node',
    target: 'node22',
    format: 'cjs',
    logLevel: 'info',
};

if (isWatch) {
    buildOptions.watch = true;
}

build(buildOptions)
    .then(() => {
        // If --release is passed, create the zip
        if (isRelease) {
            console.log('Build complete. Creating release zip...');

            // Create a 'release' folder if it doesn't exist
            mkdirSync('release', { recursive: true });

            const output = createWriteStream(`release/kjmysql.zip`);
            const archive = archiver('zip', {
                zlib: { level: 9 } // Max compression
            });

            output.on('close', () => {
                console.log(`Release zip created: ${archive.pointer()} total bytes`);
            });

            archive.on('error', (err) => { throw err; });
            archive.pipe(output);

            // Add all the necessary files
            archive.file('fxmanifest.lua', { name: 'fxmanifest.lua' });
            archive.file('ui.lua', { name: 'ui.lua' });
            archive.file('lib/MySQL.lua', { name: 'lib/MySQL.lua' });
            archive.directory('dist/', 'dist');
            archive.directory('web/build/', 'web/build');

            archive.finalize();
        }
    })
    .catch(() => process.exit(1));