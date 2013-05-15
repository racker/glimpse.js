define([
  'data/collection',
  'data/selection/selection'
],
function (dc, selection) {
  'use strict';

  var dataCollection, dataCollection2;

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
    ],


    cpuData = [
    { 'time':1317279600000,'sys':30,'user':20,'stolen':1,'wait':9,'idle':40 },
    { 'time':1317695968421,'sys':31,'user':19,'stolen':1,'wait':9,'idle':40 },
    { 'time':1318112336842,'sys':30,'user':21,'stolen':0,'wait':9,'idle':40 },
    { 'time':1318528705263,'sys':30,'user':21,'stolen':0,'wait':9,'idle':40 },
    { 'time':1318945073684,'sys':40,'user':21,'stolen':0,'wait':9,'idle':40 },
    { 'time':1319361442105,'sys':30,'user':21,'stolen':0,'wait':9,'idle':40 }],

    sampleData2 = [
      {
        'id' : 'cpu-sys',
        'title' : 'sys',
        'data': cpuData,
        dimensions: { x: 'time', y: 'sys' }
      },
      {
        'id': 'cpu-user',
        'title': 'user',
        'data': cpuData,
        dimensions: { x: 'time', y: 'user' }
      },
      {
        'id': 'cpu-stolen',
        'title': 'stolen',
        'data': cpuData,
        dimensions: { x: 'time', y: 'stolen' }
      },
      {
        'id': 'cpu-wait',
        'title': 'wait',
        'data': cpuData,
        dimensions: { x: 'time', y: 'wait' }
      },
      {
        'id': 'cpu-idle',
        'title': 'idle',
        'data': cpuData,
        dimensions: { x: 'time', y: 'idle' }
      }
    ];

    function getIds(sources) {
      return sources.map(function(source) {
        return source.id;
      });
    }

    function createStackSource(dc) {
      dc.add({
        id: 'stacks',
        sources: '*',
        derivation: function(sources) {
          return sources.stack().all();
        }
      });
      dc.updateDerivations();
    }

    describe('derives stack with seperate data objects', function() {

      beforeEach(function() {
        dataCollection = dc.create();
        dataCollection.add(sampleData);
        createStackSource(dataCollection);
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

    describe('derives stack with single data view', function() {

      beforeEach(function() {
        dataCollection2 = dc.create();
        dataCollection2.add(sampleData2);
        createStackSource(dataCollection2);
      });

      it('generated stack data is defined', function () {
        expect(dataCollection2.get('stacks')).toBeDefined();
      });

      it('generates stack data with right number of data', function () {
        expect(dataCollection2.get('stacks').length).toBe(5);
      });

      it('generates stack data with right data ids', function () {
        expect(getIds(dataCollection2.get('stacks')))
          .toEqual(['cpu-sys-stack', 'cpu-user-stack', 'cpu-stolen-stack',
              'cpu-wait-stack', 'cpu-idle-stack']);
      });

      it('generates the correct y0 dimension for all data sources', function() {
        var y0dim = selection.create(dataCollection2.get('stacks')).dim('y0');
        expect(y0dim.get()).toEqual([0, 0, 0, 0, 0, 0]);
        expect(y0dim.get(1)).toEqual([30, 31, 30, 30, 40, 30]);
        expect(y0dim.get(2)).toEqual([50, 50, 51, 51, 61, 51]);
        expect(y0dim.get(3)).toEqual([51, 51, 51, 51, 61, 51]);
        expect(y0dim.get(4)).toEqual([60, 60, 60, 60, 70, 60]);
      });

    });

  });

});
