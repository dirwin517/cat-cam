/**
 * Created by daniel.irwin on 8/7/16.
 */
module.exports = function(){
    var Speaker = require('speaker');

// Create the Speaker instance
    var speaker = new Speaker({
        channels: 2,          // 2 channels
        bitDepth: 16,         // 16-bit samples
        sampleRate: 44100     // 44,100 Hz sample rate
    });

// PCM data from stdin gets piped into the speaker
    return speaker;
};