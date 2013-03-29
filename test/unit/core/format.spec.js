define([
  'core/format'
],
function(format) {
  'use strict';

  describe('core.format', function () {

    var epoch, dayAfterEpoch, domain;

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

      it('formats the date', function() {
        expect(format.timeDomain(domain))
          .toBe('Dec 31, 04:00 PM - Jan 1, 04:00 PM');
      });

      it('appends the optional suffix', function() {
        expect(format.timeDomain(domain, '(local)'))
          .toBe('Dec 31, 04:00 PM - Jan 1, 04:00 PM (local)');
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
