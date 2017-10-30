"use strict";
/**
 * @fileoverview RTC_browser
 */

module.exports = function(SIP, environment) {
    var RTC = {
        SIP: SIP,
        environment: environment
    };
    console.log(RTC);
};