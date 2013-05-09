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

    describe('.length()', function() {

      it('returns length 0 on empty selection', function() {
        expect(sel.length()).toBe(0);
      });

      it('returns length 1 on single selection', function() {
        var source = {id: 'ORD', data: [1,2,3]};
        sel.add(source);
        expect(sel.length()).toBe(1);
      });

      it('returns correct length for multiple selections', function() {
        var sources = [
          {id: 'ORD', data: [1,2,3]},
          {id: 'DFW', data: [5,6,7]}];
        sel.add(sources);
        expect(sel.length()).toBe(2);
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
          dimensions: {
            latency: function(d) { return d.latency; },
            weight: function(d) { return d.weight; }
          }
        });
        sel.add({
          id: 'test2',
          data: [
            {latency: 10, weight: 2},
            {latency: 20, weight: 3},
            {latency: 30, weight: 4},
            {latency: 40, weight: 6},
            {latency: 50, weight: 3}],
          dimensions: {
            latency: function(d) { return d.latency; },
            weight: function(d) { return d.weight; }
          }
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

    describe('.filter()', function() {

      beforeEach(function() {
        sel.add({
          id: 'chicagoSales',
          data: [
            { year: 1991, carSales: 240 },
            { year: 1992, carSales: 300 },
            { year: 1993, carSales: 400 },
            { year: 1994, carSales: 320 },
            { year: 1995, carSales: 360 }],
          dimensions: {
            year: function(d) { return d.year; },
            carSales: function(d) { return d.carSales; }
          }
        });
        sel.add({
          id: 'bostonSales',
          data: [
            { year: 1993, carSales: 620 },
            { year: 1994, carSales: 520 },
            { year: 1995, carSales: 400 },
            { year: 1996, carSales: 480 },
            { year: 1997, carSales: 540 }],
          dimensions: {
            year: function(d) { return d.year; },
            carSales: function(d) { return d.carSales; }
          }
        });
      });

      describe('filter by range', function() {

        it('filters selection by year range', function() {
          expect(sel.filter('year', [1991, 1994]).dim('year').all())
            .toEqual([[ 1991, 1992, 1993, 1994 ], [ 1993, 1994 ]]);
        });

        it('filters years with carsales between 350 and 600', function() {
          expect(sel.filter('carSales', [350, 600]).dim('year').all())
            .toEqual([[ 1993, 1995 ], [ 1994, 1995, 1996, 1997 ]]);
        });

        it('total sales in the 1990-1993 (inclusive)', function() {
          expect(sel.filter('year', [1991, 1993]).dim('carSales')
            .concat().sum().get()).toBe(1560);
        });

       it('total sales in the 1996-1997 (inclusive)', function() {
          expect(sel.filter('year', [1996, 1997]).dim('carSales')
            .concat().sum().get()).toBe(1020);
        });

      });

    });

    describe('.filterByTags()', function() {

      beforeEach(function() {
        sel.add({
          id: 'chicagoSales',
          data: [
            { year: 1991, carSales: 240 },
            { year: 1992, carSales: 300 },
            { year: 1993, carSales: 400 },
            { year: 1994, carSales: 320 },
            { year: 1995, carSales: 360 }],
          tags: ['*', '+', 'testtag']
        });
        sel.add({
          id: 'bostonSales',
          data: [
            { year: 1993, carSales: 620 },
            { year: 1994, carSales: 520 },
            { year: 1995, carSales: 400 },
            { year: 1996, carSales: 480 },
            { year: 1997, carSales: 540 }],
          tags: ['*', '+', 'inactive']
        });
      });

      it('filters data sources by tag', function() {
        var tmp = sel.filterByTags('inactive');
        expect(tmp.all().length).toEqual(1);
      });

      it('filters data sources by array of tags ', function() {
        var tmp = sel.filterByTags(['testtag', 'inactive']);
        expect(tmp.all().length).toEqual(0);
      });

      it('does not filter data sources with out tag ', function() {
        var tmp = sel.filterByTags(['notthere']);
        expect(tmp.all().length).toEqual(2);
      });

      it('filters all sources which has same tag ', function() {
        var tmp = sel.filterByTags(['*']);
        expect(tmp.all().length).toEqual(0);
      });

    });

  });

});
