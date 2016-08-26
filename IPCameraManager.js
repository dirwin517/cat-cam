/**
 * Created by daniel.irwin on 8/7/16.
 */
module.exports = function(cameras){
    var request = require('request');

    //var badCamera = fs.createReadStream( __dirname + '/nocamera.jpg');

    function getCamera(cameraFinder, cb){

        var theCamera = cameras.filter((camera) => {
            //console.log('cameraFinder', cameraFinder, 'camera', camera);
            var port = camera.port;
            if(typeof cameraFinder.name === 'string'){
                return cameraFinder.name === camera.name;
            }
            if(cameraFinder.port && isNaN(cameraFinder.port)){
                port = parseInt(cameraFinder.port);
            }
            return camera.ip === cameraFinder.ip && camera.port === port;
        });

        if(theCamera && theCamera.length > 0){
            //console.log('found camera', theCamera[0]);
            return cb(undefined, theCamera[0]);
        }
        //console.log('no camera found');
        cb('no camera found');
    }

    function saveProxyStream(camera, stream){
        if(!camera.proxyStream){
            camera.proxyStream = stream;
            stream.on('close', function(){
               camera.proxyStream = null;
            });
            stream.on('end', function(){
                camera.proxyStream = null;
            });
            stream.on('finish', function(){
                camera.proxyStream = null;
            });
            stream.on('error', function(err) {
                camera.proxyStream = null;
                console.log('proxy error', err);
            });
        }
        return stream;
    }

    function ptzRequestOpts(camera) {
        return {
            auth: {
                user: camera.username,
                pass: camera.password
            },
            gzip : true
        };
    }

    function proxyVideo(camera){
        var url = 'http://' + camera.ip + ':' + camera.port + camera.video;
        if(camera.proxyStream){
            return camera.proxyStream;
        }
        return saveProxyStream(camera, request.get(url, ptzRequestOpts(camera)));
    }

    function proxySnapshot(camera){
        var url = 'http://' + camera.ip + ':' + camera.port + camera.snapshot;
        return request.get(url, ptzRequestOpts(camera));
    }

    function proxyAudio(camera){
        //http://192.168.1.108:5182/audio.cgi
        var url = 'http://' + camera.ip + ':' + camera.port + camera.audio;
        return request.get(url, ptzRequestOpts(camera));
    }

    function ptz(camera, action){

        var url = camera.ptz[action];
        var requestUrl = 'http://' + camera.ip + ':' + camera.port + url;
        return request.get(requestUrl, ptzRequestOpts(camera));
    }

    return {
        getCamera : getCamera,
        proxyVideo : proxyVideo,
        proxyAudio: proxyAudio,
        proxySnapshot : proxySnapshot,
        ptz : ptz
    };
};