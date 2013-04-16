define([
  'mixins/dispatch'
],
function(dispatchMixin) {
  'use strict';

  describe('mixins/dispatch', function() {

    var dispatchObj;

    beforeEach(function() {
      dispatchObj = dispatchMixin('testEvent1', 'testEvent2');
    });

    it('adds common component events by default', function() {
      expect(dispatchObj.on).toBeOfType('function');
      expect(dispatchObj.render).toBeOfType('function');
      expect(dispatchObj.update).toBeOfType('function');
      expect(dispatchObj.show).toBeOfType('function');
      expect(dispatchObj.hide).toBeOfType('function');
      expect(dispatchObj.destroy).toBeOfType('function');
    });

    it('appends additional events', function() {
      expect(dispatchObj.testEvent1).toBeOfType('function');
      expect(dispatchObj.testEvent2).toBeOfType('function');
    });

    it('dispatches events', function() {
      var handlerSpy = jasmine.createSpy();
      dispatchObj.on('render', handlerSpy);
      dispatchObj.render();
      expect(handlerSpy).toHaveBeenCalledOnce();
    });

  });

});
