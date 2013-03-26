var http = require('http'),
    XmlStream = require('xml-stream'),
    xml2js = require('xml2js').parseString,
    baseURL = "http://webservices.nextbus.com/service/publicXMLFeed?",
    agency = 'sf-muni';

exports.getVehicles = function (socket) {
  var that = this;
  that.socket = socket;
  that.getRoutes();
};

exports.processRouteLocations = function (data) {
  var that = this;
  //console.log(data);
  that.socket.emit("vehicle", data);
};

exports.getLocations = function (route) {
  var that = this;
  http.get(baseURL+"command=vehicleLocations&a="+agency+"&r="+route['$'].tag+"&t=0", function (response) {
    response.setEncoding('utf8');
    var buffer = "";
    response.on("data", function (chunk) { buffer+=chunk; });
    response.on("end", function () {
      xml2js(buffer, function (err, result) {
        that.processRouteLocations({route: route['$'], vehicles: result.body});
      });
    });
  });
};

exports.getRoutes = function () {
  console.log("transportApi::getRoutes");
  var that = this;
  http.get(baseURL+"command=routeList&a="+agency, function (response) {
    response.setEncoding('utf8');
    var buffer = "";
    response.on("data", function (chunk) { buffer+=chunk; });
    response.on("end", function () {
      xml2js(buffer, function (err, result) {
        for (var i = 0; i < result.body.route.length; i++) {
          that.getLocations(result.body.route[i]);
        }
      });
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