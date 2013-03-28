var http = require('http'),
    xml2js = require('xml2js').parseString,
    baseURL = "http://webservices.nextbus.com/service/publicXMLFeed?",
    agency = 'sf-muni';

/**
 * http GET a resouce and execute a callback passing the buffer.
 * @param  {String}   url      url to GET
 * @param  {Function} callback Callback to execute
 */
var getResource = function (url, callback) {
  http.get(url, function (response) {
    if (response) {
      response.setEncoding('utf8');
      var buffer = "";
      response.on("data", function (chunk) { buffer+=chunk; });
      response.on("end", function () {
        callback(buffer);
      });
    }
  }).on("error", function (error) {
    console.log("HTTP GET ERROR:", error);
  });
};

/**
 * Setup the socket variable here
 * @param  {Object} socket Socket.io object
 */
exports.setup = function (socket) {
  var that = this;
  that.socket = socket;
  that.intervals = {};
};

/**
 * Kick off process for getting the routes and vehicles
 * @param  {Object} socket Socket.io object
 */
exports.getVehicles = function (routeTag) {
  var that = this;
  if (routeTag === "all") {
    for (var i = 0; i < that.routes.length; i++) {
      that.getLocations(that.routes[i]); // Get vehicles for each route
    }
  } else {
    var theRoute = that.routes.filter(function (e, i, arr) {
      return e["$"].tag === routeTag;
    });
    if (theRoute.length === 1) that.getLocations(theRoute[0]);
  }
};

/**
 * Clear the intervals for all routes so that no more vehicle updates are sent
 */
exports.clearVehicles = function () {
  console.log("transportApi::clearVehicles");
  var that = this;
  for (var i in that.intervals) {
    clearInterval(that.intervals[i]);
  }
  that.socket.emit("vehiclesCleared");
};

/**
 * Sets an interval the gets the locations of all vehicles for a given route every 15 seconds and emits that data to the client
 * @param  {Object} route
 */
exports.getLocations = function (route) {
  var that = this;
  (function (route) {
    var f = function () {
      getResource(baseURL+"command=vehicleLocations&a="+agency+"&r="+route['$'].tag+"&t=0", function (buffer) {
        xml2js(buffer, function (err, result) {
          that.processRouteLocations({route: route['$'], vehicles: result.body});
        });
      });
    };
    f();
    that.intervals[route['$'].tag] = setInterval(f, 15000);
  })(route);
};

/**
 * Helper function for iterating over the vehicle locations and emiting them in turn to the client
 * @param  {Object} data The vehicle data
 */
exports.processRouteLocations = function (data) {
  var that = this;
  if (data.vehicles.vehicle) {
    for (var i = 0; i < data.vehicles.vehicle.length; i++) {
      that.socket.emit("vehicle", data.vehicles.vehicle[i]['$']);
    }
  }
};

/**
 * Gets the list of available routes from the API for the given agency (SF Municipal...)
 */
exports.getRoutes = function () {
  console.log("transportApi::getRoutes");
  var that = this;
  getResource(baseURL+"command=routeList&a="+agency, function (buffer) {
    xml2js(buffer, function (err, result) {
      that.socket.emit("routes", result.body.route);
      that.routes = result.body.route;
    });
  });
};

// var apiGetAgencys = function () {
//   http.get("http://webservices.nextbus.com/service/publicXMLFeed?command=agencyList", function (response) {
//     response.setEncoding('utf8');
//     var buffer = "";
//     response.on("data", function (chunk) {
//       buffer+=chunk;
//     });
//     response.on("end", function () {
//       xml2js(buffer, function (err, result) {
//         apiProcessAgencys(result.body.agency);
//       });
//     });

//     // var xml = new XmlStream(response);
//     // xml.on('data', function () {
//     //   console.log("data", arguments);
//     // });
//     // xml.on('end', function () {
//     //   console.log("end", arguments);
//     // });
//   });
// };

//apiGetAgencys();
