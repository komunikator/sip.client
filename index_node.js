
'use strict';

let SIP = require('.');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

let fs = require('fs');

// Тестовый звонок на марс для отладки rtc канала на Марсе. Вводить данные х45, Да, 67, Да]
// ********************** 1 **************************
let ua1 = new SIP.UA({
    uri: 'sip:1@172.17.3.33',
    user: '1',
    password: '1',
    //wsServers: ['ws://172.17.3.33:8506'],
    wsServers: ['udp://172.17.3.33:5060'],
    //wsServers: ['tcp://172.17.3.33:5060'],
    //wsServers: ['tls://172.17.3.33:5060'],
    register: true,
    //mediaHandlerFactory: SIP.WebRTC.MediaHandler.defaultFactory,
    mediaHandlerFactory: SIP.RTC.MediaHandler.defaultFactory,
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
    let fileName = 'media/Добро_пожаловать_в демонстрацию_системы_MARS2.wav';

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

    micStream.on('data', function(data) {
    });

    mic.on('info', (info) => {
        console.log('info: ', String(info));
    });

    mic.on('error', (error) => {
        console.log('error: ', error);
    });

    let options = {
        media: {
            stream: micStream
        }
    };

    let session = ua1.invite('sip:alice@172.17.3.33', options);

    // ****** Запись входящего потока ****** //
    let fileNameRemoteStreamConver = 'remoteStreamConvertMars.txt';
    let writeStreamConvert = fs.createWriteStream(fileNameRemoteStreamConver);

    let fileNameRemoteStream = 'remoteStreamOriginalMars.txt';
    let writeStream = fs.createWriteStream(fileNameRemoteStream);

    // ****** Воспроизведение входящего потока ****** //
    var g711 = new (require('./G711').G711)();

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
        writeStream.write(data);

        data = new Buffer( convertoUlawToPcmu(data) );
        writeStreamConvert.write(data);

        data = new Buffer(data);

        if (remoteBuffers) {
            var totalLength = remoteBuffers.length + data.length;
            remoteBuffers = Buffer.concat([remoteBuffers, data], totalLength);

            if (totalLength > 500) {
                speaker.write(remoteBuffers);
                remoteBuffers = null;
            }
        } else {
            remoteBuffers = data;
        }

    });

    var rightResult = '4567';
    var resultInput = '';

    ua1.on('message', function (message) {
        if (message.body) {
            resultInput += message.body;

            // console.log(resultInput);

            if (resultInput == rightResult) {
                session.bye();

                setTimeout(() => {
                    console.log('Success bye');
                }, 3000);
            }
        }
    });


}, 1000);