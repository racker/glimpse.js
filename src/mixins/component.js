define(function () {
  'use strict';

  return {

    /**
    * @description Returns the root selection of the component.
    * @return {d3.selection}
    */
    root: function () {
      return this._.root;
    },

    data: function(data) {
      var _ = this._;
      if (data) {
        _.dataCollection = data;
        return this;
      }
      return _.dataCollection.get(_.config.dataId);
    }

  };

});
