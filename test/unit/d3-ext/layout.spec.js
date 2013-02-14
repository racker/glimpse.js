define([
  'd3-ext/d3-ext'
],
function(d3) {
  'use strict';

  describe('selection.layout', function() {

    var container, g1, g2, g3;

    function setupEqualSize() {
      container = jasmine.svgFixture().append('g').size(200, 200);
      g1 = container.append('g').size(10, 10).node();
      g2 = container.append('g').size(10, 10).node();
      g3 = container.append('g').size(10, 10).node();
    }

    function setupUnequalSize() {
      container = jasmine.svgFixture().append('g').size(200, 200);
      g1 = container.append('g').size(20, 10).node();
      g2 = container.append('g').size(10, 20).node();
      g3 = container.append('g').size(30, 30).node();
    }

    describe('horizontal', function () {

      it('sets the right positions - equal', function() {
        setupEqualSize();
        d3.select(container.node()).layout({type: 'horizontal'});
        expect(g1).toHaveTranslate(0,95);
        expect(g2).toHaveTranslate(10,95);
        expect(g3).toHaveTranslate(20,95);
        expect(container.node()).not.toHaveAttr('transform');
      });

     it('sets the right gaps - equal', function() {
        setupEqualSize();
        d3.select(container.node()).layout({type: 'horizontal', gap: 10});
        expect(g1).toHaveTranslate(0,95);
        expect(g2).toHaveTranslate(20,95);
        expect(g3).toHaveTranslate(40,95);
        expect(container.node()).not.toHaveAttr('transform');
      });

      it('sets the right positions - unequal', function() {
        setupUnequalSize();
        d3.select(container.node()).layout({type: 'horizontal'});
        expect(g1).toHaveTranslate(0,95);
        expect(g2).toHaveTranslate(20,90);
        expect(g3).toHaveTranslate(30,85);
        expect(container.node()).not.toHaveAttr('transform');
      });

     it('sets the right gaps - unequal', function() {
        setupUnequalSize();
        d3.select(container.node()).layout({type: 'horizontal', gap: 10});
        expect(g1).toHaveTranslate(0,95);
        expect(g2).toHaveTranslate(30,90);
        expect(g3).toHaveTranslate(50,85);
        expect(container.node()).not.toHaveAttr('transform');
      });

    });

    describe('vertical', function () {

      it('sets the right positions - equal', function() {
        setupEqualSize();
        d3.select(container.node()).layout({type: 'vertical'});
        expect(g1).toHaveTranslate(95, 0);
        expect(g2).toHaveTranslate(95, 10);
        expect(g3).toHaveTranslate(95, 20);
        expect(container.node()).not.toHaveAttr('transform');
      });

     it('sets the right gaps - equal', function() {
        setupEqualSize();
        d3.select(container.node()).layout({type: 'vertical', gap: 10});
        expect(g1).toHaveTranslate(95, 0);
        expect(g2).toHaveTranslate(95, 20);
        expect(g3).toHaveTranslate(95, 40);
        expect(container.node()).not.toHaveAttr('transform');
      });

      it('sets the right positions - unequal', function() {
        setupUnequalSize();
        d3.select(container.node()).layout({type: 'vertical'});
        expect(g1).toHaveTranslate(90, 0);
        expect(g2).toHaveTranslate(95, 10);
        expect(g3).toHaveTranslate(85, 30);
        expect(container.node()).not.toHaveAttr('transform');
      });

     it('sets the right gaps - unequal', function() {
        setupUnequalSize();
        d3.select(container.node()).layout({type: 'vertical', gap: 10});
        expect(g1).toHaveTranslate(90, 0);
        expect(g2).toHaveTranslate(95, 20);
        expect(g3).toHaveTranslate(85, 50);
        expect(container.node()).not.toHaveAttr('transform');
      });

    });

    describe('position', function () {

      var positionSpy;

      beforeEach(function() {
        positionSpy = spyOn(d3.selection.prototype, 'position')
                        .andCallThrough();
      });

      it('calls position center on container with horiz layout', function() {
        setupEqualSize();
        d3.select(container.node()).layout({
          type: 'horizontal',
          position: 'center'
        });
        expect(positionSpy).toHaveBeenCalledWith('center');
        expect(container.node()).toHaveAttr('transform');
      });

      it('calls position center on container with horiz layout', function() {
        setupEqualSize();
        d3.select(container.node()).layout({
          type: 'vertical',
          position: 'center'
        });
        expect(positionSpy).toHaveBeenCalledWith('center');
        expect(container.node()).toHaveAttr('transform');
      });

     it('calls position bottom-left on container - horiz layout', function() {
        setupEqualSize();
        d3.select(container.node()).layout({
          type: 'horizontal',
          position: 'bottom-left'
        });
        expect(positionSpy).toHaveBeenCalledWith('bottom-left');
        expect(container.node()).toHaveAttr('transform');
      });

      it('calls position bottom-left on container - vert layout', function() {
        setupEqualSize();
        d3.select(container.node()).layout({
          type: 'vertical',
          position: 'bottom-left'
        });
        expect(positionSpy).toHaveBeenCalledWith('bottom-left');
        expect(container.node()).toHaveAttr('transform');
      });

    });

  });

});
