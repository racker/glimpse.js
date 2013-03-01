define([
  'data/selection/selection'
],
function (selection) {
  'use strict';

  describe('selection', function() {

    var sel;

    beforeEach(function() {
      sel = selection.create();
    });

    describe('.create', function () {

      it('creates a selection that is defined', function() {
        expect(sel).toBeDefined();
      });

    });

    describe('.add()', function() {

      it('adds source to selection', function() {
        var source = {id: 'ORD', data: [1,2,3]};
        sel.add(source);
        expect(sel.get()).toEqual(source);
      });

      it('adds multiple source to selection', function() {
        var sources = [
          {id: 'ORD', data: [1,2,3]},
          {id: 'DFW', data: [5,6,7]}];
        sel.add(sources);
        expect(sel.all()).toEqual(sources);
      });

    });

    describe('.map()', function() {

       it('applies a map function to selection', function() {
        var sources = [
          {id: 'ORD', data: [1,2,3]},
          {id: 'DFW', data: [5,6,7]}];
        sel.add(sources);
        sel = sel.map(function(d) { return d.data; });
        expect(sel.all()).toEqual([[1,2,3], [5,6,7]]);
      });

      it('applies another map function to selection', function() {
        var sources = [
          {id: 'ORD', data: [1,2,3]},
          {id: 'DFW', data: [5,6,7]}];
        sel.add(sources);
        sel = sel.map(function(d) { d.data.push('abc'); return d.data; });
        expect(sel.all()).toEqual([[1,2,3,'abc'], [5,6,7,'abc']]);
      });

    });

    describe('.all()', function() {

      it('returns raw selection values - 1', function() {
        var d = {id: 'ORD', data: [1,2,3]};
        sel.add(d);
        expect(sel.all()).toEqual([d]);
      });


      it('returns raw selection values - 2', function() {
        var d1 = {id: 'ORD', data: [1,2,3]},
            d2 = {id: 'DFW', data: [5,6,7]};
        sel.add(d1);
        sel.add(d2);
        expect(sel.all()).toEqual([d1, d2]);
      });

    });

    describe('.get()', function() {

      it('gets the selection by index', function() {
        var d = {id: 'ORD', data: [1,2,3]};
        sel.add(d);
        expect(sel.get()).toEqual(d);
        expect(sel.get(0)).toEqual(d);
      });


      it('gets the selection by index - 2', function() {
        var d1 = {id: 'ORD', data: [1,2,3]},
            d2 = {id: 'DFW', data: [5,6,7]};
        sel.add(d1);
        sel.add(d2);
        expect(sel.get()).toEqual(d1);
        expect(sel.get(1)).toEqual(d2);
      });

    });

    describe('.dim()', function() {

      beforeEach(function() {
        sel.add({
          id: 'test1',
          data: [
            {latency: 100, weight: 20},
            {latency: 200, weight: 30},
            {latency: 300, weight: 40},
            {latency: 400, weight: 60},
            {latency: 500, weight: 30}],
          latency: function(d) { return d.latency; },
          weight: function(d) { return d.weight; }
        });
        sel.add({
          id: 'test2',
          data: [
            {latency: 10, weight: 2},
            {latency: 20, weight: 3},
            {latency: 30, weight: 4},
            {latency: 40, weight: 6},
            {latency: 50, weight: 3}],
          latency: function(d) { return d.latency; },
          weight: function(d) { return d.weight; }
        });
      });

      it('gets latency dimension', function() {
        expect(sel.dim('latency').all())
          .toEqual([[ 100, 200, 300, 400, 500 ], [ 10, 20, 30, 40, 50 ]]);
      });

      it('gets weight dimension', function() {
        expect(sel.dim('weight').all())
          .toEqual([[ 20, 30, 40, 60, 30 ], [ 2, 3, 4, 6, 3 ]]);
      });

    });

  });

});
