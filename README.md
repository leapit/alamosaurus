# Together Storage

## Config your storage like this

Example
```
    storage: {
        dir: './storage',
        upload: {
            port: 8080,
            form: {
                //uploadDir: './storage',
                keepExtensions: true,
                multiples: true,
                maxFieldsSize: 2 * 1024 * 1024 // npm issue,not work
            },
            file: {
                ext: ['.gif', '.jpg', '.png'], // '*' for all type file
                maxsize: 2 * 1024 * 1024
            },
            image: {
                thumb: true, //need install graphicsmagick/imagemagick on server (https://github.com/aheckmann/gm)
                prefix: 'thumb_',
                resize: [150, 150, '!'], //[150,150,''] 按照比例缩略
                overwrite: false
            }
        },
        restapi: {
            port: 9090,
        },
        persistence: {
            url: 'mongodb://localhost:27017/storage',
            mongo: {},
            files: 'files',
            logs:'logs'
        }
    }
```
## Custom permission like this

```
var authApi = {};

authApi = {
    // Accepts the connection if the token are valid
    authenticate: function authenticate(token, callback) {
        var clientid = '';
        var userid = '';
        console.log(':::::::::: checking token ::::::::::');
        console.log(token);

        var authorized = (token === 'user.token.here');
        if (authorized) {
            clientid = 'clientid';
            userid = 'userid';
            callback(null, clientid, userid);
        } else {
            callback(new Error('token error.'), clientid, userid);
        }
    }

};

module.exports = authApi;

```

## Usage
###1. Embed in your app(Recommend)

```
    var storage = require('./storage');
    var config = require('./storage.config');
    var permission = require('./storage.permission');
    storage(config, permission);
```
Example with express [https://github.com/leapit/storage/wiki/Embed-in-express-js](https://github.com/leapit/storage/wiki/Embed-in-express-js)

###2. Stand alone

[https://github.com/leapit/storage/wiki/Stand-alone](https://github.com/leapit/storage/wiki/Stand-alone)

## Start your app

When your server started(e.g run npm start),the terminal will show
```
Storage upload server run at 8080
Storage download server run at 9090
```

## Example for upload a file

```
<form action="http://localhost:8080/?token=user.token.here" enctype="multipart/form-data" method="post">
<input type="text" name="container" value="my-path">
<input type="text" name="tag" value="tag1">
<input type="text" name="tag" value="tag2">
<input type="text" name="description" value="miaosu">
<br />
<input type="text" name="sharelevel" value="1">
<input type="text" name="shareto" value="VJZnd0PFl">
<input type="text" name="shareto" value="E1QwuAPKe">
<br><input type="file" name="upload" multiple="multiple">
<br><input type="submit" value="Upload">
</form>
```

## More refer to wiki
