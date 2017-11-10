
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




/*
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

    const EventEmitter = require('events');
    const stream = new EventEmitter();
    
    var stopFlag = false;
    var myBuffer = new Buffer(0);
    var arrayBuf = [];

    setTimeout( () => {
        stopFlag = true;
    }, 5000 );

    setTimeout( () => {
        // console.log('Отправка буфера: ', myBuffer.length);
        // console.log(myBuffer);

        // stream.emit('data', myBuffer);



        for (let i = 0, len = 29; i < len; i++) {
            setTimeout(() => {
                // console.log('Данные в массиве: ', arrayBuf[i]);
                // stream.emit('data', new Buffer(arrayBuf[i]));
                

                if (i == 0) {
                    let newBuffer = new Buffer(44);
                    myBuffer.copy(newBuffer, 0);

                    console.log('********start*********');
                    console.log(myBuffer);
                    console.log(newBuffer);
                    console.log('********end*********');
                    // stream.emit('data', newBuffer);
                } else {
                    let newBuffer = new Buffer(2000);
                    myBuffer.copy(newBuffer, 0, i * 2000);
                    
                    console.log('********start*********');
                    console.log(newBuffer);
                    console.log('********end*********');
                    stream.emit('data', newBuffer);
                }
            }, i * 125);
        }
    }, 16500 );

    micStream.on('data', function(data) {
        if (!stopFlag) {
            console.log('Запись', data.length);
            // arrayBuf.push(data);
            var totalLength = myBuffer.length + data.length;
            myBuffer = Buffer.concat([myBuffer, data], totalLength);        
        }
    });

    mic.on('info', (info) => {
        console.log('info: ', String(info));
    });

    mic.on('error', (error) => {
        console.log('error: ', error);
    });

    setTimeout(() => {
        stream.emit('data', new Buffer(2) );
    }, 3000);

    let options = {
        media: {
            stream: stream
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
*/





/*
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

    const EventEmitter = require('events');
    const stream = new EventEmitter();
    
    var stopFlag = false;
    var myBuffer = new Buffer(0);

    setTimeout( () => {
        stopFlag = true;

        // fs.writeFileSync('mymicrophone.raw', myBuffer)
    }, 5000 );

    setTimeout( () => {
        // console.log('Отправка буфера: ', myBuffer.length);
        // console.log(myBuffer);

        // stream.emit('data', myBuffer);

        // var myBuffer2 = new Buffer( fs.readFileSync('mymicrophone.raw') );
        // console.log(myBuffer2.length);
        // console.log(myBuffer.length);

        // console.log(myBuffer2[0]);
        // console.log(myBuffer[0]);

        // console.log(myBuffer2[3]);
        // console.log(myBuffer[3]);

        var myBuffer2 = myBuffer;
        console.log(myBuffer2.length);

        for (let i = 0, len = 29; i < len; i++) {
            setTimeout(() => {
                if (i == 0) {
                    let newBuffer = new Buffer(44);
                    myBuffer2.copy(newBuffer, 0);

                    console.log('********start*********');
                    console.log(newBuffer);
                    console.log('********end*********');
                    stream.emit('data', newBuffer);
                } else {
                    let newBuffer = new Buffer(2000);
                    myBuffer2.copy(newBuffer, 0, i * 2000);

                    console.log('********start*********');
                    console.log(newBuffer);
                    console.log('********end*********');
                    stream.emit('data', newBuffer);
                }
            }, i * 40);
        }
    }, 16500 );

    micStream.on('data', function(data) {
        if (!stopFlag) {
            console.log('Запись', data.length);
            // arrayBuf.push(data);
            var totalLength = myBuffer.length + data.length;
            myBuffer = Buffer.concat([myBuffer, data], totalLength);        
        }
    });

    mic.on('info', (info) => {
        console.log('info: ', String(info));
    });

    mic.on('error', (error) => {
        console.log('error: ', error);
    });

    setInterval(() => {
        stream.emit('data', new Buffer(2) );
    }, 3000);

    let options = {
        media: {
            stream: stream
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
*/