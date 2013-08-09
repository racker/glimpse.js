define([
  'mixins/toggle',
  'mixins/component',
  'mixins/zIndex',
  'mixins/highlight'
],
function(toggle, component, zIndex, highlight) {
  'use strict';

  return {
    toggle: toggle,
    component: component,
    zIndex: zIndex,
    highlight: highlight
  };

});
