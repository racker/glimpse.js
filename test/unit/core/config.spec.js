define([
  'd3',
  'core/config'
],
function (d3, config) {
  'use strict';

  describe('core.config', function () {
    var target, configObj, result;

    beforeEach(function () {
      target = {};
      configObj = {};
    });

    describe('without named methods', function () {

      beforeEach(function () {
        result = config(target, configObj);
        // simulate mixin
        target.config = result.config;
      });

      it('adds a config() method', function () {
        expect(result.config).toBeDefined();
      });

      it('sets individual config options with config()', function () {
        result.config('foo', 'bar');
        expect(configObj.foo).toBe('bar');
      });

      it('sets multiple config options with config()', function () {
        result.config({ 'foo': 'bar', 'biz': 'bang' });
        expect(configObj.foo).toBe('bar');
        expect(configObj.biz).toBe('bang');
      });

      it('gets individual config options with config()', function () {
        result.config('foo', 'bar');
        expect(result.config('foo')).toBe('bar');
      });

      it('returns undefined for unset options with config()', function () {
        expect(result.config('foo')).not.toBeDefined();
      });

      it('returns all config options when no args provided', function () {
        var cnf = { 'foo': 'bar', 'biz': 'bang' };
        result.config(cnf);
        expect(result.config()).toEqual(cnf);
      });

    });

    describe('with named methods', function () {

      beforeEach(function () {
        result = config(target, configObj, ['width']);
      });

      it('adds an optional named method if supplied', function () {
        result.width(100);
        expect(result.width()).toBe(100);
      });

      it('changes the same option by config() or named method', function () {
        result.config('width', 100);
        expect(result.width()).toBe(100);
      });

    });

  });

});
