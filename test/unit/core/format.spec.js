define([
  'core/format'
],
function(format) {
  'use strict';

  describe('core.format', function () {

    var epoch, dayAfterEpoch, domain;

    function formatLocalDate(d) {
      return d3.time.format('%b %-e, %I:%M %p')(d);
    }

    beforeEach(function() {
      epoch = new Date(0);
      dayAfterEpoch = new Date(24 * 60 * 60 * 1000);
      domain = [epoch, dayAfterEpoch];
    });

    describe('.timeDomainUTC()', function() {

      it('formats the date in UTC format', function() {
        expect(format.timeDomainUTC(domain))
          .toBe('Jan 1, 12:00 AM - Jan 2, 12:00 AM');
      });

      it('appends an optional suffix', function() {
        expect(format.timeDomainUTC(domain, 'UTC'))
          .toBe('Jan 1, 12:00 AM - Jan 2, 12:00 AM UTC');
      });

    });

    describe('.timeDomain()', function() {
      var expected;

      it('formats the date', function() {
        expected = formatLocalDate(domain[0]) + ' - ' +
          formatLocalDate(domain[1]);
        expect(format.timeDomain(domain))
          .toBe(expected);
      });

      it('appends the optional suffix', function() {
        expected = formatLocalDate(domain[0]) + ' - ' +
          formatLocalDate(domain[1]) + ' (local)';
        expect(format.timeDomain(domain, '(local)'))
          .toBe(expected);
      });

    });

    describe('.standardDomain()', function() {

      beforeEach(function() {
        domain = [100, 200];
      });

      it('formats a simple linear domain', function() {
        expect(format.standardDomain(domain))
          .toBe('100 - 200');
      });

      it('appends the optional suffix', function() {
        expect(format.standardDomain(domain, 'ms'))
          .toBe('100 - 200 ms');
      });

    });

  });

});
