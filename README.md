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
## custom permission like this

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

## Embed in your app

```
    var storage = require('./storage');
    var config = require('./storage.config');
    var permission = require('./storage.permission');
    storage(config, permission);
```

## Start your app

When your server started(e.g run npm start),the terminal will show
```
Storage upload server run at 8080
Storage download server run at 9090
```

## More refer to wiki



