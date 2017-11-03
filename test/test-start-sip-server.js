'use strict';
let SIP = require('..');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
/*
describe('Send Message Tests', function() {

    it('Start Sip Server Register Unregister', function(done) {
        this.timeout(2000);

        let sipServerModule = require('node_sip_server');
        let settings = {
            accounts: {
                1: {
                    user: '1',
                    password: '1'
                },
                alice: {
                    user: 'alice',
                    password: 'alice'
                }
            }
        };
        let sipServer = new sipServerModule.SipServer(settings);

        let uaAlice = new SIP.UA({
            //uri: 'sip:1@172.17.3.33',
            uri: 'sip:1@172.17.3.33',
            user: '1',
            password: '1',
            wsServers: ['ws://172.17.3.33:8506'],
            //wsServers: ['udp://172.17.3.33:5060'],
            //wsServers: ['tcp://172.17.3.33:5060'],
            //wsServers: ['tls://172.17.3.33:5060'],
            register: true,
            mediaHandlerFactory: SIP.RTP.MediaHandler.defaultFactory,
            //mediaHandlerFactory: SIP.WebRTC.MediaHandler.defaultFactory,
            registerExpires: 120,
            transport: 'ws'
                //transport: 'udp'
                //transport: 'tcp'
                //transport: 'tls'
        });

        uaAlice.on('registered', function() {
            uaAlice.unregister();
        });

        uaAlice.on('unregistered', function(response, err) {
            setTimeout(function() {
                if (err) {
                    done(err);
                } else {
                    done();
                }
            }, 1000);
        });
        uaAlice.start();
    });


    it('Send Message WS <- WS', function(done) {
        this.timeout(2000);

        let uaAlice;
        let ua1 = new SIP.UA({
            //uri: 'sip:1@172.17.3.33',
            uri: 'sip:1@172.17.3.33',
            user: '1',
            password: '1',
            wsServers: ['ws://172.17.3.33:8506'],
            //wsServers: ['udp://172.17.3.33:5060'],
            //wsServers: ['tcp://172.17.3.33:5060'],
            //wsServers: ['tls://172.17.3.33:5060'],
            register: true,
            mediaHandlerFactory: SIP.RTP.MediaHandler.defaultFactory,
            //mediaHandlerFactory: SIP.WebRTC.MediaHandler.defaultFactory,
            registerExpires: 120,
            transport: 'ws'
                //transport: 'udp'
                //transport: 'tcp'
                //transport: 'tls'
        });

        ua1.on('registered', function() {
            startAlice();
        });

        ua1.on('message', function(msg) {
            ua1.unregister();
            uaAlice.unregister();

            if (msg.body == 'Hello Bob!') {
                setTimeout(function() {
                    done();
                }, 1000);
            } else {
                done('Message not Hello Bob!');
            }
        });

        ua1.start();

        function startAlice() {
            uaAlice = new SIP.UA({
                //uri: 'sip:1@172.17.3.33',
                uri: 'sip:alice@172.17.3.33',
                user: 'alice',
                password: 'alice',
                wsServers: ['ws://172.17.3.33:8506'],
                //wsServers: ['udp://172.17.3.33:5060'],
                //wsServers: ['tcp://172.17.3.33:5060'],
                //wsServers: ['tls://172.17.3.33:5060'],
                register: true,
                mediaHandlerFactory: SIP.RTP.MediaHandler.defaultFactory,
                //mediaHandlerFactory: SIP.WebRTC.MediaHandler.defaultFactory,
                registerExpires: 120,
                transport: 'ws'
                    //transport: 'udp'
                    //transport: 'tcp'
                    //transport: 'tls'
            });

            uaAlice.on('registered', function() {
                function sendMessageAccountTo1() {
                    let text = 'Hello Bob!';
                    uaAlice.message('sip:1@172.17.3.33', text);
                }
                sendMessageAccountTo1();
            });

            uaAlice.start();
        }
    });

    it('Send Message WS <- TCP', function(done) {
        this.timeout(2000);

        let uaAlice;
        let ua1 = new SIP.UA({
            uri: 'sip:1@172.17.3.33',
            user: '1',
            password: '1',
            wsServers: ['ws://172.17.3.33:8506'],
            //wsServers: ['udp://172.17.3.33:5060'],
            //wsServers: ['tcp://172.17.3.33:5060'],
            //wsServers: ['tls://172.17.3.33:5060'],
            register: true,
            mediaHandlerFactory: SIP.RTP.MediaHandler.defaultFactory,
            //mediaHandlerFactory: SIP.WebRTC.MediaHandler.defaultFactory,
            registerExpires: 120,
            transport: 'ws'
                //transport: 'udp'
                //transport: 'tcp'
                //transport: 'tls'
        });

        ua1.on('registered', function() {
            startAlice();
        });

        ua1.on('message', function(msg) {
            ua1.unregister();
            uaAlice.unregister();
            if (msg.body == 'Hello Bob!') {
                setTimeout(function() {
                    done();
                }, 1000);
            } else {
                done('Message not Hello Bob!');
            }
        });

        ua1.start();

        function startAlice() {
            uaAlice = new SIP.UA({
                uri: 'sip:alice@172.17.3.33',
                user: 'alice',
                password: 'alice',
                //wsServers: ['ws://172.17.3.33:8506'],
                //wsServers: ['udp://172.17.3.33:5060'],
                wsServers: ['tcp://172.17.3.33:5060'],
                //wsServers: ['tls://172.17.3.33:5060'],
                register: true,
                mediaHandlerFactory: SIP.RTP.MediaHandler.defaultFactory,
                //mediaHandlerFactory: SIP.WebRTC.MediaHandler.defaultFactory,
                registerExpires: 120,
                //transport: 'ws'
                //transport: 'udp'
                transport: 'tcp'
                    //transport: 'tls'
            });

            uaAlice.on('registered', function() {
                function sendMessageAccountTo1() {
                    let text = 'Hello Bob!';
                    uaAlice.message('sip:1@172.17.3.33', text);
                }
                sendMessageAccountTo1();
            });

            uaAlice.start();
        }
    });

    it('Send Message WS <- UDP', function(done) {
        this.timeout(2000);

        let uaAlice;
        let ua1 = new SIP.UA({
            //uri: 'sip:1@172.17.3.33',
            uri: 'sip:1@172.17.3.33',
            user: '1',
            password: '1',
            wsServers: ['ws://172.17.3.33:8506'],
            //wsServers: ['udp://172.17.3.33:5060'],
            //wsServers: ['tcp://172.17.3.33:5060'],
            //wsServers: ['tls://172.17.3.33:5060'],
            register: true,
            mediaHandlerFactory: SIP.RTP.MediaHandler.defaultFactory,
            //mediaHandlerFactory: SIP.WebRTC.MediaHandler.defaultFactory,
            registerExpires: 120,
            transport: 'ws'
                //transport: 'udp'
                //transport: 'tcp'
                //transport: 'tls'
        });

        ua1.on('registered', function() {
            startAlice();
        });

        ua1.on('message', function(msg) {
            ua1.unregister();
            uaAlice.unregister();

            if (msg.body == 'Hello Bob!') {
                setTimeout(function() {
                    done();
                }, 1000);

            } else {
                done('Message not Hello Bob!');
            }
        });

        ua1.start();

        function startAlice() {
            uaAlice = new SIP.UA({
                //uri: 'sip:1@172.17.3.33',
                uri: 'sip:alice@172.17.3.33',
                user: 'alice',
                password: 'alice',
                //wsServers: ['ws://172.17.3.33:8506'],
                wsServers: ['udp://172.17.3.33:5060'],
                //wsServers: ['tcp://172.17.3.33:5060'],
                //wsServers: ['tls://172.17.3.33:5060'],
                register: true,
                mediaHandlerFactory: SIP.RTP.MediaHandler.defaultFactory,
                //mediaHandlerFactory: SIP.WebRTC.MediaHandler.defaultFactory,
                registerExpires: 120,
                //transport: 'ws'
                transport: 'udp'
                    //transport: 'tcp'
                    //transport: 'tls'
            });

            uaAlice.on('registered', function() {
                function sendMessageAccountTo1() {
                    let text = 'Hello Bob!';
                    uaAlice.message('sip:1@172.17.3.33', text);
                }
                sendMessageAccountTo1();
            });

            uaAlice.start();
        }
    });

    it('Send Message WS <- TLS', function(done) {
        this.timeout(2000);

        let uaAlice;
        let ua1 = new SIP.UA({
            uri: 'sip:1@172.17.3.33',
            user: '1',
            password: '1',
            wsServers: ['ws://172.17.3.33:8506'],
            //wsServers: ['udp://172.17.3.33:5060'],
            //wsServers: ['tcp://172.17.3.33:5060'],
            //wsServers: ['tls://172.17.3.33:5060'],
            register: true,
            mediaHandlerFactory: SIP.RTP.MediaHandler.defaultFactory,
            //mediaHandlerFactory: SIP.WebRTC.MediaHandler.defaultFactory,
            registerExpires: 120,
            transport: 'ws'
                //transport: 'udp'
                //transport: 'tcp'
                //transport: 'tls'
        });

        ua1.on('registered', function() {
            startAlice();
        });

        ua1.on('message', function(msg) {
            ua1.unregister();
            uaAlice.unregister();

            if (msg.body == 'Hello Bob!') {
                setTimeout(function() {
                    done();
                }, 1000);

            } else {
                done('Message not Hello Bob!');
            }
        });

        ua1.start();

        function startAlice() {
            uaAlice = new SIP.UA({
                uri: 'sip:alice@172.17.3.33',
                user: 'alice',
                password: 'alice',
                //wsServers: ['ws://172.17.3.33:8506'],
                //wsServers: ['udp://172.17.3.33:5060'],
                //wsServers: ['tcp://172.17.3.33:5060'],
                wsServers: ['tls://172.17.3.33:5061'],
                register: true,
                mediaHandlerFactory: SIP.RTP.MediaHandler.defaultFactory,
                //mediaHandlerFactory: SIP.WebRTC.MediaHandler.defaultFactory,
                registerExpires: 120,
                //transport: 'ws'
                //transport: 'udp'
                //transport: 'tcp'
                transport: 'tls'
            });

            uaAlice.on('registered', function() {
                function sendMessageAccountTo1() {
                    let text = 'Hello Bob!';
                    uaAlice.message('sip:1@172.17.3.33', text);
                }
                sendMessageAccountTo1();
            });

            uaAlice.start();
        }
    });


    it('Send Message TLS <- WS', function(done) {
        this.timeout(2000);

        let uaAlice;
        let ua1 = new SIP.UA({
            //uri: 'sip:1@172.17.3.33',
            uri: 'sip:1@172.17.3.33',
            user: '1',
            password: '1',
            //wsServers: ['ws://172.17.3.33:8506'],
            //wsServers: ['udp://172.17.3.33:5060'],
            //wsServers: ['tcp://172.17.3.33:5060'],
            wsServers: ['tls://172.17.3.33:5061'],
            register: true,
            mediaHandlerFactory: SIP.RTP.MediaHandler.defaultFactory,
            //mediaHandlerFactory: SIP.WebRTC.MediaHandler.defaultFactory,
            registerExpires: 120,
            //transport: 'ws'
            //transport: 'udp'
            //transport: 'tcp'
            transport: 'tls'
        });

        ua1.on('registered', function() {
            startAlice();
        });

        ua1.on('message', function(msg) {
            ua1.unregister();
            uaAlice.unregister();

            if (msg.body == 'Hello Bob!') {
                setTimeout(function() {
                    done();
                }, 1000);
            } else {
                done('Message not Hello Bob!');
            }
        });

        ua1.start();

        function startAlice() {
            uaAlice = new SIP.UA({
                //uri: 'sip:1@172.17.3.33',
                uri: 'sip:alice@172.17.3.33',
                user: 'alice',
                password: 'alice',
                wsServers: ['ws://172.17.3.33:8506'],
                //wsServers: ['udp://172.17.3.33:5060'],
                //wsServers: ['tcp://172.17.3.33:5060'],
                //wsServers: ['tls://172.17.3.33:5060'],
                register: true,
                mediaHandlerFactory: SIP.RTP.MediaHandler.defaultFactory,
                //mediaHandlerFactory: SIP.WebRTC.MediaHandler.defaultFactory,
                registerExpires: 120,
                transport: 'ws'
                    //transport: 'udp'
                    //transport: 'tcp'
                    //transport: 'tls'
            });

            uaAlice.on('registered', function() {
                function sendMessageAccountTo1() {
                    let text = 'Hello Bob!';
                    uaAlice.message('sip:1@172.17.3.33', text);
                }
                sendMessageAccountTo1();
            });

            uaAlice.start();
        }
    });

    it('Send Message TLS <- TCP', function(done) {
        this.timeout(2000);

        let uaAlice;
        let ua1 = new SIP.UA({
            uri: 'sip:1@172.17.3.33',
            user: '1',
            password: '1',
            //wsServers: ['ws://172.17.3.33:8506'],
            //wsServers: ['udp://172.17.3.33:5060'],
            //wsServers: ['tcp://172.17.3.33:5060'],
            wsServers: ['tls://172.17.3.33:5061'],
            register: true,
            mediaHandlerFactory: SIP.RTP.MediaHandler.defaultFactory,
            //mediaHandlerFactory: SIP.WebRTC.MediaHandler.defaultFactory,
            registerExpires: 120,
            //transport: 'ws'
            //transport: 'udp'
            //transport: 'tcp'
            transport: 'tls'
        });

        ua1.on('registered', function() {
            startAlice();
        });

        ua1.on('message', function(msg) {
            ua1.unregister();
            uaAlice.unregister();
            if (msg.body == 'Hello Bob!') {
                setTimeout(function() {
                    done();
                }, 1000);
            } else {
                done('Message not Hello Bob!');
            }
        });

        ua1.start();

        function startAlice() {
            uaAlice = new SIP.UA({
                uri: 'sip:alice@172.17.3.33',
                user: 'alice',
                password: 'alice',
                //wsServers: ['ws://172.17.3.33:8506'],
                //wsServers: ['udp://172.17.3.33:5060'],
                wsServers: ['tcp://172.17.3.33:5060'],
                //wsServers: ['tls://172.17.3.33:5060'],
                register: true,
                mediaHandlerFactory: SIP.RTP.MediaHandler.defaultFactory,
                //mediaHandlerFactory: SIP.WebRTC.MediaHandler.defaultFactory,
                registerExpires: 120,
                //transport: 'ws'
                //transport: 'udp'
                transport: 'tcp'
                    //transport: 'tls'
            });

            uaAlice.on('registered', function() {
                function sendMessageAccountTo1() {
                    let text = 'Hello Bob!';
                    uaAlice.message('sip:1@172.17.3.33', text);
                }
                sendMessageAccountTo1();
            });

            uaAlice.start();
        }
    });

    it('Send Message TLS <- UDP', function(done) {
        this.timeout(2000);

        let uaAlice;
        let ua1 = new SIP.UA({
            //uri: 'sip:1@172.17.3.33',
            uri: 'sip:1@172.17.3.33',
            user: '1',
            password: '1',
            //wsServers: ['ws://172.17.3.33:8506'],
            //wsServers: ['udp://172.17.3.33:5060'],
            //wsServers: ['tcp://172.17.3.33:5060'],
            wsServers: ['tls://172.17.3.33:5061'],
            register: true,
            mediaHandlerFactory: SIP.RTP.MediaHandler.defaultFactory,
            //mediaHandlerFactory: SIP.WebRTC.MediaHandler.defaultFactory,
            registerExpires: 120,
            //transport: 'ws'
            //transport: 'udp'
            //transport: 'tcp'
            transport: 'tls'
        });

        ua1.on('registered', function() {
            startAlice();
        });

        ua1.on('message', function(msg) {
            ua1.unregister();
            uaAlice.unregister();

            if (msg.body == 'Hello Bob!') {
                setTimeout(function() {
                    done();
                }, 1000);

            } else {
                done('Message not Hello Bob!');
            }
        });

        ua1.start();

        function startAlice() {
            uaAlice = new SIP.UA({
                //uri: 'sip:1@172.17.3.33',
                uri: 'sip:alice@172.17.3.33',
                user: 'alice',
                password: 'alice',
                //wsServers: ['ws://172.17.3.33:8506'],
                wsServers: ['udp://172.17.3.33:5060'],
                //wsServers: ['tcp://172.17.3.33:5060'],
                //wsServers: ['tls://172.17.3.33:5060'],
                register: true,
                mediaHandlerFactory: SIP.RTP.MediaHandler.defaultFactory,
                //mediaHandlerFactory: SIP.WebRTC.MediaHandler.defaultFactory,
                registerExpires: 120,
                //transport: 'ws'
                transport: 'udp'
                    //transport: 'tcp'
                    //transport: 'tls'
            });

            uaAlice.on('registered', function() {
                function sendMessageAccountTo1() {
                    let text = 'Hello Bob!';
                    uaAlice.message('sip:1@172.17.3.33', text);
                }
                sendMessageAccountTo1();
            });

            uaAlice.start();
        }
    });

    it('Send Message TLS <- TLS', function(done) {
        this.timeout(2000);

        let uaAlice;
        let ua1 = new SIP.UA({
            uri: 'sip:1@172.17.3.33',
            user: '1',
            password: '1',
            //wsServers: ['ws://172.17.3.33:8506'],
            //wsServers: ['udp://172.17.3.33:5060'],
            //wsServers: ['tcp://172.17.3.33:5060'],
            wsServers: ['tls://172.17.3.33:5061'],
            register: true,
            mediaHandlerFactory: SIP.RTP.MediaHandler.defaultFactory,
            //mediaHandlerFactory: SIP.WebRTC.MediaHandler.defaultFactory,
            registerExpires: 120,
            //transport: 'ws'
            //transport: 'udp'
            //transport: 'tcp'
            transport: 'tls'
        });

        ua1.on('registered', function() {
            startAlice();
        });

        ua1.on('message', function(msg) {
            ua1.unregister();
            uaAlice.unregister();

            if (msg.body == 'Hello Bob!') {
                setTimeout(function() {
                    done();
                }, 1000);

            } else {
                done('Message not Hello Bob!');
            }
        });

        ua1.start();

        function startAlice() {
            uaAlice = new SIP.UA({
                uri: 'sip:alice@172.17.3.33',
                user: 'alice',
                password: 'alice',
                //wsServers: ['ws://172.17.3.33:8506'],
                //wsServers: ['udp://172.17.3.33:5060'],
                //wsServers: ['tcp://172.17.3.33:5060'],
                wsServers: ['tls://172.17.3.33:5061'],
                register: true,
                mediaHandlerFactory: SIP.RTP.MediaHandler.defaultFactory,
                //mediaHandlerFactory: SIP.WebRTC.MediaHandler.defaultFactory,
                registerExpires: 120,
                //transport: 'ws'
                //transport: 'udp'
                //transport: 'tcp'
                transport: 'tls'
            });

            uaAlice.on('registered', function() {
                function sendMessageAccountTo1() {
                    let text = 'Hello Bob!';
                    uaAlice.message('sip:1@172.17.3.33', text);
                }
                sendMessageAccountTo1();
            });

            uaAlice.start();
        }
    });

    it('Send Message TCP <- WS', function(done) {
        this.timeout(2000);

        let uaAlice;
        let ua1 = new SIP.UA({
            //uri: 'sip:1@172.17.3.33',
            uri: 'sip:1@172.17.3.33',
            user: '1',
            password: '1',
            //wsServers: ['ws://172.17.3.33:8506'],
            //wsServers: ['udp://172.17.3.33:5060'],
            wsServers: ['tcp://172.17.3.33:5060'],
            //wsServers: ['tls://172.17.3.33:5061'],
            register: true,
            mediaHandlerFactory: SIP.RTP.MediaHandler.defaultFactory,
            //mediaHandlerFactory: SIP.WebRTC.MediaHandler.defaultFactory,
            registerExpires: 120,
            //transport: 'ws'
            //transport: 'udp'
            transport: 'tcp'
                //transport: 'tls'
        });

        ua1.on('registered', function() {
            startAlice();
        });

        ua1.on('message', function(msg) {
            ua1.unregister();
            uaAlice.unregister();

            if (msg.body == 'Hello Bob!') {
                setTimeout(function() {
                    done();
                }, 1000);
            } else {
                done('Message not Hello Bob!');
            }
        });

        ua1.start();

        function startAlice() {
            uaAlice = new SIP.UA({
                //uri: 'sip:1@172.17.3.33',
                uri: 'sip:alice@172.17.3.33',
                user: 'alice',
                password: 'alice',
                wsServers: ['ws://172.17.3.33:8506'],
                //wsServers: ['udp://172.17.3.33:5060'],
                //wsServers: ['tcp://172.17.3.33:5060'],
                //wsServers: ['tls://172.17.3.33:5060'],
                register: true,
                mediaHandlerFactory: SIP.RTP.MediaHandler.defaultFactory,
                //mediaHandlerFactory: SIP.WebRTC.MediaHandler.defaultFactory,
                registerExpires: 120,
                transport: 'ws'
                    //transport: 'udp'
                    //transport: 'tcp'
                    //transport: 'tls'
            });

            uaAlice.on('registered', function() {
                function sendMessageAccountTo1() {
                    let text = 'Hello Bob!';
                    uaAlice.message('sip:1@172.17.3.33', text);
                }
                sendMessageAccountTo1();
            });

            uaAlice.start();
        }
    });


    it('Send Message TCP <- TCP', function(done) {
        this.timeout(2000);

        let uaAlice;
        let ua1 = new SIP.UA({
            uri: 'sip:1@172.17.3.33',
            user: '1',
            password: '1',
            //wsServers: ['ws://172.17.3.33:8506'],
            //wsServers: ['udp://172.17.3.33:5060'],
            wsServers: ['tcp://172.17.3.33:5060'],
            //wsServers: ['tls://172.17.3.33:5061'],
            register: true,
            mediaHandlerFactory: SIP.RTP.MediaHandler.defaultFactory,
            //mediaHandlerFactory: SIP.WebRTC.MediaHandler.defaultFactory,
            registerExpires: 120,
            //transport: 'ws'
            //transport: 'udp'
            transport: 'tcp'
                //transport: 'tls'
        });

        ua1.on('registered', function() {
            startAlice();
        });

        ua1.on('message', function(msg) {
            ua1.unregister();
            uaAlice.unregister();
            if (msg.body == 'Hello Bob!') {
                setTimeout(function() {
                    done();
                }, 1000);
            } else {
                done('Message not Hello Bob!');
            }
        });

        ua1.start();

        function startAlice() {
            uaAlice = new SIP.UA({
                uri: 'sip:alice@172.17.3.33',
                user: 'alice',
                password: 'alice',
                //wsServers: ['ws://172.17.3.33:8506'],
                //wsServers: ['udp://172.17.3.33:5060'],
                wsServers: ['tcp://172.17.3.33:5060'],
                //wsServers: ['tls://172.17.3.33:5060'],
                register: true,
                mediaHandlerFactory: SIP.RTP.MediaHandler.defaultFactory,
                //mediaHandlerFactory: SIP.WebRTC.MediaHandler.defaultFactory,
                registerExpires: 120,
                //transport: 'ws'
                //transport: 'udp'
                transport: 'tcp'
                    //transport: 'tls'
            });

            uaAlice.on('registered', function() {
                function sendMessageAccountTo1() {
                    let text = 'Hello Bob!';
                    uaAlice.message('sip:1@172.17.3.33', text);
                }
                sendMessageAccountTo1();
            });

            uaAlice.start();
        }
    });

    it('Send Message TCP <- UDP', function(done) {
        this.timeout(2000);

        let uaAlice;
        let ua1 = new SIP.UA({
            //uri: 'sip:1@172.17.3.33',
            uri: 'sip:1@172.17.3.33',
            user: '1',
            password: '1',
            //wsServers: ['ws://172.17.3.33:8506'],
            //wsServers: ['udp://172.17.3.33:5060'],
            wsServers: ['tcp://172.17.3.33:5060'],
            //wsServers: ['tls://172.17.3.33:5061'],
            register: true,
            mediaHandlerFactory: SIP.RTP.MediaHandler.defaultFactory,
            //mediaHandlerFactory: SIP.WebRTC.MediaHandler.defaultFactory,
            registerExpires: 120,
            //transport: 'ws'
            //transport: 'udp'
            transport: 'tcp'
                //transport: 'tls'
        });

        ua1.on('registered', function() {
            startAlice();
        });

        ua1.on('message', function(msg) {
            ua1.unregister();
            uaAlice.unregister();

            if (msg.body == 'Hello Bob!') {
                setTimeout(function() {
                    done();
                }, 1000);

            } else {
                done('Message not Hello Bob!');
            }
        });

        ua1.start();

        function startAlice() {
            uaAlice = new SIP.UA({
                //uri: 'sip:1@172.17.3.33',
                uri: 'sip:alice@172.17.3.33',
                user: 'alice',
                password: 'alice',
                //wsServers: ['ws://172.17.3.33:8506'],
                wsServers: ['udp://172.17.3.33:5060'],
                //wsServers: ['tcp://172.17.3.33:5060'],
                //wsServers: ['tls://172.17.3.33:5060'],
                register: true,
                mediaHandlerFactory: SIP.RTP.MediaHandler.defaultFactory,
                //mediaHandlerFactory: SIP.WebRTC.MediaHandler.defaultFactory,
                registerExpires: 120,
                //transport: 'ws'
                transport: 'udp'
                    //transport: 'tcp'
                    //transport: 'tls'
            });

            uaAlice.on('registered', function() {
                function sendMessageAccountTo1() {
                    let text = 'Hello Bob!';
                    uaAlice.message('sip:1@172.17.3.33', text);
                }
                sendMessageAccountTo1();
            });

            uaAlice.start();
        }
    });

    it('Send Message TCP <- TLS', function(done) {
        this.timeout(2000);

        let uaAlice;
        let ua1 = new SIP.UA({
            uri: 'sip:1@172.17.3.33',
            user: '1',
            password: '1',
            //wsServers: ['ws://172.17.3.33:8506'],
            //wsServers: ['udp://172.17.3.33:5060'],
            wsServers: ['tcp://172.17.3.33:5060'],
            //wsServers: ['tls://172.17.3.33:5061'],
            register: true,
            mediaHandlerFactory: SIP.RTP.MediaHandler.defaultFactory,
            //mediaHandlerFactory: SIP.WebRTC.MediaHandler.defaultFactory,
            registerExpires: 120,
            //transport: 'ws'
            //transport: 'udp'
            transport: 'tcp'
                //transport: 'tls'
        });

        ua1.on('registered', function() {
            startAlice();
        });

        ua1.on('message', function(msg) {
            ua1.unregister();
            uaAlice.unregister();

            if (msg.body == 'Hello Bob!') {
                setTimeout(function() {
                    done();
                }, 1000);

            } else {
                done('Message not Hello Bob!');
            }
        });

        ua1.start();

        function startAlice() {
            uaAlice = new SIP.UA({
                uri: 'sip:alice@172.17.3.33',
                user: 'alice',
                password: 'alice',
                //wsServers: ['ws://172.17.3.33:8506'],
                //wsServers: ['udp://172.17.3.33:5060'],
                //wsServers: ['tcp://172.17.3.33:5060'],
                wsServers: ['tls://172.17.3.33:5061'],
                register: true,
                mediaHandlerFactory: SIP.RTP.MediaHandler.defaultFactory,
                //mediaHandlerFactory: SIP.WebRTC.MediaHandler.defaultFactory,
                registerExpires: 120,
                //transport: 'ws'
                //transport: 'udp'
                //transport: 'tcp'
                transport: 'tls'
            });

            uaAlice.on('registered', function() {
                function sendMessageAccountTo1() {
                    let text = 'Hello Bob!';
                    uaAlice.message('sip:1@172.17.3.33', text);
                }
                sendMessageAccountTo1();
            });

            uaAlice.start();
        }
    });


    it('Send Message UDP <- WS', function(done) {
        this.timeout(2000);

        let uaAlice;
        let ua1 = new SIP.UA({
            //uri: 'sip:1@172.17.3.33',
            uri: 'sip:1@172.17.3.33',
            user: '1',
            password: '1',
            //wsServers: ['ws://172.17.3.33:8506'],
            wsServers: ['udp://172.17.3.33:5060'],
            //wsServers: ['tcp://172.17.3.33:5060'],
            //wsServers: ['tls://172.17.3.33:5061'],
            register: true,
            mediaHandlerFactory: SIP.RTP.MediaHandler.defaultFactory,
            //mediaHandlerFactory: SIP.WebRTC.MediaHandler.defaultFactory,
            registerExpires: 120,
            //transport: 'ws'
            transport: 'udp'
                //transport: 'tcp'
                //transport: 'tls'
        });

        ua1.on('registered', function() {
            startAlice();
        });

        ua1.on('message', function(msg) {
            ua1.unregister();
            uaAlice.unregister();

            if (msg.body == 'Hello Bob!') {
                setTimeout(function() {
                    done();
                }, 1000);
            } else {
                done('Message not Hello Bob!');
            }
        });

        ua1.start();

        function startAlice() {
            uaAlice = new SIP.UA({
                //uri: 'sip:1@172.17.3.33',
                uri: 'sip:alice@172.17.3.33',
                user: 'alice',
                password: 'alice',
                wsServers: ['ws://172.17.3.33:8506'],
                //wsServers: ['udp://172.17.3.33:5060'],
                //wsServers: ['tcp://172.17.3.33:5060'],
                //wsServers: ['tls://172.17.3.33:5060'],
                register: true,
                mediaHandlerFactory: SIP.RTP.MediaHandler.defaultFactory,
                //mediaHandlerFactory: SIP.WebRTC.MediaHandler.defaultFactory,
                registerExpires: 120,
                transport: 'ws'
                    //transport: 'udp'
                    //transport: 'tcp'
                    //transport: 'tls'
            });

            uaAlice.on('registered', function() {
                function sendMessageAccountTo1() {
                    let text = 'Hello Bob!';
                    uaAlice.message('sip:1@172.17.3.33', text);
                }
                sendMessageAccountTo1();
            });

            uaAlice.start();
        }
    });

    it('Send Message UDP <- TCP', function(done) {
        this.timeout(2000);

        let uaAlice;
        let ua1 = new SIP.UA({
            uri: 'sip:1@172.17.3.33',
            user: '1',
            password: '1',
            //wsServers: ['ws://172.17.3.33:8506'],
            wsServers: ['udp://172.17.3.33:5060'],
            //wsServers: ['tcp://172.17.3.33:5060'],
            //wsServers: ['tls://172.17.3.33:5061'],
            register: true,
            mediaHandlerFactory: SIP.RTP.MediaHandler.defaultFactory,
            //mediaHandlerFactory: SIP.WebRTC.MediaHandler.defaultFactory,
            registerExpires: 120,
            //transport: 'ws'
            transport: 'udp'
                //transport: 'tcp'
                //transport: 'tls'
        });

        ua1.on('registered', function() {
            startAlice();
        });

        ua1.on('message', function(msg) {
            ua1.unregister();
            uaAlice.unregister();
            if (msg.body == 'Hello Bob!') {
                setTimeout(function() {
                    done();
                }, 1000);
            } else {
                done('Message not Hello Bob!');
            }
        });

        ua1.start();

        function startAlice() {
            uaAlice = new SIP.UA({
                uri: 'sip:alice@172.17.3.33',
                user: 'alice',
                password: 'alice',
                //wsServers: ['ws://172.17.3.33:8506'],
                //wsServers: ['udp://172.17.3.33:5060'],
                wsServers: ['tcp://172.17.3.33:5060'],
                //wsServers: ['tls://172.17.3.33:5060'],
                register: true,
                mediaHandlerFactory: SIP.RTP.MediaHandler.defaultFactory,
                //mediaHandlerFactory: SIP.WebRTC.MediaHandler.defaultFactory,
                registerExpires: 120,
                //transport: 'ws'
                //transport: 'udp'
                transport: 'tcp'
                    //transport: 'tls'
            });

            uaAlice.on('registered', function() {
                function sendMessageAccountTo1() {
                    let text = 'Hello Bob!';
                    uaAlice.message('sip:1@172.17.3.33', text);
                }
                sendMessageAccountTo1();
            });

            uaAlice.start();
        }
    });

    it('Send Message UDP <- UDP', function(done) {
        this.timeout(2000);

        let uaAlice;
        let ua1 = new SIP.UA({
            //uri: 'sip:1@172.17.3.33',
            uri: 'sip:1@172.17.3.33',
            user: '1',
            password: '1',
            //wsServers: ['ws://172.17.3.33:8506'],
            wsServers: ['udp://172.17.3.33:5060'],
            //wsServers: ['tcp://172.17.3.33:5060'],
            //wsServers: ['tls://172.17.3.33:5061'],
            register: true,
            mediaHandlerFactory: SIP.RTP.MediaHandler.defaultFactory,
            //mediaHandlerFactory: SIP.WebRTC.MediaHandler.defaultFactory,
            registerExpires: 120,
            //transport: 'ws'
            transport: 'udp'
                //transport: 'tcp'
                //transport: 'tls'
        });

        ua1.on('registered', function() {
            startAlice();
        });

        ua1.on('message', function(msg) {
            ua1.unregister();
            uaAlice.unregister();

            if (msg.body == 'Hello Bob!') {
                setTimeout(function() {
                    done();
                }, 1000);

            } else {
                done('Message not Hello Bob!');
            }
        });

        ua1.start();

        function startAlice() {
            uaAlice = new SIP.UA({
                //uri: 'sip:1@172.17.3.33',
                uri: 'sip:alice@172.17.3.33',
                user: 'alice',
                password: 'alice',
                //wsServers: ['ws://172.17.3.33:8506'],
                wsServers: ['udp://172.17.3.33:5060'],
                //wsServers: ['tcp://172.17.3.33:5060'],
                //wsServers: ['tls://172.17.3.33:5060'],
                register: true,
                mediaHandlerFactory: SIP.RTP.MediaHandler.defaultFactory,
                //mediaHandlerFactory: SIP.WebRTC.MediaHandler.defaultFactory,
                registerExpires: 120,
                //transport: 'ws'
                transport: 'udp'
                    //transport: 'tcp'
                    //transport: 'tls'
            });

            uaAlice.on('registered', function() {
                function sendMessageAccountTo1() {
                    let text = 'Hello Bob!';
                    uaAlice.message('sip:1@172.17.3.33', text);
                }
                sendMessageAccountTo1();
            });

            uaAlice.start();
        }
    });

    it('Send Message UDP <- TLS', function(done) {
        this.timeout(2000);

        let uaAlice;
        let ua1 = new SIP.UA({
            uri: 'sip:1@172.17.3.33',
            user: '1',
            password: '1',
            //wsServers: ['ws://172.17.3.33:8506'],
            wsServers: ['udp://172.17.3.33:5060'],
            //wsServers: ['tcp://172.17.3.33:5060'],
            //wsServers: ['tls://172.17.3.33:5061'],
            register: true,
            mediaHandlerFactory: SIP.RTP.MediaHandler.defaultFactory,
            //mediaHandlerFactory: SIP.WebRTC.MediaHandler.defaultFactory,
            registerExpires: 120,
            //transport: 'ws'
            transport: 'udp'
                //transport: 'tcp'
                //transport: 'tls'
        });

        ua1.on('registered', function() {
            startAlice();
        });

        ua1.on('message', function(msg) {
            ua1.unregister();
            uaAlice.unregister();

            if (msg.body == 'Hello Bob!') {
                setTimeout(function() {
                    done();
                }, 1000);

            } else {
                done('Message not Hello Bob!');
            }
        });

        ua1.start();

        function startAlice() {
            uaAlice = new SIP.UA({
                uri: 'sip:alice@172.17.3.33',
                user: 'alice',
                password: 'alice',
                //wsServers: ['ws://172.17.3.33:8506'],
                //wsServers: ['udp://172.17.3.33:5060'],
                //wsServers: ['tcp://172.17.3.33:5060'],
                wsServers: ['tls://172.17.3.33:5061'],
                register: true,
                mediaHandlerFactory: SIP.RTP.MediaHandler.defaultFactory,
                //mediaHandlerFactory: SIP.WebRTC.MediaHandler.defaultFactory,
                registerExpires: 120,
                //transport: 'ws'
                //transport: 'udp'
                //transport: 'tcp'
                transport: 'tls'
            });

            uaAlice.on('registered', function() {
                function sendMessageAccountTo1() {
                    let text = 'Hello Bob!';
                    uaAlice.message('sip:1@172.17.3.33', text);
                }
                sendMessageAccountTo1();
            });

            uaAlice.start();
        }
    });

});
*/

