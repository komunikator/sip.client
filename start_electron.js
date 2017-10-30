'use strict';

// let SIP = require('./src/index.js');
/*
console.log('start module start_electron');

var config = {
    uri: 'alice@172.17.3.33',
    wsServers: [
        'ws://172.17.3.33:8506'
    ],
    authorizationUser: 'alice',
    password: 'alice',
    mediaHandlerFactory: SIP.RTC.MediaHandler.defaultFactory
    // mediaHandlerFactory: SIP.WebRTC.MediaHandler.defaultFactory
};

var ua = new SIP.UA(config);
var session;

var options = {
    media: {
        constraints: {
            audio: true,
            video: true
        },
        render: {
            remote: document.getElementById('remoteVideo'),
            local: document.getElementById('localVideo')
        }
    }
};
console.log('Start_electron!');
ua.on('registered', function () {
    console.log('Alice registered');
});

ua.on('invite', function(session) {
    console.log('Alice invite');
    session.accept(options);

    //let remoteStream = session.getRemoteStreams();
    //remoteStream.on('data', (data) => {
    //    console.log('Alice Remote Stream data: ', data);
    //});
});

ua.on('message', function (message) {
  console.log(message.body);
});
*/


/*
// face
'use strict';

var express = require('express')
var app = express()

app.use(express.static('face'));

app.listen(3000, () => {
    console.log('server start port: 3000');

    var ifrm = document.createElement("iframe");
    ifrm.setAttribute("src", "http://localhost:3000");
    ifrm.setAttribute('width', '1000px');
    ifrm.setAttribute('height', '1000px');
    document.body.appendChild(ifrm);
});



(function(){
  var mediaOptions = { audio: true, video: { frameRate: { ideal: 10, max: 20 } } };

  if (!navigator.getUserMedia) {
      navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
  }

  if (!navigator.getUserMedia){
    return alert('getUserMedia not supported in this browser.');
  }

  navigator.getUserMedia(mediaOptions, success, function(e) {
    console.log(e);
  });

  function success(stream){
    var video = document.querySelector("#player");
    video.src = window.URL.createObjectURL(stream);
  }
})();
*/


//let SIP = require('./src/index.js');

// process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";


//********************** Alice **************************

let ua1 = new SIP.UA({
    uri: 'sip:1@172.17.3.33',
    user: '1',
    password: '1',
    wsServers: ['ws://172.17.3.33:8506'],
    // wsServers: ['udp://172.17.3.50:5060'],
    //wsServers: ['tcp://172.17.3.33:5060'],
    //wsServers: ['tls://172.17.3.33:5060'],
    register: true,
    // mediaHandlerFactory: SIP.RTP.MediaHandler.defaultFactory,
    // mediaHandlerFactory: SIP.WebRTC.MediaHandler.defaultFactory,
    mediaHandlerFactory: SIP.RTC.MediaHandler.defaultFactory,
    registerExpires: 120,
    // transport: 'ws'
    // transport: 'udp'
        //transport: 'tcp'
        //transport: 'tls'
});

/*
setTimeout(function() {
    let session = ua1.invite('sip:2@172.17.3.50');
    console.log('INVITE session: ', session);
}, 2000);
*/
/*
let uaAlice = new SIP.UA({
uri: 'sip:alice@172.17.3.33',
user: 'alice',
password: 'alice',
//wsServers: ['ws://172.17.3.33:8506'],
wsServers: ['udp://172.17.3.33:5060'],
//wsServers: ['tcp://172.17.3.33:5060'],
//wsServers: ['tls://172.17.3.33:5060'],
register: true,
mediaHandlerFactory: SIP.RTC.MediaHandler.defaultFactory,
//mediaHandlerFactory: SIP.WebRTC.MediaHandler.defaultFactory,
//mediaHandlerFactory: SIP.WRTC.MediaHandler.defaultFactory,
registerExpires: 120,
//transport: 'ws'
transport: 'udp'
    //transport: 'tcp'
    //transport: 'tls'
});

uaAlice.on('invite', function(session) {
    let Webrtc = require('node-webrtc');

    console.log('Alice ON INVITE');

    session.accept();

    let remoteStream = session.getRemoteStreams();
    remoteStream.on('data', (data) => {
        console.log('Alice Remote Stream data: ', new Buffer(data));
    });

    setTimeout(() => {
        console.log('bye');
        session.bye();
    }, 10000);
});
*/

