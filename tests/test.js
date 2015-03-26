var watchTree = require('../index');
var util = require('util');
var numeral = require('numeral');
var prettyTime = require('pretty-hrtime');
var lodash = require('lodash');

var start = process.hrtime();

watchTree(__dirname)
    .on('ready', function(files) {
        console.log(`created watch on ${numeral(files.length).format('0,0')} files in ${prettyTime(process.hrtime(start))}`);
    })
    .on('modify',function(file) {
        dump('modify',file);
    })
    .on('create',function(file) {
        dump('create',file);
    })
    .on('delete',function(file) {
        dump('delete',file);
    })
    //.on('all', function(file) {
    //    dump('all',file);
    //})
;


function dump(obj) {
    console.log.apply(null, lodash.map(arguments, function(obj) {
        return util.inspect(obj, {
            //showHidden: false,
            //depth: 6,
            colors: true
        });
    }));
}
