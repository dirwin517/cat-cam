/**
 * Created by daniel.irwin on 8/26/16.
 */
module.exports = function(opts){

    var userCounter = 0;

    opts.metrics({
        name    : 'Realtime user',
        value   : function() {
            return userCounter;
        },
        alert : {
            mode     : 'threshold',
            value    : 500
        }
    });

    function addUser(){
        userCounter++;
    }

    function removeUser(){
        userCounter--;
    }

    var myUsers = {};

    function getUserIp(req){
        return req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    }

    function toBase64(input) {
        return new Buffer(input, 'utf8').toString('base64');
    }

    function toUtf8(input) {
        return new Buffer(input, 'base64').toString('utf8');
    }

    function middleware(req, res, next){
        var username = req.cookies.username || req.query.username;
        //if(!username){
        //    res.status(400);
        //    return res.send('must include username');
        //}

        addUser();

        req.on('end', function(){
           removeUser();
        });

        var guid;
        if(!req.cookies['cat-cam']){
            var epochNow = new Date().getTime().toString();
            guid = getUserIp(req) + '.' + username + '.' + toBase64(epochNow);
            res.cookie('cat-cam', guid);
        }
        else {
            guid = req.cookies['cat-cam'];
        }

        if(!myUsers[guid]){
            myUsers[guid] = {
                ip : getUserIp(req),
                guid : guid,
                login : new Date().toISOString(),
                username : username,
                hits : 0
            };
        }
        else {
            myUsers[guid].hits++
        }
        next();
    }


    function getUsers(){
        return Object.keys(myUsers).map((key) =>{
            if(myUsers && myUsers[key]) {
                return myUsers[key].guid;
            }
            return 'unknown';
        });
    }

    function userHits(){
        return Object.keys(myUsers).map((key) => {
           if(myUsers && myUsers[key]){
               var result = {};
               result[myUsers[key].username] = myUsers[key].hits;
               return result;
           }
            return '';
        });
    }

    return {
        middleware : middleware,
        getUsers : getUsers,
        userHits : userHits
    }

};