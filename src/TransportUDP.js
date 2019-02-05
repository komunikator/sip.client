"use strict";
/**
 * @fileoverview Transport
 */

/**
 * @augments SIP
 * @class Transport
 * @param {SIP.UA} ua
 * @param {Object} server ws_server Object
 */
module.exports = function(SIP, environment) {
    var Socket = environment.dgram;

    var Transport,
        C = {
            // Transport status codes
            STATUS_READY: 0,
            STATUS_DISCONNECTED: 1,
            STATUS_ERROR: 2
        };

    /**
     * Compute an amount of time in seconds to wait before sending another
     * keep-alive.
     * @returns {Number}
     */
    function computeKeepAliveTimeout(upperBound) {
        var lowerBound = upperBound * 0.8;
        return 1000 * (Math.random() * (upperBound - lowerBound) + lowerBound);
    }

    Transport = function(ua, server) {

        this.logger = ua.getLogger('sip.transport');
        this.ua = ua;
        this.ws = null;
        this.server = server;
        this.reconnection_attempts = 0;
        this.closed = false;
        this.connected = false;
        this.reconnectTimer = null;
        this.lastTransportError = {};

        this.keepAliveInterval = ua.configuration.keepAliveInterval;
        this.keepAliveTimeout = null;
        this.keepAliveTimer = null;

        this.ua.transport = this;

        // Connect
        this.connect();
    };

    Transport.prototype = {
        /**
         * Send a message.
         * @param {SIP.OutgoingRequest|String} msg
         * @returns {Boolean}
         */
        send: function(msg) {
            var message = msg.toString();

            //console.log('*** Send Message: \n', message);

            var parseUri = this.server.ws_uri.split(':');
            var protocol = parseUri[0];
            var host = parseUri[1].replace('//', '');
            var port = parseUri[2];

            this.ws.send(message, 0, message.length, port, host, (err) => {
                if (err) {
                    console.log('Error: ', err);
                }
            });
            return true;

            /*
            if (this.ws && this.ws.readyState === Socket.OPEN) {
                if (this.ua.configuration.traceSip === true) {
                    this.logger.log('sending Socket message:\n\n' + message + '\n');
                }
                this.ws.send(message);
                return true;
            } else {
                this.logger.warn('unable to send message, Socket is not open');
                return false;
            }
            */
        },

        /**
         * Send a keep-alive (a double-CRLF sequence).
         * @private
         * @returns {Boolean}
         */
        sendKeepAlive: function() {
            if (this.keepAliveTimeout) { return; }

            this.keepAliveTimeout = SIP.Timers.setTimeout(function() {
                this.ua.emit('keepAliveTimeout');
            }.bind(this), 10000);

            return this.send('\r\n\r\n');
        },

        /**
         * Start sending keep-alives.
         * @private
         */
        startSendingKeepAlives: function() {
            if (this.keepAliveInterval && !this.keepAliveTimer) {
                this.keepAliveTimer = SIP.Timers.setTimeout(function() {
                    this.sendKeepAlive();
                    this.keepAliveTimer = null;
                    this.startSendingKeepAlives();
                }.bind(this), computeKeepAliveTimeout(this.keepAliveInterval));
            }
        },

        /**
         * Stop sending keep-alives.
         * @private
         */
        stopSendingKeepAlives: function() {
            SIP.Timers.clearTimeout(this.keepAliveTimer);
            SIP.Timers.clearTimeout(this.keepAliveTimeout);
            this.keepAliveTimer = null;
            this.keepAliveTimeout = null;
        },

        /**
         * Disconnect socket.
         */
        disconnect: function() {
            if (this.ws) {
                // Clear reconnectTimer
                SIP.Timers.clearTimeout(this.reconnectTimer);

                this.stopSendingKeepAlives();

                this.closed = true;
                this.logger.log('closing Socket ' + this.server.ws_uri);
                this.ws.close();
            }

            if (this.reconnectTimer !== null) {
                SIP.Timers.clearTimeout(this.reconnectTimer);
                this.reconnectTimer = null;
                this.ua.emit('disconnected', {
                    transport: this,
                    code: this.lastTransportError.code,
                    reason: this.lastTransportError.reason
                });
            }
        },

        /**
         * Connect socket.
         */
        connect: function() {
            var transport = this;

            if (this.ws && (this.ws.readyState === Socket.OPEN || this.ws.readyState === Socket.CONNECTING)) {
                this.logger.log('Socket ' + this.server.ws_uri + ' is already connected');
                return false;
            }

            if (this.ws) {
                this.ws.close();
            }

            this.logger.log('connecting to Socket ' + this.server.ws_uri);
            this.ua.onTransportConnecting(this,
                (this.reconnection_attempts === 0) ? 1 : this.reconnection_attempts);
            try {
                //this.ws = new Socket(this.server.ws_uri, 'sip');
                this.ws = Socket.createSocket('udp4');
            } catch (e) {
                this.logger.warn('error connecting to Socket ' + this.server.ws_uri + ': ' + e);
            }

            this.ws.on('error', (e) => {
                this.ws.close();
                transport.onError(e);
            });
            this.ws.on('message', (e, rinfo) => {
                e = e.toString();
                //console.log('*********************** New Message : ', e);

                transport.onMessage({ data: e });
            });
            this.ws.on('listening', () => {
                transport.onOpen();
            });
            this.ws.on('close', (e) => {
                transport.onClose(e);
                // this.ondisconnect();
            });

            this.ws.bind({});

            //this.ws.binaryType = 'arraybuffer';

            // this.ws.onopen = function() {
            //     transport.onOpen();
            // };

            // this.ws.onclose = function(e) {
            //     transport.onClose(e);
            // };

            // this.ws.onmessage = function(e) {
            //     transport.onMessage(e);
            // };

            // this.ws.onerror = function(e) {
            //     transport.onError(e);
            // };
        },

        // Transport Event Handlers

        /**
         * @event
         * @param {event} e
         */
        onOpen: function() {
            this.connected = true;

            this.logger.log('Socket ' + this.server.ws_uri + ' connected');
            // Clear reconnectTimer since we are not disconnected
            if (this.reconnectTimer !== null) {
                SIP.Timers.clearTimeout(this.reconnectTimer);
                this.reconnectTimer = null;
            }
            // Reset reconnection_attempts
            this.reconnection_attempts = 0;
            // Disable closed
            this.closed = false;
            // Trigger onTransportConnected callback
            this.ua.onTransportConnected(this);
            // Start sending keep-alives
            this.startSendingKeepAlives();
        },

        /**
         * @event
         * @param {event} e
         */
        onClose: function(e) {
            var connected_before = this.connected;

            this.lastTransportError.code = e && e.code ? e.code : '';
            this.lastTransportError.reason = e && e.reason ? e.reson : '';

            this.stopSendingKeepAlives();

            if (this.reconnection_attempts > 0) {
                this.logger.log('Reconnection attempt ' + this.reconnection_attempts + ' failed (code: ' + (e && e.code ? e.code : '') + (e.reason ? '| reason: ' + e.reason : '') + ')');
                this.reconnect();
            } else {
                this.connected = false;
                this.logger.log('Socket disconnected (code: ' + (e && e.code ? e.code : '') + (e && e.reason ? '| reason: ' + e.reason : '') + ')');

                if (e && e.wasClean === false) {
                    this.logger.warn('Socket abrupt disconnection');
                }
                // Transport was connected
                if (connected_before === true) {
                    this.ua.onTransportClosed(this);
                    // Check whether the user requested to close.
                    if (!this.closed) {
                        this.reconnect();
                    } else {
                        this.ua.emit('disconnected', {
                            transport: this,
                            code: this.lastTransportError.code,
                            reason: this.lastTransportError.reason
                        });

                    }
                } else {
                    // This is the first connection attempt
                    //Network error
                    this.ua.onTransportError(this);
                }
            }
        },

        /**
         * @event
         * @param {event} e
         */
        onMessage: function(e) {
            var message, transaction,
                data = e.data;

            // CRLF Keep Alive response from server. Ignore it.
            if (data === '\r\n') {
                SIP.Timers.clearTimeout(this.keepAliveTimeout);
                this.keepAliveTimeout = null;

                if (this.ua.configuration.traceSip === true) {
                    this.logger.log('received Socket message with CRLF Keep Alive response');
                }

                return;
            }

            // Socket binary message.
            else if (typeof data !== 'string') {
                try {
                    data = String.fromCharCode.apply(null, new Uint8Array(data));
                } catch (evt) {
                    this.logger.warn('received Socket binary message failed to be converted into string, message discarded');
                    return;
                }

                if (this.ua.configuration.traceSip === true) {
                    this.logger.log('received Socket binary message:\n\n' + data + '\n');
                }
            }

            // Socket text message.
            else {
                if (this.ua.configuration.traceSip === true) {
                    this.logger.log('received Socket text message:\n\n' + data + '\n');
                }
            }

            message = SIP.Parser.parseMessage(data, this.ua);

            if (!message) {
                return;
            }

            if (this.ua.status === SIP.UA.C.STATUS_USER_CLOSED && message instanceof SIP.IncomingRequest) {
                return;
            }

            // Do some sanity check
            if (SIP.sanityCheck(message, this.ua, this)) {
                if (message instanceof SIP.IncomingRequest) {
                    message.transport = this;
                    this.ua.receiveRequest(message);
                } else if (message instanceof SIP.IncomingResponse) {
                    /* Unike stated in 18.1.2, if a response does not match
                     * any transaction, it is discarded here and no passed to the core
                     * in order to be discarded there.
                     */
                    switch (message.method) {
                        case SIP.C.INVITE:
                            transaction = this.ua.transactions.ict[message.via_branch];
                            if (transaction) {
                                transaction.receiveResponse(message);
                            }
                            break;
                        case SIP.C.ACK:
                            // Just in case ;-)
                            break;
                        default:
                            transaction = this.ua.transactions.nict[message.via_branch];
                            if (transaction) {
                                transaction.receiveResponse(message);
                            }
                            break;
                    }
                }
            }
        },

        /**
         * @event
         * @param {event} e
         */
        onError: function(e) {
            this.logger.warn('Socket connection error: ' + JSON.stringify(e));
        },

        /**
         * Reconnection attempt logic.
         * @private
         */
        reconnect: function() {
            var transport = this;

            this.reconnection_attempts += 1;

            if (this.reconnection_attempts > this.ua.configuration.wsServerMaxReconnection) {
                this.logger.warn('maximum reconnection attempts for Socket ' + this.server.ws_uri);
                this.ua.onTransportError(this);
            } else if (this.reconnection_attempts === 1) {
                this.logger.log('Connection to Socket ' + this.server.ws_uri + ' severed, attempting first reconnect');
                transport.connect();
            } else {
                this.logger.log('trying to reconnect to Socket ' + this.server.ws_uri + ' (reconnection attempt ' + this.reconnection_attempts + ')');

                this.reconnectTimer = SIP.Timers.setTimeout(function() {
                    transport.connect();
                    transport.reconnectTimer = null;
                }, this.ua.configuration.wsServerReconnectionTimeout * 1000);
            }
        }
    };

    Transport.C = C;
    return Transport;
};