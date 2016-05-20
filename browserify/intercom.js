var sip = require('sip.js');
var React = require('react');
var ReactDOM = require('react-dom');
var IntercomButton = require('./intercom-button');

var config = {
  // Replace this IP address with your Asterisk IP address
  uri: 'webrtc@192.168.1.12',

  // Replace this IP address with your Asterisk IP address,
  // and replace the port with your Asterisk port from the http.conf file
  ws_servers: 'ws://192.168.1.12:8088/ws',
  authorizationUser: 'webrtc',
  password: 'webrtc',
  iceCheckingTimeout: 1000
};

var ua = new sip.UA(config);
var session = null;
var err = null;

function call() {
  state = 'calling';
  err = null;
  renderDisplay();
  session = ua.invite('sip:100@wallerfamily.name',{
    media: {
      constraints: {
        audio: true,
        video: false
      }
    }
  });
  session.on('accepted', function () {
    state = 'in-call';
    err = null;
    renderDisplay();
  });
  session.on('terminated', function (message, cause) {
    err = cause;
    state = 'connected';
    renderDisplay();
  });
}

function hangup() {
  session.bye();
  session = null;
  state = 'connected';
  err = null;
  renderDisplay();
}

var button = null;
var state = 'connecting';
function renderDisplay() {
  button = ReactDOM.render(<IntercomButton state={state} oncall={call} onhangup={hangup} err={err} />, document.getElementById('button'));
}
renderDisplay();

ua.on('connecting', function () {
  state = 'connecting';
  err = null;
  renderDisplay();
});

ua.on('connected', function () {
  state = 'connected';
  err = null;
  renderDisplay();
});
