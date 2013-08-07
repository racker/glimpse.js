define([
  'mixins/toggle',
  'mixins/component',
  'mixins/zIndex'
],
function(toggle, component, zIndex) {
  'use strict';

  return {
    toggle: toggle,
    component: component,
    zIndex: zIndex
  };

});
