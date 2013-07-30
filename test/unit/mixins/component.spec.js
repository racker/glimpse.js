define([
  'core/object',
  'mixins/mixins'
],
function(obj, mixins) {
  'use strict';

  describe('mixins.component', function() {
    var component;

    function createComponent() {
      var component = function() {};
      component._ = { config: {} };
      return component;
    }

    beforeEach(function() {
      component = createComponent();
      obj.extend(component, mixins.component);
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
    });

  });

});
