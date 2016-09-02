/**
 * Created by daniel.irwin on 8/27/16.
 */
module.exports = function(opts){

    var config = require('./config.json');

    var Mustache = require('mustache');
    var fs = require('fs');

    var cameras = [];
    var cameraManager = require('./IPCameraManagerV2')(cameras);

    var crawler = require('./CameraCrawler');

    var cameraFlavors = require('./cameraFlavors.json');

    function initCameras(cb){

        crawler.scan((camerasFound) => {

            cameras = camerasFound.map((camera) => {
                var newCamera = JSON.parse(JSON.stringify(cameraFlavors[camera.type]));
                newCamera.name = camera.alias;
                newCamera.ip = camera.ip;
                newCamera.port = camera.port;

                return newCamera;
            });

            if(typeof cb === 'function'){
                cb(cameras);
            }

        });

    }

    //this may be the shittiest auth ever, but its only temporary
    function auth(req, next, unauth){
        //req.socket.setTimeout(2147483647);

        //if(config.users[req.cookies.username] && config.users[req.cookies.username].password === req.cookies.password) {
            next();
        //}
        //else {
        //    unauth({ message : 'unauthorized'});
        //}
    }


    function rootPage(req, res) {

        var query = req.query;
        if(query && query.username && query.password){
            res.cookie('username', query.username);
            res.cookie('password', query.password);
        }

        console.log('got root page!');
        var template;
        var indexPage;

        template = fs.readFileSync('./public/cameras.mustache', 'utf8');
        indexPage = Mustache.render(template, {
            cameras : cameras
        });

        res.send(indexPage);

    }

    function single(req, res) {
        console.log('got camera page!');
        var template = fs.readFileSync('./public/camera.mustache', 'utf8');
        cameraManager.getCamera(req.query, (err, camera) => {
            //console.log('err', err, 'camera', camera);
            var indexPage = Mustache.render(template, {
                camera : camera
            });

            res.send(indexPage);
        });
    }
    function users(req, res){
        res.json(opts.userManager.getUsers());
    }

    function hits(req, res){
        res.json(opts.userManager.userHits());
    }

    function camera(req, res, next) {
        auth(req,function() {
            console.log('params', req.query);
            cameraManager.getCamera(req.query, (err, camera) => {
                if (err) {
                    return res.json({
                        code: 'Nope',
                        message: err
                    });
                }

                process.nextTick(() => {

                    var cameraStream = cameraManager.proxyVideo(camera);

                    res.on('close', function(){
                        console.log('switched cameras?');
                    });

                    cameraStream.pipe(res);

                });
            });
        },res.json);
    }

    function ptz(req, res){
        cameraManager.getCamera(req.query, (err, camera) => {
            //console.log('err', err, 'camera', camera);
            cameraManager.ptz(camera, req.query.action);

            setTimeout(() => {
                cameraManager.ptz(camera, 'stop');
            }, 500);

            res.send(null);
        });
    }

    function snapshot(req, res) {
        auth(req,function() {
            console.log('params', req.query);
            cameraManager.getCamera(req.query, (err, camera) => {
                if (err) {
                    return res.json({
                        code: 'Nope',
                        message: err
                    });
                }

                process.nextTick(() => {
                    res.setHeader('connection', 'keep-alive');
                    var cameraStream = cameraManager.proxySnapshot(camera, res);
                    //cameraStream.pipe(res);//.pipe(res);
                });
            });
        },res.json);
    }

    function scan(req, res){
        crawler.scan((data) => {
            res.json(data);
        });
    }

    initCameras();

    opts.pmxAction('camera:scan', function(reply) {
        initCameras( (result) => {
           reply(result);
        });
    });

    function who(req, res){
        res.json(cameras);
    }

    return {
        '/' : rootPage,
        '/single' : single,
        '/users' : users,
        '/hits' : hits,
        '/ptz' : ptz,
        '/camera' : camera,
        '/snapshot' : snapshot,
        '/scan' : scan,
        '/who' : who
    };

};