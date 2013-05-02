define([
  'data/collection',
  'data/selection/selection'
],
function (dc, selection) {
  'use strict';

  var dataCollection;

  describe('stack', function () {

    var sampleData = [
      {
        'id' : 'cpu-sys',
        'title' : 'sys',
        'data': [
          { 'x': 1317279600000, 'y': 30 },
          { 'x': 1317695968421, 'y': 31 },
          { 'x': 1318112336842, 'y': 30 },
          { 'x': 1318528705263, 'y': 30 },
          { 'x': 1318945073684, 'y': 40 },
          { 'x': 1319361442105, 'y': 30 }
        ],
        dimensions: { x: 'x', y: 'y' }
      },
      {
        'id': 'cpu-user',
        'title': 'user',
        'data': [
          { 'x': 1317279600000, 'y': 20 },
          { 'x': 1317695968421, 'y': 19 },
          { 'x': 1318112336842, 'y': 21 },
          { 'x': 1318528705263, 'y': 21 },
          { 'x': 1318945073684, 'y': 21 },
          { 'x': 1319361442105, 'y': 21 }
        ],
        dimensions: { x: 'x', y: 'y' }
      },
      {
        'id': 'cpu-stolen',
        'title': 'stolen',
        'data': [
          { 'x': 1317279600000, 'y': 1 },
          { 'x': 1317695968421, 'y': 1 },
          { 'x': 1318112336842, 'y': 0 },
          { 'x': 1318528705263, 'y': 0 },
          { 'x': 1318945073684, 'y': 0 },
          { 'x': 1319361442105, 'y': 0 }
        ],
        dimensions: { x: 'x', y: 'y' }
      },
      {
        'id': 'cpu-wait',
        'title': 'wait',
        'data': [
          { 'x': 1317279600000, 'y': 9 },
          { 'x': 1317695968421, 'y': 9 },
          { 'x': 1318112336842, 'y': 9 },
          { 'x': 1318528705263, 'y': 9 },
          { 'x': 1318945073684, 'y': 9 },
          { 'x': 1319361442105, 'y': 9 }
        ],
        dimensions: { x: 'x', y: 'y' }
      },
      {
        'id': 'cpu-idle',
        'title': 'idle',
        'data': [
          { 'x': 1317279600000, 'y': 40 },
          { 'x': 1317695968421, 'y': 40 },
          { 'x': 1318112336842, 'y': 40 },
          { 'x': 1318528705263, 'y': 40 },
          { 'x': 1318945073684, 'y': 30 },
          { 'x': 1319361442105, 'y': 40 }
        ],
        dimensions: { x: 'x', y: 'y' }
      }
    ];

    function getIds(sources) {
      return sources.map(function(source) {
        return source.id;
      });
    }

    function createStackSource() {
      dataCollection.add({
        id: 'stacks',
        sources: '*',
        derivation: function(sources) {
          return sources.stack().all();
        }
      });
      dataCollection.updateDerivations();
    }

    beforeEach(function() {
      dataCollection = dc.create();
      dataCollection.add(sampleData);
      createStackSource();
    });

    it('generated stack data is defined', function () {
      expect(dataCollection.get('stacks')).toBeDefined();
    });

    it('generates stack data with right number of data', function () {
      expect(dataCollection.get('stacks').length).toBe(5);
    });

    it('generates stack data with right data ids', function () {
      expect(getIds(dataCollection.get('stacks')))
        .toEqual(['cpu-sys-stack', 'cpu-user-stack', 'cpu-stolen-stack',
            'cpu-wait-stack', 'cpu-idle-stack']);
    });

    it('generates the correct y0 dimension for all data sources', function() {
      var y0dim = selection.create(dataCollection.get('stacks')).dim('y0');
      expect(y0dim.get()).toEqual([0, 0, 0, 0, 0, 0]);
      expect(y0dim.get(1)).toEqual([30, 31, 30, 30, 40, 30]);
      expect(y0dim.get(2)).toEqual([50, 50, 51, 51, 61, 51]);
      expect(y0dim.get(3)).toEqual([51, 51, 51, 51, 61, 51]);
      expect(y0dim.get(4)).toEqual([60, 60, 60, 60, 70, 60]);
    });

  });

});
