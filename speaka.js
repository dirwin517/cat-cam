/**
 * Created by daniel.irwin on 8/7/16.
 */
var cameras = require('./cameras.json');
var cameraManager = require('./IPCameraManager')(cameras);


var Speaker = require('speaker');

// Create the Speaker instance
var speaker = new Speaker({
    channels: 1,          // 2 channels
    bitDepth: 16,         // 16-bit samples
    sampleRate: 16000     // 44,100 Hz sample rate
});

var grapher = require('./grapher');

cameraManager.getCamera({
    name : "kitchen"
}, (err, cam) => {
    if(!err) {
        var stream = cameraManager.proxyAudio(cam);

        stream.pipe(speaker);

        stream.on('data', function (data) {

            //console.log('', data.readUInt8());

            //grapher.graph(data);

        });
    }
});

