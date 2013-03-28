
/**
 * Module dependencies.
 */

var express = require('express'),
  routes = require('./routes'),
  http = require('http'),
  path = require('path'),
  transportApi = require('./transportApi'),
  io = require("socket.io");

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

app.get('/', routes.index);

var server = http.createServer(app);

// Create a new instance of socket.IO
var socketIo = io.listen(server);

// socketIo.configure(function () {
//   socketIo.set("transports", ["xhr-polling"]);
//   socketIo.set("polling duration", 10);
//   socketIo.set('log level', 1);
// });

server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

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
});

