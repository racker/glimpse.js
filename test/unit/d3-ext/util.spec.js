define([
  'd3-ext/util'
],

function(d3util) {
  'use strict';

  describe('d3-ext.util', function() {

    var fixture;

    describe('.select()', function() {

      var sel;

      it('selects with a text selector', function() {
        fixture = jasmine.htmlFixture();
        sel = d3util.select('#html-fixture');
        expect(sel.node()).toBe(fixture.node());
      });

      it('selects with a d3 selection', function() {
        fixture = jasmine.htmlFixture();
        sel = d3util.select(d3.select('#html-fixture'));
        expect(sel.node()).toBe(fixture.node());
      });

      it('selects with an DOM node', function() {
        fixture = jasmine.htmlFixture();
        sel = d3util.select(fixture.node());
        expect(sel.node()).toBe(fixture.node());
      });

    });

    describe('.applyTarget()', function() {
       var componentMock, applyFn, noop;

      function getComponentMock(target) {
        return {
          config: function() {
            return target;
          }
        };
      }

      beforeEach(function() {
        applyFn = function(target) {
          return target;
        };
        noop = function() {};
        fixture = jasmine.svgFixture();
      });

      it('returns null if there is no selection or target', function() {
        componentMock = getComponentMock(null);
        expect(
          d3util.applyTarget(componentMock, null, noop)
        ).toBe(null);
      });

      it('passes the selection as the target if present',
      function() {
        componentMock = getComponentMock(null);
        expect(
          d3util.applyTarget(componentMock, fixture, applyFn)
        ).toBe(fixture);
      });

      it('passes config.target selection as the target if selection is null',
      function() {
        componentMock = getComponentMock('#svg-fixture');
        expect(
          d3util.applyTarget(componentMock, null, applyFn).node()
        ).toBe(d3.select('#svg-fixture').node());
      });

      it('passes the selection as the target if both are present',
      function() {
        componentMock = getComponentMock('#svg-fixture');
        expect(
          d3util.applyTarget(componentMock, fixture, applyFn)
        ).toBe(fixture);
      });

    });

    describe('isTimeScale', function() {
      it('returns true for time scale', function() {
        expect(d3util.isTimeScale(d3.time.scale())).toBe(true);
      });

      it('returns false for linear scale', function() {
        expect(d3util.isTimeScale(d3.scale.linear())).toBe(false);
      });

      it('returns false for null', function() {
         expect(d3util.isTimeScale(null)).toBe(false);
      });

      it('returns false for undefined', function() {
         expect(d3util.isTimeScale(undefined)).toBe(false);
      });

    });

  });

});
