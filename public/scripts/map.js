/**
 * This is our map module that handles all logic and functionality for drawing our svg map with d3 and plotting our vehicle positions on it.
 */
define(["vehicle"], function (vehicle) {
  return (function () {

    var svg, mapG, projection, vehicles, vehiclesMap, path, colors = {}, routesHash = {}, LAYERS = [], $load = $("#load"), currentVehicles;

    var width = parseInt($(document).width(), 10),
    height = parseInt($(document).height(), 10),
    minArea = 1;

    /**
     * Fetch an array of JSON files from the server with a single callback
     * @param  {array}   urls     Files to GET
     * @param  {Function} callback Callback function accepting the returned data and the list of urls
     */
    var getJSONs = function (urls, callback) {
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
        callback(json, urls);
      });
    };

    /**
     * Scale and translate a projection based on the bounding box of some data and the path for displaying it.
     * @param  {Int}    width      Dimensions of the container to scale to
     * @param  {Int}    height     Dimensions of the container to scale to
     * @param  {Int}    scale      Multiplier for the calculated scale to fine tune projections
     * @param  {Object} data       GeoJSON data for bounding box
     * @param  {Object} path       The path based on the projection
     * @param  {Object} projection The projection to scale and translate
     * @return {Object}            The scaled projection
     */
    var scaleToData = function (width, height, scale, data, path, projection) {
      /**
       * The correct scale for a projection can be worked out by applying the following formula with bounding box 'b':
       * Math.max(cavasWidth/(b[1][0] - b[0][0]), canvasHeight/(b[1][1] - b[0][0]))
       * This works by comparing the dimensions of the bounding box to the dimensions of the canvas.
       *
       * The translation for the canvas works in a simlar way, first multiplying the bounding box by the scale and 
       * then using the canvas dimensions to position it.
       */
      var b = path.bounds(data);

      var s = scale*(height/(b[1][1] - b[0][1]));

      var t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];

      projection.scale(s).translate(t);

      return projection;
    };

    /**
     * Draw the main map using D3
     */
    var drawMapGeoJSON = function (json, urls) { // Ensure that SVG layers are drawn in the correct order
      this.mapJSON = json;
      this.mapURLS = urls;
      mapG = svg.append("g").attr("class", "map");
      $load.remove();
      for (var i = 0; i < urls.length; i++) {
        var data = json.filter(function (e) {
          return e.type === urls[i];
        });

        /**
         * If the data is for the neigborhoods SVG then use that to center and scale the projection.
         */
        if (urls[i] === 'neighborhoods') {
          projection = scaleToData(width, height, 0.95, data[0].data, path, projection);
        }

        var g = mapG.append("g").attr("class", data[0].type);
        g.selectAll("path")
          .data(data[0].data.features)
          .enter()
          .append("path")
          .attr({
            "d": path
          });
        LAYERS.push(g);
      }
    };

    /**
     * Draw the reference map in the corner with D3
     */
    var drawRefGeoJSON = function (json, urls) {
      var w = $("#ref").width();
      var h = $("#ref").height();

      var prj = d3.geo.albers().scale(1).translate([0,0]);
      var pth = d3.geo.path().projection(prj);
      var ref = d3.select("#ref")
                  .append('svg')
                  .attr({
                    "width": w,
                    "height": h
                  })
                  .append("g")
                  .attr("class", "ref");

      var sf_data = json.filter(function (e) {
        return e.type === 'sf_basic';
      })[0];
      prj = scaleToData(w, h, 0.018, sf_data.data, pth, prj);

      for (var i = 0; i < urls.length; i++) {
        var data = json.filter(function (e) {
          return e.type === urls[i];
        });
        ref.append("path")
        .datum(data[0].data)
        .attr({
          "d": pth,
          "class": data[0].type
        });
      }
    };

    /**
     * Plot an individual vehicle on the map notifying the vehicle object to create itself or update itself.
     */
    var plotVehicles = function (data) {

      // Create layer
      vehicles = vehicles || svg.append("g").attr("class", "vehicles");

      currentVehicles = vehicles.selectAll("g").data(data, function (d, i) {
        return d["$"]["id"];
      });

      currentVehicles.each(function (d, i) {
        this.vehicle.update(d);
      });

      currentVehicles.enter().append("g").each(function (d, i) {
        var v = new vehicle(d["$"], this, projection, colors[d["$"].routeTag]);
        v.create();
        this.vehicle = v;
      });

      currentVehicles.exit().each(function (d, i) {
        this.vehicle.destroy();
      });

      //var hash = routesHash[data.routeTag] = routesHash[data.routeTag] || {};

      //hash[data.id] = hash[data.id] || 

      // if (hash[data.id].el === null) {
      //   hash[data.id].create();
      // } else {
      //   hash[data.id].update(data);
      // }

    };

    /**
     * Wait for vehicles to be sent from the server.
     */
    var awaitVehicles = function () {
      socket.on('vehicles', function (data) {
        plotVehicles(data);
      });
    };

    return {

      /**
       * Build out the initial variables for the main map based on the container ID
       */
      build: function (id) {
        svg = d3.select(id).append("svg")
          .attr("width", width)
          .attr("height", height);
        projection = d3.geo.albers().scale(1).translate([0,0]);
        path = d3.geo.path().projection(projection);
        getJSONs(['california_basic', 'sf_basic'], drawRefGeoJSON);
        getJSONs(['neighborhoods', 'streets', 'arteries', 'freeways'], drawMapGeoJSON);
        awaitVehicles();
      },

      /**
       * Redscale the map incase of window resize (slightly buggy..)
       */
      redraw: function () {
        var w = parseInt($(document).width(), 10);
        var h = parseInt($(document).height(), 10);
        var scaleFactor = Math.max((w/width), (h/height));
        svg.attr({
          "width": w,
          "height": h
        });
        mapG.attr({
          "transform": "scale(" + scaleFactor + ")",
          "x": (w/2)*-1
        });
      },

      /**
       * Access method to provide the current routes to outside modules
       */
      getRoutesHash: function () {
        return routesHash;
      },

      /**
       * Clear an individual route from the server and map
       */
      clearRoute: function (routeTag, callback) {
        socket.emit("clearRoute", {routeTag: routeTag});
        socket.on("routeCleared", function (data) {
          for (var v in routesHash[routeTag]) {
            routesHash[routeTag][v].destroy();
          }
          callback();
        });
      },

      /**
       * Clear all routes from the map.
       */
      clearAllRoutes: function () {
        socket.emit("clearVehicles");
        socket.on("vehiclesCleared", function () {
          for (var r in routesHash) {
            for (var v in routesHash[r]) {
              routesHash[r][v].destroy();
            }
          }
        });
      },

      /**
       * Notify the server to start updating vehicles for a route
       */
      findVehicles: function (routeTag, color) {
        colors[routeTag] = color;
        socket.emit("findVehicles", {routeTag: routeTag});
      },

      /**
       * Turn a map layer on or off and execute a callback.
       */
      toggleLayer: function (layer, toggle, callback) {
        var $layer = $(LAYERS.filter(function (e) {
          return e.attr("class") === layer;
        })[0][0]);
        if (toggle) $layer.show();
        else $layer.hide();
        if (callback) callback(layer, toggle);
      }

    };
  })();
});
