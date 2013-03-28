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
    that.intervals[route] = setInterval(f, 15000);
  })(route);
};

exports.processRouteLocations = function (data) {
  var that = this;
  if (data.vehicles.vehicle) {
    for (var i = 0; i < data.vehicles.vehicle.length; i++) {
      that.socket.emit("vehicle", data.vehicles.vehicle[i]['$']);
    }
  }
};

exports.getRoutes = function () {
  console.log("transportApi::getRoutes");
  var that = this;

  var temp = [{"$":{"tag":"F","title":"F-Market & Wharves"}},{"$":{"tag":"J","title":"J-Church"}},{"$":{"tag":"KT","title":"KT-Ingleside/Third Street"}},{"$":{"tag":"L","title":"L-Taraval"}},{"$":{"tag":"M","title":"M-Ocean View"}},{"$":{"tag":"N","title":"N-Judah"}},{"$":{"tag":"NX","title":"NX-N Express"}},{"$":{"tag":"1","title":"1-California"}},{"$":{"tag":"1AX","title":"1AX-California A Express"}},{"$":{"tag":"1BX","title":"1BX-California B Express"}},{"$":{"tag":"2","title":"2-Clement"}},{"$":{"tag":"3","title":"3-Jackson"}},{"$":{"tag":"5","title":"5-Fulton"}},{"$":{"tag":"6","title":"6-Parnassus"}},{"$":{"tag":"8X","title":"8X-Bayshore Exp"}},{"$":{"tag":"8AX","title":"8AX-Bayshore A Exp"}},{"$":{"tag":"8BX","title":"8BX-Bayshore B Exp"}},{"$":{"tag":"9","title":"9-San Bruno"}},{"$":{"tag":"9L","title":"9L-San Bruno Limited"}},{"$":{"tag":"10","title":"10-Townsend"}},{"$":{"tag":"12","title":"12-Folsom/Pacific"}},{"$":{"tag":"14","title":"14-Mission"}},{"$":{"tag":"14L","title":"14L-Mission Limited"}},{"$":{"tag":"14X","title":"14X-Mission Express"}},{"$":{"tag":"16X","title":"16X-Noriega Express"}},{"$":{"tag":"17","title":"17-Park Merced"}},{"$":{"tag":"18","title":"18-46th Avenue"}},{"$":{"tag":"19","title":"19-Polk"}},{"$":{"tag":"21","title":"21-Hayes"}},{"$":{"tag":"22","title":"22-Fillmore"}},{"$":{"tag":"23","title":"23-Monterey"}},{"$":{"tag":"24","title":"24-Divisadero"}},{"$":{"tag":"27","title":"27-Bryant"}},{"$":{"tag":"28","title":"28-19th Avenue"}},{"$":{"tag":"29","title":"29-Sunset"}},{"$":{"tag":"30","title":"30-Stockton"}},{"$":{"tag":"30X","title":"30X-Marina Express"}},{"$":{"tag":"31","title":"31-Balboa"}},{"$":{"tag":"31AX","title":"31AX-Balboa A Express"}},{"$":{"tag":"31BX","title":"31BX-Balboa B Express"}},{"$":{"tag":"33","title":"33-Stanyan"}},{"$":{"tag":"35","title":"35-Eureka"}},{"$":{"tag":"36","title":"36-Teresita"}},{"$":{"tag":"37","title":"37-Corbett"}},{"$":{"tag":"38","title":"38-Geary"}},{"$":{"tag":"38AX","title":"38AX-Geary A Express"}},{"$":{"tag":"38BX","title":"38BX-Geary B Express"}},{"$":{"tag":"38L","title":"38L-Geary Limited"}},{"$":{"tag":"39","title":"39-Coit"}},{"$":{"tag":"41","title":"41-Union"}},{"$":{"tag":"43","title":"43-Masonic"}},{"$":{"tag":"44","title":"44-OShaughnessy"}},{"$":{"tag":"45","title":"45-Union/Stockton"}},{"$":{"tag":"47","title":"47-Van Ness"}},{"$":{"tag":"48","title":"48-Quintara - 24th Street"}},{"$":{"tag":"49","title":"49-Mission-Van Ness"}},{"$":{"tag":"52","title":"52-Excelsior"}},{"$":{"tag":"54","title":"54-Felton"}},{"$":{"tag":"56","title":"56-Rutland"}},{"$":{"tag":"66","title":"66-Quintara"}},{"$":{"tag":"67","title":"67-Bernal Heights"}},{"$":{"tag":"71","title":"71-Haight-Noriega"}},{"$":{"tag":"71L","title":"71L-Haight-Noriega Limited"}},{"$":{"tag":"76","title":"76-Marin Headlands"}},{"$":{"tag":"81X","title":"81X-Caltrain Express"}},{"$":{"tag":"82X","title":"82X-Levi Plaza Express"}},{"$":{"tag":"83X","title":"83X-Caltrain"}},{"$":{"tag":"88","title":"88-B.A.R.T. Shuttle"}},{"$":{"tag":"90","title":"90-San Bruno Owl"}},{"$":{"tag":"91","title":"91-Owl"}},{"$":{"tag":"108","title":"108-Treasure Island"}},{"$":{"tag":"K OWL","title":"K-Owl"}},{"$":{"tag":"L OWL","title":"L-Owl"}},{"$":{"tag":"M OWL","title":"M-Owl"}},{"$":{"tag":"N OWL","title":"N-Owl"}},{"$":{"tag":"T OWL","title":"T-Owl"}},{"$":{"tag":"59","title":"Powell/Mason Cable Car"}},{"$":{"tag":"60","title":"Powell/Hyde Cable Car"}},{"$":{"tag":"61","title":"California Cable Car"}}];
  that.socket.emit("routes", temp);
  // getResource(baseURL+"command=routeList&a="+agency, function (buffer) {
  //   xml2js(buffer, function (err, result) {
  //     that.socket.emit("routes", result.body.route);
  //     that.routes = result.body.route;
  //   });
  // });
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
