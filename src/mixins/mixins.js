define([
  'mixins/toggle',
  'mixins/component',
  'mixins/dispatch',
  'mixins/lifecycle',
  'mixins/zIndex'
],
function(toggle, component, dispatch, lifecycle, zIndex) {
  'use strict';

  return {
    toggle: toggle,
    component: component,
    lifecycle: lifecycle,
    dispatch: dispatch,
    zIndex: zIndex
  };

});
