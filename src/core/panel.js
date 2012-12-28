/**
 * @fileOverview
 * Panel
 *
 * Renders itself.
 * Renders components within itself (framed & unframed).
 */

define([
  'd3',
  'obj/obj'
],
function (d3, Obj) {
  'use strict';

  var PanelProto,
    selection,
    componentsSelection,
    framedComponentsSelection;

  PanelProto = Obj.extend({

    init: function () {
      this.config({
        'name': 'panel',
        'width': 600,
        'height': 400,
        'marginTop': 30,
        'marginRight': 10,
        'marginBottom': 30,
        'marginLeft': 50
      });
      return this;
    },

    render: function (el) {
      selection = el.append('svg')
        .attr({
          'width': this.width,
          'height': this.height,
          'font-family': 'sans-serif',
          'font-size': '12'
        });
      framedComponentsSelection = selection.append('g')
        .attr({
          'class': 'components frame',
          'transform':
            'translate(' + this.marginLeft + ',' + this.marginTop + ')'
        });
      componentsSelection = selection.append('g')
        .attr({
          'class': 'components'
        });
      return this;
    },

    frameWidth: function () {
      return this.width - this.marginLeft - this.marginRight;
    },

    frameHeight: function () {
      return this.height - this.marginTop - this.marginBottom;
    },

    renderComponents: function (components) {
      var renderTarget, componentConfig;

      if (components) {
        components.forEach(function (component) {
          if (component.isFramed) {
            renderTarget = framedComponentsSelection;
            componentConfig = {
              'height': this.frameHeight(),
              'width': this.frameWidth()
            };
          } else {
            renderTarget = componentsSelection;
            componentConfig = {
              'height': this.height,
              'width': this.width
            };
          }
          component.config(componentConfig).render(renderTarget);
        }, this);
      }
      return this;
    }
  });

  return PanelProto;
});
