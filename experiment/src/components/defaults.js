// Specify defaults for all components in a single file.
// Users of the library can edit these defaults in one place.

var defaults = {};

defaults.xAccessor = function(d) {
  return d.x;
};
defaults.yAccessor = function(d) {
  return d.y;
};

// Generate documentation from defauts (create ConfigManager)
defaults.graph = function (config) {
  return {
    title: null,
    padding: {
      'top': config.title ? 40 : 20,
      'right': 30,
      'bottom': config.xlabel ? 60 : 20,
      'left': config.ylabel ? 70 : 45
    },
    width: 480,
    height: 250,
    scales: { x: d3.time.scale, y: d3.scale.linear },
    xAccessor: defaults.xAccessor,
    yAccessor: defaults.yAccessor,
    zoom: false,
    layers: [],
    style: '', // svg|html technology specific property
    legend: true,
    loading: false, // uses loader component
    colorScale: d3.scale.category10
  }
};

function gl_applyDefaults(type, config) {
  config = config || {};
  return gl_objCopyKeys(config, defaults[type](config))
};
