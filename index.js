var fs = require('fs');
var path = require('path');
var util = require('util');
var lodash = require('lodash');
var Promise = require('bluebird');
var EventEmitter = require('events').EventEmitter;
var statAsync = Promise.promisify(fs.stat);

// TODO: move these into options
var ignoreFiles = /^hg-|(^|[\/\\])(\.|Thumbs\.db$|nohup\.out$)|___jb_(old|bak)___$|\.(pyc|tar\.gz|orig)$/;
var ignoreDirs = /^(node_modules|bower_components|sql|artifacts|session|logs|cache|plugins\/ezc)$|(^|[\/\\])\./;



module.exports = function watchTree(dir, options) {
    options = lodash.defaults(options || {}, {
        base: process.cwd(),
        wait: 10
        // add `fields` option like watchman; https://github.com/facebook/watchman/tree/master/node
        // [name, is_dir, size, inode, atime, mtime, ctime] etc
    });

    var pendingChanges = {};
    var emitter = new EventEmitter();
    var isDir = {};
    var fileList = [];

    var handler = lodash.debounce(function() {
        var deleted = [];
        var created = [];
        var modified = [];

        var stats = lodash.map(pendingChanges, function(_, file) {
            return statAsync(file).then(function(stat) {
                if(!isDir.hasOwnProperty(file)) {
                    if(stat.isDirectory()) {
                        scanDir(file); // FIXME: this repeats a little bit of work
                    } else {
                        isDir[file] = false;
                    }
                    created.push(file);
                } else {
                    modified.push(file); // TODO: if we hash the file we can determine if it *actually* changed. we should also be able to detect renames
                }
            }, function(err) {
                if(err.errno === -2 && isDir.hasOwnProperty(file)) {
                    deleted.push(file);
                    delete isDir[file];
                } else {
                    throw err;
                }
            });
        });

        Promise.settle(stats).then(function() {
            if(deleted.length) emitter.emit('delete',deleted);
            if(modified.length) emitter.emit('modify',modified);
            if(created.length) emitter.emit('create',created);
            if(EventEmitter.listenerCount(emitter, 'all')) {
                var all = deleted.concat(modified).concat(created);
                if(all.length) emitter.emit('all', all);
            }
        });

        pendingChanges = {};
    }, options.wait);

    scanDir(dir).then(function() {
        emitter.emit('ready', fileList);
    });

    return emitter;

    function scanDir(dir) {
        return new Promise(function(resolve, reject) {
            fs.stat(dir, function(err, stat) {
                if(err) return reject(err);
                var relpath = path.relative(options.base,dir);

                if(stat.isDirectory()) {
                    if(ignoreDirs.test(relpath)) return resolve();

                    isDir[relpath] = true;

                    fs.watch(dir, function(event, filename) {
                        var relfile = path.join(relpath, filename);
                        if(!ignoreFiles.test(relfile)) {
                            pendingChanges[relfile] = true;
                            handler();
                        }
                    });

                    fs.readdir(dir, function(err, files) {
                        if(err) return reject(err);

                        var watchers = files.map(function(file) {
                            return scanDir(path.join(dir, file));
                        });

                        Promise.settle(watchers).then(resolve);
                    });
                } else {
                    if(!ignoreFiles.test(relpath)) {
                        isDir[relpath] = false;
                        fileList.push(relpath);
                    }
                    resolve();
                }
            });
        });
    }
};



/*
 stat returns an object like this:

 { dev: 26,
 mode: 16832,
 nlink: 23,
 uid: 1000,
 gid: 1000,
 rdev: 0,
 blksize: 4096,
 ino: 13900686,
 size: 12288,
 blocks: 24,
 atime: Tue Mar 24 2015 08:52:39 GMT-0700 (PDT),
 mtime: Tue Mar 24 2015 08:55:01 GMT-0700 (PDT),
 ctime: Tue Mar 24 2015 08:55:01 GMT-0700 (PDT),
 birthtime: Tue Mar 24 2015 08:55:01 GMT-0700 (PDT) }

 */


