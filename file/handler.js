/*
 * Together Storage
 * Copyright 2016 Tony Tam @tabenren
 */

//more : https://github.com/substack/stream-handbook

var fs = require('fs');
var path = require('path');
var mime = require('mime');
var oppressor = require('oppressor');
var provider = require('./provider');

exports.download = function (opts, file, name, cb) {
    return function(req, res, next){
        var filePath = path.resolve(opts.dir, file);

        var fileProvider = provider.createClient(opts);
        var reader = fileProvider.download(filePath, function(err){
            if(err){
                return cb(err);
            }
        });
        var mimetype = mime.lookup(filePath);
        
        res.setHeader('Content-disposition', 'attachment; filename*=UTF-8\'\'' + encodeURIComponent(name));
        res.setHeader('Content-type', mimetype);
        // reader.on('data', function (chunk) {
        //  console.log(chunk)
        // })
        // .on('end', function () {
        //  console.log('end');
        // });

        return reader.pipe(oppressor(req)).pipe(res);

        //cb(null, reader);
        reader.on('error', function (err) {
            if (err.code === 'ENOENT') {
                return cb(err);
            }
        });
    }
};