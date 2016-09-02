/**
 * Created by daniel.irwin on 8/7/16.
 */
module.exports = function(cameras){
    var request = require('request');

    //var Jimp = require('jimp');
    //var badCamera = fs.createReadStream( __dirname + '/nocamera.jpg');

    var streamBuffers = require('stream-buffers');

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

    var pool = { maxSockets : 15 };

    function ptzRequestOpts(camera) {
        var basicAuth = 'Basic ' + (new Buffer(camera.username + ':' + camera.password, 'utf8')).toString('base64');
        console.log('basicAuth', basicAuth);
        return {
            pool : pool,
            agent : false,
            timeout : 25000,
            forever : true,
            headers : {
                Authorization : basicAuth
            }
        };
    }

    function loadCamera(camera){
        proxyVideoAndSave(camera);
    }

    function proxyVideoAndSave(camera){
        return saveProxyStream(camera, proxyVideo(camera, true));
    }

    function proxyVideo(camera, ignoreSavedStream){
        var url = calcBaseUrl(camera) + camera.video;
        if(camera.proxyStream && !ignoreSavedStream){
            return camera.proxyStream;
        }

        return request.get(url, ptzRequestOpts(camera));
    }



    function proxySnapshot(camera, res){
        var start = new Date().getTime();

        var uri = calcBaseUrl(camera) + camera.snapshot;
        var reqOpts = ptzRequestOpts(camera);

        console.log('uri', uri, 'reqOpts', reqOpts);

        var proxy = request(uri, reqOpts, function cb(err, response){
            if(err) {
                console.log('err', err);
                return res.json({
                    err : err
                });
            }

            var end = new Date().getTime();
            console.log('firstbyte', end-start);
        });


        proxy.on('end', function () {
            var end = new Date().getTime();
            console.log('total', end-start);
        });

        var buffer = new streamBuffers.WritableStreamBuffer({
            initialSize: (100 * 1024),   // start at 100 kilobytes.
            incrementAmount: (10 * 1024) // grow by 10 kilobytes each time buffer overflows.
        });

        proxy.pipe(buffer);

        proxy.on('end', function(){
            res.send(buffer.getContents());
            res.end();
            //buffer.pipe(res);
        });

        proxy.on('error', function(err){
            console.log('err', err);
        });
    }

    function proxyAudio(camera){
        return request.get(calcBaseUrl(camera) + camera.audio, ptzRequestOpts(camera));
    }

    function ptz(camera, action){
        return request.get(calcBaseUrl(camera) + camera.ptz[action], ptzRequestOpts(camera));
    }

    function loadCameras() {
        cameras.forEach((cam) => {
            loadCamera(cam);
        });
    }

    loadCameras();

    function setCameras(input){
        cameras = input;
        loadCameras();
    }

    return {
        setCameras : setCameras,
        getCamera : getCamera,
        proxyVideo : proxyVideo,
        proxyAudio: proxyAudio,
        proxySnapshot : proxySnapshot,
        ptz : ptz
    };
};