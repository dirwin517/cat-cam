/**
 * Created by daniel.irwin on 9/1/16.
 */

module.exports = (function(){

    var netscan = require('netscan')();

    function analyze(data){

        function keyValues(camera) {
            if (camera.uri.indexOf('get_status.cgi') > -1) {
                camera.type = 'FOSCAM';
                return camera.body.split('\n')
            }
            else if (camera.uri.indexOf('system.cgi') > -1) {
                camera.type = 'KEEBOX';
                return camera.body.split('\r\n');
            }
            return [];
        }

        function unstring(stringOfString){
            if(typeof stringOfString !== 'string'){
                return '';
            }
            return stringOfString.replace(/'|"/g,'').replace('var ', '').replace(';','');
        }

        try {
            data.forEach((camera) => {
                var newBody = {};
                keyValues(camera).forEach((keyValue) => {
                    var kv = keyValue.split('=');
                    var key = unstring(kv[0]);
                    var value = unstring(kv[1]);
                    if (key && value) {
                        newBody[key] = value;
                    }
                });

                camera.alias = newBody.CameraName || newBody.alias;
                delete camera.body;

            });
        }
        catch(e){
            console.log('error happened', e.stack);
        }
        return data;
    }

    function rawScan(callback){
        netscan.scan({

            protocol : ['http'],

            octet0: [192],
            octet1: [168],
            octet2: [0],
            octet3: [{min: 100, max: 130}], //range of 7 to 10 inclusive

            ports: [80],

            codes: [200, 201, 202, 400, 401, 402, 403], //only count it if a 200 comes back,

            errors : [],

            paths: ['/system.cgi', '/get_status.cgi'], // optional to have it hit a specific endpoint

            headers: {
                Authorization:  'Basic ' + (new Buffer('admin' + ':' + 'admin', 'utf8')).toString('base64')
            }, // include the following headers in all request so you can do auth or something,

            timeout: 20000 //10 seconds timeout)

            //ignoreResponse : true
        }, function(results) {
            if (typeof callback === 'function') {
                callback(analyze(results));
            }
            else {
                //console.log(JSON.stringify(results, null, 3));
            }
        });
    }

    function ipscan(callback){
        rawScan(function(results){
            console.log('raw Scan Results', results);
            callback(analyze(results));
        });
    }

    return {
        scan : ipscan,
        rawScan : rawScan
    }

})();