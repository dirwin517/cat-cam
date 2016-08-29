/**
 * Created by daniel.irwin on 8/7/16.
 */
module.exports = function(cameras){
    var request = require('request');

    //var Jimp = require('jimp');
    //var badCamera = fs.createReadStream( __dirname + '/nocamera.jpg');

    function calcBaseUrl(camera) {
        return 'http://' + camera.ip + ':' + camera.port;
    }

    function getCamera(cameraFinder, cb){

        var theCamera = cameras.filter((camera) => {
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
            return cb(undefined, theCamera[0]);
        }
        cb('no camera found');
    }

    function saveProxyStream(camera, stream){
        if(!camera.proxyStream){
            //function restartProxy(){
            //    camera.proxyStream = proxyVideo(camera);
            //}
            //
            //camera.proxyStream = stream;
            //stream.on('close',  restartProxy);
            //stream.on('end',    restartProxy);
            //stream.on('finish', restartProxy);
            //stream.on('error',  restartProxy);
        }
        return stream;
    }

    function ptzRequestOpts(camera) {
        var basicAuth = 'Basic ' + (new Buffer(camera.username + ':' + camera.password, 'utf8')).toString('base64');
        console.log('basicAuth', basicAuth);
        return {
            headers : {
                Authorization : basicAuth
            }
            //auth: {
            //    user: camera.username,
            //    pass: camera.password
            //}
        };
    }

    function loadCamera(camera){
        proxyVideoAndSave(camera);
        //setInterval(function(){
        //    proxySnapshot(camera);
        //}, 15000);
    }

    function proxyVideoAndSave(camera){
        return saveProxyStream(camera, proxyVideo(camera));
    }

    function proxyVideo(camera){
        var url = calcBaseUrl(camera) + camera.video;
        if(camera.proxyStream){
            return camera.proxyStream;
        }
        return request.get(url, ptzRequestOpts(camera));
    }

    var http = require('http');

    function proxySnapshot(camera, res){
        var start = new Date().getTime();

        function handleResponse(response) {
            var end = new Date().getTime();
            console.log('diff', end-start);


            return response.pipe(res, {end : true});
        }

        var request = {
            method: 'GET',
            host: camera.ip,
            port: camera.port,
            path: camera.snapshot,
            headers: ptzRequestOpts(camera).headers
        };
        console.log('request', request);
        http.request(request, handleResponse).on('error', (err) => {
            res.json({
                err: err
            });
        });;

        //return request.get(calcBaseUrl(camera) + camera.snapshot, ptzRequestOpts(camera), handleResponse);
    }

    function proxyAudio(camera){
        return request.get(calcBaseUrl(camera) + camera.audio, ptzRequestOpts(camera));
    }

    function ptz(camera, action){
        return request.get(calcBaseUrl(camera) + camera.ptz[action], ptzRequestOpts(camera));
    }

    cameras.forEach((cam) => {
        loadCamera(cam);
    });

    return {
        getCamera : getCamera,
        proxyVideo : proxyVideo,
        proxyAudio: proxyAudio,
        proxySnapshot : proxySnapshot,
        ptz : ptz
    };
};