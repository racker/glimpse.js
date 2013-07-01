define([
  'mixins/toggle',
  'mixins/dispatch',
  'mixins/lifecycle',
  'mixins/zIndex'
],
function(toggle, dispatch, lifecycle, zIndex) {
  'use strict';

  return {
    toggle: toggle,
    lifecycle: lifecycle,
    dispatch: dispatch,
    zIndex: zIndex
  };

});
