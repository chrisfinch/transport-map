/**
 * This is our map module that handles all logic and functionality for drawing our svg map with d3 and plotting our vehicle positions on it.
 */
define(["vehicle"], function (vehicle) {
  return (function () {

    var svg, projection, vehicles, vehiclesMap, path, colors = {}, routesHash = {};

    var width = parseInt($(document).width(), 10),
    height = parseInt($(document).height(), 10),
    minArea = 1;

    var getGeoJSON = function () {
      var urls = ['neighborhoods', 'streets', 'arteries', 'freeways'];
      var jxhr = [];
      var json = [];
      $.each(urls, function (i, url) {
        jxhr.push(
          $.getJSON("/data/"+url+".json", function (data) {
            json.push({data: data, type: url});
          })
          );
      });
      $.when.apply($, jxhr).done(function() {
        drawGeoJSON(json, urls);
      });
    };

    var drawGeoJSON = function (json, urls) { // Ensure that SVG layers are drawn in the correct order
      for (var i = 0; i < urls.length; i++) {
        var data = json.filter(function (e) {
          return e.type === urls[i];
        });

        /**
         * If the data is for the neigborhoods SVG then use that to center and scale the projection.
         */
        if (urls[i] === 'neighborhoods') {
          /**
           * The correct scale for a projection can be worked out by applying the following formula with bounding box 'b':
           * Math.max(cavasWidth/(b[1][0] - b[0][0]), canvasHeight/(b[1][1] - b[0][0]))
           * This works by comparing the dimensions of the bounding box to the dimensions of the canvas.
           *
           * The translation for the canvas works in a simlar way, first multiplying the bounding box by the scale and 
           * then using the canvas dimensions to position it.
           */
          var b = path.bounds(data[0].data),
          s = 0.95*(height/(b[1][1] - b[0][1])),
          t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];
          projection.scale(s).translate(t);
        }

        var g = svg.append("g").attr("class", data[0].type);
        g.selectAll("path")
        .data(data[0].data.features)
        .enter()
        .append("path")
        .attr({
          "d": path
        });
      }
    };

    var plotVehicle = function (data) {
      vehicles = vehicles || svg.append("g").attr("class", "vehicles");
      var hash = routesHash[data.routeTag] = routesHash[data.routeTag] || {};
      hash[data.id] = hash[data.id] || new vehicle(data, vehicles, projection, colors[data.routeTag]);

      if (hash[data.id].el === null) {
        hash[data.id].create();
      } else {
        hash[data.id].update(data);
      }

    };

    var awaitVehicles = function () {
      socket.on('vehicle', function (data) {
        plotVehicle(data);
      });
    };

    return {
      build: function (id) {
        svg = d3.select(id).append("svg")
          .attr("width", width)
          .attr("height", height);
        projection = d3.geo.albers().scale(1).translate([0,0]);
        path = d3.geo.path().projection(projection);
        this.draw();
        awaitVehicles();
      },
      draw: function () {
        $.getJSON("/data/california_basic.json", function (data) {
          //var sf_county = data.features[1545];
          // Compute the bounds of a feature of interest, then derive scale & translate.
          // var b = path.bounds(sf_county),
          // s = (0.95 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][0]) / height)),
          // t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];
          // projection.scale(s).translate(t);
          var prj = d3.geo.albers().scale(1).translate([0,0]);
          var pth = d3.geo.path().projection(prj);
          var ca = d3.select("#ref").append('svg').append("g").attr("class", "ca");

          var w = $("#ref").width();
          var h = $("#ref").height();

          var b = pth.bounds(data),
          s = 0.95*(h/(b[1][1] - b[0][1])),
          t = [(w - s * (b[1][0] + b[0][0])) / 2, (h - s * (b[1][1] + b[0][1])) / 2];
          prj.scale(s).translate(t);

          ca.append("path")
          .datum(data)
          .attr({
            "d": pth,
            "class": function (d) {
              return "class";
            }
          });


        });
        getGeoJSON();        
      },
      getRoutesHash: function () {
        return routesHash;
      },
      clearAllVehicles: function () {
        socket.emit("clearVehicles");
        socket.on("vehiclesCleared", function () {
          for (var r in routesHash) {
            for (var v in routesHash[r]) {
              routesHash[r][v].destroy();
            }
          }
        });
      },
      findVehicles: function (routeTag, color) {
        colors[routeTag] = color;
        socket.emit("findVehicles", {routeTag: routeTag});
      }
    }; // map
  })();
});
