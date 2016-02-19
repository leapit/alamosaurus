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
var connect      = require('connect');
var connectRoute = require('connect-route');
var Promise      = require('bluebird');
var persistence  = require('./persistence');
var provider     = require('./file/provider');

var extend = util._extend;
var app = connect();

/*

// share options
// share:{
//     level:1//0:no share; 1:limit for specific; 2: by link; 
//     userid:['userid-1','userid-2']//only when level = 1
// }


return json


{
    "id": "VktM01utl",
    "files": [{
        "clientid": "clientid",
        "userid": "userid",
        "fid": "ik3m3gqy1hwxe6df5527b5r8",
        "field": "upload",
        "file": "upload_cdf4d23d21d25f90aa7528dfd4a36493.png",
        "name": "Together storage feature.png",
        "size": 127902,
        "type": "image/png",
        "hash": null,
        "share": {
            "level": "1",
            "to": ["VJZnd0PFl", "E1QwuAPKe"]
        },
        "timestamp": 1454309112202,
        "description": "miaosu",
        "star": 0,
        "tag": ["tag1", "tag2"],
        "container": "my-path",
        "thumb": "thumb_upload_cdf4d23d21d25f90aa7528dfd4a36493.png",
        "_id": "56aefef86ab75ef210d791a8"
    }, {
        "clientid": "clientid",
        "userid": "userid",
        "fid": "ik3m3gud1hwxe6df55483i8e",
        "field": "upload",
        "file": "upload_c4704a467a107b4bc11fa3f7957dcbe1.png",
        "name": "Together next.png",
        "size": 133311,
        "type": "image/png",
        "hash": null,
        "share": {
            "level": "1",
            "to": ["VJZnd0PFl", "E1QwuAPKe"]
        },
        "timestamp": 1454309112325,
        "description": "miaosu",
        "star": 0,
        "tag": ["tag1", "tag2"],
        "container": "my-path",
        "thumb": "thumb_upload_c4704a467a107b4bc11fa3f7957dcbe1.png",
        "_id": "56aefef86ab75ef210d791a9"
    }],
    "fields": [{
        "container": "my-path"
    }, {
        "tag": "tag1"
    }, {
        "tag": "tag2"
    }, {
        "description": "miaosu"
    }, {
        "sharelevel": "1"
    }, {
        "shareto": "VJZnd0PFl"
    }, {
        "shareto": "E1QwuAPKe"
    }],
    "errors": []
}

*/
function Server(opts, callback) {
    var that = this;
    if (!(this instanceof Server)) {
        return new Server(opts, callback);
    }
    if (opts.port) {
        opts.port = opts.port || 8080;
    }

    callback = callback || function() {};
    
    // app.use(bodyParser.urlencoded({ extended: true }));

    app.use(connectRoute(function (router) {
        //handle download api
        router.post('/', function (req, res, next) {
            var query = url.parse(req.url, true).query;
            var token = query.token || '';

            if(!token){
                return next(new Error('Token error.'));
            }

            var errors = [];
            var resMessage = '';
            var allFiles = [];
            files = [];
            fields = [];
            //property
            var properties = {};
            var share = {};
            var container = '';
            var tag = [];
            var star = 0;
            var description = '';
            extend(properties,{container:''});
            extend(properties,{tag:[]});
            extend(properties,{star:0});
            extend(properties,{description:''});

            extend(share,{level:'0'});
            extend(share,{to:[]});

            // parse a file upload
            var form = new formidable.IncomingForm();

            extend(form, opts.form);
            form.uploadDir = opts.dir;

            that.authenticate(token,function(err, clientid, userid){
                if(err == null){
                    form.on('error', function(err) {
                        resMessage = err;
                        errors.push(err)
                    });

                    form.on('field', function(field, value) {
                        switch (field){
                            case 'container':
                                properties['container'] = value;
                                break;
                            case 'tag':
                                properties['tag'].push(value);
                                break;
                            case 'star':
                                properties['star'] = value;
                                break;
                            case 'description':
                                properties['description'] = value;
                                break;
                            case 'sharelevel':
                                share['level'] = value;
                                break;
                            case 'shareto':
                                share['to'].push(value);
                                break;
                        }
                        var item = {};
                        item[field] = value;
                        fields.push(item);
                    });

                    // 当文件超过大小时，无法停止上传
                    // form.on('progress', function(bytesReceived, bytesExpected) {
                    //     if(bytesReceived > opts.form.maxFieldsSize){
                    //         this.emit('error', ": file size .....");
                    //     }
                    // });

                    form.on('file', function(field, file) {
                        var type = file.type;
                        var size = file.size;
                        type = type.split('/');
                        type = type[1];
                        if(size > opts.file.maxsize){ //formidable 本身提供的 form.maxFieldsSize 存在问题，所以服务器端临时采用上传后判断文件大小，超过大小再删除，目前还没有较好的办法（参照结合前端ajax判断文件大小，比如jquery upload）
                            this.emit('error', file.name + ": file too big");
                            fs.unlink(file.path);
                        }else{
                            files.push([field, file]);
                        }
                    });

                    form.on('end', function() {
                        //if(errors.length == 0){
                        /*
                        files = 
                        [ [ 'upload',
                            { size: 4729,
                              path: '',
                              name: 'Untitled.png',
                              type: 'image/png'
                            }
                          ],[ 'upload',
                            { size: 4729,
                              path: '',
                              name: 'Untitled.png',
                              type: 'image/png'
                            }
                          ]
                        ]
                        */

                        var sum = 0;
                        var totalFileNum = files.length - 1;

                        if(totalFileNum >= 0){
                            that.getFiles(function() {
                                return sum <= totalFileNum;
                            }, function() {
                                return new Promise(function(resolve, reject) {
                                    var puid = new Puid();
                                    var timestamp = Date.now();
                                    var oldFilename = path.basename(files[sum][1].path);
                                    var newFilename = opts.image.overwrite == true ? oldFilename : opts.image.prefix + oldFilename;
                                    var thisFile = {clientid:clientid,userid:userid,fid:puid.generate(),field:files[sum][0],file:oldFilename,name:files[sum][1].name,size:files[sum][1].size,type:files[sum][1].type,hash:files[sum][1].hash,share:share,timestamp:timestamp};
                                    extend(thisFile,properties);
                                    var mine = '';
                                    mine = files[sum][1].type.split('/');
                                    if(mine[0] == 'image' && opts.image.thumb == true){
                                        gm(files[sum][1].path)
                                        //.options({imageMagick: true})//gm 默认使用graphicsmagick，这里使用imagemagick
                                        .resize(opts.image.resize[0], opts.image.resize[1], opts.image.resize[2])
                                        .noProfile()
                                        .write(form.uploadDir + '/' + newFilename, function (err) {
                                            if (!err){
                                                extend(thisFile,{thumb:newFilename});
                                            }
                                            allFiles.push(thisFile);
                                            //next
                                            sum++;
                                            resolve();
                                            //end
                                        });
                                    }else{
                                        allFiles.push(thisFile);
                                        //next
                                        sum++;
                                        resolve();
                                        //end
                                    }
                                });
                            }).then(function() {
                                var uniqueid = that.generateUniqueId();
                                var data = {id:uniqueid,files:allFiles,fields:fields,errors:errors};
                                var packet = {id:uniqueid,files:allFiles,fields:fields};
                                that.persistence.store(allFiles,packet,function(err){
                                    //
                                });

                                res.writeHead(200, {'content-type': 'text/plain'});
                                return res.end(JSON.stringify(data));
                            });

                        }else{
                            res.writeHead(200, {'content-type': 'text/plain'});
                            return res.end(JSON.stringify({'error':'Not file selected.'}));
                        }
                    });

                    form.parse(req);

                    form.onPart = function(part) {
                        if(!_.isUndefined(part.filename)) {
                            //if it is file field
                            if (part.filename == '') {
                                //not select file
                                this.emit('error',  "No file selected");
                            }else{
                                var ext = path.extname(part.filename)
                                if (part.filename && (opts.file.ext == '*' || _.indexOf(opts.file.ext, ext) != -1)) {
                                    form.handlePart(part);
                                }else{
                                    this.emit('error', part.filename + ": file type not allowed upload");
                                }
                            }
                        }else{
                            //if not a file field(container/tag/description)
                            form.handlePart(part);
                        }
                    }

                }else{
                    return res.end(util.inspect({auth:'faild.'}));
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
        var fileProvider = provider.createClient(opts);

        console.log('\x1B[32mStorage upload server run at ' + opts.port + '\033[0m');
        callback(null)
    });

    // http.createServer(function(req, res) {
    //     console.log(req.body)
    //     console.log(req.params)
    //     console.log(req.query)
    //     console.log(req.param('token'))
    //     var token = req.body.token || req.params.token || req.query.token || req.headers['x-access-token'];
    //     if (req.url == '/' && req.method.toLowerCase() == 'post') {
    //         var errors = [];
    //         var resMessage = '';
    //         var allFiles = [];
    //         files = [];
    //         fields = [];
    //         //property
    //         var properties = {};
    //         var share = {};
    //         var container = '';
    //         var tag = [];
    //         var star = 0;
    //         var description = '';
    //         extend(properties,{container:''});
    //         extend(properties,{tag:[]});
    //         extend(properties,{star:0});
    //         extend(properties,{description:''});

    //         extend(share,{level:'0'});
    //         extend(share,{to:[]});

    //         // parse a file upload
    //         var form = new formidable.IncomingForm();

    //         extend(form, opts.form);
    //         form.uploadDir = opts.dir;

    //         that.authenticate(token,function(err, clientid, userid){
    //             if(err == null){
    //                 form.on('error', function(err) {
    //                     resMessage = err;
    //                     errors.push(err)
    //                 });

    //                 form.on('field', function(field, value) {
    //                     switch (field){
    //                         case 'container':
    //                             properties['container'] = value;
    //                             break;
    //                         case 'tag':
    //                             properties['tag'].push(value);
    //                             break;
    //                         case 'star':
    //                             properties['star'] = value;
    //                             break;
    //                         case 'description':
    //                             properties['description'] = value;
    //                             break;
    //                         case 'sharelevel':
    //                             share['level'] = value;
    //                             break;
    //                         case 'shareto':
    //                             share['to'].push(value);
    //                             break;
    //                     }
    //                     var item = {};
    //                     item[field] = value;
    //                     fields.push(item);
    //                 });

    //                 // 当文件超过大小时，无法停止上传
    //                 // form.on('progress', function(bytesReceived, bytesExpected) {
    //                 //     if(bytesReceived > opts.form.maxFieldsSize){
    //                 //         this.emit('error', ": file size .....");
    //                 //     }
    //                 // });

    //                 form.on('file', function(field, file) {
    //                     var type = file.type;
    //                     var size = file.size;
    //                     type = type.split('/');
    //                     type = type[1];
    //                     if(size > opts.file.maxsize){ //formidable 本身提供的 form.maxFieldsSize 存在问题，所以服务器端临时采用上传后判断文件大小，超过大小再删除，目前还没有较好的办法（参照结合前端ajax判断文件大小，比如jquery upload）
    //                         this.emit('error', file.name + ": file too big");
    //                         fs.unlink(file.path);
    //                     }else{
    //                         files.push([field, file]);
    //                     }
    //                 });

    //                 form.on('end', function() {
    //                     //if(errors.length == 0){
    //                     /*
    //                     files = 
    //                     [ [ 'upload',
    //                         { size: 4729,
    //                           path: '',
    //                           name: 'Untitled.png',
    //                           type: 'image/png'
    //                         }
    //                       ],[ 'upload',
    //                         { size: 4729,
    //                           path: '',
    //                           name: 'Untitled.png',
    //                           type: 'image/png'
    //                         }
    //                       ]
    //                     ]
    //                     */

    //                     var sum = 0;
    //                     var totalFileNum = files.length - 1;

    //                     if(totalFileNum >= 0){
    //                         that.getFiles(function() {
    //                             return sum <= totalFileNum;
    //                         }, function() {
    //                             return new Promise(function(resolve, reject) {
    //                                 var puid = new Puid();
    //                                 var timestamp = Date.now();
    //                                 var oldFilename = path.basename(files[sum][1].path);
    //                                 var newFilename = opts.image.overwrite == true ? oldFilename : opts.image.prefix + oldFilename;
    //                                 var thisFile = {clientid:clientid,userid:userid,fid:puid.generate(),field:files[sum][0],file:oldFilename,name:files[sum][1].name,size:files[sum][1].size,type:files[sum][1].type,hash:files[sum][1].hash,share:share,timestamp:timestamp};
    //                                 extend(thisFile,properties);
    //                                 var mine = '';
    //                                 mine = files[sum][1].type.split('/');
    //                                 if(mine[0] == 'image' && opts.image.thumb == true){
    //                                     gm(files[sum][1].path)
    //                                     //.options({imageMagick: true})//gm 默认使用graphicsmagick，这里使用imagemagick
    //                                     .resize(opts.image.resize[0], opts.image.resize[1], opts.image.resize[2])
    //                                     .noProfile()
    //                                     .write(form.uploadDir + '/' + newFilename, function (err) {
    //                                         if (!err){
    //                                             extend(thisFile,{thumb:newFilename});
    //                                         }
    //                                         allFiles.push(thisFile);
    //                                         //next
    //                                         sum++;
    //                                         resolve();
    //                                         //end
    //                                     });
    //                                 }else{
    //                                     allFiles.push(thisFile);
    //                                     //next
    //                                     sum++;
    //                                     resolve();
    //                                     //end
    //                                 }
    //                             });
    //                         }).then(function() {
    //                             var uniqueid = that.generateUniqueId();
    //                             var data = {id:uniqueid,files:allFiles,fields:fields,errors:errors};
    //                             var packet = {id:uniqueid,files:allFiles,fields:fields};
    //                             that.persistence.store(allFiles,packet,function(err){
    //                                 //
    //                             });

    //                             res.writeHead(200, {'content-type': 'text/plain'});
    //                             return res.end(JSON.stringify(data));
    //                         });

    //                     }else{
    //                         res.writeHead(200, {'content-type': 'text/plain'});
    //                         return res.end(JSON.stringify({'error':resMessage}));
    //                     }
    //                 });

    //                 form.parse(req);

    //                 form.onPart = function(part) {
    //                     if(!_.isUndefined(part.filename)) {
    //                         //if it is file field
    //                         if (part.filename == '') {
    //                             //not select file
    //                             this.emit('error',  "No file selected");
    //                         }else{
    //                             var ext = path.extname(part.filename)
    //                             if (part.filename && (opts.file.ext == '*' || _.indexOf(opts.file.ext, ext) != -1)) {
    //                                 form.handlePart(part);
    //                             }else{
    //                                 this.emit('error', part.filename + ": file type not allowed upload");
    //                             }
    //                         }
    //                     }else{
    //                         //if not a file field(container/tag/description)
    //                         form.handlePart(part);
    //                     }
    //                 }

    //             }else{
    //                 return res.end(util.inspect({auth:'faild.'}));
    //             }
    //         });
    //     }

    // }).listen(opts.port,function(){
    //     persistenceFactory = persistence.getFactory('mongo');
    //     that.persistence = persistenceFactory(opts.persistence,function(err){
    //     });
    //     var fileProvider = provider.createClient(opts);

    //     console.log('\x1B[32mStorage upload server run at ' + opts.port + '\033[0m');
    //     callback(null)
    // });
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