/**
 * Created by daniel.irwin on 8/26/16.
 */
module.exports = (function(){

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
        if(!req.cookies.username){
            res.statusCode(400);
            return res.send('must include username');
        }

        var guid;
        if(!req.cookies['cat-cam']){
            var epochNow = new Date().getTime().toString();
            guid = getUserIp(req) + '.' + req.cookies.username + '.' + toBase64(epochNow);
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
                username : req.cookies.username
            };
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

    return {
        middleware : middleware,
        getUsers : getUsers
    }

})();