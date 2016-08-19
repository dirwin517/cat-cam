
var express = require('express');
var app = express();
var port = 1337;
var cameras = require('./cameras.json');
var cameraManager = require('./IPCameraManager')(cameras);

var compression = require('compression');
app.use(compression());

var cookieParser = require('cookie-parser');
app.use(cookieParser());

var config = require('./config.json');

process.on('uncaughtException', function (err) {
    console.log('uncaught error ',err);
});

app.get('/', function (req, res) {

    var query = req.query;
    if(query && query.username && query.password){
        res.cookie('username', query.username);
        res.cookie('password', query.password);
    }

    console.log('got root page!');
    var Mustache = require('mustache');
    var fs = require('fs');
    var template;
    var indexPage;

        template = fs.readFileSync('./public/cameras.mustache', 'utf8');
        indexPage = Mustache.render(template, {
            cameras : cameras
        });

        res.send(indexPage);

});



app.get('/single', function (req, res) {

    var query = req.query;

    console.log('got camera page!');
    var Mustache = require('mustache');
    var fs = require('fs');

    if(query && query.camera){
        var template = fs.readFileSync('./public/camera.mustache', 'utf8');
        return cameraManager.getCamera(req.query, (err, camera) => {
            var indexPage = Mustache.render(template, {
                camera : camera
            });

            res.send(indexPage);
        });
    }
    res.send(null);
});



//this may be the shittiest auth ever, but its only temporary
function auth(req, next, unauth){
    req.socket.setTimeout(2147483647);

    if(config.users[req.cookies.username] && config.users[req.cookies.username].password === req.cookies.password) {
        next();
    }
    else {
        unauth({ message : 'unauthorized'});
    }
}

app.get('/camera', function (req, res) {
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
                var cameraStream = cameraManager.proxyVideo(camera);
                cameraStream.on('error', (err) => {
                    res.json({
                        err: err
                    });
                });
                cameraStream.pipe(res);//.pipe(res);
            });
        });
    },res.json);
});

app.get('/snapshot', function (req, res) {
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
});

app.listen(port, function () {
    console.log(`Example app listening on port ${port}!`);
});
