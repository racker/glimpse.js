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
        if (this.dispatch && this.dispatch.show) {
          this.dispatch.show.call(this);
        }
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
        if (this.dispatch && this.dispatch.hide) {
          this.dispatch.hide.call(this);
        }
      }
      return this;
    }

  };

});
