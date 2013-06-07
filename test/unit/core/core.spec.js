define([
  'core/core',
  'events/pubsub'
],
function(core, pubsub) {
  'use strict';

  describe('core.core', function () {

    describe('helper api', function() {

      it('should have object helper exposed', function () {
        expect(core.obj).toBeDefined();
      });

      it('should have string helper exposed', function () {
        expect(core.string).toBeDefined();
      });

      it('should have array helper exposed', function () {
        expect(core.array).toBeDefined();
      });

      it('should have function helper exposed', function () {
        expect(core.fn).toBeDefined();
      });

      it('should have format helper exposed', function () {
        expect(core.format).toBeDefined();
      });

    });

    it('should have a version', function () {
      expect(core.version).toBeDefined();
    });

    it('should have components loaded', function () {
      expect(core.components).toBeDefined();
    });

    it('should have data collection exposed', function () {
      expect(core.dataCollection).toBeDefined();
    });

    it('should have pubsub exposed', function () {
      expect(core.pubsub).toBeDefined();
    });

    it('should have the global pubsub exposed', function () {
      expect(core.globalPubsub).toBe(pubsub.getSingleton());
    });

  });

});
