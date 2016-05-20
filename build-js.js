var fs = require("fs");
var browserify = require("browserify");
browserify("browserify/index.js")
  .transform("babelify", {presets: ["es2015", "react"]})
  .bundle()
  .pipe(fs.createWriteStream("public/javascripts/index.js"));
browserify("browserify/intercom.js")
  .transform("babelify", {presets: ["es2015", "react"]})
  .bundle()
  .pipe(fs.createWriteStream("public/javascripts/intercom.js"));