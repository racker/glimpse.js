define([
  'data/dimension/dimension'
], function (dimension) {
  'use strict';

  describe('dimension', function() {

    var dim;

    beforeEach(function() {
      dim = dimension.create();
    });

    describe('.create', function () {

      it('creates a dimension that is defined', function() {
        expect(dim).toBeDefined();
      });

    });

    describe('.add()', function() {

      it('adds source to dimension', function() {
        var source = {id: 'ORD', data: [1,2,3]};
        dim.add(source);
        expect(dim.get()).toEqual(source);
      });

      it('adds multiple source to dimension', function() {
        var sources = [
          {id: 'ORD', data: [1,2,3]},
          {id: 'DFW', data: [5,6,7]}];
        dim.add(sources);
        expect(dim.all()).toEqual(sources);
      });

    });

    describe('.map()', function() {

       it('applies a map function to dimension', function() {
        var sources = [
          {id: 'ORD', data: [1,2,3]},
          {id: 'DFW', data: [5,6,7]}];
        dim.add(sources);
        dim = dim.map(function(d) { return d.data; });
        expect(dim.all()).toEqual([[1,2,3], [5,6,7]]);
      });

      it('applies another map function to dimension', function() {
        var sources = [
          {id: 'ORD', data: [1,2,3]},
          {id: 'DFW', data: [5,6,7]}];
        dim.add(sources);
        dim = dim.map(function(d) { d.data.push('abc'); return d.data; });
        expect(dim.all()).toEqual([[1,2,3,'abc'], [5,6,7,'abc']]);
      });

    });

    describe('.all()', function() {

      it('returns raw dimension values - 1', function() {
        var d = {id: 'ORD', data: [1,2,3]};
        dim.add(d);
        expect(dim.all()).toEqual([d]);
      });


      it('returns raw dimension values - 2', function() {
        var d1 = {id: 'ORD', data: [1,2,3]},
            d2 = {id: 'DFW', data: [5,6,7]};
        dim.add(d1);
        dim.add(d2);
        expect(dim.all()).toEqual([d1, d2]);
      });

    });

    describe('.get()', function() {

      it('gets the dimension by index', function() {
        var d = {id: 'ORD', data: [1,2,3]};
        dim.add(d);
        expect(dim.get()).toEqual(d);
        expect(dim.get(0)).toEqual(d);
      });


      it('gets the dimension by index - 2', function() {
        var d1 = {id: 'ORD', data: [1,2,3]},
            d2 = {id: 'DFW', data: [5,6,7]};
        dim.add(d1);
        dim.add(d2);
        expect(dim.get()).toEqual(d1);
        expect(dim.get(1)).toEqual(d2);
      });

    });

    describe('.sum()', function() {

      it('computes correct sum - 1', function() {
        dim.add([[ 100, 200, 300, 400, 500 ]]);
        expect(dim.sum().get()).toEqual(1500);
      });

      it('computes correct sum - 2', function() {
        dim.add([[ 100, -200, -300, 400, 500 ]]);
        expect(dim.sum().get()).toEqual(500);
      });

    });

    describe('.avg()', function() {

      it('computes correct avg - 1', function() {
        dim.add([[ 100, 200, 300, 400, 500 ]]);
        expect(dim.avg().get()).toEqual(300);
      });

      it('computes correct avg - 2', function() {
        dim.add([[ 100, -200, -300, 400, 500 ]]);
        expect(dim.avg().get()).toEqual(100);
      });

    });

     describe('.concat()', function() {

      it('cocnat - 1', function() {
        dim.add([[ 100, 200, 300, 400, 500 ]]);
        expect(dim.concat().get()).toEqual(
          [ 100, 200, 300, 400, 500 ]);
      });

      it('cocnat - 2', function() {
        dim.add([[ 100, 200, 300, 400, 500 ], [ 100, -200, -300, 400, 500 ]]);
        expect(dim.concat().get()).toEqual(
          [ 100, 200, 300, 400, 500 , 100, -200, -300, 400, 500 ]);
      });

    });

    describe('.min()', function() {

      it('calculates min - 1', function() {
        dim.add([[ 100, 200, 300, 400, 500 ]]);
        expect(dim.min().get()).toEqual(100);
      });

      it('calculates min - 2', function() {
        dim.add([[ 100, 200, 300, 400, 500 ], [ 100, -200, -300, 400, 500 ]]);
        expect(dim.min().all()).toEqual(
          [ 100, -300]);
      });

    });

   describe('.max()', function() {

      it('calculates max - 1', function() {
        dim.add([[ 100, 200, 300, 400, 500 ]]);
        expect(dim.max().get()).toEqual(500);
      });

      it('calculates max - 2', function() {
        dim.add([[ 100, 200, 300, 400, 500 ], [ 100, -200, -300, 400, 1000 ]]);
        expect(dim.max().all()).toEqual(
          [ 500, 1000]);
      });

    });

    describe('.extent()', function() {

      it('calculates extent - 1', function() {
        dim.add([[ 100, 200, 300, 400, 500 ]]);
        expect(dim.extent().get()).toEqual([100, 500]);
      });

      it('calculates extent - 2', function() {
        dim.add([[ 100, 200, 300, 400, 500 ], [ 100, -200, -300, 400, 1000 ]]);
        expect(dim.extent().all()).toEqual(
          [ [100, 500], [-300, 1000] ]);
      });

    });

    describe('.round()', function() {

      it('rounds values - 1', function() {
        dim.add([[ 100.4, 200.7, 300.3, 400.22, 500.55 ]]);
        expect(dim.round().get())
          .toEqual([100, 201, 300, 400, 501 ]);
      });

      it('rounds values - 2', function() {
        dim.add([[ 100.4, 200.7, 300.3, 400.22, 500.55 ],
                 [ 100.673, -200.213, -300.83, 400.23, 1000.44 ]]);
        expect(dim.round().all()).toEqual(
          [ [100, 201, 300, 400, 501 ], [ 101, -200, -301, 400, 1000 ] ]);
      });

    });

    describe('method chaining', function() {

      it('chains concat, sum', function() {
         dim.add([[ 100, 200, 300, 400, 500 ], [ 100, -200, -300, 400, 500 ]]);
         expect(dim.concat().sum().get()).toBe(2000);
         expect(dim.sum().concat().sum().get()).toBe(2000);
         expect(dim.sum().concat().get()).toEqual([1500, 500]);
      });

     it('chains concat, sum', function() {
         dim.add([[ 100, 200, 300, 400, 500 ], [ 100, -200, -300, 400, 500 ]]);
         expect(dim.concat().avg().get()).toBe(200);
         // Don't compute average of averages irl.
         expect(dim.avg().concat().avg().get()).toBe(200);
         expect(dim.avg().concat().get()).toEqual([300, 100]);
      });

      it('chains sum, round, concat', function() {
        dim.add([[ 100.1, 200.2, 300.6, 400.234, 500.843252 ],
                 [ 100.5, -200.12321, -300.643, 400.234, 500.12312 ]]);
        // Don't round and then sum irl.
        expect(dim.concat().round().sum().get()).toBe(2002);
        expect(dim.concat().sum().round().get()).toBe(2002);
      });


    });

  });

});
