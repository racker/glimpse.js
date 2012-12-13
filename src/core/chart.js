define([
  'd3',
  'obj/obj'
],
function (d3, obj) {
  'use strict';

  var internal, chart;

  // TODO: probably a better way to do this
  internal = {
    setupCanvas: function () {
      if (this.svg) {
        return;
      }
      this.el.html('');
      this.svg = this.el.append('svg')
        .attr({
          'width': this.width,
          'height': this.height
        });
    },
    renderLayers: function () {
      this.layerGroup = this.svg.append('g');
      this.layers.forEach(function (layer) {
        layer.render(this.layerGroup);
      }, this);
    },
    updateLayerData: function () {
    }
  };

  chart = {

    //config: {
      //width: 600,
      //height: 400,
      //bgColor: '#fff',
      //title: null
    //},

    // TODO: move public stuff in to config object?
    // and private stuff into private config?
    init: function () {
      // defaults go here
      this.width = 600;
      this.height = 400;
      this.bgColor = '#fff';
      this.title = null;
      this.el = null;
      this.svg = null;
      this.layerGroup = null;
      this.layers = [];
      this.dataset = null;
      // if we follow this pattern init() must always return this
      return this;
    },

    layer: function (layer) {
      // TODO: maybe by index is a good default, but should be configurable
      layer.data(this.dataset[this.layers.length]);
      this.layers.push(layer);
      return this;
    },

    data: function (dataset) {
      this.dataset = dataset;
      internal.updateLayerData.bind(this)();
      return this;
    },

    render: function (selector) {
      if (!this.el) {
        this.el = d3.select(selector);
      }
      internal.setupCanvas.bind(this)();
      internal.renderLayers.bind(this)();


      console.log('');
      console.log('title: ' + this.title);
      console.log('height: ' + this.height);
      console.log('width: ' + this.width);
      console.log('bgColor: ' + this.bgColor);

      return this;
    },

    // TODO: move somewhere else and make reusable
    config: function (name, value) {
      if (!value) {
        return this[name];
      }
      this[name] = value;
      return this;
    },

    create: function () {
      var newObj = obj.create(this);
      // initialize only if this is not a descendant
      if (!obj.hasPrototype(this)) {
        newObj.init();
      }
      return newObj;
    }

  };

  return chart;

});
