define([
  'mixins/toggle',
  'mixins/component',
  'mixins/dispatch',
  'mixins/zIndex'
],
function(toggle, component, dispatch, zIndex) {
  'use strict';

  return {
    toggle: toggle,
    component: component,
    dispatch: dispatch,
    zIndex: zIndex
  };

});
