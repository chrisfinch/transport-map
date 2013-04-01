/**
 * =============== San Franciso Transport Map =============== 
 *
 * Frontend structure:
 *
 * ├─┬ main.js                (Main file called by require.js, intializes modules)
 * │ ├── ui.js                (Require module for handling all UI binding and actions)
 * │ ├── map.js               (Require module for handling all map plotting, adjusting and interaction)
 * │ └── vehicle.js           (Require module providing a class for each vehicle to be displayed on the map)
 * │
 * ├─┬ /vendor
 * │ ├── d3.v3.js             (Framework for interacting with complex datasets and SVG/canvas visualisations in Javascript)
 * │ ├── jquery-1.8.2.min.js  (DOM interaction and JS helper framework)
 * │ └── require.js           (AMD style module loader for JS)
 * │
 * └── ../style.less             (LESS stylesheet for all css styles)
 *
 * All custom files are provided unminified and non-concatenated to maintain view-source-ability :-)
 * 
 */

require(["map", "vehicle", "ui"], function (map, vehicle, ui) {
  $(function() {

    // Initialize our websocket..
    window.socket = io.connect(window.location.hostname);

    // Build our map from geojson
    map.build("#map");
    ui.init();
    $(window).on("resize", map.redraw); // All the vehicles loose the correct projection!

  });

});