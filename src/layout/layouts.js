/**
 * @fileOverview
 * Layouts
 * Set of predefined layouts directly available for use.
 */
define(function () {
  'use strict';

  var layouts = {

    'default': {
      'class': 'gl-vgroup',
      'split': [15,85],
      children: [{
        padding: 1,
        'class': 'gl-info'
      },{
        'class': 'gl-unframed',
        padding: 1,
        paddingBottom: 10,
        children: {
          'class': 'gl-framed'
        }
      }]
    },

   'threepane': {
      'class': 'gl-vgroup',
      'split': [15, 70, 15],
      children: [{
        padding: 1,
        'class': 'gl-stat'
      },{
        'class': 'gl-unframed',
        padding: 1,
        paddingBottom: 10,
        children: {
          'class': 'gl-framed'
        }
      },{
        padding: 1,
        'class': 'gl-info'
      }]
    }

  };

  return {

    /**
     * Get a layout by specifying id.
     */
    getLayout: function(id) {
      return layouts[id];
    },

    /**
     * Get the entire layouts object.
     */
    getLayouts: function() {
      return layouts;
    },

    /**
     * Provide an id and associated layout, for reuse.
     */
    setLayout: function(id, layout) {
      layouts[id] = layout;
    },

    /**
     * Remove a layout by its id.
     */
    removeLayout: function(id) {
      delete layouts[id];
    }

  };

});
