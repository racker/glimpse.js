define([
  'components/domain-label',
  'core/format',
  'data/functions',
  'test-util/component',
  'data/collection'
],
function(domainLabel, format, dataFns, compUtil, dataCollection) {
  'use strict';

  describe('x domain label', function() {
    var testDomainLabel, domain, handlerSpy;

    function updateDomain(data) {
      domain.upsert({ id: '$domain', x:data });
    }

    beforeEach(function() {
      testDomainLabel = domainLabel();
      domain = dataCollection.create();
      domain.add({
        id: '$domain',
        x: [new Date(0), new Date(34347661000)]
      });
      handlerSpy = jasmine.createSpy();
    });

    describe('.render()', function() {

      beforeEach(function() {
        testDomainLabel.dispatch.on('render', handlerSpy);
        testDomainLabel
          .config('suffix', 'UTC')
          .data(domain)
          .render(jasmine.svgFixture());
      });

      it('dispatches a "render" event', function() {
        expect(handlerSpy).toHaveBeenCalledOnce();
      });

      it('renders the label', function() {
        expect(compUtil.getByCid('gl-domain-label').node()).toBeDefined();
      });

      it('formats dates correctly using default formatter', function() {
        expect(testDomainLabel.text())
          .toBe('Jan 1, 12:00 AM - Feb 2, 01:01 PM UTC');
      });

      it('updates the suffix', function() {
        testDomainLabel.config('suffix', 'foo');
        expect(testDomainLabel.text())
          .toBe('Jan 1, 12:00 AM - Feb 2, 01:01 PM foo');
      });

      it('ignores null suffix', function() {
        testDomainLabel.config('suffix', null);
        expect(testDomainLabel.text())
          .toBe('Jan 1, 12:00 AM - Feb 2, 01:01 PM');
      });

      it('renders an inner label component', function() {
        expect(testDomainLabel.root().select('.gl-label').empty()).toBe(false);
      });

      it('updates the text when the domain changes', function() {
        updateDomain([new Date(0), new Date(44715661000)]);
        testDomainLabel.update();
        expect(testDomainLabel.text())
          .toBe('Jan 1, 12:00 AM - Jun 2, 01:01 PM UTC');
      });

      it('works with linear data and non-timescale formatter', function() {
        updateDomain([5, 100]);
        testDomainLabel
          .config({
            suffix: null,
            formatter: format.standardDomain
          }).update();
        expect(testDomainLabel.text())
          .toBe('5 - 100');
      });

    });

    describe('.update()', function() {

      beforeEach(function() {
        testDomainLabel
          .config('suffix', 'UTC')
          .data(domain)
          .render(jasmine.svgFixture());
        testDomainLabel.dispatch.on('update', handlerSpy);
      });

      it('dispatches an "update" event', function() {
        //testDomainLabel.update();
        //expect(handlerSpy).toHaveBeenCalledOnce();
      });

    });

    describe('.destroy()', function() {

      beforeEach(function() {
        testDomainLabel
          .config('suffix', 'UTC')
          .data(domain)
          .render(jasmine.svgFixture());
        testDomainLabel.dispatch.on('destroy', handlerSpy);
        testDomainLabel.destroy();
      });

      it('dispatches an "destroy" event', function() {
        expect(handlerSpy).toHaveBeenCalledOnce();
      });

    });

  });

});
