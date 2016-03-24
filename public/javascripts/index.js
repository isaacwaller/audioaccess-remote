var React = require('react');
var ReactDOM = require('react-dom');
var request = require('browser-request');
var async = require('async');

var RoomsDisplay = require('./roomsdisplay');

// connecting - making initial requests
// connected - connected ws
var connectionState = "connecting";
var rooms = [
  { id: 1, name: "Living Room" },
  { id: 2, name: "Kitchen" },
  { id: 3, name: "Stella's Room" },
  { id: 4, name: "Master Bedroom" },
  { id: 5, name: "Joe's Room" }
];
var roomsdisplay = null;
function renderDisplay() {
  roomsdisplay = ReactDOM.render(<RoomsDisplay rooms={rooms} />, document.getElementById('roomsdisplay'));
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
updateAllData();

// websocket
var socket = io('http://localhost:3000');
socket.on('dirty', function (roomId) {
  if (connectionState == "connected") {
    // refresh the given room
    updateRoomData(roomId);
  }
});
