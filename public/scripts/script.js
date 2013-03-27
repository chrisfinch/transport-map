$(function() {

  var socket = io.connect('http://localhost');

  var width = parseInt($(document).width(), 10),
  height = parseInt($(document).height(), 10),
  minArea = 1;

  var svg = d3.select("#map").append("svg")
  .attr("width", width)
  .attr("height", height);

  var area = d3.select("#area");

  var vehicles;
  var vehiclesMap = {};

  var projection = d3.geo.albers().scale(1).translate([0,0]);

  var path = d3.geo.path()
    .projection(projection);



    $.getJSON("/data/us_counties.json", function (data) {

      var sf_county = data.features[1545];

      // Compute the bounds of a feature of interest, then derive scale & translate.
      var b = path.bounds(sf_county),
      s = (0.95 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][0]) / height))*400,
      t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];
      projection.scale(s).translate(t);

      // var ca = svg.append("g").attr("class", "ca");

      // ca.append("path")
    //   .datum(data)
    //   .attr({
      //  "d": path,
      //  "class": function (d) {
      //    return "class"
      //  }
      // });

      // ca.selectAll("path")
      //  .data(data.features)
      //  .enter()
      //  .append("path")
      //  .attr({
     //     "d": path,
     //     "class": function (d) {
     //       return d.properties.NAME
     //     }
     //   });

    getSF();
  });

    var getSF = function () {
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
        draw(json, urls);
      });
    };

    var draw = function (json, urls) { // Ensure that SVG layers are drawn in the correct order
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

      socket.on('vehicle', function (data) {
        plotVehicle(data);
      });

    }; // !draw

    var plotVehicle = function (data) {
      vehicles = vehicles || svg.append("g").attr("class", "vehicles");
      
      vehiclesMap[data.id] = vehiclesMap[data.id] || new vehicle(data);

      if (vehiclesMap[data.id].el === null) {
        vehiclesMap[data.id].create();
      } else {
        vehiclesMap[data.id].update(data);
      }
      
    };

    var vehicle = function (data) {

      var that = this;

      that.data = data;

      that.node = null;

      that.el = null;

      that.create = function () {
        that.node = vehicles.append("g");
        that.el = that.node.append("circle")
                  .datum(data)
                  .attr({
                    "cx": function(d) {
                      return projection([d.lon, d.lat])[0];
                    },
                    "cy": function(d) {
                      return projection([d.lon, d.lat])[1];
                    },
                    class: "vehicle",
                    r: 5
                  });

        that.label = that.node.append("text")
                      .datum(data)
                      .attr({
                        "x": function(d) {
                          return projection([d.lon, d.lat])[0];
                        },
                        "y": function(d) {
                          return projection([d.lon, d.lat])[1];
                        },
                        class: "label"
                      })
                      .text("Vehicle '"+data.id+"'' on Route '"+data.routeTag+"'.")
                      .style("display", "none");
        
        $(that.el[0]).on("mouseenter mouseleave", function (event) {
          switch (event.type) {
            case 'mouseenter':
              $(that.label[0]).fadeIn();
            break;
                  
            case 'mouseleave':
              $(that.label[0]).fadeOut();
            break;
          }
        });
      };

      that.update = function (data) {
        that.data = data;
        that.el.datum(data)
          .transition()
          .ease("linear")
          .duration(1000)
          .attr({
            "cx": function(d) {
              return projection([d.lon, d.lat])[0];
            },
            "cy": function(d) {
              return projection([d.lon, d.lat])[1];
            }
          });
      };

    };    

  });