/*
describe('Call Tests', function() {

    it('Call WS <- WS', function(done) {
        this.timeout(300000);

        let ua1 = new SIP.UA({
            uri: 'sip:1@172.17.3.33',
            user: '1',
            password: '1',
            //wsServers: ['ws://172.17.3.33:8506'],
            wsServers: ['udp://172.17.3.33:5060'],
            //wsServers: ['tcp://172.17.3.33:5060'],
            //wsServers: ['tls://172.17.3.33:5060'],
            register: true,
            mediaHandlerFactory: SIP.RTP.MediaHandler.defaultFactory,
            //mediaHandlerFactory: SIP.WebRTC.MediaHandler.defaultFactory,
            registerExpires: 120,
            //transport: 'ws'
            transport: 'udp'
                //transport: 'tcp'
                //transport: 'tls'
        });

        let logger = ua1.getLogger('test');

        setTimeout(function() {
            let fs = require('fs');
            let wav = require('wav');
            let fileName = 'media/Добро_пожаловать_в демонстрацию_системы_MARS.wav';

            // Передача файла по rtp
            let file = fs.createReadStream(fileName);
            let reader = new wav.Reader();

            reader.on('format', function(format) {
                let options = {
                    media: {
                        stream: reader
                    }
                };

                let session = ua1.invite('sip:alice@172.17.3.33', options);
            });
            file.pipe(reader);
        }, 2000);

        let uaAlice = new SIP.UA({
            uri: 'sip:alice@172.17.3.33',
            user: 'alice',
            password: 'alice',
            //wsServers: ['ws://172.17.3.33:8506'],
            wsServers: ['udp://172.17.3.33:5060'],
            //wsServers: ['tcp://172.17.3.33:5060'],
            //wsServers: ['tls://172.17.3.33:5060'],
            register: true,
            mediaHandlerFactory: SIP.RTP.MediaHandler.defaultFactory,
            //mediaHandlerFactory: SIP.WebRTC.MediaHandler.defaultFactory,
            registerExpires: 120,
            //transport: 'ws'
            transport: 'udp'
                //transport: 'tcp'
                //transport: 'tls'
        });

        uaAlice.on('invite', function(session) {
            let fs = require('fs');
            let wav = require('wav');
            let fileName = 'media/Спасибо_за_оценку.wav';

            // Передача файла по rtp
            let file = fs.createReadStream(fileName);
            let reader = new wav.Reader();

            reader.on('format', function(format) {
                let options = {
                    media: {
                        stream: reader
                    }
                };

                session.accept(options);

                let fileNameRemoteStream = 'remoteStream.txt';
                let remoteStream = session.getRemoteStreams();
                let writeStream = fs.createWriteStream(fileNameRemoteStream);

                remoteStream.on('data', (data) => {
                    writeStream.write(data);
                });

                // Проверка на корректность переданных данных
                setTimeout(() => {
                    let remoteStream = fs.readFileSync(fileNameRemoteStream);
                    let readStream = fs.createReadStream('media/Добро_пожаловать_в демонстрацию_системы_MARS.wav');
                    let wavReader = new wav.Reader();

                    wavReader.on('format', function(format) {
                        wavReader.on('data', (data) => {
                            remoteStream = remoteStream.slice(1, data.length + 1);

                            function isEqualBuffers() {
                                for (let i = 0, len = data.length; i < len; i++) {
                                    if (data[i] != remoteStream[i]) {
                                        return false;
                                    }
                                }
                                return true;
                            }

                            if (isEqualBuffers()) {
                                done();
                            } else {
                                done('Buffer are not identical');
                            }
                        });
                    });
                    readStream.pipe(wavReader);
                }, 6000);

            });
            file.pipe(reader);
        });

    });
});
*/

