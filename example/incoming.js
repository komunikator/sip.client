
'use strict';

let SIP = require('..');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Тестовый звонок на марс для отладки rtc канала на Марсе. Вводить данные х45, Да, 67, Да]
// ********************** 1 **************************
let ua1 = new SIP.UA({
    uri: 'sip:4@172.17.3.33',
    user: '4',
    password: '4',
    //wsServers: ['ws://172.17.3.33:8506'],
    wsServers: ['udp://172.17.3.33:5060'],
    //wsServers: ['tcp://172.17.3.33:5060'],
    //wsServers: ['tls://172.17.3.33:5060'],
    register: true,
    //mediaHandlerFactory: SIP.WebRTC.MediaHandler.defaultFactory,
    mediaHandlerFactory: SIP.RTP.MediaHandler.defaultFactory,
    //mediaHandlerFactory: SIP.WRTC.MediaHandler.defaultFactory,
    registerExpires: 120,
    //transport: 'ws'
    transport: 'udp'
        //transport: 'tcp'
        //transport: 'tls'
});
let logger = ua1.getLogger('test');

var streams = require('memory-streams');
var reader = new streams.ReadableStream(new Buffer(2));

const Speaker = require('speaker');
const speaker = new Speaker({
    bitDepth: 16,
    sampleRate: 8000,
    channels: 1,
    signed: true,         
});

// ******************* Получаем данные с микрофона *******************
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

micStream.on('data', function(data) {
    function convertPcm2ulaw(data) {
        let ulawFact = {fileSize: data.length / 2};
        let ulawData;
        let ulawAudio = new Buffer(ulawFact.fileSize),
        i = ulawFact.fileSize;

        while (i > 0) {
            i -= 1;
            ulawAudio[i] = g711.linear2ulaw(data.readInt16LE(i * 2));
        }
        return Array.from(ulawAudio);
    }

    let ulaw = convertPcm2ulaw(data);
    stream.emit('data', ulaw);
});

mic.on('info', (info) => {
    console.log('info: ', String(info));
});

mic.on('error', (error) => {
    console.log('error: ', error);
});


// ****** Воспроизведение входящего потока ****** //
var g711 = new (require('../src/RTP/rtp/G711.js').G711)();

function convertoUlawToPcm16(buffer) {
    var l = buffer.length;
    var buf = new Int16Array(l);

    while (l--) {
        buf[l] = g711.ulaw2linear(buffer[l]); //convert to pcmu
    }

    return buf.buffer;
}

ua1.on('invite', (session) => {
    let options = {
        media: {
            stream: stream
        }
    };

    session.accept(options);

    var remoteStream = session.getRemoteStreams();
    var remoteBuffers;
    var isAddSpeaker = false;
    var oldDate = 0;
    var timerUploadData;

    remoteStream.on('data', (data) => {
        if (oldDate) {
            var diff = new Date().getTime() - oldDate;
            // console.log('\ndiff ', diff);

            if (diff > 80) {
                isAddSpeaker = false;
                reader.unpipe(speaker);
            }

            oldDate = new Date().getTime();
        } else {
            oldDate = new Date().getTime();
        }

        clearTimeout(timerUploadData);

        timerUploadData = setTimeout(() => {
            if (!isAddSpeaker && reader._readableState.length > 0) {
                isAddSpeaker = true;
                reader.pipe(speaker);            
            }
        }, 60);

        data = new Buffer( convertoUlawToPcm16(data) );
        reader.append(data);

        if ( (reader._readableState.length > 4000) && (!isAddSpeaker) ) {
            isAddSpeaker = true;
            reader.pipe(speaker);
        }
    });
});