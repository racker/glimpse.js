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

      it('returns the dimension function', function() {
        expect(typeof dataFns.dimension(dataSource, 'time')).toBe('function');
        expect(typeof dataFns.dimension(dataSource, 'latency'))
          .toBe('function');
      });

      it('returns null if invalid dimension', function() {
        expect(dataFns.dimension(dataSource, 'abc')).toBe(null);
        expect(dataFns.dimension(dataSource, 'def')).toBe(null);
        expect(dataFns.dimension(dataSource, '123')).toBe(null);
      });

      it('returns correct dimension function', function() {
        expect(dataFns.dimension(dataSource, 'time')(data)).toBe('today');
        expect(dataFns.dimension(dataSource, 'latency')(data)).toBe(100);
      });

    });

  });

});
