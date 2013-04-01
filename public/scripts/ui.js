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
    $layer_toggles = $controls.find(".layer-toggle");

    /**
     * Kick of the building of the select options for the route select
     */
    var build = function () {
      socket.emit("findRoutes");
      socket.on("routes", function (routes) {
        addRouteOptions(routes);
      });
    };

    /**
     * Bind all browser events to UI controls
     */
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
        addRoute($(this));
      });
      $clear.on("click", function (event) {
        event.preventDefault();
        map.clearAllRoutes();
        socket.on("vehiclesCleared", function () {
          emptyVehicleList();
          notify("Routes cleared");
        });
      });
      $layer_toggles.on("click", function (event) {
        event.preventDefault();
        var $btn = $(this);
        map.toggleLayer($(this).attr("id"), $btn.is(".disabled"), function (layer, toggle) {
          if (toggle) $btn.removeClass("disabled");
          else $btn.addClass("disabled");
          var adjective = toggle ? "on" : "off";
          notify(layer+" "+adjective);
        });
      });
    };

    /**
     * Add routes to the select box and assign colours to them based on HSL hue
     */
    var addRouteOptions = function (routes) {
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

    /**
     * Toggle labels on all vehicles
     */
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

    /**
     * Add a route to the map along with its indicator list item with colour for the key.
     */
    var addRoute = function ($el) {
      var $option = $($el[0].options[$el[0].selectedIndex]);
      map.findVehicles($el[0].value, $option.data("color"));
      var $icon   = $("<span />").addClass("icon").css("backgroundColor", $option.data("color"));
      var $text   = $("<span />").addClass("name").html($option.data("title"));
      var $amount = $("<span />").addClass("amount badge badge-info").html(0);
      var $li     = $("<li />").addClass($el[0].value).append($icon, $text, $amount);
      $li.appendTo($list).find(".icon").on("click", function (event) {
        var $el = $(this).parent();
        map.clearRoute($el.attr("class"), function () {
          $el.remove();
          notify("Cleared");
        });
      });
      notify("Added");
    };

    /**
     * Throw up a simple notification to let the user know whats happened.
     */
    var notify = function (text) {
      $notify.html(text).addClass("pop").on("webkitAnimationEnd oanimationend msAnimationEnd animationend", function () {
        $notify.removeClass("pop");
      });
    };

    /**
     * Helper to empty the list of vehicles on callback form the server
     */
    var emptyVehicleList = function () {
      $list.empty();
    };

    return {
      /**
       * Kick of the build and bind functions
       */
      init: function () {
        map.clearAllRoutes(); // Clear out old vehicle feeds on the server incase of refresh
        build();
        bind();
      }
    };
  })();
});
