#!/usr/bin/env nodejs
/*
server.js file of the Server system for IOAA-2016 India

To run the server,
nodejs server.js

Copyright (c) 2016 Kumar Ayush, Sandesh Kalantre, Sharad Mirani, Alankar Kotwal

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in 
the Software without restriction, including without limitation the rights to use
, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of 
the Software, and to permit persons to whom the Software is furnished to do so, 
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all 
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

//load the required modules
var express = require('express')
  , app = express()
  , http = require('http')
  , MongoClient = require('mongodb').MongoClient
  , server = http.createServer(app)
  , multer  = require('multer')
  , serve_index = require('serve-index')
  , path = require("path")
  , fs = require("fs-extra")
  , log_timestamp = require('log-timestamp')(function() { return '[ ' + (new Date).toLocaleString() + ' ] %s'});
var io = require('socket.io').listen(server);


var ObjectID = require('mongodb').ObjectID;
//server running at port 8080
server.listen(8080);
console.log('Server running at http://127.0.0.1:8080/');

//tell node to send the required files when requested
//static files
app.get('/static/css/bootstrap.min.css', function(req,res){res.sendFile(__dirname+'/static/css/bootstrap.min.css');});
app.get('/static/css/simple-sidebar.css', function(req,res){res.sendFile(__dirname+'/static/css/simple-sidebar.css');});
app.get('/static/css/main.css', function(req,res){res.sendFile(__dirname+'/static/css/main.css');});
app.get('/static/js/jquery.min.js', function(req,res){res.sendFile(__dirname+'/static/js/jquery.min.js');});
app.get('/static/js/bootstrap.min.js', function(req,res){res.sendFile(__dirname+'/static/js/bootstrap.min.js');});
app.get('/static/js/knockout-2.2.0.js', function(req,res){res.sendFile(__dirname+'/static/js/knockout-2.2.0.js');});
app.get('/static/js/jquery.tablesorter.js', function(req,res){res.sendFile(__dirname+'/static/js/jquery.tablesorter.js');});
app.get('/static/js/Chart.min.js', function(req,res){res.sendFile(__dirname+'/static/js/Chart.min.js');});
app.get('/media/ioaa-logo.png', function(req,res){res.sendFile(__dirname+'/media/ioaa-logo.png');});
app.get('/media/favicon.ico', function(req,res){res.sendFile(__dirname+'/media/favicon.ico');});
app.get('/media/tifr-logo-s.png', function(req,res){res.sendFile(__dirname+'/media/tifr-logo-s.png');});
app.get('/static/fonts/glyphicons-halflings-regular.woff2', function(req,res){res.sendFile(__dirname+'/static/fonts/glyphicons-halflings-regular.woff2');});
app.get('/static/fonts/glyphicons-halflings-regular.woff', function(req,res){res.sendFile(__dirname+'/static/fonts/glyphicons-halflings-regular.woff');});
