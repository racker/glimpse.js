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
      'split': [10, 65, 10, 15],
      children: [{
        padding: 0,
        'class': 'gl-info'
      }, {
        'class': 'gl-framed',
        paddingTop: 5,
        border: 1,
        borderColor: '#999',
        backgroundColor: '#fff'
      }, {
        'class': 'gl-xaxis',
        padding: 1,
        paddingTop: 20
      }, {
        'class': 'gl-footer',
        paddingTop: 1,
        paddingBottom: 1,
        padding: 1,
        borderStyle: 'dotted',
        borderTop: 1
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
