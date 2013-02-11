define([
  'core/config'
],
function(config) {
  'use strict';

  describe('core.config', function () {
    var target, configObj, rebindSrc;

    beforeEach(function () {
      var mixinResult;
      target = {};
      configObj = {};
      rebindSrc = {};
      mixinResult = config.mixin.call(target, configObj);
      // simulate object.extend(target, mixinResult);
      target.config = mixinResult.config;
      target.rebind = mixinResult.rebind;
      target.reapply = mixinResult.reapply;
    });

    describe('without named methods', function () {

      beforeEach(function () {
      });

      it('adds a config() method', function () {
        expect(target.config).toBeDefined();
      });

      it('sets individual config options with config()', function () {
        target.config('foo', 'bar');
        expect(configObj.foo).toBe('bar');
      });

      it('sets multiple config options with config()', function () {
        target.config({ 'foo': 'bar', 'biz': 'bang' });
        expect(configObj.foo).toBe('bar');
        expect(configObj.biz).toBe('bang');
      });

      it('gets individual config options with config()', function () {
        target.config('foo', 'bar');
        expect(target.config('foo')).toBe('bar');
      });

      it('returns undefined for unset options with config()', function () {
        expect(target.config('foo')).not.toBeDefined();
      });

      it('returns all config options when no args provided', function () {
        var cnf = { 'foo': 'bar', 'biz': 'bang' };
        target.config(cnf);
        expect(target.config()).toEqual(cnf);
      });

    });

    describe('with named methods', function () {

      beforeEach(function () {
        target = config.mixin.call(target, configObj, 'width');
      });

      it('adds an optional named method if supplied', function () {
        target.width(100);
        expect(target.width()).toBe(100);
      });

      it('changes the same option by config() or named method', function () {
        target.config('width', 100);
        expect(target.width()).toBe(100);
      });

    });

    describe('rebind() and reapply()', function() {

      beforeEach(function() {
        rebindSrc.foo = function() {};
        rebindSrc.blah = function() {};
        rebindSrc.noop = function() {};
        spyOn(rebindSrc, 'foo');
        spyOn(rebindSrc, 'blah');
        // Non-bound method
        spyOn(rebindSrc, 'noop');
      });

      describe('rebind()', function() {

        beforeEach(function() {
          target.rebind(rebindSrc, 'foo', 'blah');
        });

        it('rebinds the setter method from src to target', function() {
          target.foo('bar');
          expect(rebindSrc.foo).toHaveBeenCalledWith('bar');
        });

        it('sets the target config with the set value', function() {
          target.foo('bar');
          expect(target.config('foo')).toBe('bar');
        });

        it('adds a getter to the target', function() {
          target.foo('bar');
          expect(target.foo()).toBe('bar');
        });

        it('sets an array on target config when multiple args are passed',
        function() {
          target.foo('bar', 'bang');
          expect(target.config('foo')).toEqual(['bar', 'bang']);
        });

        it('sets a 3 item array on target config when multiple args are passed',
        function() {
          target.foo('bar', 'bang', 'biz');
          expect(target.config('foo')).toEqual(['bar', 'bang', 'biz']);
        });

        it('reapplies all bound config values to the src', function() {
          target.config({
            foo: 'bar',
            blah: 'meh',
            noop: 'nothing'
          });
          expect(rebindSrc.foo).toHaveBeenCalledWith('bar');
          expect(rebindSrc.blah).toHaveBeenCalledWith('meh');
          expect(rebindSrc.noop).not.toHaveBeenCalled();
        });

        it('still sets/gets multiple config values even with bound methods',
        function() {
          target.config({
            foo: 'bar',
            blah: 'meh',
            noop: 'nothing'
          });
          expect(target.config('foo')).toBe('bar');
          expect(target.config('blah')).toBe('meh');
          expect(target.config('noop')).toBe('nothing');
        });

      });

      describe('reapply()', function() {

        beforeEach(function() {
          target.config({
            foo: 'abc',
            blah: 'def',
            noop: 'ghi'
          });
          target.rebind(rebindSrc, 'foo', 'blah');
        });

        it('calls all the methods that are bound', function() {
          target.reapply();
          expect(rebindSrc.foo).toHaveBeenCalledOnce();
          expect(rebindSrc.blah).toHaveBeenCalledOnce();
          expect(rebindSrc.noop).not.toHaveBeenCalled();
        });

        it('calls bound methods with values from the config', function() {
          target.reapply();
          expect(rebindSrc.foo).toHaveBeenCalledWith('abc');
          expect(rebindSrc.blah).toHaveBeenCalledWith('def');
        });

        it('optionally filters by include list', function() {
          target.reapply(['foo']);
          expect(rebindSrc.foo).toHaveBeenCalledOnce();
          expect(rebindSrc.blah).not.toHaveBeenCalled();
        });

      });

    });

  });

});
