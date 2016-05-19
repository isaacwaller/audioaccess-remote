var express = require('express');
var router = express.Router();
var PX700 = require('../PX700');
var merge = require('merge');
var async = require('async');

// Create serial connection.
var px = new PX700("COM3"); // TODO: use ENV variable for this
px.on('ready', function () {
  console.log("PX700 connection ready.");
});
// Basic locking mechanism for serial connection
var pxInUse = false;
var waitingForPx = [];
function pxTransaction(func) {
  if (pxInUse) {
    waitingForPx.push(func);
  } else {
    pxInUse = true;
    func(function () {
      // done with PX
      pxInUse = false;
      if (waitingForPx.length != 0) {
        var next = waitingForPx.shift();
        pxTransaction(next);
      }
    });
  }
}

var rooms = [
  { id: 1, name: "Living Room" },
  { id: 2, name: "Kitchen" },
  { id: 3, name: "Master Bedroom" },
  { id: 4, name: "Stella's Room" },
  { id: 5, name: "Joe's Room" }
];

// Websocket
var wsConnections = [];
px.on('message', function (msg) {
  console.log(msg.deviceType + ": " + msg.command);
  if (msg.deviceType != "keypad" || msg.command == "acknowledge") {
    return;
  }
  if (msg.command.endsWith("-led-on") && msg.command != "power-led-on") {
    // -led-on is all you need to know someone changed source from the keypad
    var source = msg.command.substring(0, msg.command.length - "-led-on".length);
    if (source == "fm") {
      source = "tuner";
    } else if (source == "vid") {
      source = "video";
    }
    var room = msg.zone;
    console.log("Received keypad tune to '" + source + "'; sending to sockets " + wsConnections.length);
    wsConnections.forEach(function (socket) {
      socket.emit('data-push', room, merge(true, rooms[room - 1], { source: source }));
    });
  } else if (msg.command == "all-leds-off") {
    // It's being turned off
    var room = msg.zone;
    wsConnections.forEach(function (socket) {
      socket.emit('data-push', room, merge(true, rooms[room - 1], { source: "off" }));
    });
  }
});

router.ioStarted = function (io) {
  io.on('connection', function (socket) {
    wsConnections.push(socket);
  });
  io.on('disconnect', function (socket) {
    wsConnections = wsConnections.splice(wsConnections.indexOf(socket), 1);
  });
};

// Make sure to lock px yourself
function roomStatus(room, callback) {
  px.getMainRoomStatus(room, function (err, status) {
    if (err) {
      callback(err);
    } else {
      if (status.source == "off") {
        callback(null, merge(true, rooms[room - 1], { source: "off" }));
      } else {
        callback(null, merge(true, rooms[room - 1], status));
      }
    }
  });
}

router.get('/rooms', function(req, res, next) {
  res.send(rooms);
});

router.get('/rooms/:room', function(req, res, next) {
  var room = parseInt(req.params.room);
  pxTransaction(function (close) {
    roomStatus(room, function (err, status) {
      if (err) {
        next(err);
      } else {
        res.send(status);
      }
    });
    close();
  });
});

router.post('/rooms/:room/turn-off', function (req, res, next) {
  var room = parseInt(req.params.room);
  pxTransaction(function (close) {
    px.roomOff(room, function (err) {
      close();
      if (err) {
        next(err);
      } else {
        newData = merge(true, rooms[room - 1], { source: "off" });
        res.send(newData);
      }
    });
  });
});

router.post('/rooms/:room/tune', function (req, res, next) {
  var room = parseInt(req.params.room);
  var source = req.body.source;
  pxTransaction(function (close) {
    px.selectSource(room, source, function (err) {
      close();
      if (err) {
        next(err);
      } else {
        newData = merge(true, rooms[room - 1], { source: source });
        res.send(newData);
      }
    });
  });
});

router.post('/rooms/:room/volume', function (req, res, next) {
  var room = parseInt(req.params.room);
  var level = parseInt(req.body.level);
  pxTransaction(function (close) {
    px.setVolume(room, level, function (err) {
      close();
      if (err) {
        next(err);
      } else {
        res.send({}); // 200 OK
      }
    });
  });
});


module.exports = router;
