var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var browserify = require('browserify-middleware');

var api = require('./routes/api');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.get('/javascripts/index.js', browserify('./public/javascripts/index.js', { transform: [ [ "babelify", {presets: ["es2015", "react"]} ] ] }));
app.get('/javascripts/intercom.js', browserify('./public/javascripts/intercom.js', { transform: [ [ "babelify", {presets: ["es2015", "react"]} ] ] }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', api);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    console.log(err);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

app.ioStarted = function (io) {
  api.ioStarted(io);
};

module.exports = app;
