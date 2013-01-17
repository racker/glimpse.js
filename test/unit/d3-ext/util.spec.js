define([
  'd3-ext/util'
],
function(selection) {
  'use strict';

  describe('d3-ext.selection', function() {

    beforeEach(function() {
    });

    it('selects with a text selector', function() {
      var fixture = jasmine.htmlFixture(),
        sel = selection.select('#html-fixture');
      expect(sel.node()).toBe(fixture.node());
    });

    it('selects with a d3 selection', function() {
      var fixture = jasmine.htmlFixture(),
        sel = selection.select(d3.select('#html-fixture'));
      expect(sel.node()).toBe(fixture.node());
    });

    it('selects with an DOM node', function() {
      var fixture = jasmine.htmlFixture(),
        sel = selection.select(fixture.node());
      expect(sel.node()).toBe(fixture.node());
    });

  });

});
