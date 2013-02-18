
define([
  'components/mixins/toggle',
  'components/mixins/lifecycle'
],
function(toggle, lifecycle) {
  'use strict';

  return {
    toggle: toggle,
    lifecycle: lifecycle
  };

});
