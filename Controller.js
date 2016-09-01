/**
 * Created by daniel.irwin on 8/27/16.
 */
module.exports = function(opts){

    var config = require('./config.json');

    var Mustache = require('mustache');
    var fs = require('fs');

    var cameras = require('./cameras.json');
    var cameraManager = require('./IPCameraManagerV2')(cameras);

    var netscan = require('netscan')();

    var proxyCameras = {

    };


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

    var MjpegProxy = require('mjpeg-proxy').MjpegProxy;

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
                    //res.setHeader('connection', 'keep-alive');
                    //if(!proxyCameras[camera.name]){
                    //    proxyCameras[camera.name] = new MjpegProxy('http://'+camera.username+':'+camera.password+'@' + camera.ip + camera.video).proxyRequest;
                    //}
                    //
                    //proxyCameras[camera.name](req, res, next);

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
                    var cameraStream = cameraManager.proxySnapshot(camera, res);
                    //cameraStream.pipe(res);//.pipe(res);
                });
            });
        },res.json);
    }

    function analyze(data){

        function keyValues(camera) {
            if (camera.uri.indexOf('get_status.cgi') > -1) {
                return camera.body.split('\n')
            }
            else if (camera.uri.indexOf('system.cgi') > -1) {
                return camera.body.split('\r\n');
            }
            return [];
        }

        function unstring(stringOfString){
            if(typeof stringOfString !== 'string'){
                return '';
            }
            return stringOfString.replace(/'|"/g,'').replace('var ', '');
        }

        data.forEach((camera) => {
            var newBody = {};
            keyValues(camera).forEach((keyValue) => {
                var kv = keyValue.split('=');
                var key = unstring(kv[0]);
                var value = unstring(kv[1]);
                if(key && value) {
                    newBody[key] = value;
                }
            });

            camera.alias = newBody.CameraName || newBody.alias;
            delete camera.body;

        });

        return data;
    }

    function ipscan(req, res){
        netscan.scan({

            protocol : ['http'],

            octet0: [192],
            octet1: [168],
            octet2: [0],
            octet3: [{min: 100, max: 126}], //range of 7 to 10 inclusive

            ports: [80],

            codes: [200, 201, 202, 400, 401, 402, 403], //only count it if a 200 comes back,

            errors : [],

            paths: ['/system.cgi', '/get_status.cgi'], // optional to have it hit a specific endpoint

            headers: {
                Authorization:  'Basic ' + (new Buffer('admin' + ':' + 'admin', 'utf8')).toString('base64')
            }, // include the following headers in all request so you can do auth or something,

            timeout: 10000 //10 seconds timeout)

            //ignoreResponse : true
        }, function(results){

            res.json(analyze(results));
        });
    }

    return {
        '/' : rootPage,
        '/single' : single,
        '/users' : users,
        '/hits' : hits,
        '/ptz' : ptz,
        '/camera' : camera,
        '/snapshot' : snapshot,
        '/scan' : ipscan
    };

};