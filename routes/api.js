var express = require('express');
var router = express.Router();
var PX700 = require('../PX700');
var merge = require('merge');

// Create serial connection.
var px = new PX700("COM3"); // TODO: use ENV variable for this
px.on('ready', function () {
  console.log("PX700 connection ready.");
});

var rooms = [
  { id: 1, name: "Living Room" },
  { id: 2, name: "Kitchen" },
  { id: 3, name: "Stella's Room" },
  { id: 4, name: "Master Bedroom" },
  { id: 5, name: "Joe's Room" }
];

function roomStatus(room, req, res, next) {
  px.getMainRoomStatus(room, function (err, status) {
    if (err) {
      next(err);
    } else {
      if (status.source == "off") {
        res.send(merge(true, rooms[room - 1], { source: "off" }));
      } else {
        res.send(merge(true, rooms[room - 1], status));
      }
    }
  });
}

router.get('/rooms', function(req, res, next) {
  res.send(rooms);
});

router.get('/rooms/:room', function(req, res, next) {
  var room = parseInt(req.params.room);
  roomStatus(room, req, res, next);
});

router.post('/rooms/:room/turn-off', function (req, res, next) {
  var room = parseInt(req.params.room);
  px.roomOff(room, function (err) {
    if (err) {
      next(err);
    } else {
      res.send(merge(true, rooms[room - 1], { source: "off" }));
    }
  });
});

router.post('/rooms/:room/tune', function (req, res, next) {
  var room = parseInt(req.params.room);
  var source = req.body.source;
  px.selectSource(room, source, function (err) {
    if (err) {
      next(err);
    } else {
      roomStatus(room, req, res, next);
    }
  });
});

router.post('/rooms/:room/volume', function (req, res, next) {
  var room = parseInt(req.params.room);
  var level = parseInt(req.body.level);
  px.setVolume(room, level, function (err) {
    if (err) {
      next(err);
    } else {
      roomStatus(room, req, res, next);
    }
  });
});

// Websocket
var wsConnections = [];
px.on('message', function (msg) {
  if (msg.deviceType != "keypad" || msg.command == "acknowledge") {
    return;
  }
  console.log("Sending to sockets " + wsConnections.length);
  wsConnections.forEach(function (socket) {
    socket.emit('dirty', msg.zone);
  });
});

router.ioStarted = function (io) {
  io.on('connection', function (socket) {
    wsConnections.push(socket);
  });
  io.on('disconnect', function (socket) {
    wsConnections.splice(wsConnections.indexOf(socket), 1);
  });
};


module.exports = router;
