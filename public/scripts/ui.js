/**
 * This is the UI module that handles all DOM manipulation and event binding that is not directly part of the map.
 */
define(["map"], function (map) {
  return (function () {

    $controls = $(".controls");
    $notify = $(".notify");
    $routes = $controls.find("#routes");
    $list = $controls.find(".displayedRoutes");
    $labels = $controls.find(".labels");
    $clear = $controls.find(".clear");
    $ctrl_toggle = $(".ctrl-toggle .btn");

    var build = function () {
      socket.emit("findRoutes");
      socket.on("routes", function (routes) {
        addRoutes(routes);
      });
    };

    var bind = function () {
      $ctrl_toggle.on("click", function (event) {
        event.preventDefault();
        if ($controls.is(".open")) $controls.removeClass("open");
        else $controls.addClass("open");
      });
      $labels.on("click", function (event) {
        event.preventDefault();
        toggleLabels($(this));
      });
      $routes.on("change", function (event) {
        event.preventDefault();
        addVehicle($(this));
      });
      $clear.on("click", function (event) {
        event.preventDefault();
        map.clearAllVehicles();
        socket.on("vehiclesCleared", function () {
          emptyVehicleList();
          notify("Routes cleared");
        });
      });
    };

    var addRoutes = function (routes) {
      // Build colors
      var colors = new Array(routes.length);
      for (var j = 0; j < colors.length; j++) {
        var hue = Math.floor((360/routes.length)*j);
        colors[j] = "hsl("+hue+", 90%, 70% )";
      }
      // Build options
      for (var i = 0; i < routes.length; i++) {
        $routes.append($("<option />").html(routes[i]["$"].title)
                        .attr("value", routes[i]["$"].tag)
                        .data({
                          "color": colors[i],
                          "title": routes[i]["$"].title
                        })
        );
      }
    };

    var toggleLabels = function ($el) {
      var routesHash = map.getRoutesHash();
      if ($el.hasClass("on")) {
        for (var o in routesHash) {
          for (var v in routesHash[o]) {
            routesHash[o][v].hideLabel();
          }
        }
        $el.removeClass("on");
        notify("Labels off");
      } else {
        for (var w in routesHash) {
          for (var x in routesHash[w]) {
            routesHash[w][x].showLabel();
          }
        }
        $el.addClass("on");
        notify("Labels on");
      }
    };

    var addVehicle = function ($el) {
      var $option = $($el[0].options[$el[0].selectedIndex]);
      map.findVehicles($el[0].value, $option.data("color"));
      var $icon = $("<span />").addClass("icon").css("backgroundColor", $option.data("color"));
      var $text = $("<span />").html($option.data("title"));
      var $li = $("<li />").addClass($el[0].value).append($icon, $text);
      $li.appendTo($list);
    };

    var notify = function (text) {
      $notify.html(text).addClass("pop").on("webkitAnimationEnd oanimationend msAnimationEnd animationend", function () {
        $notify.removeClass("pop");
      });
    };

    var emptyVehicleList = function () {
      $list.empty();
    };

    return {
      init: function () {
        map.clearAllVehicles(); // Clear out old vehicle feeds on the server incase of refresh
        build();
        bind();
      }
    };
  })();
});
