var React = require('react');
var ReactDOM = require('react-dom');
var request = require('browser-request');
var async = require('async');

var RoomsDisplay = require('./roomsdisplay');

function onSourceSelected(roomId) {
  return function (source) {
    makeTuneRequest(roomId, source);
  };
}
function onVolumeChange(roomId) {
  return function (level) {
    makeVolumeRequest(roomId, level);
  }
}

function onSourceForAllSelected(source) {
  var spacing = 200;
  async.eachSeries(rooms, function (room, callback) {
    makeTuneRequest(room.id, source, function () {
      setTimeout(callback, spacing);
    });
  }, function done() {
    console.log("Done tuning all to " + source);
  });
}

var volumeAllChangeInProgress = false;
var volumeAllChangeLevel;

function onVolumeChangeForAll(level) {
  if (volumeAllChangeInProgress) {
    volumeAllChangeLevel = level;
    return;
  }
  volumeAllChangeInProgress = true;
  
  var spacing = 150;
  async.eachSeries(rooms, function (room, callback) {
    makeVolumeRequest(room.id, level, function () {
      setTimeout(callback, spacing);
    }, true); // force
  }, function done() {
    console.log("Done changing volume for all");
    
    volumeAllChangeInProgress = false;
    var newLevel = volumeAllChangeLevel;
    if (newLevel) {
      volumeAllChangeLevel = null;
      onVolumeChangeForAll(newLevel);
    }
  });
}

// connecting - making initial requests
// connected - connected ws
var connectionState = "connecting";
var rooms = [
  { id: 1, name: "Living Room" },
  { id: 2, name: "Kitchen" },
  { id: 3, name: "Master Bedroom" },
  { id: 4, name: "Stella's Room" },
  { id: 5, name: "Joe's Room" }
];
var roomsdisplay = null;
function renderDisplay() {
  roomsdisplay = ReactDOM.render(<RoomsDisplay rooms={rooms}
    onSourceSelected={onSourceSelected}
    onSourceForAllSelected={onSourceForAllSelected}
    onVolumeChange={onVolumeChange}
    onVolumeChangeForAll={onVolumeChangeForAll} />, document.getElementById('roomsdisplay'));
}
renderDisplay();

// initial requests
function updateAllData() {
  async.eachSeries(rooms, function (room, callback) {
    updateRoomData(room.id, callback);
  }, function done() {
    connectionState = "connected"; // Start listening for 'dirty' messages
  });
}
function updateRoomData(roomId, callback) {
  request({ url: '/api/rooms/' + roomId, json: true }, function (err, response) {
    if (err) {
      // TODO show error
      return;
    }

    rooms[roomId - 1] = response.body;
    renderDisplay();
    if (callback) {
      callback();
    }
  });
}
function makeTuneRequest(roomId, source, callback) {
  var params = { method: "POST", json: true };
  if (source == "off") {
    params.url = '/api/rooms/' + roomId + '/turn-off';
    params.body = {};
  } else {
    params.url = '/api/rooms/' + roomId + '/tune';
    params.body = { source: source };
  }
  request(params, function (err, response) {
    if (err) {
      // TODO show error
      return;
    }

    rooms[roomId - 1] = response.body;
    renderDisplay();
    if (callback) {
      callback();
    }
  });
}

var inProgressVolumeRequests = {};
var latestVolumeRequests = {};

function makeVolumeRequest(roomId, level, callback, force) {
  if (inProgressVolumeRequests[roomId] && !force) {
    latestVolumeRequests[roomId] = level;
    callback();
    return;
  }
  inProgressVolumeRequests[roomId] = true;
  
  var params = { method: "POST", json: true, url: '/api/rooms/' + roomId + '/volume', body: { level: level } };
  request(params, function (err, response) {
    if (err) {
      // TODO show error
      console.log(err);
      return;
    }

    var newVolRequest = latestVolumeRequests[roomId];
    if (newVolRequest) {
      latestVolumeRequests[roomId] = null;
      makeVolumeRequest(roomId, newVolRequest, callback, true);
      return;
    }
    inProgressVolumeRequests[roomId] = false;
  
    if (callback) {
      callback();
    }
  });
}
updateAllData();

// websocket
var socket = io('http://192.168.1.105:3000');
socket.on('dirty', function (roomId) {
  if (connectionState == "connected") {
    // refresh the given room
    updateRoomData(roomId);
  }
});
socket.on('data-push', function (roomId, body) {
  if (connectionState == "connected") {
    // got new data, update
    rooms[roomId - 1] = body;
    renderDisplay();
  }
});
