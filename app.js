/**
 * Module dependencies.
 */

var express = require('express'),
  routes = require('./routes'),
  http = require('http'),
  path = require('path'),
  transportApi = require('./transportApi'),
  io = require("socket.io");

// Fire up express and configure
var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(require('less-middleware')({ src: __dirname + '/public' }));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

// Our one and only route
app.get('/', routes.index);

// Kick off the server
var server = http.createServer(app);

// Create a new instance of socket.IO
var socketIo = io.listen(server);

// Heroku doesn't support websockets :-(
socketIo.configure(function () {
  socketIo.set("transports", ["xhr-polling"]);
  socketIo.set("polling duration", 10);
  socketIo.set('log level', 1);
});

// Start listening for incoming connections
server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

// Start listening for socket events to fire off to our transportApi instance
socketIo.sockets.on('connection', function (socket) {
  transportApi.setup(socket);
  socket.on("findRoutes", function () {
    transportApi.getRoutes();
  });
  socket.on("findVehicles", function (data) {
    transportApi.getVehicles(data.routeTag);
  });
  socket.on("clearVehicles", function () {
    transportApi.clearVehicles();
  });
  socket.on("clearRoute", function (data) {
    transportApi.clearRoute(data.routeTag);
  });
});

