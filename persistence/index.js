/*
 * Together Storage
 * Copyright 2016 Tony Tam @tabenren
 */

//module.exports.Mongo = require("./other");
module.exports.Mongo = require("./mongo");

var factories = {};
Object.keys(module.exports).forEach(function(type) {
    factories[type.toLowerCase()] = module.exports[type];
});

module.exports.getFactory = function(name) {
    return factories[name.toLowerCase()];
};