const JSZip = require('./dev_modules/jszip.min.js');
const fs = require('fs');
const path = require('path');

const args = process.argv;

// handle fx flag
let fxFlag = false;
const manifestPath = './src/manifest.json';
if (args.length > 3) {
    printUsage();
} else if (args.length === 3) {
    switch (args[2]) {
        case 'firefox':
            fxFlag = true;
            break;
        case 'chromium':
            fxFlag = false;
            break;
        default:
            printUsage();
    }
}
if (fxFlag === false) {
    fs.copyFileSync(manifestPath, manifestPath + '.bk');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, {encoding: 'utf8'}));
    // remove firefox entry
    delete manifest.browser_specific_settings;
    // remove permission *management*
    manifest.permissions.splice(manifest.permissions.indexOf('management', 1));
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 4));
}

// archive
let zip = new JSZip();
let ignoreRules = ['.git', 'dev_modules', 'build.js', 'manifest.json.bk', 'MyToolBox.zip', 'MyToolBox.fx.zip'];
const archiveRoot = path.join(process.cwd(), 'src');

archive('', zip);

zip.generateAsync({ type: 'nodebuffer' }).then(data => {
    if (fxFlag) {
        fs.writeFileSync('MyToolBox.fx.zip', data);
        fs.unlinkSync(manifestPath);
        fs.renameSync(manifestPath + '.bk', manifestPath);
    } else {
        fs.writeFileSync('MyToolBox.zip', data);
    }
});

function printUsage() {
    console.log(
        'Usage:\n  node build.js chromium "build chromium extension"\n  node build.js firefox "build firefox addon"'
    );
    process.exit(1);
}

function archive(relPath, zip) {
    const fullPath = path.join(archiveRoot, relPath);
    const files = fs.readdirSync(fullPath, { withFileTypes: true });
    itr_files: for (item of files) {
        // filter files by ignoreRules
        for (rule of ignoreRules) {
            if (item.name.match(rule)) continue itr_files;
        }
        // recursive iteration
        const newFullPath = path.join(fullPath, item.name);
        const newRelPath = path.join(relPath, item.name);
        if (item.isDirectory()) {
            archive(newRelPath, zip);
        } else if (item.isFile()) {
            // use *nix style path for better compatibility
            const unixRelPath = newRelPath.replace(/\\/g, '/');
            const data = fs.readFileSync(newFullPath);
            zip.file(unixRelPath, data);
            console.log('added file to: ' + unixRelPath);
        } else {
            console.warn(newFullPath, ' is neither a dir nor a file.');
        }
    }
}
