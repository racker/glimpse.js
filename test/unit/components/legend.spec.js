define([
  'components/legend'
],
function(legend) {
  'use strict';

  describe('components.legend', function() {
    var testLegend, svgNode, rootNode, key1, key2, keys;

    function select(selector) {
      return jasmine.svgFixture().select(selector);
    }

    function selectAll(selector) {
      return jasmine.svgFixture().selectAll(selector);
    }

    beforeEach(function() {
      testLegend = legend();
      key1 = { color: 'blue', label: 'blue label' };
      key2 = { color: function() { return 'green'; }, label: 'green label' };
      keys = [key1, key2];
      testLegend.keys(keys);
      svgNode = jasmine.svgFixture().node();
      spyOn(testLegend, 'update').andCallThrough();
    });

    describe('config', function() {

      it('adds convenience functions', function() {
        expect(testLegend)
          .toHaveProperties(
            'cid',
            'keys',
            'fontColor',
            'fontFamily',
            'fontSize',
            'fontWeight',
            'indicatorWidth',
            'indicatorHeight',
            'show',
            'hide'
          );
      });

    });

    describe('render()', function() {

      beforeEach(function() {
        testLegend.render('#svg-fixture');
        rootNode = select('.gl-legend').node();
      });

      it('renders to the provided selection', function() {
        expect(rootNode.parentNode).toBe(svgNode);
      });

      it('appends the root <g> element', function() {
        expect(rootNode.nodeName).toBe('g');
      });

      it('adds all the correct css classes', function() {
        expect(rootNode).toHaveClasses('gl-component', 'gl-legend');
      });

      it('calls update()', function() {
        expect(testLegend.update).toHaveBeenCalled();
      });

      describe('legend keys', function() {

        it('adds keys to the DOM when new key data is added', function() {
          expect(selectAll('.gl-legend .gl-legend-key')[0].length)
            .toBe(2);
        });

        describe('indicators', function() {
          var indicatorNodes;

          beforeEach(function() {
            var selector = '.gl-legend .gl-legend-key .gl-legend-key-indicator';
            indicatorNodes = selectAll(selector)[0];
          });

          it('adds key indicators', function() {
            expect(indicatorNodes.length).toBe(2);
          });

          it('sets the correct static indicator color', function() {
            expect(indicatorNodes[0]).toHaveAttr('fill', 'blue');
          });

          it('sets the correct dynamic indicator color', function() {
            expect(indicatorNodes[1]).toHaveAttr('fill', 'green');
          });

        });

        describe('labels', function() {
          var labelNodes;

          beforeEach(function() {
            var selector = '.gl-legend .gl-legend-key .gl-legend-key-label';
            labelNodes = selectAll(selector)[0];
          });

          it('adds key labels', function() {
            expect(labelNodes.length).toBe(2);
          });

          it('creates label nodes as <text> elements', function () {
            expect(labelNodes[0].nodeName).toBe('text');
            expect(labelNodes[1].nodeName).toBe('text');
          });

          it('sets the correct label text', function () {
            expect(labelNodes[0].textContent).toBe(key1.label);
            expect(labelNodes[1].textContent).toBe(key2.label);
          });

        });

      });

    });

    describe('update()', function() {

      it('does nothing if render() hasnt been called', function() {
        var newLegend = legend();
        newLegend.update();
        expect(svgNode.childNodes.length).toBe(0);
      });

      describe('after render', function() {

        beforeEach(function() {
          testLegend.render('#svg-fixture');
        });

        it('removes keys from the DOM when key data is removed', function() {
          testLegend.keys().splice(0, 1);
          testLegend.update();
          expect(selectAll('.gl-legend .gl-legend-key')[0].length).toBe(1);
        });

        it('updates existing key labels', function() {
          keys[0].label = 'foo';
          testLegend.update();
          expect(select('.gl-legend-key-label').node().textContent).toBe('foo');
        });

        it('updates the font color on the text node', function() {
          testLegend.fontColor('#cccccc');
          testLegend.update();
          expect(select('.gl-legend-key-label').node())
            .toHaveAttr('fill', '#cccccc');
        });

        it('updates the font size on the key node', function() {
          testLegend.fontSize(16);
          testLegend.update();
          expect(select('.gl-legend-key').node())
            .toHaveAttr('font-size', '16');
        });

        it('updates the font weight on the key node', function() {
          testLegend.fontWeight('normal');
          testLegend.update();
          expect(select('.gl-legend-key').node())
            .toHaveAttr('font-weight', 'normal');
        });

        it('updates the indicator width', function() {
          testLegend.indicatorWidth(13);
          testLegend.update();
          expect(select('.gl-legend-key .gl-legend-key-indicator').node())
            .toHaveAttr('width', 13);
        });

        it('updates the indicator height', function() {
          testLegend.indicatorHeight(13);
          testLegend.update();
          expect(select('.gl-legend-key .gl-legend-key-indicator').node())
            .toHaveAttr('height', 13);
        });

      });

    });

    describe('destroy()', function() {
      var selection;

      beforeEach(function() {
        selection = jasmine.svgFixture();
        testLegend.render(selection);
        testLegend.destroy();
      });

      it('removes all the dom nodes', function() {
        expect(selection.selectAll('*')).toBeEmptySelection();
      });

    });

  });

});
