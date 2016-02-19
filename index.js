/*
 * Together Storage
 * Copyright 2016 Tony Tam @tabenren
 */

var upload = require('./upload');
var restapi = require('./restapi');

var server = function(opt,permission){
    opt.upload.persistence = opt.restapi.persistence = opt.persistence;
    opt.upload.dir = opt.restapi.dir = opt.dir;
    
    var uploadServer = new upload.Server(opt.upload);
    uploadServer.authenticate = permission.authenticate;

    var downloadServer = new restapi.Server(opt.restapi);
    downloadServer.authenticate = permission.authenticate;

};

module.exports = server;