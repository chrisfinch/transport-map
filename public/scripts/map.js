define(["vehicle"], function (vehicle) {
  return (function () {

    var svg, projection, vehicles, vehiclesMap, path, colors = {};

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
        var g = svg.append("g").attr("class", data[0].type);
        g.selectAll("path")
        .data(data[0].data.features)
        .enter()
        .append("path")
        .attr({
          "d": path
        });
      } // !for
    }; // !draw

    var plotVehicle = function (data) {
      vehicles = vehicles || svg.append("g").attr("class", "vehicles");
      vehiclesMap = vehiclesMap || {};
      vehiclesMap[data.id] = vehiclesMap[data.id] || new vehicle(data, vehicles, projection, colors[data.routeTag]);

      if (vehiclesMap[data.id].el === null) {
        vehiclesMap[data.id].create();
      } else {
        vehiclesMap[data.id].update(data);
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
        $.getJSON("/data/us_counties.json", function (data) {
          var sf_county = data.features[1545];
          // Compute the bounds of a feature of interest, then derive scale & translate.
          var b = path.bounds(sf_county),
          s = (0.95 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][0]) / height))*150,
          t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];
          projection.scale(s).translate(t);

          var ca = svg.append("g").attr("class", "ca");

          ca.append("path")
          .datum(data)
          .attr({
            "d": path,
            "class": function (d) {
              return "class";
            }
          });

          getGeoJSON();
        });
      },
      getVehicles: function () {
        return vehiclesMap;
      },
      clearVehicles: function () {
        socket.emit("clearVehicles");
        socket.on("vehiclesCleared", function () {
          for (var v in vehiclesMap) {
            vehiclesMap[v].destroy();
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
