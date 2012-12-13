define([
  'd3',
  'obj/obj',
  'core/layer/layer',
  'core/layer/bar'
],
function (d3, obj, layer, barLayer) {

  var layerFactory;

  layerFactory = {

    create: function (type) {
      switch (type) {
        // TOOD: load on demand with require()
        case 'bar':
          return obj.create(layer, barLayer);
      }
    }

  };

  return layerFactory;

});
