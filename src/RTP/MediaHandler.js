"use strict";
/**
 * @fileoverview MediaHandler
 */

/* MediaHandler
 * @class PeerConnection helper Class.
 * @param {SIP.Session} session
 * @param {Object} [options]
 * @param {SIP.RTP.MediaStreamManager} [options.mediaStreamManager]
 *        The MediaStreamManager to acquire/release streams from/to.
 *        If not provided, a default MediaStreamManager will be used.
 */
var countLoadRtp = 0;

process.on('uncaughtException', function(err) {
    console.log(err);
})

module.exports = function(SIP) {

    var MediaHandler = function(session, options) {
        options = options || {};

        let EventEmitter = require('events');
        this.logger = session.ua.getLogger('sip.invitecontext.mediahandler', session.id);
        this.session = session;
        this.localMedia = null;
        this.ready = true;
        this.mediaStreamManager = options.mediaStreamManager || new SIP.RTP.MediaStreamManager(this.logger);
        this.audioMuted = false;
        this.videoMuted = false;
        this.local_hold = false;
        this.remote_hold = false;
        session.remoteStream = new EventEmitter();
        // old init() from here on

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

    MediaHandler.defaultFactory = function defaultFactory(session, options) {
        return new MediaHandler(session, options);
    };
    MediaHandler.defaultFactory.isSupported = function() {
        return SIP.RTP.isSupported();
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
                // have to check signalingState since this.close() gets called multiple times
                // TODO figure out why that happens
                if (this.peerConnection && this.peerConnection.signalingState !== 'closed') {
                    this.peerConnection.close();

                    if (this.localMedia) {
                        this.mediaStreamManager.release(this.localMedia);
                    }
                }
            }
        },

        /**
         * @param {SIP.RTP.MediaStream | (getUserMedia constraints)} [mediaHint]
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
                            self.peerConnection.ondatachannel = function(evt) {
                                self.dataChannel = evt.channel;
                                self.emit('dataChannel', self.dataChannel);
                            };
                        } else if (mediaHint.dataChannel &&
                            self.peerConnection.createDataChannel) {
                            self.dataChannel = self.peerConnection.createDataChannel(
                                'sipjs',
                                mediaHint.dataChannel
                            );
                            self.emit('dataChannel', self.dataChannel);
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

                var description = new SIP.RTP.RTCSessionDescription(rawDescription);
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
                    /*this.session.onmute({
                      audio: audioMuted,
                      video: videoMuted
                    });*/
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
                    audio: false, //this.getLocalStreams()[0].getAudioTracks().length > 0,
                    video: false //this.getLocalStreams()[0].getVideoTracks().length > 0
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
                    /*this.session.onunmute({
                      audio: audioUnMuted,
                      video: videoUnMuted
                    });*/
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

        // Functions the application can use, but not the session
        getLocalStreams: {
            writable: true,
            value: function getLocalStreams() {
                return this.session.mediaHint.stream;

                /*
                var pc = this.peerConnection;
                if (pc && pc.signalingState === 'closed') {
                    this.logger.warn('peerConnection is closed, getLocalStreams returning []');
                    return [];
                }
                return (pc.getLocalStreams && pc.getLocalStreams()) ||
                    pc.localStreams || [];
                */
            }
        },

        getRemoteStreams: {
            writable: true,
            value: function getRemoteStreams() {
                return this.session.remoteStream;
                //console.log('MediaHandler getRemoteStreams');
                /*
                var pc = this.peerConnection;
                if (pc && pc.signalingState === 'closed') {
                    this.logger.warn('peerConnection is closed, getRemoteStreams returning this._remoteStreams');
                    return this._remoteStreams;
                }
                return (pc.getRemoteStreams && pc.getRemoteStreams()) ||
                    pc.remoteStreams || [];
                    */
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
                    SIP.RTP.MediaStreamManager.render(streams, renderHint[loc]);
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
                    setLocalDescription: function() {
                        self.logger.log('setLocalDescription');
                        return {};
                    },
                    createOffer: (param1, param2, param3) => {
                        // Для входящего звонка
                        if (!this.session.rtp) {
                            this.peerConnection.initRtp(function() {
                                param1();
                            });
                        } else { // Для исходящего звонка
                            this.peerConnection.setRemoteRtpPort(function() {
                                param1();
                            });
                        }
                    },

                    close: () => {
                        if (this.session.rtp._events && this.session.rtp._events.message) {
                            this.session.rtp.removeListener('message', this.session.rtp._events.message);
                        }

                        this.session.rtp.message({
                            action: 'close',
                            params: {
                                sessionID: this.session.sessionID
                            }
                        });

                        this.session.rtp = undefined;
                    },
                    RTCSessionDescription: (param1) => {
                        return param1;
                    },
                    /*
                    getLocalStreams: () => {
                        return self.session.mediaHint.stream;
                    },
                    getRemoteStreams: () => {
                        return this.session.remoteStream;
                    },
                    */
                    initRtp: (cb) => {
                        function getRandomID(min, max) {
                            var int = Math.floor(Math.random() * (max - min + 1)) + min;
                            return int.toString(36);
                        }
                        var rtp = require(__dirname + '/rtp/rtp.js');

                        this.session.rtp = new rtp();
                        this.session.sessionID = getRandomID(0, 1679615);

                        this.session.rtp.timeOutID = setTimeout(function() {
                            this.session.rtp.message({ action: 'close' });
                        }, 1800000); //30 min

                        var callback = (d) => {
                            if (d.action == 'rtpInPort') {
                                var sdp = 'v=0\r\n' +
                                    'o=- 13374 13374 IN IP4 172.17.3.33\r\n' +
                                    's=-\r\n' +
                                    'c=IN IP4 172.17.3.33\r\n' +
                                    't=0 0\r\n' +

                                    //'m=audio ' + d.params.port + ' RTP/AVP 8 101\r\n' +
                                    'm=audio ' + d.params.port + ' RTP/AVP 0 101\r\n' +

                                    //'a=rtpmap:8 PCMA/8000\r\n' +
                                    'a=rtpmap:8 0 PCMU/8000\r\n' +

                                    'a=rtpmap:101 telephone-event/8000\r\n' +
                                    'a=fmtp:101 0-15\r\n' +
                                    'a=ptime:30\r\n' +
                                    'a=sendrecv\r\n';

                                this.peerConnection.localDescription.sdp = sdp;
                                this.session.rtp.sdp = sdp;
                                this.session.rtp.removeListener('message', callback);
                                cb();
                            }
                        };

                        this.session.rtp.on('message', callback);

                        this.session.rtp.message({
                            action: 'rtpInPort',
                            params: {
                                sessionID: this.session.sessionID
                            }
                        });
                    },
                    setRemoteRtpPort: (cb) => {
                        var port = String(this.peerConnection.RemoteDescription.sdp.match(/m=audio [0-9]*/g)).replace('m=audio ', '');
                        this.session.rtp.on('message', (d) => {
                            if (d.action == 'init') {

                                let self = this;
                                let stream = this.getLocalStreams();

                                stream.on('data', (data) => {
                                    self.session.rtp.message({
                                        action: 'audioBuffer',
                                        params: {
                                            sessionID: self.session.sessionID,
                                            data: Array.from(data)
                                        }
                                    });
                                });

                                this.session.rtp.message({
                                    action: 'start_play',
                                    params: {
                                        audioBuffer: self.session.sessionID
                                    }
                                });

                                this.session.rtp.message({
                                    action: 'rec',
                                    params: {
                                        sessionID: self.session.sessionID,
                                        rec: true,
                                        file: 'rec/' + self.session.sessionID + '.wav',
                                        type: '-m',
                                        media_stream: true
                                    }
                                });

                                cb();

                                self.onIceCompleted.resolve({});

                                var stateEvent = 'iceConnectionConnected';
                                self.emit(stateEvent, this);
                            } else if (d.action == 'mediaStream') {
                                //console.log('d.params.sessionID: ', d.params.sessionID, ' self.session.sessionID: ', self.session.sessionID);
                                //if (d.params.sessionID == self.session.sessionID) {
                                self.session.getRemoteStreams().emit('data', d.params.data);
                                //this.getRemoteStreams().emit('data', d.params.data);
                                //}
                            }
                        });

                        var info = {
                            out: {
                                ip: '172.17.3.33',
                                port: port
                            },
                            sessionID: this.session.sessionID,
                            in: {}
                        };

                        this.session.rtp.message({ action: 'init', params: info });
                    },
                    setRemoteDescription: (param1, param2, param3) => {
                        this.peerConnection.RemoteDescription = {
                            sdp: param1.sdp
                        };

                        // Для входящего звонка
                        if (!this.session.rtp) {
                            this.peerConnection.initRtp(function() {
                                param2();
                            });
                        } else { // Для исходящего звонка
                            this.peerConnection.setRemoteRtpPort(function() {
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
                        }.bind(this.peerConnection), config.iceCheckingTimeout);
                    }
                };

            }
        },

        createOfferOrAnswer: {
            writable: true,
            value: function createOfferOrAnswer(constraints) {
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
                            throw new Error(err);
                        })
                    .then(function onSetLocalDescriptionSuccess() {
                        var deferred = SIP.Utils.defer();
                        deferred.resolve();
                        return deferred.promise;
                    })
                    .then(function readySuccess() {
                        var sdp = pc.localDescription.sdp;
                        var sdpWrapper = {
                            type: methodName === 'createOffer' ? 'offer' : 'answer',
                            sdp: sdp
                        };
                        self.emit('getDescription', sdpWrapper);
                        self.ready = true;
                        return sdpWrapper.sdp;
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