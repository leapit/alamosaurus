# Together Storage

## Embed in your app

```
    var storage = require('./storage');
    var permission = require('./storage.permission');
    storage(opt, permission);
```

## Config your storage

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

## Start your app

When your server started(e.g run npm start),the terminal will show
```
Storage upload server run at 8080
Storage download server run at 9090
```

## More refer to wiki



