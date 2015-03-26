# watchree

A wrapper around [`fs.watch`](https://iojs.org/api/fs.html#fs_fs_watch_filename_options_listener) for recursively watching a directory of files.

## Purpose

I found other file watchers such as

- [mikeal/watch](https://github.com/mikeal/watch)
- [substack/watchify](https://github.com/substack/watchify)
- [shama/gaze](https://github.com/shama/gaze)
- [paulmillr/chokidar](https://github.com/paulmillr/chokidar)

were either slow to start up or unreliable. I created watchtree to watch a project directory with more than 40,000 files; it initializes in under 500ms.

The only fast and reliable library I found was [facebook/watchman](https://github.com/facebook/watchman/tree/master/node), but I didn't like
that it dependend on a separate service that had to be [built and installed](https://facebook.github.io/watchman/docs/install.html).

## Install

```bash
npm install watchree --save-dev
```

## Example

```javascript
var watchTree = require('watchree');

watchTree(__dirname, {
    excludeFiles: /^hg-|(^|[\/\\])(\.|Thumbs\.db$|nohup\.out$)|___jb_(old|bak)___$|\.(pyc|tar\.gz|orig)$/,
    excludeDirs: /^(node_modules|bower_components|sql|artifacts|session|logs|cache|plugins\/ezc)$|(^|[\/\\])\./
})
    .on('ready', function(files) {
        console.log('watch initialized on '+files.length+' files');
    })
    .on('modify',function(files) {
        console.log('modify',files);
    })
    .on('create',function(files) {
        console.log('create',files);
    })
    .on('delete',function(files) {
        console.log('delete',files);
    })
    .on('all', function(files) {
        console.log('created, modified or deleted',files);
    });
```

## License

watchree is made available under the terms of the MIT license. See the LICENSE file that accompanies this distribution for the full text of the license.