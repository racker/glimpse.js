define([
  'graphs/graph'
],
function(graph) {
  'use strict';

  var testGraph, selection;

  describe('mixins.zIndex', function() {

    var fakeData = [{
      id:'fakeData',
      data: [
        { x: 0, y: 106},
        { x: 1, y: 56},
        { x: 2, y: 100},
        { x: 3, y: 103},
        { x: 4, y: 90},
        { x: 5, y: 200},
        { x: 6, y: 130}
      ]
    }];

    function createGraph() {
      var g = graph();
      g.data([
        {
          id: 'fakeData',
          color: 'black',
          title: 'DFW',
          data: fakeData[0].data
        }
      ]);
      return g;
    }

    function renderGraph() {
      selection = jasmine.htmlFixture();
      testGraph.render(selection.node());
    }

    // Returns the cids in the order they were rendered in the graph.
    function getComponentDetails() {
      var nodes = selection.select('[gl-container-name="gl-main"]')
                   .node().childNodes,
          cids = [], zIndexes = [], node, i;
      // Need for loop sinces nodes is not an actual array
      for (i = 0; i < nodes.length; i++) {
        node = nodes[i];
        if (node.tagName === 'g') {
          zIndexes.push(parseInt(d3.select(node).attr('gl-zIndex'), 10));
          cids.push(d3.select(node).attr('gl-cid'));
        }
      }
      return  { zIndexes: zIndexes, cids: cids };
    }

    describe('.applyZIndex()', function() {

      beforeEach(function() {
        testGraph = createGraph();
      });

      it('arranges line components and axis with default zindex', function() {
       testGraph .component([
          { cid: 'testComp', type: 'line', dataId: 'fakeData' },
          { cid: 'testComp2', type: 'line',
            dataId: 'fakeData', color: 'red'}
        ]);
        renderGraph();
        expect(getComponentDetails().zIndexes).toEqual([5, 5, 10]);
        expect(getComponentDetails().cids)
          .toEqual(['testComp', 'testComp2', 'gl-yaxis' ]);
      });

      it('sorts line components and axis with specified zIndex', function() {
       testGraph .component([
          { cid: 'testComp', type: 'line', dataId: 'fakeData', zIndex: 20 },
          { cid: 'testComp2', type: 'line',
            dataId: 'fakeData', color: 'red', zIndex: 5 }
        ]);
        renderGraph();
        expect(getComponentDetails().zIndexes).toEqual([5, 10, 20]);
        expect(getComponentDetails().cids)
          .toEqual([ 'testComp2', 'gl-yaxis', 'testComp' ]);
      });

      it('calls applyZindex on all the rendered components', function() {
        var componentApplyZIndexSpies;
        testGraph .component([
          { cid: 'testComp', type: 'line', dataId: 'fakeData', zIndex: 20 },
          { cid: 'testComp2', type: 'line',
            dataId: 'fakeData', color: 'red', zIndex: 5 }
        ]);
        componentApplyZIndexSpies = testGraph.component().cids()
          .map(function(cid) {
            return spyOn(testGraph.component().first(cid), 'applyZIndex')
                    .andCallThrough();
          });
        expect(componentApplyZIndexSpies.length > 0).toBe(true);
        renderGraph();
        componentApplyZIndexSpies.forEach(function(spy) {
          expect(spy).toHaveBeenCalled();
        });
      });

    });

  });

});
