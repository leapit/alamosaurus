/*
 * Together Storage
 * Copyright 2016 Tony Tam @tabenren
 */

var _            = require("lodash");
var url          = require("url");
var shortid      = require("shortid");
var Puid         = require('puid');
var formidable   = require('formidable');
var http         = require('http');
var util         = require('util');
var path         = require('path');
var fs           = require('fs');
var gm           = require('gm');
var fileType     = require('file-type');
//var static       = require('node-static');
var connect      = require('connect');
var connectRoute = require('connect-route');
//var Download     = require('download');
var Promise      = require('bluebird');
var bodyParser   = require('body-parser');
var persistence  = require('./persistence');
var apis         = require('./apis');

var extend = util._extend;
var app = connect();
/*

*/
function Server(opts, callback) {
    var that = this;
    //var fileServer = new static.Server(opts.dir);

    if (!(this instanceof Server)) {
        return new Server(opts, callback);
    }
    if (opts.port) {
        opts.port = opts.port || 9090;
    }

    callback = callback || function() {};

    app.use(bodyParser.urlencoded({ extended: true }));

    app.use(connectRoute(function (router) {
        //handle download api
        router.get('/file/:id', function (req, res, next) {
            var query = url.parse(req.url, true).query;
            var token = query.token || '';
            var id = req.params.id || '';

            that.authenticate(token, function(err, clientid, userid){
                if(err){
                    next(err);
                }else{
                    apis.downloadFile(opts, that.persistence, clientid, userid, id)(req, res, next);
                }
            });            
        });
    }));


    app.use(function(req, res) {
        res.statusCode = 404;
        var message = 'Not found'
        res.setHeader('Content-type', 'application/json');
        res.end(JSON.stringify({ 'error': message }));
    });

    app.use(function onerror(err, req, res, next) {
        res.statusCode = err ? 200 : 500;
        var message = (err && err.message) || 'Unknown error'
        res.setHeader('Content-type', 'application/json');
        res.end(JSON.stringify({ 'error': message }));
    });

    app.listen(opts.port,function(){
        persistenceFactory = persistence.getFactory('mongo');
        that.persistence = persistenceFactory(opts.persistence,function(err){
        });

        console.log('\x1B[32mStorage download server run at ' + opts.port + '\033[0m');
        callback(null)
    });
}

module.exports.Server = Server;


Server.prototype.generateUniqueId = function() {
    return shortid.generate();
};

Server.prototype.authenticate = function(token, callback) {
    callback(null,'stirng','stirng');
};

Server.prototype.getFiles = function(condition, action) {
    var resolver = Promise.defer();
    var loop = function() {
        if (!condition()) return resolver.resolve();
        return Promise.cast(action())
            .then(loop)
            .catch(resolver.reject);
    };
    process.nextTick(loop);
    return resolver.promise;
};