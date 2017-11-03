"use strict";
/**
 * @fileoverview MediaHandler
 */

/* MediaHandler
 * @class PeerConnection helper Class.
 * @param {SIP.Session} session
 * @param {Object} [options]
 * @param {SIP.RTC.MediaStreamManager} [options.mediaStreamManager]
 *        The MediaStreamManager to acquire/release streams from/to.
 *        If not provided, a default MediaStreamManager will be used.
 */
var countLoadRtc = 0;

process.on('uncaughtException', function(err) {
    console.log(err);
});

module.exports = function(SIP) {

    var MediaHandler = function(session, options) {
        options = options || {};
        // console.log('************** OPTIONS: ', options);

        let EventEmitter = require('events');
        this.logger = session.ua.getLogger('sip.invitecontext.mediahandler', session.id);
        this.session = session;
        this.localMedia = null;
        this.ready = true;
        this.mediaStreamManager = options.mediaStreamManager || new SIP.RTC.MediaStreamManager(this.logger);
        this.audioMuted = false;
        this.videoMuted = false;
        this.local_hold = false;
        this.remote_hold = false;
        session.remoteStream = new EventEmitter();

        function getRandomID(min, max) {
            var int = Math.floor(Math.random() * (max - min + 1)) + min;
            return int.toString(36);
        }
        this.session.sessionID = getRandomID(0, 1679615);

        var servers = this.prepareIceServers(options.stunServers, options.turnServers);
        this.RTCConstraints = options.RTCConstraints || {};

        this.initPeerConnection(servers);

        function selfEmit(mh, event) {
            if (mh.mediaStreamManager.on) {
                mh.mediaStreamManager.on(event, function() {
                    mh.emit.apply(mh, [event].concat(Array.prototype.slice.call(arguments)));
                });
            }
        }

        selfEmit(this, 'userMediaRequest');
        selfEmit(this, 'userMedia');
        selfEmit(this, 'userMediaFailed');
    };

    MediaHandler.getDefaultStream = function getDefaultStream(stream) {
        var self = this;

        if (!navigator) return false;

        // ******************** Web Audio Api ******************** //
        navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);

        navigator.getUserMedia(
            { audio: true, video: false },
            function (localStream) {
                var AudioContext = window.AudioContext || window.webkitAudioContext,
                    ctx = new AudioContext(),
                    source = ctx.createMediaStreamSource(localStream),
                    analyser = ctx.createAnalyser(),
                    processor = ctx.createScriptProcessor(2048*8, 1, 1),
                    data,
                    dataSource;

                source.connect(analyser);
                source.connect(processor);
                processor.connect(ctx.destination);

                function convertoFloat32ToInt16(buffer) {
                    var l = buffer.length;  //Buffer
                    var buf = new Int16Array(l/3);

                    while (l--) {
                        if (l==-1) break;

                        if (buffer[l]*0xFFFF > 32767) {
                            buf[l] = 32767;
                        } else if (buffer[l]*0xFFFF < -32768) {
                            buf[l] = -32768;
                        } else {
                            buf[l] = buffer[l]*0xFFFF;
                        }
                    }
                    return buf.buffer;
                }

                processor.onaudioprocess = (audioEvents) => {
                    if (self.session.channelClose) {
                        source.disconnect(processor);
                        processor.disconnect(ctx.destination);
                        return;
                    } else {
                        var data = audioEvents.inputBuffer.getChannelData(0);
                        data = convertoFloat32ToInt16(data);
                        stream.emit('data', data);
                        // console.log(data);
                    }
                }

                // Воспроизведение звука
                // var mediaStreamSource = ctx.createMediaStreamSource(localStream);
                // mediaStreamSource.connect( ctx.destination );
            },
            function (error) {
                    //error processing
            }
        );
        return stream;
    }

    MediaHandler.defaultFactory = function defaultFactory(session, options) {
        return new MediaHandler(session, options);
    };
    MediaHandler.defaultFactory.isSupported = function() {
        return SIP.RTC.isSupported();
    };

    MediaHandler.prototype = Object.create(SIP.MediaHandler.prototype, {
        // Functions the session can use
        isReady: {
            writable: true,
            value: function isReady() {
                return this.ready;
            }
        },

        close: {
            writable: true,
            value: function close() {
                this._remoteStreams = [];

                if (this.session.rtc && this.session.rtc.dataChannel
                    && this.session.rtc.dataChannel.close && this.session.channelClose == 0
                    && this.session.rtc.dataChannel.readyState != 'close') {
                    this.session.rtc.dataChannel.close();
                }
            }
        },

        /**
         * @param {SIP.RTC.MediaStream | (getUserMedia constraints)} [mediaHint]
         *        the MediaStream (or the constraints describing it) to be used for the session
         */
        getDescription: {
            writable: true,
            value: function getDescription(mediaHint) {
                var self = this;
                var acquire = self.mediaStreamManager.acquire;
                if (acquire.length > 1) {
                    acquire = SIP.Utils.promisify(this.mediaStreamManager, 'acquire', true);
                }
                mediaHint = mediaHint || {};
                if (mediaHint.dataChannel === true) {
                    mediaHint.dataChannel = {};
                }
                this.mediaHint = mediaHint;

                /*
                 * 1. acquire streams (skip if MediaStreams passed in)
                 * 2. addStreams
                 * 3. createOffer/createAnswer
                 */

                var streamPromise;

                if (self.localMedia) {
                    streamPromise = SIP.Utils.Promise.resolve(self.localMedia);
                } else {
                    streamPromise = acquire.call(self.mediaStreamManager, mediaHint)
                        .then(function acquireSucceeded(streams) {
                            self.localMedia = streams;
                            self.session.connecting();
                            return streams;
                        }, function acquireFailed(err) {
                            self.logger.error(err);
                            self.session.connecting();
                            throw err;
                        })
                        .then(this.addStreams.bind(this));
                }

                return streamPromise
                    .then(function streamAdditionSucceeded() {
                        if (self.hasOffer('remote')) {
                        } else if (mediaHint.dataChannel &&
                            self.peerConnection.rtc.createDataChannel) {
                        }
                        self.render();
                        return self.createOfferOrAnswer(self.RTCConstraints);
                    })
                    .then(function(sdp) {
                        return {
                            body: sdp,
                            contentType: 'application/sdp'
                        };
                    });
            }
        },

        /**
         * Check if a SIP message contains a session description.
         * @param {SIP.SIPMessage} message
         * @returns {boolean}
         */
        hasDescription: {
            writeable: true,
            value: function hasDescription(message) {
                return message.getHeader('Content-Type') === 'application/sdp' && !!message.body;
            }
        },

        /**
         * Set the session description contained in a SIP message.
         * @param {SIP.SIPMessage} message
         * @returns {Promise}
         */
        setDescription: {
            writable: true,
            value: function setDescription(message) {
                var sdp = message.body;

                this.remote_hold = /a=(sendonly|inactive)/.test(sdp);

                sdp = SIP.Hacks.Firefox.cannotHandleExtraWhitespace(sdp);
                sdp = SIP.Hacks.AllBrowsers.maskDtls(sdp);

                var rawDescription = {
                    type: this.hasOffer('local') ? 'answer' : 'offer',
                    sdp: sdp
                };

                this.emit('setDescription', rawDescription);

                var description = new SIP.RTC.RTCSessionDescription(rawDescription);
                return SIP.Utils.promisify(this.peerConnection, 'setRemoteDescription')(description);
            }
        },

        /**
         * If the Session associated with this MediaHandler were to be referred,
         * what mediaHint should be provided to the UA's invite method?
         */
        getReferMedia: {
            writable: true,
            value: function getReferMedia() {
                function hasTracks(trackGetter, stream) {
                    return stream[trackGetter]().length > 0;
                }

                function bothHaveTracks(trackGetter) {
                    /* jshint validthis:true */
                    return this.getLocalStreams().some(hasTracks.bind(null, trackGetter)) &&
                        this.getRemoteStreams().some(hasTracks.bind(null, trackGetter));
                }

                return {
                    constraints: {
                        audio: bothHaveTracks.call(this, 'getAudioTracks'),
                        video: bothHaveTracks.call(this, 'getVideoTracks')
                    }
                };
            }
        },

        updateIceServers: {
            writeable: true,
            value: function(options) {
                var servers = this.prepareIceServers(options.stunServers, options.turnServers);
                this.RTCConstraints = options.RTCConstraints || this.RTCConstraints;
            }
        },

        // Functions the session can use, but only because it's convenient for the application
        isMuted: {
            writable: true,
            value: function isMuted() {
                return {
                    audio: this.audioMuted,
                    video: this.videoMuted
                };
            }
        },

        mute: {
            writable: true,
            value: function mute(options) {
                if (this.getLocalStreams().length === 0) {
                    return;
                }

                options = options || {
                    audio: this.getLocalStreams()[0].getAudioTracks().length > 0,
                    video: this.getLocalStreams()[0].getVideoTracks().length > 0
                };

                var audioMuted = false,
                    videoMuted = false;

                if (options.audio && !this.audioMuted) {
                    audioMuted = true;
                    this.audioMuted = true;
                    this.toggleMuteAudio(true);
                }

                if (options.video && !this.videoMuted) {
                    videoMuted = true;
                    this.videoMuted = true;
                    this.toggleMuteVideo(true);
                }

                //REVISIT
                if (audioMuted || videoMuted) {
                    return {
                        audio: audioMuted,
                        video: videoMuted
                    };
                }
            }
        },

        unmute: {
            writable: true,
            value: function unmute(options) {
                if (this.getLocalStreams().length === 0) {
                    return;
                }

                options = options || {
                    audio: false,
                    video: false
                };

                var audioUnMuted = false,
                    videoUnMuted = false;

                if (options.audio && this.audioMuted) {
                    audioUnMuted = true;
                    this.audioMuted = false;
                    this.toggleMuteAudio(false);
                }

                if (options.video && this.videoMuted) {
                    videoUnMuted = true;
                    this.videoMuted = false;
                    this.toggleMuteVideo(false);
                }

                //REVISIT
                if (audioUnMuted || videoUnMuted) {
                    return {
                        audio: audioUnMuted,
                        video: videoUnMuted
                    };
                }
            }
        },

        hold: {
            writable: true,
            value: function hold() {
                this.local_hold = true;
                this.toggleMuteAudio(true);
                this.toggleMuteVideo(true);
            }
        },

        unhold: {
            writable: true,
            value: function unhold() {
                this.local_hold = false;

                if (!this.audioMuted) {
                    this.toggleMuteAudio(false);
                }

                if (!this.videoMuted) {
                    this.toggleMuteVideo(false);
                }
            }
        },

        getLocalStreams: {
            writable: true,
            value: function getLocalStreams() {
                //console.log('************ this.session.mediaHint: ', this.session.mediaHandler);
                if (this && this.session && this.session.mediaHint && this.session.mediaHint.stream) {
                    return this.session.mediaHint.stream;
                }
                return false;
            }
        },

        getRemoteStreams: {
            writable: true,
            value: function getRemoteStreams() {
                return this.session.remoteStream;
            }
        },

        render: {
            writable: true,
            value: function render(renderHint) {
                renderHint = renderHint || (this.mediaHint && this.mediaHint.render);
                if (!renderHint) {
                    return false;
                }
                var streamGetters = {
                    local: 'getLocalStreams',
                    remote: 'getRemoteStreams'
                };
                Object.keys(streamGetters).forEach(function(loc) {
                    var streamGetter = streamGetters[loc];
                    var streams = this[streamGetter]();
                    SIP.RTC.MediaStreamManager.render(streams, renderHint[loc]);
                }.bind(this));
            }
        },

        // Internal functions
        hasOffer: {
            writable: true,
            value: function hasOffer(where) {
                var offerState = 'have-' + where + '-offer';
                return this.peerConnection.signalingState === offerState;
                // TODO consider signalingStates with 'pranswer'?
            }
        },

        prepareIceServers: {
            writable: true,
            value: function prepareIceServers(stunServers, turnServers) {
                var servers = [],
                    config = this.session.ua.configuration;

                stunServers = stunServers || config.stunServers;
                turnServers = turnServers || config.turnServers;

                [].concat(stunServers).forEach(function(server) {
                    servers.push({ 'urls': server });
                });

                [].concat(turnServers).forEach(function(server) {
                    var turnServer = { 'urls': server.urls };
                    if (server.username) {
                        turnServer.username = server.username;
                    }
                    if (server.password) {
                        turnServer.credential = server.password;
                    }
                    servers.push(turnServer);
                });

                return servers;
            }
        },

        initPeerConnection: {
            writable: true,
            value: function initPeerConnection(servers) {
                var self = this,
                    config = this.session.ua.configuration;

                this.onIceCompleted = SIP.Utils.defer();
                this.onIceCompleted.promise.then(function(pc) {
                    self.emit('iceGatheringComplete', pc);
                    if (self.iceCheckingTimer) {
                        SIP.Timers.clearTimeout(self.iceCheckingTimer);
                        self.iceCheckingTimer = null;
                    }
                });

                this.peerConnection = {
                    addStream: function() {
                        self.startIceCheckingTimer();
                    },
                    localDescription: {
                        sdp: 'localDescription.sdp value'
                    },
                    onicecandidate: (e) => {
                        self.emit('iceCandidate', e);

                        if (e.candidate) {
                            self.logger.log('ICE candidate received: ' + (e.candidate.candidate === null ? null : e.candidate.candidate.trim()));

                            this.session.rtc.icecandidates = this.session.rtc.icecandidates || [];
                            this.session.rtc.icecandidates.push(e);

                            self.startIceCheckingTimer();
                        } else {
                            self.onIceCompleted.resolve(this);
                        }
                    },
                    onicegatheringstatechange: () => {
                        self.logger.log('RTCIceGatheringState changed: ' + this.iceGatheringState);
                        if (this.iceGatheringState === 'gathering') {
                            self.emit('iceGathering', this);
                        }
                        if (this.iceGatheringState === 'complete') {
                            self.onIceCompleted.resolve(this);
                        }
                    },
                    oniceconnectionstatechange: () => {
                        var stateEvent;

                        if (this.iceConnectionState === 'checking') {
                            self.startIceCheckingTimer();
                        }

                        switch (this.iceConnectionState) {
                            case 'new':
                                stateEvent = 'iceConnection';
                                break;
                            case 'checking':
                                stateEvent = 'iceConnectionChecking';
                                break;
                            case 'connected':
                                stateEvent = 'iceConnectionConnected';
                                break;
                            case 'completed':
                                stateEvent = 'iceConnectionCompleted';
                                break;
                            case 'failed':
                                stateEvent = 'iceConnectionFailed';
                                break;
                            case 'disconnected':
                                stateEvent = 'iceConnectionDisconnected';
                                break;
                            case 'closed':
                                stateEvent = 'iceConnectionClosed';
                                break;
                            default:
                                self.logger.warn('Unknown iceConnection state:', this.iceConnectionState);
                                return;
                        }
                        console.log(stateEvent);
                        self.emit(stateEvent, this);
                    },
                    setLocalDescription: function() {
                        self.logger.log('setLocalDescription');
                        return {};
                    },
                    createRTCAnswer: (param1) => {
                        var createDataChannel = () => {
                            let dataChannel;

                            this.session.rtc.ondatachannel = (event) => {
                                dataChannel = event.channel;

                                // На входящий звонок!
                                dataChannel.onopen = () => {
                                    dataChannel.onmessage = (event) => {
                                        let data = event.data;
                                        data = Buffer.from(data, 12, 320);
                                        this.session.getRemoteStreams().emit('data', data);
                                    }

                                    dataChannel.onclose = () => {
                                        this.session.channelClose = 1;
                                    }

                                    this.peerConnection.attachLocalStream();

                                    // setInterval(() => {
                                    //     if (this.session.channelClose == 0 && dataChannel.readyState == 'open') {
                                    //         dataChannel.send('ping');
                                    //     }
                                    // }, 1000);

                                    //dataChannel.send('ping');
                                    this.session.rtc.dataChannel = dataChannel;
                                };
                            }
                        }
                        createDataChannel();

                        function handleError(error) {
                            throw error;
                        }

                        var setRtcLocalDescription = (sdp) => {
                            this.session.rtc.setLocalDescription(
                                new SIP.RTC.RTCSessionDescription(sdp),
                                () => {
                                    this.peerConnection.localDescription.sdp = sdp;
                                    this.session.rtc.sdp = sdp;
                                    param1();
                                },
                                handleError
                            );
                        }

                        this.session.rtc.createAnswer(setRtcLocalDescription, handleError);
                    },
                    attachLocalStream: () => {
                        var stream = this.getLocalStreams();

                        var g711 = new (require('../../test/G711').G711)();

                        function convertPcmuToUlaw(buffer) {
                            console.log('buffer.length: ', buffer.length);
                            
                            var l = buffer.length;
                            var buf = new Int8Array(l);

                            while (l--) {
                                buf[l] = g711.linear2ulaw(buffer[l]); //convert to ulaw
                            }

                            // console.log('buf.length: ', buf.length, '\r\n');

                            // console.log(buf.buffer);
                            return buf.buffer;
                        }

                        if (stream) {
                            stream.on('data', (data) => {
                                if (this.session.channelClose == 0) {
                                    // console.log('Stream chunk');

                                    // data = new Buffer(data);

                                    // console.log(data);
                                    // data = convertPcmuToUlaw(data);
                                    // console.log(data);
                                    // console.log('\r\n');

                                    this.session.rtc.dataChannel.send(data);
                                }
                            });
                        } else {
                            let eventEmitter = require('events');
                            stream = new eventEmitter();

                            stream.on('data', (data) => {
                                if (this.session.channelClose == 0) {
                                    this.session.rtc.dataChannel.send(data);
                                }
                            });
                            MediaHandler.getDefaultStream.call(this, stream);
                        }
                    },
                    createRTCOffer: (param1) => {
                        /*********************************** Create Channel ***********************************/
                        var createDataChannel = () => {
                            var dataChannel = this.session.rtc.createDataChannel('text');
                            this.session.channelClose = 0;

                            // На исходящий звонок!
                            dataChannel.onopen = () => {
                                dataChannel.onmessage = (event) => {
                                    var data = event.data;
                                    data = Buffer.from(data, 12, 320);
                                    this.session.getRemoteStreams().emit('data', data);
                                }

                                dataChannel.onclose = () => {
                                    this.session.channelClose = 1;

                                    var currentdate = new Date();
                                    var datetime = currentdate.getHours() + ":" + currentdate.getMinutes() + ":" + currentdate.getSeconds();

                                    console.log('!!!!!!!!!!!!!!!!!! Close ' + datetime);

                                }
                                this.peerConnection.attachLocalStream();
                            }

                            this.session.rtc.dataChannel = dataChannel;
                        }
                        createDataChannel();

                        /*********************************** createRTCOffer ***********************************/
                        function handleError(error) {
                            throw error;
                        }

                        var setRtcLocalDescription = (sdp) => {
                            this.session.rtc.setLocalDescription(
                                new SIP.RTC.RTCSessionDescription(sdp),
                                () => {
                                    //sdp = JSON.stringify(sdp);
                                    this.peerConnection.localDescription.sdp = sdp;
                                    this.session.rtc.sdp = sdp;
                                    param1();
                                },
                                handleError
                            );
                        }

                        var createOffer = () => {
                            console.log('! rtc: create offer');
                            this.session.rtc.createOffer(setRtcLocalDescription, handleError);
                        }

                        createOffer();
                    },
                    createOffer: (param1, param2, param3) => {
                        if (!this.session.rtc) {
                            this.peerConnection.initRtc(() => {
                                this.peerConnection.createRTCOffer(param1);
                            });
                        } else {
                            this.peerConnection.createRTCAnswer(param1);
                        }
                    },

                    close: () => {
                        this.session.rtc = undefined;
                    },
                    RTCSessionDescription: (param1) => {
                        return param1;
                    },
                    initRtc: (cb) => {
                        var servers = {'iceServers':[{'urls':'stun:stun.iptel.org'}]};
                        /*********************************** RTC ***********************************/
                        var rtc = new SIP.RTC.RTCPeerConnection(servers) || new webkitRTCPeerConnection(servers);
                        this.session.channelClose = 0;

                        /*********************************** Other ***********************************/
                        this.session.rtc = rtc;
                        this.session.rtc.onicecandidate = this.peerConnection.onicecandidate;
                        this.session.rtc.onicegatheringstatechange = this.peerConnection.onicegatheringstatechange;
                        this.session.rtc.oniceconnectionstatechange = this.peerConnection.oniceconnectionstatechange;
                        this.session.rtc.onstatechange = this.peerConnection.onstatechange;
                        cb();
                    },
                    setRemoteSdp: (cb) => {
                        console.log('setRemoteSdp this.peerConnection.RemoteDescription.sdp: ', this.peerConnection.RemoteDescription.sdp);

                        var remoteSdp = JSON.parse(this.peerConnection.RemoteDescription.sdp.sdp);

                        function handleError(error) {
                            console.log('setRemoteSdp handleError: ', error);
                            throw error;
                        }

                        var setIceCandidate = (sdp) => {

                            console.log('setRemoteSdp icecandidates: ', remoteSdp.icecandidates);

                            console.log('setRemoteSdp: ', remoteSdp);

                            if ( (remoteSdp.icecandidates)
                                && Array.isArray(remoteSdp.icecandidates) ) {

                                var iceCandidates = remoteSdp.icecandidates;

                                iceCandidates.forEach((item, i, arr) => {
                                    if (item.candidate) {
                                        console.log('setRemoteSdp set icecandidates: ', item.candidate);
                                        this.session.rtc.addIceCandidate(item.candidate);
                                    }
                                });
                            }
                        };

                        var wait = () => {
                            setIceCandidate();
                            cb();

                            var stateEvent = 'iceConnectionConnected';
                            this.emit(stateEvent, this);
                        }
                        this.session.rtc.setRemoteDescription(
                            new SIP.RTC.RTCSessionDescription(remoteSdp),
                            wait,
                            handleError
                        );
                    },
                    setRemoteDescription: (param1, param2, param3) => {
                        console.log('setRemoteDescription');
                        this.peerConnection.RemoteDescription = {
                            sdp: param1
                        };

                        // Инициализация Media Handler
                        if (!this.session.rtc) {
                            this.peerConnection.initRtc(() => {
                                this.peerConnection.setRemoteSdp(() => {
                                    param2();
                                });
                            });
                        } else { // Установка данных об удаленном соединении
                            this.peerConnection.setRemoteSdp(() => {
                                param2();
                            });
                        }
                        return {};
                    }
                };

                this._remoteStreams = [];

                self._remoteStreams.push({});
                self.render();
                self.emit('addStream', {});

                this.startIceCheckingTimer = function() {
                    if (!self.iceCheckingTimer) {
                        self.iceCheckingTimer = SIP.Timers.setTimeout(function() {
                            self.logger.log('RTCIceChecking Timeout Triggered after ' + config.iceCheckingTimeout + ' milliseconds');
                            self.onIceCompleted.resolve(this);
                        }.bind(this.peerConnection.rtc), config.iceCheckingTimeout);
                    }
                };

            }
        },

        createOfferOrAnswer: {
            writable: true,
            value: function createOfferOrAnswer(constraints) {
                console.log('createOfferOrAnswer');

                var self = this;
                var methodName;
                var pc = self.peerConnection;

                self.ready = false;
                methodName = self.hasOffer('remote') ? 'createAnswer' : 'createOffer';

                return SIP.Utils.promisify(pc, methodName, true)(constraints)
                    .then(function() {
                            return SIP.Utils.promisify(pc, 'setLocalDescription')
                        },
                        function(err) {
                            console.log('methodName: ', methodName);
                            throw new Error(err);
                        })
                    .then(function onSetLocalDescriptionSuccess() {
                        var deferred = SIP.Utils.defer();
                        if (pc.iceGatheringState === 'complete' && (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed')) {
                            deferred.resolve();
                        } else {
                            self.onIceCompleted.promise.then(deferred.resolve);
                        }
                        return deferred.promise;
                    })
                    .then(() => { // readySuccess
                        console.log('readySuccess');
                        var sdp = pc.localDescription.sdp;

                        var iceCandidate = [];

                        this.session.rtc.icecandidates.forEach(function(item, i, arr) {
                            if (item && item['candidate'] && item['candidate']['candidate']) {
                                iceCandidate.push({
                                    candidate: item['candidate']
                                });
                            } else {
                                iceCandidate.push(item);
                            }
                        });
                        sdp["icecandidates"] = iceCandidate;

                        // Создание клона объекта sdp из за некорректной сериализации объекта sdp
                        var cloneSdp = {
                            'sdp': sdp['sdp'],
                            'icecandidates': sdp['icecandidates'],
                            'type': sdp['type']
                        }

                        var answerSdp = JSON.stringify(cloneSdp);

                        var sdpWrapper = {
                            type: cloneSdp.type,
                            sdp: answerSdp
                        };
                        self.ready = true;
                        console.log(answerSdp);

                        return sdpWrapper.sdp;

                        /*
                        var sdp = pc.localDescription.sdp;
                        sdp.icecandidates = this.session.rtc.icecandidates;
                        var type = sdp.type;
                        sdp = JSON.stringify(sdp);

                        var sdpWrapper = {
                            type: type,
                            sdp: sdp
                        };
                        self.ready = true;
                        console.log('ready Success: ', sdpWrapper);
                        return sdpWrapper.sdp;
                        */
                    })
                    .catch(function methodFailed(e) {
                        self.logger.error(e);
                        self.ready = true;
                        throw new SIP.Exceptions.GetDescriptionError(e);
                    });
            }
        },

        addStreams: {
            writable: true,
            value: function addStreams(streams) {
                try {
                    streams = [].concat(streams);
                    streams.forEach(function(stream) {
                        this.peerConnection.addStream(stream);
                    }, this);
                } catch (e) {
                    this.logger.error('error adding stream');
                    this.logger.error(e);
                    return SIP.Utils.Promise.reject(e);
                }

                return SIP.Utils.Promise.resolve();
            }
        },

        toggleMuteHelper: {
            writable: true,
            value: function toggleMuteHelper(trackGetter, mute) {
                this.getLocalStreams().forEach(function(stream) {
                    stream[trackGetter]().forEach(function(track) {
                        track.enabled = !mute;
                    });
                });
            }
        },

        toggleMuteAudio: {
            writable: true,
            value: function toggleMuteAudio(mute) {
                this.toggleMuteHelper('getAudioTracks', mute);
            }
        },

        toggleMuteVideo: {
            writable: true,
            value: function toggleMuteVideo(mute) {
                this.toggleMuteHelper('getVideoTracks', mute);
            }
        }
    });

    // Return since it will be assigned to a variable.
    return MediaHandler;
};