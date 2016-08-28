/**
 * Created by daniel.irwin on 8/27/16.
 */
module.exports = (function(){

    var config = require('./config.json');

    var Mustache = require('mustache');
    var fs = require('fs');

    var cameras = require('./cameras.json');
    var cameraManager = require('./IPCameraManagerV2')(cameras);



    //this may be the shittiest auth ever, but its only temporary
    function auth(req, next, unauth){
        //req.socket.setTimeout(2147483647);

        if(config.users[req.cookies.username] && config.users[req.cookies.username].password === req.cookies.password) {
            next();
        }
        else {
            unauth({ message : 'unauthorized'});
        }
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
        res.json(userManager.getUsers());
    }

    function hits(req, res){
        res.json(userManager.userHits());
    }

    function camera(req, res) {
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
                    //res.setHeader('connection', 'keep-alive');
                    var cameraStream = cameraManager.proxyVideo(camera);
                    cameraStream.on('error', () => {
                        //console.log('err', err);
                        //res.json({
                        //    err: err
                        //});
                    });
                    res.on('close', function(){
                        console.log('switched cameras?');
                    });
                    //res.setHeader('Content-Encoding','gzip');

                    cameraStream.pipe(res);//.pipe(res);

                });
            });
        },res.json);
    }

    function ptz(req, res){
        cameraManager.getCamera(req.query, (err, camera) => {
            //console.log('err', err, 'camera', camera);
            cameraManager.ptz(camera, req.query.action);
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
                    var cameraStream = cameraManager.proxySnapshot(camera);
                    cameraStream.on('error', (err) => {
                        res.json({
                            err: err
                        });
                    });
                    cameraStream.pipe(res);//.pipe(res);
                });
            });
        },res.json);
    }


    return {
        '/' : rootPage,
        '/single' : single,
        '/users' : users,
        '/hits' : hits,
        '/ptz' : ptz,
        '/camera' : camera,
        '/snapshot' : snapshot
    };

})();