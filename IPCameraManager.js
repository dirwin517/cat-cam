/**
 * Created by daniel.irwin on 8/7/16.
 */
module.exports = function(cameras){
    var request = require('request');

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

    function proxyVideo(camera){
        var basicAuthToke = new Buffer( camera.username + ':' + camera.password).toString('base64');
        var url = 'http://' + camera.ip + ':' + camera.port + camera.video;
        console.log('proxying ', url, 'with', basicAuthToke);
        return request.get(url, {
            auth : {
                user : camera.username,
                pass : camera.password
            },
            gzip : true
        })
        .on('error', function(err) {
            console.log('proxy error', err);
        });
    }

    function proxyAudio(camera){
        //http://192.168.1.108:5182/audio.cgi
        var basicAuthToke = new Buffer( camera.username + ':' + camera.password).toString('base64');
        var url = 'http://' + camera.ip + ':' + camera.port + camera.audio;
        console.log('proxying ', url, 'with', basicAuthToke);
        return request.get(url, {
            auth : {
                user : camera.username,
                pass : camera.password
            }
        })
        .on('error', function(err) {
            console.log('proxy error', err);
        });
    }

    return {
        getCamera : getCamera,
        proxyVideo : proxyVideo,
        proxyAudio: proxyAudio
    };
};