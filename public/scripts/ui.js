define(["map"], function (map) {
  return (function () {

    $controls = $(".controls");
    $notify = $(".notify");
    $routes = $("#routes");
    $list = $(".displayedRoutes");

    var build = function () {
      socket.emit("findRoutes");
      socket.on("routes", function (routes) {
        addRoutes(routes);
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

    var bind = function () {
      $controls.find(".labels").on("click", function (event) {
        var vehicles = map.getVehicles();
        if ($(this).hasClass("on")) {
          for (var v in vehicles) {
            vehicles[v].hideLabel();
          }
          $(this).removeClass("on");
          notify("Labels off");
        } else {
          for (var w in vehicles) {
            vehicles[w].showLabel();
          }
          $(this).addClass("on");
          notify("Labels on");
        }
      });
      $routes.on("change", function (event) {
        //map.clearVehicles();
        addVehicle($(this));
      });
    };

    var addVehicle = function ($el) {
      map.findVehicles($el[0].value);
      var $option = $($el[0].options[$el[0].selectedIndex]);
      var $icon = $("<span />").addClass("icon").css("backgroundColor", $option.data("color"));
      var $text = $("<span />").html($option.data("title"));
      var $li = $("<li />").append($icon, $text);
      $li.appendTo($list);
    };

    var notify = function (text) {
      $notify.html(text).addClass("pop").on("webkitAnimationEnd oanimationend msAnimationEnd animationend", function () {
        $notify.removeClass("pop");
      });
    };

    return {
      init: function () {
        build();
        bind();
      }
    };
  })();
});
