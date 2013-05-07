define([
  'components/legend',
  'data/collection'
],
function(legend, dc) {
  'use strict';

  describe('components.legend', function() {
    var testLegend, svgNode, rootNode, key1, key2, keys,
    handlerSpy, dataCollection, data, inactiveColor;

     data = [{
      id:'key1',
      data: [
        { x: 13, y: 106},
        { x: 15, y: 56},
        { x: 17, y: 100}
      ],
      dimensions: {
        x: function(d) { return d.x + 1; },
        y: function(d) { return d.y + 1; }
      }
    }];

    function select(selector) {
      return jasmine.svgFixture().select(selector);
    }

    function selectAll(selector) {
      return jasmine.svgFixture().selectAll(selector);
    }

    function fireClickEvent(elem) {
      var evt = document.createEvent('MouseEvents');
      evt.initMouseEvent('click',
       true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
      elem.dispatchEvent(evt);
    }

    beforeEach(function() {
      dataCollection = dc.create();
      testLegend = legend();
      key1 = { dataId: 'key1', color: 'blue', label: 'blue label' };
      key2 = {
        dataId: 'key2',
        color: function() { return 'green'; },
        label: 'green label'
      };
      keys = [key1, key2];
      testLegend.keys(keys);
      dataCollection.add(data);
      testLegend.data(dataCollection);
      inactiveColor = testLegend.config('inactiveColor');
      svgNode = jasmine.svgFixture().node();
      spyOn(testLegend, 'update').andCallThrough();
      spyOn(dataCollection, 'toggleTags').andCallThrough();
      handlerSpy = jasmine.createSpy();
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
            'hide',
            'rootId'
          );
      });

    });

    describe('render()', function() {

      beforeEach(function() {
        testLegend.dispatch.on('render', handlerSpy);
        testLegend.render('#svg-fixture');
        rootNode = select('.gl-legend').node();
      });

      it('dispatches a "render" event', function() {
        expect(handlerSpy).toHaveBeenCalledOnce();
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

      it('renders adds a legend-key for each key', function() {
        expect(selectAll('.gl-legend .gl-legend-key')[0].length).toBe(2);
      });

      describe('onClick handler', function() {
        var legendNode, selectorLabel, labelNode,
        selectorInd, indicatorNode;

        beforeEach(function () {
          legendNode = select('.gl-legend-key').node();
          //indicator and label for checking colors
          selectorLabel = '.gl-legend .gl-legend-key .gl-legend-key-label';
          selectorInd = '.gl-legend .gl-legend-key .gl-legend-key-indicator';
          indicatorNode = select(selectorInd)[0];
          labelNode = select(selectorLabel)[0];

        });

        it('checks the datatag and sets it to inactive color for onClick',
         function() {
          fireClickEvent(legendNode);
          expect(indicatorNode[0]).toHaveAttr('fill', inactiveColor);
          expect(labelNode[0]).toHaveAttr('fill', inactiveColor);
        });

        it('makes sure they are not inactive after another onClick',
         function() {
          fireClickEvent(legendNode);
          expect(indicatorNode[0]).not.toHaveAttr('fill', inactiveColor);
          expect(labelNode[0]).not.toHaveAttr('fill', inactiveColor);
        });

        it('calls the dataToggle method when onClick', function() {
          fireClickEvent(legendNode);
          expect(dataCollection.toggleTags).toHaveBeenCalledOnce();
          //make legend active again for other tests below
          fireClickEvent(legendNode);
        });

      });

      describe('legend keys', function() {

        it('adds keys to the DOM when new key data is added', function() {
          expect(selectAll('.gl-legend .gl-legend-key')[0].length)
            .toBe(2);
        });

        afterEach(function(){
            dataCollection.removeTags('key1', 'inactive');
        });

        describe('indicators', function() {
          var indicatorNodes, selector;

          beforeEach(function() {
            selector = '.gl-legend .gl-legend-key .gl-legend-key-indicator';
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

          it('sets inactive initial color if data inactive', function() {
            var indicatorNode =  select(selector)[0];
            dataCollection.addTags('key1', 'inactive');
            testLegend.update();
            expect(indicatorNode[0]).toHaveAttr('fill', inactiveColor);
          });

        });

        describe('labels', function() {
          var labelNodes, selector;

          beforeEach(function() {
            selector = '.gl-legend .gl-legend-key .gl-legend-key-label';
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

          it('sets inactive initial label color if data inactive', function() {
            var labelNode = select(selector)[0];
            dataCollection.addTags('key1', 'inactive');
            testLegend.update();
            expect(labelNode[0]).toHaveAttr('fill', inactiveColor);
          });

        });

      });

    });

    describe('data()', function() {
      it('gets/sets data and datacollection available in Legend', function() {
        testLegend.data(dataCollection);
        expect(testLegend.data()).toBe(dataCollection);
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
          testLegend.dispatch.on('update', handlerSpy);
        });

        it('dispatches an "update" event', function() {
          testLegend.update();
          expect(handlerSpy).toHaveBeenCalledOnce();
        });

        it('removes keys from the DOM when key data is removed', function() {
          testLegend.keys().splice(0, 1);
          testLegend.update();
          expect(selectAll('.gl-legend .gl-legend-key')[0].length).toBe(1);
        });

        it('updates existing key with same color', function() {
          var key3;
          key3 = { color: 'blue', label: 'second blue label' };
          keys.push(key3);
          testLegend.update();
          expect(selectAll('.gl-legend .gl-legend-key')[0].length).toBe(3);
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
        testLegend.dispatch.on('destroy', handlerSpy);
        testLegend.destroy();
      });

      it('dispatches a "destroy" event', function() {
        expect(handlerSpy).toHaveBeenCalledOnce();
      });

      it('removes all the dom nodes', function() {
        expect(selection.selectAll('*')).toBeEmptySelection();
      });

    });

  });

});
