
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

app.get('/', function (req, res) {
    var Mustache = require('mustache');
    var fs = require('fs');
    var template = fs.readFileSync('./public/cameras.mustache', 'utf8');
    var indexPage = Mustache.render(template, { cameras : cameras });
    res.send(indexPage);
});

app.get('/camera', function (req, res) {
    //this may be the shittiest auth ever, but its only temporary
    if(config.users[req.cookies.username] && config.users[req.cookies.username].password === req.cookies.password){

        console.log('params', req.query);
        cameraManager.getCamera(req.query, (err, camera) => {
            if(err){
                return res.json({
                    code : 'Nope',
                    message : err
                });
            }
            req.socket.setTimeout(2147483647);

            process.nextTick(() => {
                res.setHeader('connection', 'keep-alive');
                var cameraStream = cameraManager.proxyVideo(camera);
                cameraStream.on('error', (err) => {
                    res.json({
                        err : err
                    });
                });
                cameraStream.on('close', () =>{
                    console.log('shit man the ' + camera.name + ' died');
                });

                cameraStream.pipe(res);//.pipe(res);
            });
        });
    }
    else {
        res.json({});
    }

});

app.listen(port, function () {
    console.log(`Example app listening on port ${port}!`);
});