describe('Call Tests', function() {

    this.timeout(300000);

     it('Call WS <- WS', function(done) {
         this.timeout(300000);

         let fs = require('fs');

        // Тестовый звонок на марс для отладки rtc канала на Марсе
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
                channels: 1,
                bitDepth: 16,         
                signed: true,         
                sampleRate: 8000,
            });

            // ******************* Получаем данные с микрофона *******************
            var Mic = require('node-microphone');
            var mic = new Mic({
                // Марс
                bitDepth: 16, //8
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

            const stream = fs.createReadStream(fileName);
            let options = {
                media: {
                    stream: micStream
                    // stream: stream
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

                // console.log(buf.buffer);
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
                        // console.log(remoteBuffers.length);
                        speaker.write(remoteBuffers);
                        remoteBuffers = null;
                    }
                } else {
                    remoteBuffers = data;
                }

            });

            // setTimeout(() => {
            //     setInterval(() => {
            //         if (remoteBuffers) {
            //             speaker.write(remoteBuffers);
            //             remoteBuffers = null;
            //         }
            //     }, 1000);
            // }, 2000);

            // var counterRead = 1;

            // setInterval(() => {
            //     var actualBuffer;

            //     if ( (counterRead == 1) && remoteBuffer1 ) {
            //         actualBuffer = remoteBuffer1;
            //         remoteBuffer1 = null;
            //         console.log('[1]');
            //     } else if ( (counterRead == 2) && remoteBuffer2 ) {
            //         actualBuffer = remoteBuffer2;
            //         remoteBuffer2 = null;
            //         console.log('[2]');
            //     } else if ( (counterRead == 3) && remoteBuffer3) {
            //         actualBuffer = remoteBuffer3;
            //         remoteBuffer3 = null;
            //         console.log('[3]');
            //     }

            //     if (actualBuffer) {
            //         counterRead++;
            //         // console.log('actualBuffer: ', actualBuffer);
            //         speaker.write(actualBuffer);
            //     }

            //     if (counterRead > 3) {
            //         counterRead = 1;
            //     }
            // }, 40);

            // setTimeout(() => {
                // console.log('bye');
                // session.bye();
                // console.log('allBuffers: ', allBuffers);

                // allBuffers.forEach((item, i, arr) => {
                //     speaker.write(item);
                // });
            // }, 15000);

            /*
            setTimeout(function() {
                session.dtmf(1);
                session.dtmf(2);
                session.dtmf(3);
                session.dtmf(4);
                session.dtmf(5);
                session.dtmf('#');
            }, 25000);

            setTimeout(function() {
                session.dtmf(1);
            }, 42000);

            setTimeout(function() {
                session.dtmf(6);
                session.dtmf(7);
                session.dtmf(8);
                session.dtmf(9);
                session.dtmf('#');
            }, 52000);

            setTimeout(function() {
                session.dtmf(1);
            }, 66000);
            */

            // setTimeout(() => {
                // console.log('bye');
                // session.bye();
            // }, 20000);

            /*
            let Webrtc = require('node-webrtc');
            Webrtc.getUserMedia({ audio: true, video: { width: 1280, height: 720 } },
                function(stream) {
                    console.log('getUserMedia Add Stream USER 1: ', stream);
                    let options = {
                        media: {
                            stream: stream
                        }
                    };
                    let session = ua1.invite('sip:alice@172.17.3.33', options);
                },
                function(err) {
                    console.log("The following error occurred: " + err.name);
                }
            );
            */
        }, 1000);

        //********************** Alice **************************

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

            let fileName = 'media/Добро_пожаловать_в демонстрацию_системы_MARS2.wav';

            const stream = fs.createReadStream(fileName);
            let options = {
                media: {
                    stream: stream
                }
            };

            session.accept(options);

            let remoteStream = session.getRemoteStreams();

            remoteStream.on('data', (data) => {
                console.log('Alice Remote Stream data: ', new Buffer(data));
            });

            setTimeout(() => {
                console.log('bye');
                session.bye();
            }, 10000);

            // Webrtc.getUserMedia({ audio: true, video: { width: 1280, height: 720 } },
            //     function(stream) {
            //         console.log('getUserMedia Add Stream USER Alice: ', stream);
            //         let options = {
            //             media: {
            //                 stream: stream
            //             }
            //         };
            //         session.accept(options);
            //     },
            //     function(err) {
            //         console.log("The following error occurred: " + err.name);
            //     }
            // );
            
        });
        */
        


     });
 });
