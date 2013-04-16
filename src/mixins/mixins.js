define([
  'mixins/toggle',
  'mixins/dispatch',
  'mixins/lifecycle'
],
function(toggle, dispatch, lifecycle) {
  'use strict';

  return {
    toggle: toggle,
    lifecycle: lifecycle,
    dispatch: dispatch
  };

});
