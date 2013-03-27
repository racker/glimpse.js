define([
  'd3-ext/d3-ext'
],
function () {
  'use strict';

  describe('d3.selection.prototype.selectAttr()', function() {

    var selection, fixture, foo1a, foo1b, foo2;

    beforeEach(function() {
      fixture = jasmine.svgFixture();
      foo1a = fixture.append('g')
        .attr('gl-foo', '1').attr('id', 'foo1a');
      foo1b = jasmine.svgFixture().append('g')
        .attr('gl-foo', '1').attr('id', 'foo1b');
      foo2 = jasmine.svgFixture().append('g')
        .attr('gl-foo', '2').attr('id', 'foo2');
    });

    it('only selects 1 node', function() {
      selection = fixture.selectAttr('gl-foo', '1');
      expect(selection).toBeSelectionLength(1);
    });

    it('selects the first matching node', function() {
      selection = fixture.selectAttr('gl-foo', '1');
      expect(selection.node()).toBe(foo1a.node());
    });

    it('must match the value to get a result', function() {
      selection = fixture.selectAttr('gl-foo', 'doesnt exist value');
      expect(selection.empty()).toBe(true);
    });

  });

});
