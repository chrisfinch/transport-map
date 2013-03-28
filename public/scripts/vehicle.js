define(function () {
  var vehicle = function (data, parent, projection, color) {

    var that = this;
    that.data = data;
    that.color = color;
    that.node = null;
    that.el = null;

    helpers = {
      getX: function (d) {
        return projection([d.lon, d.lat])[0];
      },
      getY: function (d) {
        return projection([d.lon, d.lat])[1];
      }
    };

    that.create = function () {
      that.node = parent.append("g")
                    .datum(data);
      that.el = that.node.append("circle")
                  .attr({
                    "cx": helpers.getX,
                    "cy": helpers.getY,
                    class: "vehicle",
                    r: 5,
                    fill: that.color
                  });

      that.label = that.node.append("rect")
                  .attr({
                    "x": function (d) { return helpers.getX(d)+4; },
                    "y": function (d) { return helpers.getY(d)-24; },
                    "rx": 5,
                    "ry": 5,
                    width: 80,
                    height: 18,
                    class: "label"
                  }).style("display", "none");
      that.text = that.node.append("text")
                  .attr({
                    "x": function (d) { return helpers.getX(d)+6; },
                    "y": function (d) { return helpers.getY(d)-10; },
                    width: 100
                  })
                  .text("id:'"+data.id+"', r:'"+data.routeTag+"'")
                  .style("display", "none");
    };

    that.update = function (data) {
      that.data = data;
      that.node.datum(data)
        .select("circle")
        .transition()
        .ease("linear")
        .duration(1000)
        .attr({
          "cx": helpers.getX,
          "cy": helpers.getY
        });
      that.node.select("rect")
        .transition()
        .ease("linear")
        .duration(1000)
        .attr({
          "x": function (d) { return helpers.getX(d)+4; },
          "y": function (d) { return helpers.getY(d)-24; }
        });
      that.node.select("text")
        .transition()
        .ease("linear")
        .duration(1000)
        .attr({
          "x": function (d) { return helpers.getX(d)+6; },
          "y": function (d) { return helpers.getY(d)-10; }
        });
    };

    that.hideLabel = function () {
      $(that.label[0]).add($(that.text[0])).fadeOut();
    };

    that.showLabel = function () {
      if (that.el) $(that.label[0]).add($(that.text[0])).fadeIn();
    };

    that.destroy = function () {
      if (that.el) that.el.remove();
      that.hideLabel();
      that.el = null;
    };

  };

  return vehicle;

});
