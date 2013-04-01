require(["map", "vehicle", "ui"], function (map, vehicle, ui) {
  $(function() {

    // Initialize our websocket..
    window.socket = io.connect(window.location.hostname);

    // Build our map from geojson
    map.build("#map");
    ui.init();
    //$(window).on("resize", map.draw); // All the vehicles loose the correct projection!

  });

});
