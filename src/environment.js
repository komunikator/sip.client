"use strict";
var extend = require('util')._extend;

extend(exports, require('./environment_browser'));

extend(exports, {
    WebSocket: require('ws'), // WS
    dgram: require('dgram'), // UDP
    net: require('net'), // TCP
    tls: require('tls'), // TLS
    Promise: exports.Promise || require('promiscuous'),
    console: require('console'),
    timers: require('timers')
});