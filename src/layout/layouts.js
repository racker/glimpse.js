/**
 * @fileOverview
 * Layouts
 * Set of predefined layouts directly available for use.
 */
define(function () {
  'use strict';

  var layouts = {

    'default': {
      name: 'gl-vgroup',
      split: [10, 65, 10, 15],
      children: [
        {
          name: 'gl-info'
        },
        {
          name: 'gl-main',
          clip: true,
          border: 1,
          paddingTop: 4,
          borderColor: '#999',
          backgroundColor: '#fff'
        },
        {
          name: 'gl-xaxis',
          padding: 1,
          paddingTop: 20
        },
        {
          name: 'gl-footer',
          paddingTop: 1,
          paddingBottom: 1,
          padding: 1,
          borderStyle: 'dotted',
          borderTop: 1
        }
      ]
    },

     'sparkline': {
      name: 'gl-vgroup',
      split: [100],
      children: [
        {
          name: 'gl-main',
          clip: true,
          border: 1,
          paddingTop: 4,
          borderColor: '#999',
          backgroundColor: '#fff'
        }
        ]
    },

    'rax-layout': {
      type: 'vgroup',
      'class': 'random-class another-class',
      containers: [
        {
          padding: [1, 1, 1, 2],
          'class': 'gl-info',
          height: '15%',
          componenents: [
            {
              type: 'legend',
              visibleState: 'normal'
            }
          ]
        },
        {
          height: '60%',
          'class': 'gl-frame'
        },
        {
          height: '10%',
          'class': 'gl-xaxis',
          padding: [10, 1, 1, 1],
          components: [
            {
              type: 'axis',
              visibleState: ['normal', 'empty'],
              config: {
                type: 'x',
                ticks: 7,
                orient: 'bottom',
              }
            }
          ]
        },
        {
          height: '15%',
          'class': 'gl-footer',
          padding: 1,
          components: [
            {
              type: 'label',
              config: {
                cid: 'statsLabel',
                position: 'center-left'
              }
            },
            {
              type: 'label',
              // how to set data here???
              config: {
                cid: 'xDomainLabel',
                formatter: 'core.format.timeDomain',
                position: 'center-right'
              }
            }
          ]
        }
      ]
    },

   'threepane': {
      name: 'gl-vgroup',
      split: [15, 70, 15],
      children: [
        {
          name: 'gl-stat',
          padding: 1
        },
        {
          name: 'gl-main',
          padding: 1,
          paddingBottom: 10
        },
        {
          name: 'gl-info',
          padding: 1
        }
      ]
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
