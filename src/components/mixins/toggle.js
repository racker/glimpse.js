define(function () {
  'use strict';

  return {

    /**
    * @description Makes the component visible
    * @return {components.component}
    */
    show: function () {
      this.root().attr('display', null);
      return this;
    },

    /**
    * @description Hides the component
    * @return {components.component}
    */
    hide: function () {
      this.root().attr('display', 'none');
      return this;
    }

  };

});
