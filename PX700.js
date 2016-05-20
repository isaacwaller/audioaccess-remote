'use strict';

var SerialPort = require("serialport").SerialPort;
const EventEmitter = require('events');

// Indexed by device type
const CondiCommands = {
  0x01: { // 'keypad'
    "power-buttom-down": 0x10,
    "power-button-up": 0x11,
    "power-button-long": 0x12,
    "power-led-on": 0x32,
    "power-led-off": 0x33,
    "fm-and-power-led-on": 0x30,
    "all-leds-off": 0x31,
    "fm-button-down": 0x01,
    "fm-button-up": 0x02,
    "fm-button-long": 0x03,
    "fm-led-on": 0x21,
    "fm-led-off": 0x22,
    "cd-button-down": 0x04,
    "cd-button-up": 0x05,
    "cd-button-long": 0x06,
    "cd-led-on": 0x24,
    "cd-led-off": 0x25,
    "tape-button-down": 0x07,
    "tape-button-up": 0x08,
    "tape-button-long": 0x09,
    "tape-led-on": 0x27,
    "tape-led-off": 0x28,
    "aux-button-down": 0x0A,
    "aux-button-up": 0x0B,
    "aux-button-long": 0x0C,
    "aux-led-on": 0x2A,
    "aux-led-off": 0x2B,
    "vid-button-down": 0x0D,
    "vid-button-up": 0x0E,
    "vid-button-long": 0x0F,
    "vid-led-on": 0x2D,
    "vid-led-off": 0x2E,
    "volume-up": 0x71,
    "volume-down": 0xB1,
    "mute": 0xF1,

    "acknowledge": 0x38
  },
  0x04: { // 'computer'
   "room-on": 0x40,
   "room-off": 0x41,
   "room-all-on": 0x42,
   "room-all-off": 0x43,
   "mute-on": 0xF2,
   "mute-off": 0xF3,
   "select-tuner": 0x01,
   "select-next-tuner": 0x03,
   "select-cd": 0x04,
   "select-next-cd": 0x06,
   "select-tape": 0x07,
   "select-next-tape": 0x09,
   "select-aux": 0x0A,
   "select-next-aux": 0x0C,
   "select-video": 0x0D,
   "select-next-video": 0x0F,
   "select-page": 0x44,
   "main-room-status-request": 0x50,
   "main-room-status-response": 0x63,
   "set-main-room-level": 0x71,

   "acknowledge": 0x38
  }
};
const ComputerCommands = CondiCommands[0x04];

const CondiCommandNames = function (obj) {
  var new_obj = {};
  for (var device in obj) {
    if(obj.hasOwnProperty(device)) {
      var new_device = {};
      for (var byte in obj[device]) {
        if(obj[device].hasOwnProperty(byte)) {
          new_device[obj[device][byte]] = byte;
        }
      }
      new_obj[device] = new_device;
    }
  }
  return new_obj;
}(CondiCommands);

const CondiCommandDataLengths = {
  0x01: { // 'keypad'

  },
  0x04: { // 'computer'
    0x63: 4,
    0x71: 3,
    0x62: 3,
    0x70: 3
  }
};

const MESSAGE_SPACING = 50;
const ACK_TIMEOUT = 2000;

class PX700 extends EventEmitter {
  // Create new connection, do not use until you have received the 'ready'
  // event
  constructor(path) {
    super();
    var serialPort = new SerialPort(path, {
      baudrate: 9600,
      dataBits: 8,
      stopBits: 1,
      parity: 'none'
    });

    var self = this;
    var buffer = null;
    serialPort.on("open", function () {
      serialPort.on('data', function(data) {
        if (buffer == null) {
          buffer = data;
        } else {
          buffer = Buffer.concat([buffer, data]);
        }

        var bytesUsed = self.parseIncomingData(buffer);
        if (bytesUsed == -1) {
          // Clear buffer
          buffer = null;
        } else {
          buffer = new Buffer(buffer.slice(bytesUsed));
        }
      });

      self.emit('ready');
    });

    this.serialPort = serialPort;
  }

  parseIncomingData(buffer) {

    if (buffer.length < 6) {
      //console.log("Message too short (" + buffer.length + "), skipping message");
      return 0; // Still too short
    }
    if (buffer[0] != 0x7E) {
      console.log("Recieved bad preamble, skipping message");
      return -1;
    }

    var systemCode = buffer[1]; // Ignored for now
    var zoneCode = buffer[2];

    var zone = zoneCode & 7; // last 3 bits is zone code

    var deviceTypeByte = buffer[3], deviceType;
    switch (deviceTypeByte) {
    case 0x01:
      deviceType = 'keypad';
      break;
    case 0x04:
      deviceType = 'computer';
      break;
    case 0x06:
      deviceType = 'px-603';
      break;
    case 0x05:
    case 0x07:
      deviceType = 'reserved';
      break;
    default:
      deviceType = 'unknown (' + deviceTypeByte.toString(16) + ')';
      break;
    }

    var command = buffer[4];

    var data;
    var dataLength = 0;
    if (CondiCommandDataLengths[deviceTypeByte] && CondiCommandDataLengths[deviceTypeByte][command]) {
      dataLength = CondiCommandDataLengths[deviceTypeByte][command];
      if (buffer.length < (6 + dataLength)) {
        return 0; // Entire message not yet received
      }
      data = buffer.slice(5, 5 + dataLength);
    }

    var checksum = buffer[5 + dataLength];
    // TODO verify checksum

    var commandName = CondiCommandNames[deviceTypeByte] ? CondiCommandNames[deviceTypeByte][command] : null;
    if (!commandName) {
      commandName = 'unknown (' + command.toString(16) + ')';
    }

    var msg = {
      zone: zone,
      deviceType: deviceType,
      command: commandName
    };

    if (dataLength > 0) {
      msg.data = data;
    }

    this.emit('message', msg);
    this.emit(deviceType + '-message', msg);
    // Used for not sending messages while others are using the connection
    this.lastMessageReceiveTime = new Date();

    if (buffer.length > (6 + dataLength)) {
      // additional commands
      this.parseIncomingData(buffer.slice(6 + dataLength));
    }
    
    return 6 + dataLength;
  }

