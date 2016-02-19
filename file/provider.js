/*
 * Together Storage
 * Copyright 2016 Tony Tam @tabenren
 */

var fs = require('fs');
var path = require('path');
var async = require('async');

module.exports.createClient = function (options) {
    return new FileSystemProvider(options);
};

function FileSystemProvider(options) {
    options = options || {};
    this.dir = options.dir;
    var exists = fs.existsSync(this.dir);
    if (!exists) {
        //throw new Error('FileSystemProvider: Path does not exist: ' + this.dir);
        console.error('\x1B[31mStorage path does not exist: ' + path.resolve(this.dir) + '\033[0m');
        process.exit(0);
    }
    var stat = fs.statSync(this.dir);
    if (!stat.isDirectory()) {
        //throw new Error('FileSystemProvider: Invalid directory: ' + this.dir);
        console.error('\x1B[31mStorage path does not exist: ' + path.resolve(this.dir) + '\033[0m');
        process.exit(0);
    }
}

function validateName(name, cb) {
    var namePattern = new RegExp('[^' + path.sep + '/]+');
    if (!name) {
        cb && process.nextTick(cb.bind(null, new Error('Invalid name: ' + name)));
        if (!cb) {
            console.error('FileSystemProvider: Invalid name: ', name);
        }
        return false;
    }
    var match = namePattern.exec(name);
    if (match && match.index === 0 && match[0].length === name.length) {
        return true;
    } else {
        cb && process.nextTick(cb.bind(null,
            new Error('FileSystemProvider: Invalid name: ' + name)));
        if (!cb) {
            console.error('FileSystemProvider: Invalid name: ', name);
        }
        return false;
    }
}

function populateMetadata(stat, props) {
    for (var p in stat) {
        switch (p) {
            case 'size':
            case 'atime':
            case 'mtime':
            case 'ctime':
                props[p] = stat[p];
                break;
        }
    }
}

FileSystemProvider.prototype.download = function (filePath, cb) {
    var fileOpts = {
        flags: 'r',
        autoClose: true 
    };
    if(fs.statSync(filePath).isFile()){
        try {
            return fs.createReadStream(filePath, fileOpts);
        } catch (e) {
            cb && cb(e);
        }
    }else{
        return cb(new Error('Invalid file'));
    }
};