// Specify defaults for all components in a single file.
// Users of the library can edit these defaults in one place.

function defaults() {}

defaults.xAccessor = function(d) {
  return d.x;
};
defaults.yAccessor = function(d) {
  return d.y;
};

// Generate documentation from defauts (create ConfigManager)
defaults.graph = function (config) {
  return {
    title: { value: null, accessor: 'simple'},
    padding: {
      'top': config.title ? 40 : 20,
      'right': 30,
      'bottom': config.xlabel ? 60 : 20,
      'left': config.ylabel ? 70 : 45,
      'accessor': 'object'
    },
    width: { value: 480, accessor: 'simple'},
    height: { value: 250, accessor: 'simple'},
    scales: { x: d3.time.scale, y: d3.scale.linear, accessor: 'object' },
    xAccessor: defaults.xAccessor,
    yAccessor: defaults.yAccessor,
    zoom: false,
    components: [],
    style: '', // svg|html technology specific property
    legend: true,
    loading: { type: 'loader', value: false, accessor: 'simple' },
    colorScale: d3.scale.category10
  };
};

/*
components with renderType of xy get rendered to xy plane.
components are given random id (use this to determing whether it is rendered or not)
title: { value: string simple, value: string}
*/
