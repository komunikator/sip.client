
'use strict';

let SIP = require('..');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

let fs = require('fs');
let writeStreamUlaw = fs.createWriteStream('ulaw');

// Тестовый звонок на марс для отладки rtc канала на Марсе. Вводить данные х45, Да, 67, Да]
// ********************** 1 **************************
let ua1 = new SIP.UA({
    uri: 'sip:2@172.17.3.33',
    user: '3',
    password: '3',
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

setTimeout(function() {
    console.log('Timeout');

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
        console.log('ulaw.lenght ', ulaw.length);
        stream.emit('data', ulaw);
    });

    mic.on('info', (info) => {
        console.log('info: ', String(info));
    });

    mic.on('error', (error) => {
        console.log('error: ', error);
    });

    let options = {
        media: {
            // stream: micStream
            stream: stream
        }
    };

    let session = ua1.invite('sip:2@172.17.3.33', options);
    // setTimeout(() => {
    //     session.dtmf(1);
    // }, 5000);

    // ****** Воспроизведение входящего потока ****** //
    var g711 = new (require('../src/RTP/rtp/G711.js').G711)();

    function convertoUlawToPcmu(buffer) {
        var l = buffer.length;
        var buf = new Int16Array(l);

        while (l--) {
            buf[l] = g711.ulaw2linear(buffer[l]); //convert to pcmu
        }

        return buf.buffer;
    }

    var remoteStream = session.getRemoteStreams();

    var remoteBuffers;

    remoteStream.on('data', (data) => {
        data = new Buffer( convertoUlawToPcmu(data) );

        if (remoteBuffers) {
            var totalLength = remoteBuffers.length + data.length;
            remoteBuffers = Buffer.concat([remoteBuffers, data], totalLength);

            if (totalLength > 500) {
                console.log('Воспроизведение данных ', remoteBuffers);
                speaker.write(remoteBuffers);
                remoteBuffers = null;
            }
        } else {
            remoteBuffers = data;
        }

    });

    // var rightResult = '4567';
    // var resultInput = '';

    // ua1.on('message', function (message) {
    //     if (message.body) {
    //         resultInput += message.body;

    //         // console.log(resultInput);

    //         if (resultInput == rightResult) {
    //             session.bye();

    //             setTimeout(() => {
    //                 console.log('Success bye');
    //             }, 3000);
    //         }
    //     }
    // });


}, 1000);