  // Lets you use EventEmitter.once with a timeout
  onceTimeout(event, timeout, callback) {
    var timer;
    var self = this;

    var handler = function () {
      var args = Array.prototype.slice.call(arguments);
      args.unshift(null); // 'err'
      var continueListening = callback.apply(this, args);
      
      if (!continueListening) {
        clearTimeout(timer);
        self.removeListener(event, handler);
      }
    };

    timer = setTimeout(function () {
      self.removeListener(event, handler);
      callback(new Error("Timed out"));
    }, timeout);

    self.on(event, handler);
  }

  // Only use after open
  sendString(hex, callback) {
    // From the CONDI manual:
    // Before beginning data transmission, the bus should be checked for inactivity.
    // If the bus is free, transmission may commense. If the bus is being used, wait for a period of inactivity.
    if ((new Date() - this.lastMessageReceiveTime) < MESSAGE_SPACING) {
      // Wait
      setTimeout(() => this.sendString(hex, callback), MESSAGE_SPACING);
      return;
    }
    this.serialPort.write(new Buffer(hex.replace(/ /g,'').toLowerCase(), "hex"), function(err) {
      callback(err);
    });
  }

  sendCommand(zone, command, data, callback, skipAck, deviceType) {
    // First, create command string
    var commandByte = ("0" + ComputerCommands[command].toString(16)).substr(-2);

    var deviceTypeByte;
    if (deviceType == 'keypad') {
      deviceTypeByte = "01";
    } else {
      deviceTypeByte = "04"; // computer
    }

    var string = "7E 10 0" + zone + " " + deviceTypeByte + " " + commandByte;
    if (data) {
      string += " ";
      string += data;
    }

    var checksum = -(string.split(' ').map(function (s) { return parseInt(s, 16); }).reduce((a, b) => a + b, 0) + 1) & 0xFF;
    var self = this;

    // Send command, then wait for echo and ACK
    this.sendString(string + checksum.toString(16), function (err) {
      var n = 0;
      self.onceTimeout('computer-message', ACK_TIMEOUT, function (err, msg) {
        if (err) {
          callback(err);
          return;
        }

        if (msg.command == command && msg.zone == zone) {
          // Good echo
          n++;
          if (n == 2 || skipAck) {
            callback();
          } else {
            // Wait for ACK / other message
          }
        } else {
          // continue listening
          return true;
        }
      });
      
      if (!skipAck) {
        self.onceTimeout('computer-message', ACK_TIMEOUT, function (err, msg) {
          if (err) {
            callback(err);
            return;
          }

          if (msg.command == 'acknowledge' && msg.zone == zone) {
            // Good ACK
            n++;
            if (n == 2) {
              callback();
            }
          } else {
            // continue listening
            return true;
          }
        });
       }
    });
  }

  muteOn(zone, callback) {
    this.sendCommand(zone, 'mute-on', null, callback);
  }

  muteOff(zone, callback) {
    this.sendCommand(zone, 'mute-off', null, callback);
  }

  roomOn(zone, callback) {
    this.sendCommand(zone, 'room-on', null, callback);
  }

  roomOff(zone, callback) {
    this.sendCommand(zone, 'room-off', null, callback);
  }

  // Set volume on a specific zone
  // level should be from 0 to 63
  // Unity gain is 53
  setVolume(zone, level, callback) {
    var levelByte = ("0" + level.toString(16)).substr(-2);
    this.sendCommand(zone, 'set-main-room-level', levelByte + " 07 07", function (err, results) {
      callback(err);
    });
  }

  selectSource(zone, source, callback) {
    this.sendCommand(zone, 'select-' + source, null, callback);
  }

  getMainRoomStatus(zone, callback) {
    var self = this;
    // Start listening before sending command in case they arrive out of order
    self.onceTimeout('computer-message', ACK_TIMEOUT, function (err, msg) {
      if (err) {
        callback(err);
        return;
      }

      if (msg.command != 'main-room-status-response' || msg.zone != zone) {
        return true; // Keep waiting
      } else {
        // Parse main room status response.
        var sourceByte = msg.data[0];
        var source;
        switch (sourceByte) {
        case 0x00:
          source = "off";
          break;
        case 0x01:
          source = "tuner";
          break;
        case 0x02:
          source = "cd";
          break;
        case 0x03:
          source = "tape";
          break;
        case 0x04:
          source = "aux";
          break;
        case 0x05:
          source = "video";
          break;
        case 0x06:
          source = "page";
          break;
        }

        callback(null, {
          source: source,
          volume: msg.data[1],
          bass: msg.data[2],
          treble: msg.data[3]
        });
      }
    });
    this.sendCommand(zone, 'main-room-status-request', null, function (err) {
      if (err) {
        callback(err);
      } else {
        // See above for callback
      }
    }, true); // Do not wait for ACK
  }
}

module.exports = PX700;
