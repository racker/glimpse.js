define(function () {
  'use strict';

  return {

    /**
    * @description Makes the component visible
    * @return {components.component}
    */
    show: function () {
      var root = this.root();
      if (root) {
        root.attr('display', null);
      }
      return this;
    },

    /**
    * @description Hides the component
    * @return {components.component}
    */
    hide: function () {
      var root = this.root();
      if (root) {
        root.attr('display', 'none');
      }
      return this;
    }

  };

});
