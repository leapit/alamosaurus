/*
 * Together Storage
 * Copyright 2016 Tony Tam @tabenren
 */

var utilities = require('./utilities');
var handler = require('./file/handler');

module.exports.downloadFile = function(opts, db, clientid, userid, id) {
	return function(req, res, next){
        db.findFile(clientid, userid, id, function(err, result){
            if(err){
            	return next(err);
            }else{
			    if(result){
			    	handler.download(opts, result.file, result.name, function(err, stream){
			    		if(err){
			    			utilities.json({error:err.message})(req, res, next);
			    		}
			    	})(req, res, next);
			    }else{
			    	utilities.json({file:result})(req, res, next);
			    }
            }
        });
    }
};