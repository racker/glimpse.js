define([
  'core/object',
  'mixins/mixins',
  'events/pubsub'
],
function(obj, mixins, pubsubModule) {
  'use strict';

  describe('mixins.component', function() {
    var component, pubsub;

    function createComponent() {
      var component = function() {};
      component._ = { config: {} };
      return component;
    }

    beforeEach(function() {
      component = createComponent();
      obj.extend(component, mixins.component);
      pubsub = pubsubModule.getSingleton();
    });

    it('call to init defines its internal state', function() {
      component.init();
      expect(component._.globalPubsub).toBeDefined();
      expect(component.dispatch).toBeDefined();
      expect(component.zIndex).toBeDefined();
      expect(component.target).toBeDefined();
      expect(component.cid).toBeDefined();
      expect(component.rootId).toBeDefined();
    });

    it('has component lifecycle methods defined', function() {
      expect(component.root).toBeDefined();
      expect(component.init).toBeDefined();
      expect(component.data).toBeDefined();
      expect(component.update).toBeDefined();
      expect(component.render).toBeDefined();
      expect(component.destroy).toBeDefined();
      expect(component.isRendered).toBeDefined();
      expect(component.on).toBeDefined();
      expect(component.off).toBeDefined();
    });

    it('the callback is executed when on is called', function() {
      var callbackSpy;
      component.init();
      callbackSpy = jasmine.createSpy();
      component.on('foo', callbackSpy);
      pubsub.pub('foo');
      expect(callbackSpy).toHaveBeenCalledOnce();
    });

    it('the callback is not executed when off is called', function() {
      var callbackSpy;
      component.init();
      callbackSpy = jasmine.createSpy();
      component.off('foo', callbackSpy);
      pubsub.pub('foo');
      expect(callbackSpy).not.toHaveBeenCalled();
    });

  });

});
