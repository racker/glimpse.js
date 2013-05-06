define([
  'data/functions'
], function (dataFns) {
  'use strict';

  describe('data functions', function () {

    var data, dataSource;

    function setupDataSource(data, dim) {
      dataSource = {
        data: data,
        dimensions: dim
      };
    }

    beforeEach(function() {
      var dim = {
        time: 'ord.time',
        latency: 'ord.latency'
      };
      data = {
        ord : {
          time: 'today',
          latency: 100
        }
      };
      setupDataSource(data, dim);
    });

    describe('.dimension()', function() {

      it('returns the dimension function if alias is specified', function() {
        expect(typeof dataFns.dimension(dataSource, 'time')).toBe('function');
        expect(typeof dataFns.dimension(dataSource, 'latency'))
          .toBe('function');
      });

      it('returns accessor of string if dimension lookup failed', function() {
        var abcFn = dataFns.dimension(dataSource, 'abc'),
            defFn = dataFns.dimension(dataSource, 'def');

        expect(abcFn).toBeDefined();
        expect(defFn).toBeDefined();
        expect(abcFn({'abc': 123})).toBe(123);
        expect(defFn({'def': 123})).toBe(123);
      });

      it('returns correct dimension function', function() {
        expect(dataFns.dimension(dataSource, 'time')(data)).toBe('today');
        expect(dataFns.dimension(dataSource, 'latency')(data)).toBe(100);
      });

    });

  });

});
