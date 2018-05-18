'use strict';

// ******************* Получаем данные с микрофона *******************
var g711 = new (require('../src/RTP/rtp/G711.js').G711)();
var Mic = require('node-microphone');
var mic = new Mic({
    bitDepth: 16,
    rate: 8000,
    device: 'plughw:2,0',
    encoding: 'signed-integer',
    endian: 'little'
});

var micStream = mic.startRecording();

var events = require('events');
var stream = new events.EventEmitter();
var fs = require('fs');
var writeStreamPcm16 = fs.createWriteStream('pcm16');
var writeStreamUlaw = fs.createWriteStream('ulaw');

micStream.on('data', function(data) {
    function convertPcm2ulaw(data) {
        let ulawFact = {fileSize: data.length / 2};
        let ulawData;
        let ulawAudio = new Buffer(ulawFact.fileSize),
        i = ulawFact.fileSize;

        while (i > 0) {
            i -= 1;
            ulawAudio[i] = g711.linear2ulaw(data.readInt16LE(i * 2));
            console.log('16 = ', data.readInt16LE(i * 2), ' : ', ulawAudio[i]);
        }
        return ulawAudio;
    }
    writeStreamPcm16.write(data);
    writeStreamUlaw.write( convertPcm2ulaw(data) );
});

mic.on('info', (info) => {
    console.log('info: ', String(info));
});

mic.on('error', (error) => {
    console.log('error: ', error);
});