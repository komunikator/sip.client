'use strict';

let EventEmitter = require('events');
let fs = require('fs');

try {
    class Rtp extends EventEmitter {

        constructor() {
            super();
            this.rtp;
            this.stun = require('vs-stun');
            this.rtp_packet;
            this.stt;
            this.stop_flag = true;
            this.stream_on;
            this.rec_start;
            this.rec_type;
            this.audio_stream_in;
            this.audio_stream_out;
            this.sessionID;
            this.bufferSize = 320; //8*30 //30 ms
            this.audioPayload = 0; //RFC3551//PCMU,
            this.fileCodec;
            this.wavDataOffset = 58;
            this.Buffer = require('buffer').Buffer;
            this.RtpPacket = require('./rtppacket').RtpPacket;
            this.eventEmitter = require('events');
            this.audioBuffers = {};
            this.g711 = new(require('./G711').G711)();
            this.wav = require('wav');
            this.lastSttOpt;
        }

        message(data) {
            if (data) {
                var params = data.params;
                if (data.action === 'audioBuffer' && params.sessionID && params.data.length) {
                    this.audioBuffers[params.sessionID] = this.audioBuffers[params.sessionID] || new Buffer(0);

                    /*
                    console.log('********************');
                    console.log('params.data:             ', params.data);
                    console.log('new Buffer(params.data): ', new Buffer(params.data));
                    */

                    this.audioBuffers[params.sessionID] = Buffer.concat([this.audioBuffers[params.sessionID], new Buffer(params.data)]);
                    return;
                }
                if (data.action === 'rtpInPort') {
                    if (params && params.audioCodec === 'PCMA')
                        this.audioPayload = 8;

                    this.rtp = require("dgram").createSocket('udp4');

                    this.rtp.bind(0, () => {
                        var rtpIn = { port: this.rtp.address().port };
                        if (params && params.publicIP && params.stunServer) {
                            rtpIn.host = params.publicIP;
                            stun.resolve(this.rtp, params.stunServer, (err, value) => {
                                if (value && value.public) {
                                    rtpIn = value.public
                                };
                                this.emit('message', { action: data.action, params: rtpIn });
                            }, { count: 1, timeout: 100 });
                        } else
                            this.emit('message', { action: data.action, params: rtpIn });
                    })
                    return;
                }
                if (data.action === 'init') {
                    this.sessionID = params.sessionID;
                    this.init(params, () => {
                        data.action = 'stop';
                        this.emit('message', data);
                    });
                    this.emit('message', data);
                    return;
                }
                if (data.action === 'close') {
                    //console.log('rtp data.action close');
                    this.close();
                }
                if (data.action === 'stop_play')
                    this.stop_flag = true;
                if ((data.action === 'start_play') && params && (params.file || params.audioBuffer)) {
                    if (params.file) {
                        var files = params.file.split(";");
                        files.forEach((f) => {
                            // var f_ = f.slice(0, -4) + audioPostfix + '.wav';
                            // if (fs.existsSync(f_))
                            //     f = f_;
                            if (!fs.existsSync(f)) {
                                data.error = 'File not exists';
                                this.emit('message', data);
                                return;
                            } else
                            //TODO
                            //USE require('wav')!!!
                            if (!require(__dirname + '/wav.js').checkFormat(f, [6, 7])) { //6-pcma,7pcmu
                                data.error = 'Invalid File Format "' + f + '"';
                                this.emit('message', data);
                                return;
                            }
                        });
                    }
                    if (data.error)
                        return;
                    var toDo = () => {
                        this.emit('message', data);
                        this.start_play(params, (resetFlag) => {
                            if (!resetFlag) {
                                data.action = 'stop_play';
                                this.emit('message', data);
                                this.stop_flag = true;
                            } else {
                                data.action = 'reset_play';
                                this.emit('message', data);
                            }

                        });
                    };
                    if (this.stop_flag === false) {
                        this.stop_flag = true;
                        setTimeout(toDo, 50);
                    } else
                        toDo();
                    return;
                }
                if (data.action === 'rec' && (params)) {
                    this.emit('message', data);
                    this.rec(params);
                    return;
                }
            }
        }

        init(params, cb) {
            let buf2array = (buf) => {
                var data = [];
                for (var i = 0; i < buf.length; i++) {
                    if (this.audioPayload)
                        data.push(this.g711.alaw2linear(buf.readInt8(i)));
                    else
                        data.push(this.g711.ulaw2linear(buf.readInt8(i)));
                    //fs.appendFile("data.dat",el+"\n");
                }
                return data;
            }

            let dtmf_data = (pkt) => {
                var keys = {
                    10: '*',
                    11: '#',
                    12: 'A',
                    13: 'B',
                    14: 'C',
                    15: 'D'
                };
                var key = pkt[0];
                if (keys[key])
                    key = keys[key];
                return {
                    //event: pkt[0],
                    event: key,
                    //e: (pkt[1] & 0x01),
                    //r: (pkt[1]>>> 1 & 0x01),
                    volume: (pkt[1] >>> 2),
                    duration: (pkt[2] << 8 | pkt[3])
                };
            }

            let rtp_data = (pkt) => {
                return {
                    type: (pkt[1] & 0x7F),
                    seq: (pkt[2] << 8 | pkt[3]),
                    time: (pkt[4] << 24 | pkt[5] << 16 | pkt[6] << 8 | pkt[7]),
                    source: pkt.slice(12, pkt.length)
                };
            }
            var dtmf_decoder = require('./dtmf'),
                //audio_stream,
                dtmf_mode,
                min_dtmf_dur,
                change_flag,
                stream_on;

            this.stt = require('./stt');

            var initParams = params;
            this.rtp.params = params;

            this.rtp.on("message", (msg, rinfo) => {
                if (!stream_on) {
                    this.emit('message', {
                        action: 'stream_on',
                        params: {
                            port: this.rtp.address().port,
                            rinfo: rinfo
                        }
                    });
                    stream_on = true;
                }
                var params = this.rtp.params.in;

                if (!(params.dtmf_detect || params.stt_detect || params.file || params.media_stream))
                    return;
                if (this.rec_type != params.rec) {
                    this.rec_type = params.rec;
                    if (this.rec_type == false) {
                        if (this.audio_stream_in)
                            this.audio_stream_in.end();
                        else {
                            this.emit('message', {
                                action: 'recOff',
                                params: {},
                                error: 'Record file not found'
                            });
                        }
                    }
                }

                var data = rtp_data(msg);

                if (data.type == params.dtmf_payload_type) {
                    if (params.dtmf_detect) {
                        if (dtmf_mode === 'inband') //auto change dtmf mode
                            change_flag = true;
                        if (!dtmf_mode || change_flag) {
                            dtmf_mode = 'rfc2833';
                            this.emit('message', {
                                action: 'set_dtmf_mode',
                                params: dtmf_mode
                            });
                        }
                        var dtmf = dtmf_data(data.source);
                        if (min_dtmf_dur === undefined || dtmf.duration <= min_dtmf_dur) {
                            if (!change_flag)
                                this.emit('message', {
                                    action: 'dtmf_key',
                                    params: {
                                        key: dtmf.event
                                    }
                                });
                            change_flag = false;
                            min_dtmf_dur = dtmf.duration;
                        }
                    }
                } else
                /*if (msg.length == (bufferSize + 12)) */

                if (data.type == this.audioPayload) {
                    if (params.media_stream) {
                        if (!payload)
                            payload = buf2array(data.source);
                        /*
                        this.emit('message', {
                            action: 'mediaStream',
                            params: {
                                sessionID: initParams.sessionID,
                                data: data.source
                            }
                        });
                        */
                    }

                    if (params.rec && params.file) {
                        if (!this.audio_stream_in) {
                            this.emit('message', params);
                            this.audio_stream_in = new this.wav.FileWriter(params.file + '.in', {
                                format: this.audioPayload ? 6 : 7, //7 pcmu, 6 pcma
                                channels: 1,
                                sampleRate: 8000,
                                bitDepth: 8
                            });
                            this.audio_stream_out = new this.wav.FileWriter(params.file + '.out', {
                                format: this.audioPayload ? 6 : 7, //7 pcmu, 6 pcma
                                channels: 1,
                                sampleRate: 8000,
                                bitDepth: 8
                            });

                            this.audio_stream_in.on("finish", () => {
                                this.emit('message', {
                                    action: 'recOff',
                                    params: {
                                        file: params.file
                                    }
                                });
                                //audio_stream.emit('end');
                                //audio_stream = null; //???
                            });
                            this.rec_start = process.hrtime(); //время старта входящего потока
                        }
                        if (!this.audio_stream_in.ending)
                            this.audio_stream_in.write(data.source);
                        this.emit('message', {
                            action: 'mediaStream',
                            params: {
                                sessionID: initParams.sessionID,
                                data: data.source
                            }
                        });
                    }
                    var payload;
                    if (params.stt_detect) {
                        var options = params.options && params.options.options;
                        if (options) {
                            if (!this.stt.isReady()) {
                                if (!this.stt.isConnecting()) {
                                    this.emit('message', { action: 'start_stt', params: options });
                                    this.stt.init(options,
                                        (error, params) => {
                                            //console.log(error, params);
                                            var res = {
                                                action: 'sttInit'
                                            };
                                            if (error)
                                                res.error = error;
                                            else {
                                                res.params = params;
                                            }
                                            this.emit('message', res);
                                            //console.log(res);
                                        });
                                }
                            } else {
                                payload = buf2array(data.source);
                                this.stt.send(payload);
                            }
                        }

                    };
                    if (params.dtmf_detect) {
                        if (dtmf_mode !== 'rfc2833') {
                            if (!payload)
                                payload = buf2array(data.source);
                            dtmf_decoder.filter(payload, (c) => {
                                if (!dtmf_mode) {
                                    dtmf_mode = 'inband';
                                    this.emit('message', {
                                        action: 'set_dtmf_mode',
                                        params: dtmf_mode
                                    });
                                }
                                if (c.key !== undefined) {
                                    this.emit('message', {
                                        action: 'dtmf_key',
                                        params: {
                                            key: c.key
                                        }
                                    });
                                    last_key = c.key;
                                };
                                if (c.seq !== undefined)
                                    this.emit('message', {
                                        action: 'dtmf_seq',
                                        params: {
                                            key: c.seq
                                        }
                                    });
                            });
                        }
                    }
                }
            });

            this.rtp.on("close", () => {
                var f = () => {
                    let toDo = () => {
                        if (cb)
                            cb();
                        //process.nextTick(process.exit());
                    };
                    var recFile = this.rtp.params.in.file;

                    if (fs.existsSync(recFile + '.in') &&
                        fs.existsSync(recFile + '.out')) {
                        var spawn = require('child_process').spawn,
                            //микшируем записи входящего и исходящего потока
                            // -m: все в один моно файл
                            // -M: стерео файл, левый канал - входящий поток, правый - исходящий
                            sox = spawn('sox', [this.rtp.params.in.type || '-m', recFile + '.in', recFile + '.out', recFile]);
                        sox.on('error', (e) => {
                            this.emit('message', 'pid:' + process.pid + ': ' + e.toString());
                            toDo();
                        });
                        sox.stdout.on('finish', () => {
                            //fs.unlinkSync(recFile + '.in');
                            //fs.unlinkSync(recFile + '.out');
                            toDo();
                        });
                    } else
                        toDo();
                };
                if (this.audio_stream_in) {
                    this.audio_stream_in.on("finish", () => {
                        if (this.audio_stream_out) {
                            this.audio_stream_out.on("finish", f);
                            this.audio_stream_out.end();
                            this.audio_stream_out.ending = true;
                        } else
                            f();
                    });
                    this.audio_stream_in.end();
                } else
                    f();
            });

            this.rtp_packet = new this.RtpPacket(new Buffer(1)); //send empty packet
            this.rtp_packet.time += 1;
            this.rtp_packet.seq++;
            this.rtp.send(this.rtp_packet.packet, 0, this.rtp_packet.packet.length, this.rtp.params.out.port, this.rtp.params.out.ip);
        }

        close() {
            if (this.rtp) {
                this.stop_flag = true;
                try {
                    this.rtp.close();
                } catch (err) {
                    console.log('rtp.js close error: ', err);
                }
            }
        };

        transcoding(buf) {
            if (this.fileCodec === 7 //pcmu
                &&
                this.audioPayload === 8) //pcma
            //u->a transcoding
            {
                for (var i = 0; i < buf.length; i++)
                    buf[i] = this.g711.ulaw2alaw(buf.readInt8(i));
            } else
            if (this.fileCodec === 6 //pcma
                &&
                this.audioPayload === 0) //pcmu
            //a->u transcoding
            {
                for (var i = 0; i < buf.length; i++)
                    buf[i] = this.g711.alaw2ulaw(buf.readInt8(i));
            }
            return buf;
        }

        start_play(params, cb) {
            if (params.file) {
                var files = params.file.split(";");
                params.file = files.shift();
            }

            var f = () => {
                if (this.rtp.params.in.rec &&
                    this.rtp.params.in.file &&
                    this.audio_stream_out &&
                    this.rtp_packet) {

                    var rec_end = process.hrtime(rec_start),
                        streamTimeout = rec_end[0] * 1000 + rec_end[1] / 1000000;

                    var silenceLen = (streamTimeout - (this.bufferSize / 8)).toFixed(); //ms

                    if (silenceLen > (this.bufferSize / 8)) { //прошло больше времени размера пакета
                        var silenceBuf = new Buffer(silenceLen * 8);
                        silenceBuf.fill(this.audioPayload ? 213 : 127); //тишина 127 - pcmu, 213 - pcma
                        if (!this.audio_stream_out.ending) {
                            this.audio_stream_out.write(silenceBuf);
                        }
                    }
                }
                var start,
                    i = 0,
                    contents,
                    buf,
                    bytesRead;
                if (params.file)
                    try {
                        contents = fs.readFileSync(params.file);
                        this.fileCodec = contents.readUInt16LE(20);
                        contents = new Buffer(contents.slice(wavDataOffset, contents.length - 1));
                    } catch (e_) {
                        console.log('rtp.js start_play error: ', e_);
                        return;
                    };
                this.stop_flag = false;
                if (!this.rtp)
                    return;
                var writeInterval = this.bufferSize / 8; //20, //20;//ms
                this.emit('message', { action: 'audioBuffer', params: { data: [bytesRead] } });
                var writeData = () => {
                    if (this.rtp.params.in.rec &&
                        this.rtp.params.in.file &&
                        this.audio_stream_out &&
                        this.rtp_packet && bytesRead) {
                        if (!this.audio_stream_out.ending) {
                            var _buf = new Buffer(buf.length);
                            this.rtp_packet.packet.copy(_buf, 0, 12);
                            this.audio_stream_out.write(_buf);
                        }
                        this.rec_start = process.hrtime();
                    }

                    bytesRead = 0;
                    buf.fill(this.audioPayload ? 213 : 127); //пакет заполняем тишиной );//тишина 127 - pcmu, 213 - pcma

                    if (params.file && (buf.length * i < contents.length)) {
                        bytesRead = buf.length * (i + 1) > contents.length ?
                            buf.length * (i + 1) - contents.length : buf.length;
                        contents.copy(buf, 0, buf.length * i, buf.length * i + bytesRead);
                    }
                    buf = this.transcoding(buf);

                    if (params.audioBuffer && this.audioBuffers[params.audioBuffer] && this.audioBuffers[params.audioBuffer].length > 0) {
                        //if (params.audioBuffer && this.audioBuffers[params.audioBuffer] && this.audioBuffers[params.audioBuffer].length >= buf.length) {
                        //console.log('this.audioBuffers[params.audioBuffer].length: ', this.audioBuffers[params.audioBuffer].length, ' buf.length: ', buf.length);

                        var bufferData = this.audioBuffers[params.audioBuffer].slice(0, buf.length);
                        buf = new Buffer(bufferData);
                        bytesRead = bufferData.length;
                        this.audioBuffers[params.audioBuffer] = this.audioBuffers[params.audioBuffer].slice(-1 * (this.audioBuffers[params.audioBuffer].length - bytesRead));
                    } else if (params.audioBuffer && this.audioBuffers[params.audioBuffer]) {
                        //console.log('!!! this.audioBuffers[params.audioBuffer].length: ', this.audioBuffers[params.audioBuffer].length, ' buf.length: ', buf.length);
                    }

                    if (!this.stop_flag && (bytesRead > 0 || params.always)) {
                        if (!this.rtp_packet)
                            this.rtp_packet = new this.RtpPacket(buf);
                        else
                            this.rtp_packet.payload = buf;
                        this.rtp_packet.type = this.audioPayload;
                        this.rtp_packet.time += buf.length;
                        this.rtp_packet.seq++;

                        if (!start)
                            start = Date.now();
                        i++;

                        let tFn = () => {
                            var timeOut = start + writeInterval * i;
                            var t_ = timeOut - Date.now();
                            if (t_ > 0)
                                setTimeout(tFn, 0);
                            else {
                                //if (t_)
                                //    console.log('delay', t_);
                                if (writeInterval + t_ < 0)
                                    writeData(); //skip packet
                                else {
                                    if (bytesRead)
                                        try {
                                            this.rtp.send(this.rtp_packet.packet, 0, this.rtp_packet.packet.length, this.rtp.params.out.port, this.rtp.params.out.ip, writeData);
                                        } catch (err) {
                                            console.log('rtp.js tFn error: ', err);
                                        }
                                    else
                                        writeData();
                                }
                            }
                        }
                        tFn();

                    } else {
                        if (!this.stop_flag && files && files.length) {
                            params.file = files.shift();
                            f();
                        } else {
                            if (!this.stop_flag && params.audioBuffer)
                                setTimeout(writeData, 0);
                            else
                                cb(this.stop_flag);
                            // dgram module automatically listens on the port even if we only wanted to send... -_-
                        }
                    }
                };
                buf = new Buffer(this.bufferSize);
                writeData();
            };
            f();
        }

        rec(params) {
            this.emit('message', 'rec params: ' + JSON.stringify(params));
            if (!this.rtp)
                return;
            for (var key in params)
                this.rtp.params.in[key] = params[key];
            if (params.stt_detect) {
                if (JSON.stringify(params) != JSON.stringify(lastSttOpt) &&
                    this.stt && this.stt.isReady())
                    this.stt.stop();
                lastSttOpt = params;
            }
        }
    }

    module.exports = Rtp;

} catch (err) {
    console.log('rtp error: ', err);
}