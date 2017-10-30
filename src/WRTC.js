"use strict";
/**
 * @fileoverview RTC
 */

module.exports = function(SIP, environment) {
    var RTC;

    RTC = {};

    RTC.MediaHandler = require('./WRTC/MediaHandler')(SIP);
    RTC.MediaStreamManager = require('./WRTC/MediaStreamManager')(SIP, environment);
    // RTC.MediaHandler = require('./WRTC_WebRTC/MediaHandler')(SIP);
    // RTC.MediaStreamManager = require('./WRTC_WebRTC/MediaStreamManager')(SIP, environment);

    let wrtc = require('node-webrtc');
    // if (window) {
    //     wrtc = environment;
    // }

    var _isSupported;

    RTC.isSupported = function() {
        if (_isSupported !== undefined) {
            return _isSupported;
        }

        environment.getUserMedia = function(obj, resolve, reject) {
            resolve({
                getAudioTracks: function() {
                    return [];
                },
                getVideoTracks: function() {
                    return {};
                }
            });
        }

        // environment.RTCSessionDescription = function(param1) {
        //     return param1;
        // }

        RTC.MediaStream = environment.MediaStream;
        RTC.getUserMedia = environment.getUserMedia;
        RTC.RTCPeerConnection = wrtc.RTCPeerConnection;
        RTC.RTCSessionDescription = wrtc.RTCSessionDescription;

        RTC.getUserMedia = SIP.Utils.promisify(environment, 'getUserMedia');
        _isSupported = true;
        return _isSupported;
    };

    SIP.RTC = RTC;
    return RTC;
};