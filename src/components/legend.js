define([
  'core/object',
  'core/config'
],
function (obj, config) {
  'use strict';

  return function () {

    var config_ = {},
      defaults_ = {
        isFramed: false
      },
      data_;

    function legend() {
      obj.extend(config_, defaults_);

      return legend;
    }

    legend.update = function () {
      return legend;
    };

    legend.render = function () {
      return legend;
    };

    obj.extend(legend, config(legend, config_, []));
    return legend();
  };

});
