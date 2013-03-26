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

    function areDatesEqual(utcData, actualDate) {
      return utcData.getFullYear() === actualDate.getUTCFullYear() &&
         utcData.getMonth() === actualDate.getUTCMonth() &&
         utcData.getDate() === actualDate.getUTCDate();
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

    describe('.toUTCDate()', function() {
      var baseEpoch, baseDate;
      beforeEach(function() {
        baseEpoch = 0;
        baseDate = new Date(baseEpoch);
      });

      it('returns a date when input is a timestamp', function() {
        var date = dataFns.toUTCDate(baseDate.getTime());
        expect(areDatesEqual(date, baseDate)).toBe(true);
      });

      it('returns a date when input is a string date', function() {
         var date = dataFns.toUTCDate(baseDate.toString());
         expect(areDatesEqual(date, baseDate)).toBe(true);
      });

      it('returns an array of dates when input is a array of timestamps',
        function() {
          var dates, utcDates, i = 0;
          dates = [baseDate, new Date(baseEpoch + 1), new Date(baseEpoch + 2)];
          utcDates = dataFns.toUTCDate(dates);
          expect(Array.isArray(utcDates)).toBe(true);
          for (i = 0; i < utcDates.length; i++) {
            expect(areDatesEqual(utcDates[i], dates[i])).toBe(true);
          }
      });

      it('returns null if data is null', function() {
        var date = dataFns.toUTCDate(null);
        expect(date).toBe(null);
      });

      it('returns undefined if data is undefined', function() {
        var date = dataFns.toUTCDate(undefined);
        expect(date).toBe(undefined);
      });

      it('returns data if data is an invalid data', function() {
        var date = dataFns.toUTCDate('test');
        expect(date).toBe('test');
      });

    });

  });

});
