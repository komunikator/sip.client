"use strict";
/**
 * @fileoverview RTP
 */

module.exports = function(SIP, environment) {
    var RTP;

    RTP = {};

    RTP.MediaHandler = require('./RTP/MediaHandler')(SIP);
    RTP.MediaStreamManager = require('./RTP/MediaStreamManager')(SIP, environment);

    var _isSupported;

    RTP.isSupported = function() {
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

        environment.RTCSessionDescription = function(param1) {
            return param1;
        }

        RTP.MediaStream = environment.MediaStream;
        RTP.getUserMedia = environment.getUserMedia;
        RTP.RTCPeerConnection = environment.RTCPeerConnection;
        RTP.RTCSessionDescription = environment.RTCSessionDescription;

        //if (RTP.RTCPeerConnection && RTP.RTCSessionDescription) {
        //if (RTP.getUserMedia) {
        RTP.getUserMedia = SIP.Utils.promisify(environment, 'getUserMedia');
        //}
        _isSupported = true;
        //} else {
        //_isSupported = false;
        //    _isSupported = true;
        //}
        return _isSupported;
    };

    SIP.RTP = RTP;
    return RTP;
};