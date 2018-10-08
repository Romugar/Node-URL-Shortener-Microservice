"use strict";

var express = require("express");
var mongo = require("mongodb");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var dns = require("dns");
var Schema = mongoose.Schema;

mongoose.connect(process.env.MONGO_URI);

var cors = require("cors");

var app = express();

// Basic Configuration
var port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));

/** this project needs a db !! **/

// mongoose.connect(process.env.MONGOLAB_URI);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", function(req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// your first API endpoint...
app.get("/api/hello", function(req, res) {
  res.json({ greeting: "hello API" });
});

// URL shortener

var urlSchema = new Schema({
  url: String,
  shortUrl: Number
});

var urlModel = mongoose.model("urlModel", urlSchema);

var createAndSaveUrl = function(url, shortUrl, done) {
  var newUrl = new urlModel({
    url: url,
    shortUrl: shortUrl
  });
  newUrl.save((err, data) => {
    if (err) done(err);
  });
};

function findByShortUrl(shortUrl, callback) {
  urlModel.find({ shortUrl: shortUrl }, function(err, data) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, data[0]);
    }
  });
}

findByShortUrl(2728, function(err, data) {
  if (err) {
    console.log(err);
  }
  if (data !== undefined) {
    console.log(data);
  }
});

var hash = string => {
  var hash = 0;
  for (var i = 0; i < string.length; i++) {
    hash += string.charCodeAt(i);
  }
  return hash;
};

app.post("/api/shorturl/new", function(req, res) {
  var url = req.body.url;
  var parsedUrl = url.match(/([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/g);
  if (parsedUrl === null) {
    parsedUrl = "error";
  }
  dns.lookup(parsedUrl[0], function(err) {
    if (err) {
      res.json({ error: "invalid URL" });
    } else {
      findByShortUrl(hash(req.body.url), function(err, data) {
        if (err) {
          console.log(err);
        }
        if (data === undefined) {
          res.json({
            original_url: req.body.url,
            short_url: hash(req.body.url)
          });
          createAndSaveUrl(req.body.url, hash(req.body.url));
        } else {
          res.json({
            error: "shortUrl already created",
            original_url: req.body.url,
            short_url: hash(req.body.url)
          });
        }
      });
    }
  });
});

app.get("/api/shorturl/:shortUrl", function(req, res) {
  findByShortUrl(req.params.shortUrl, function(err, data) {
    if (err) {
      console.log(err);
    }
    if (data === undefined) {
      res.json({ error: "The shortUrl doesn't exist" });
    } else {
      console.log(data);
      res.writeHead(301, { Location: data.url });
      res.end();
    }
  });
});

app.listen(port, function() {
  console.log("Node.js listening ...");
});