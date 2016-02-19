/*
 * Together Storage
 * Copyright 2016 Tony Tam @tabenren
 */

var util = require('util');

//out put json
module.exports.json = function(data) {
    return function(req, res, next) {
        var extend = util._extend;
        var jsonData = {};
        extend(jsonData, data);

        res.setHeader('Content-type', 'application/json');
        res.end(JSON.stringify(jsonData));
    }
};
