const JSZip = require('./dev_modules/jszip.min.js');
const fs = require('fs');
const path = require('path');

const args = process.argv;

// handle fx flag
let fxFlag = false;
if(args.length > 3){
    printUsage();
}else if(args.length === 3){
    args[2] === 'fx' ? fxFlag = true : printUsage();
}
if(fxFlag){
    fs.copyFileSync('./manifest.json', './manifest.json.bk');
    const firefoxEntry = {'browser_specific_settings': {
            "gecko": {
                "id": "landius@github.com",
                "strict_min_version": "68.0"
            }
        }
    };
    const manifest = JSON.parse(fs.readFileSync('./manifest.json', {encoding: 'utf8'}));
    for(key in firefoxEntry){
        manifest[key] = firefoxEntry[key];
    }
    fs.writeFileSync('./manifest.json', JSON.stringify(manifest));
}

// archive
let zip = new JSZip();
let ignoreRules = ['.git', 'dev_modules', 'build.js', 'manifest.json.bk', 'MyToolBox.zip', MyToolBox.fx.zip];
const cwd = process.cwd();

archive('', zip);

zip.generateAsync({type: 'nodebuffer'}).then(data=>{
    if(fxFlag){
        fs.writeFileSync('MyToolBox.fx.zip', data);
        fs.unlinkSync('./manifest.json');
        fs.renameSync('./manifest.json.bk', './manifest.json');
    }else{
        fs.writeFileSync('MyToolBox.zip', data);
    }
});

function printUsage(){
    console.log('Usage:\n  node build.js "build chrome extension"\n  node build.js fx "build firefox addon"');
    process.exit(1);
}

function archive(relPath, zip){
    const fullPath = path.join(cwd, relPath);
    const files = fs.readdirSync(fullPath, {withFileTypes: true});
    itr_files:
    for(item of files){
        // filter files by ignoreRules
        for(rule of ignoreRules){
            if(item.name.match(rule)) continue itr_files;
        }
        // recursive iteration
        const newFullPath = path.join(fullPath, item.name);
        const newRelPath = path.join(relPath, item.name);
        if(item.isDirectory()){
            archive(newRelPath, zip);
        }else if(item.isFile()){
            console.log(newRelPath, newFullPath);
            const data = fs.readFileSync(newFullPath);
            zip.file(newRelPath, data);
        }else{
            console.warn(newFullPath, ' is neither a dir nor a file.');
        }
    }
}