/*
describe('Call Tests', function() {

    it('Call WS <- WS', function(done) {
        this.timeout(300000);

        let ua1 = new SIP.UA({
            uri: 'sip:1@172.17.3.33',
            user: '1',
            password: '1',
            //wsServers: ['ws://172.17.3.33:8506'],
            wsServers: ['udp://172.17.3.33:5060'],
            //wsServers: ['tcp://172.17.3.33:5060'],
            //wsServers: ['tls://172.17.3.33:5060'],
            register: true,
            // mediaHandlerFactory: SIP.RTP.MediaHandler.defaultFactory,
            mediaHandlerFactory: SIP.WebRTC.MediaHandler.defaultFactory,
            registerExpires: 120,
            transport: 'ws'
            // transport: 'udp'
                //transport: 'tcp'
                //transport: 'tls'
        });

        let logger = ua1.getLogger('test');

        setTimeout(function() {
            let session = ua1.invite('sip:alice@172.17.3.33');
        }, 2000);
    });
});
*/







/*
describe('Call Tests', function() {

    it('Call WS <- WS', function(done) {
        this.timeout(300000);
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
                    //mediaHandlerFactory: SIP.RTP.MediaHandler.defaultFactory,
                    mediaHandlerFactory: SIP.WebRTC.MediaHandler.defaultFactory,
                    registerExpires: 120,
                    //transport: 'ws'
                    transport: 'udp'
                        //transport: 'tcp'
                        //transport: 'tls'
                });

                uaAlice.on('registered', function(session) {
                    console.log('Alice register');
                });

                uaAlice.on('invite', function(session) {
                    console.log('Alice INVITE!!!!');
                    session.accept();
                });
        */
        /*
                let ua1 = new SIP.UA({
                    uri: 'sip:1@172.17.3.33',
                    user: '1',
                    password: '1',
                    //wsServers: ['ws://172.17.3.33:8506'],
                    wsServers: ['udp://172.17.3.33:5060'],
                    //wsServers: ['tcp://172.17.3.33:5060'],
                    //wsServers: ['tls://172.17.3.33:5060'],
                    register: true,
                    //mediaHandlerFactory: SIP.RTP.MediaHandler.defaultFactory,
                    mediaHandlerFactory: SIP.WebRTC.MediaHandler.defaultFactory,
                    registerExpires: 120,
                    //transport: 'ws'
                    transport: 'udp'
                        //transport: 'tcp'
                        //transport: 'tls'
                });

                let logger = ua1.getLogger('test');

                let session = ua1.invite('sip:alice@172.17.3.33');
        */
        /*
        ua1.on('invite', function(session) {
            console.log('1 INVITE!!!!');
            session.accept();
        });
        */
        /*
    });
});
*/