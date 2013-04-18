define([
  'events/pubsub'
],
function(pubsubModule) {
  'use strict';

  describe('events.pubusb', function() {

    var pubsub, fooHandler, foo2Handler, foo3Handler, barHandler, ignoreHandler,
        arg1, arg2;

    beforeEach(function() {
      pubsub = pubsubModule.getSingleton();
      arg1 = 'arg1';
      arg2 = 'arg2';
      fooHandler = jasmine.createSpy();
      foo2Handler = jasmine.createSpy();
      foo3Handler = jasmine.createSpy();
      barHandler = jasmine.createSpy();
      ignoreHandler = jasmine.createSpy();
      pubsub.sub('foo', fooHandler);
      pubsub.sub('foo', foo2Handler);
      pubsub.sub('foo', foo3Handler);
      pubsub.sub('bar', barHandler);
      pubsub.sub('nothing', barHandler);
    });

    describe('.create()', function() {
      var p1, p2, p1Callback, p2Callback;

      beforeEach(function() {
        p1 = pubsubModule.create();
        p2 = pubsubModule.create();
        p1Callback = jasmine.createSpy();
        p2Callback = jasmine.createSpy();
        p1.sub('foo', p1Callback);
        p2.sub('foo', p2Callback);
        p1.pub('foo');
      });

      it('creates new instances', function() {
        expect(p1).not.toBe(p2);
      });

      it('only publishes/subscribes to the same instances', function() {
        expect(p1Callback).toHaveBeenCalledOnce();
        expect(p2Callback).not.toHaveBeenCalled();
      });

    });

    describe('.getSingleton()', function() {

      it('uses the same instance', function() {
        var p1, p2;
        p1 = pubsubModule.getSingleton();
        p2 = pubsubModule.getSingleton();
        expect(p1).toBe(p2);
      });

    });

    describe('.pub()/.sub()', function() {

      beforeEach(function() {
        pubsub.pub('foo', arg1, arg2)
          .pub('doesntexist')
          .pub('bar');
      });

      it('calls subscriber callbacks', function() {
        expect(barHandler).toHaveBeenCalledOnce();
      });

      it('calls multiple subscriber callbacks', function() {
        expect(fooHandler).toHaveBeenCalledOnce();
        expect(foo2Handler).toHaveBeenCalledOnce();
      });

      it('doesnt call non-subscribed callbacks', function() {
        expect(ignoreHandler).not.toHaveBeenCalledOnce();
      });

      it('passes the supplied args along to subscriber', function() {
        expect(fooHandler).toHaveBeenCalledWith(arg1, arg2);
      });

    });

    describe('.unsub()', function() {

      it('gracefully returns if topic doesnt exist', function() {
        var exceptionThrown = false;
        try {
          pubsub.unsub('doesntexist');
        } catch(e) {
          exceptionThrown = true;
        }
        expect(exceptionThrown).toBe(false);
      });

      it('unsubscribes all handlers from a topic', function() {
        pubsub.unsub('foo');
        pubsub.pub('foo');
        expect(fooHandler).not.toHaveBeenCalled();
        expect(foo2Handler).not.toHaveBeenCalled();
      });

      it('unsubscribes individual handlers from a topic', function() {
        pubsub.unsub('foo', fooHandler);
        pubsub.pub('foo');
        expect(fooHandler).not.toHaveBeenCalled();
        expect(foo2Handler).toHaveBeenCalledOnce();
      });

      it('unsubscribes an array of hanlders from a topic', function() {
        pubsub.unsub('foo', [fooHandler, foo2Handler]);
        pubsub.pub('foo');
        expect(fooHandler).not.toHaveBeenCalled();
        expect(foo2Handler).not.toHaveBeenCalled();
        expect(foo3Handler).toHaveBeenCalledOnce();
      });

    });

    describe('.clearAll()', function() {

      it('unsubscribes everything', function() {
        pubsub.clearAll();
        pubsub.pub('foo');
        pubsub.pub('bar');
        expect(fooHandler).not.toHaveBeenCalled();
        expect(foo2Handler).not.toHaveBeenCalled();
        expect(foo3Handler).not.toHaveBeenCalled();
        expect(barHandler).not.toHaveBeenCalled();
      });

    });

  });

});
