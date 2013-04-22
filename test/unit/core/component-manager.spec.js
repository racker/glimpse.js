define([
  'core/component-manager',
  'components/line'
],
function(componentManager, lineComponent) {
  'use strict';

  describe('core.component-manager', function() {
    var compMgr, line, result, fooLine, barLine, fooLineConfig,
        barLineConfig, handlerSpy;

    function cidMap(c) {
      return c.cid();
    }

    beforeEach(function() {
      compMgr = componentManager.create();
      handlerSpy = jasmine.createSpy();
      line = lineComponent().config('cid', 'test-line');
      result = null;
      fooLineConfig = { type: 'line', cid: 'foo' };
      barLineConfig = { type: 'line', cid: 'bar' };
      compMgr.add([ fooLineConfig, barLineConfig ]);
      fooLine = compMgr.first('foo');
      barLine = compMgr.first('bar');
    });

    describe('static methods', function() {
      var mgr;

      describe('.create()', function() {

        it('creates an instance', function() {
          expect(compMgr).toBeDefined();
        });

        it('auto-adds a passed component', function() {
          mgr = componentManager.create(fooLine);
          expect(mgr.first('foo')).toBeDefined();
        });

        it('auto-adds an array of passed components', function() {
          mgr = componentManager.create([ fooLine, barLine ]);
          expect(mgr.first('foo')).toBeDefined();
          expect(mgr.first('bar')).toBeDefined();
        });

        it('auto-adds a passed component config', function() {
          mgr = componentManager.create(fooLineConfig);
          expect(mgr.first('foo')).toBeDefined();
        });

        it('auto-adds an array of passed component configs', function() {
          mgr = componentManager.create([ fooLineConfig, barLineConfig ]);
          expect(mgr.first('foo')).toBeDefined();
          expect(mgr.first('bar')).toBeDefined();
        });

      });

      describe('.parse()', function() {

        it('parse a component instance from a config', function() {
          result = componentManager.parse({ type: 'line' });
          expect(result.length).toBe(1);
          expect(result[0].config('type')).toBe('line');
          expect(result[0].render).toBeDefined();
        });

        it('parses an array of component configs', function() {
          var c1, c2;
          result = componentManager.parse([
            { type: 'line', cid: 'c1' },
            { type: 'area', cid: 'c2' }
          ]);
          c1 = result.filter(function(c) {
            return c.cid() === 'c1';
          })[0];
          c2 = result.filter(function(c) {
            return c.cid() === 'c2';
          })[0];
          expect(result.length).toBe(2);
          expect(c1.config('type')).toBe('line');
          expect(c2.config('type')).toBe('area');
        });

      });

      describe('.serialize()', function() {

        it('serializes a single component into a json config', function() {
          var expected;
          expected = fooLine.config();
          result = componentManager.serialize(fooLine);
          expect(result.length).toEqual(1);
          expect(result[0]).toEqual(expected);
        });

        it('serializes an array of components into a json config', function() {
          var expected;
          expected = [ fooLine.config(), barLine.config() ];
          result = componentManager.serialize([ fooLine, barLine ]);
          expect(result.length).toEqual(2);
          expect(result).toEqual(expected);
        });

      });

    });

    describe('.add()', function() {
      var c1, c2, c3;

      beforeEach(function() {
        c1 = lineComponent().config({
          cid: 'c1'
        });
        c2 = lineComponent().config({
          cid: 'c2'
        });
        c3 = lineComponent().config({
          cid: 'c1'
        });
        compMgr.dispatch.on('error', handlerSpy);
      });

      it('adds a component instance', function() {
        compMgr.add(line);
        expect(compMgr.first('test-line').cid()).toBe('test-line');
      });

      it('returns the added instance', function() {
        result = compMgr.add({ type: 'line', cid: 'line-cid' });
        expect(result.length).toBe(1);
        expect(result[0].cid()).toBe('line-cid');
        expect(result[0].config('type')).toBe('line');
      });

      it('adds multiple component instances', function() {
        compMgr.remove();
        compMgr.add([c1, c2]);
        expect(compMgr.get().length).toBe(2);
        expect(compMgr.first('c1')).toBeDefined();
        expect(compMgr.first('c2')).toBeDefined();
      });

      it('dispatches an "error" event if cid is not unique', function() {
        compMgr.remove();
        compMgr.add([c1, c3]);
        expect(handlerSpy).toHaveBeenCalledOnce();
      });

      it('does not dispatch "error" event if is cid unique', function() {
        compMgr.remove();
        compMgr.add([c1, c2]);
        expect(handlerSpy).not.toHaveBeenCalled();
      });

      it('does not add cid to the componentManager', function() {
        compMgr.remove();
        compMgr.add([c1, c3]);
        expect(compMgr.get().length).toBe(1);
        expect(compMgr.first('c3')).toBe(null);
      });

      it('returns an array of multiple added components', function() {
        compMgr.remove();
        result = compMgr.add([c1, c2]);
        expect(result.length).toBe(2);
        expect(result.indexOf(c1)).not.toBe(-1);
        expect(result.indexOf(c2)).not.toBe(-1);
      });

      it('parses and adds a component from a config', function() {
        result = compMgr.first('foo');
        expect(result.cid()).toBe('foo');
        expect(result.config('type')).toBe('line');
      });

      it('returns the parsed instance', function() {
        result = compMgr.add({ type: 'line', cid: 'line-cid' });
        expect(result.length).toBe(1);
        expect(result[0].cid()).toBe('line-cid');
        expect(result[0].config('type')).toBe('line');
      });

      it('parses and adds multiple components from an array', function() {
        // Gets added in the top-level beforeEach()
        expect(compMgr.first('foo')).toBeDefined();
        expect(compMgr.first('bar')).toBeDefined();
      });

      it('returns an array of the parsed instances', function() {
        var cids;
        compMgr.remove();
        result = compMgr.add([
          { type: 'line', cid: 'c1' },
          { type: 'line', cid: 'c2' }
        ]);
        cids = result.map(cidMap).sort();
        expect(result.length).toBe(2);
        expect(cids).toEqual(['c1', 'c2']);
      });

    });

    describe('.cids()', function() {

      it('gets all the cids from all the components', function() {
        expect(compMgr.cids()).toEqual([ 'foo', 'bar' ]);
      });

      it('returns an empty array when there are no components', function() {
        compMgr.remove();
        expect(compMgr.cids()).toEqual([]);
      });

    });

    describe('.get()', function() {

      it('gets all the components if cids are not provided', function() {
        result = compMgr.get().map(cidMap);
        expect(result.sort()).toEqual([ 'bar', 'foo' ]);
      });

      it('gets only the comonents with matching cid', function() {
        result = compMgr.get([ 'foo' ]);
        expect(result.length).toBe(1);
        expect(result[0].cid()).toEqual('foo');
      });

      it('gets only the comonents with matching cids', function() {
        compMgr.add({ type: 'line', cid: 'bang' });
        result = compMgr.get([ 'foo', 'bar' ]).map(cidMap);
        expect(result.sort()).toEqual([ 'bar', 'foo' ]);
      });

    });

    describe('.first()', function() {

      it('gets the component with a matching cid', function() {
        expect(compMgr.first('foo')).toBe(fooLine);
      });

    });

    describe('.remove()', function() {

      it('removes all components with no args', function() {
        compMgr.remove();
        result = compMgr.get();
        expect(result.length).toBe(0);
      });

      it('removes only the components with specified cids', function() {
        compMgr.remove(['bar']);
        result = compMgr.get();
        expect(result.length).toBe(1);
      });

    });

    describe('.destroy()', function() {

      beforeEach(function() {
        spyOn(fooLine, 'destroy');
        spyOn(barLine, 'destroy');
      });

      it('calls destroy on all components if no args', function() {
        compMgr.destroy();
        expect(fooLine.destroy).toHaveBeenCalled();
        expect(barLine.destroy).toHaveBeenCalled();
      });

      it('calls destroy on one specified components', function() {
        compMgr.destroy(['foo']);
        expect(fooLine.destroy).toHaveBeenCalled();
        expect(barLine.destroy).not.toHaveBeenCalled();
      });

      it('removes a destroyed component', function() {
        compMgr.destroy(['foo']);
        expect(compMgr.first('foo')).toBeNull();
      });

      it('removes multiple destroyed components', function() {
        compMgr.destroy(['foo', 'bar']);
        expect(compMgr.first('foo')).toBeNull();
        expect(compMgr.first('bar')).toBeNull();
      });

    });

    describe('.filter()', function() {

      it('applies a generic filter function', function() {
        compMgr.add({ type: 'area', cid: 'biz' });
        compMgr.add({ type: 'area', cid: 'boo' });
        result = compMgr.filter(function(c) {
          return c.config('type') === 'area';
        });
        expect(result.length).toBe(2);
        expect(result[0].config('type')).toBe('area');
        expect(result[1].config('type')).toBe('area');
      });

    });

    describe('.data()', function() {
      var data;

      beforeEach(function() {
        data = { iam: 'some data' };
        spyOn(fooLine, 'data');
        spyOn(barLine, 'data');
      });

      it('sets data on all components', function() {
        compMgr.data(data);
        expect(fooLine.data).toHaveBeenCalledWith(data);
        expect(barLine.data).toHaveBeenCalledWith(data);
      });

      it('sets data only on specified components', function() {
        compMgr.data(data, ['foo']);
        expect(fooLine.data).toHaveBeenCalledWith(data);
        expect(barLine.data).not.toHaveBeenCalled();
      });

    });

    describe('.render()', function() {
      var selection;

      beforeEach(function() {
        selection = jasmine.svgFixture();
        spyOn(fooLine, 'render');
        spyOn(barLine, 'render');
      });

      it('calls render on all components', function() {
        compMgr.render(selection);
        expect(fooLine.render).toHaveBeenCalledOnce();
        expect(barLine.render).toHaveBeenCalledOnce();
      });

      it('calls render only on specified components', function() {
        compMgr.render(selection, ['foo']);
        expect(fooLine.render).toHaveBeenCalledOnce();
        expect(barLine.render).not.toHaveBeenCalled();
      });

    });

    describe('.update()', function() {

      beforeEach(function() {
        spyOn(fooLine, 'update');
        spyOn(barLine, 'update');
      });

      it('calls update on all components', function() {
        compMgr.update();
        expect(fooLine.update).toHaveBeenCalledOnce();
        expect(barLine.update).toHaveBeenCalledOnce();
      });

      it('calls update only on specified components', function() {
        compMgr.update(['foo']);
        expect(fooLine.update).toHaveBeenCalledOnce();
        expect(barLine.update).not.toHaveBeenCalled();
      });

    });

    describe('.show()', function() {

      beforeEach(function() {
        spyOn(fooLine, 'show');
        spyOn(barLine, 'show');
      });

      it('calls show on all components', function() {
        compMgr.show();
        expect(fooLine.show).toHaveBeenCalledOnce();
        expect(barLine.show).toHaveBeenCalledOnce();
      });

      it('calls show only on specified components', function() {
        compMgr.show(['foo']);
        expect(fooLine.show).toHaveBeenCalledOnce();
        expect(barLine.show).not.toHaveBeenCalled();
      });

    });

    describe('.hide()', function() {

      beforeEach(function() {
        spyOn(fooLine, 'hide');
        spyOn(barLine, 'hide');
      });

      it('calls hide on all components', function() {
        compMgr.hide();
        expect(fooLine.hide).toHaveBeenCalledOnce();
        expect(barLine.hide).toHaveBeenCalledOnce();
      });

      it('calls hide only on specified components', function() {
        compMgr.hide(['foo']);
        expect(fooLine.hide).toHaveBeenCalledOnce();
        expect(barLine.hide).not.toHaveBeenCalled();
      });

    });

    describe('.applyMethod()', function() {
      var args;

      beforeEach(function() {
        fooLine.random = function() {
          args = arguments;
        };
        barLine.random = function() {};
        spyOn(fooLine, 'random').andCallThrough();
        spyOn(barLine, 'random');
      });

      it('calls any arbitrary method on the components', function() {
        compMgr.applyMethod('random');
        expect(fooLine.random).toHaveBeenCalledOnce();
        expect(barLine.random).toHaveBeenCalledOnce();
      });

      it('filters by cids', function() {
        compMgr.applyMethod('random', ['foo']);
        expect(fooLine.random).toHaveBeenCalledOnce();
        expect(barLine.random).not.toHaveBeenCalledOnce();
      });

      it('passes thru any arguments', function() {
        compMgr.applyMethod('random', ['foo'], 'a', 'b', 'c');
        expect(fooLine.random).toHaveBeenCalledOnce();
        expect(args).toEqual([ 'a', 'b', 'c' ]);
      });

    });

    describe('.registerSharedObject', function() {
      var sharedObj, newComp;

      beforeEach(function() {
        sharedObj = 'test shared object';
        newComp = lineComponent().config('cid', 'newComp');
        newComp.test = function() {};
        spyOn(newComp, 'test');
      });

      it('registers a shared object', function() {
        compMgr.registerSharedObject('test', sharedObj);
        result = compMgr.getSharedObjects();
        expect(Object.keys(result).length).toBe(1);
        expect(result.test.value).toBe(sharedObj);
      });

      it('defaults autoApply to false', function() {
        compMgr.registerSharedObject('test', sharedObj);
        result = compMgr.getSharedObjects();
        expect(result.test.autoApply).toBe(false);
      });

      it(
      'applies shared objects configured to be auto-applied to new components',
      function() {
        compMgr.registerSharedObject('test', sharedObj, true);
        compMgr.add(newComp);
        expect(newComp.test).toHaveBeenCalledWith(sharedObj);
      });

      it('doesnt apply shared objects configured not to be auto-applied',
      function() {
        compMgr.registerSharedObject('test', sharedObj);
        compMgr.add(newComp);
        expect(newComp.test).not.toHaveBeenCalled();
      });

    });

    describe('.applySharedObject', function() {

      var sharedObj = 'test shared object';

      beforeEach(function() {
        fooLine.test = function() {};
        barLine.test = function() {};
        spyOn(fooLine, 'test');
        spyOn(fooLine, 'update');
        spyOn(barLine, 'test');
        spyOn(barLine, 'update');
        compMgr.registerSharedObject('test', sharedObj);
      });

      it('applies the shared object to all existing components', function() {
        compMgr.applySharedObject('test');
        expect(fooLine.test).toHaveBeenCalledWith(sharedObj);
        expect(barLine.test).toHaveBeenCalledWith(sharedObj);
      });

      it('applies the shared object only to cids specified', function() {
        compMgr.applySharedObject('test', ['foo']);
        expect(fooLine.test).toHaveBeenCalledWith(sharedObj);
        expect(barLine.test).not.toHaveBeenCalled();
      });

      it('calls update() by default', function() {
        compMgr.applySharedObject('test', ['foo']);
        expect(fooLine.update).toHaveBeenCalledOnce();
      });

      it('optionally supresses the update() call', function() {
        compMgr.applySharedObject('test', ['foo'], true);
        expect(fooLine.update).not.toHaveBeenCalled();
      });

    });

    describe('.applyAutoSharedObjects', function() {

      var sharedObj;

      beforeEach(function() {
        sharedObj = 'test shared object';
        compMgr.registerSharedObject('autoApplyMethod', sharedObj, true);
        compMgr.registerSharedObject('nonAutoApplyMethod', sharedObj, false);
        fooLine.autoApplyMethod = function() {};
        fooLine.nonAutoApplyMethod = function() {};
        spyOn(fooLine, 'autoApplyMethod');
        spyOn(fooLine, 'nonAutoApplyMethod');
        barLine.autoApplyMethod = function() {};
        barLine.nonAutoApplyMethod = function() {};
        spyOn(barLine, 'autoApplyMethod');
        spyOn(barLine, 'nonAutoApplyMethod');
      });

      it('applies all the auto-apply shared objects', function() {
        compMgr.applyAutoSharedObjects();
        expect(fooLine.autoApplyMethod).toHaveBeenCalledWith(sharedObj);
      });

      it('doesnt apply the non-auto-apply shared objects', function() {
        compMgr.applyAutoSharedObjects();
        expect(fooLine.nonAutoApplyMethod).not.toHaveBeenCalled();
      });

      it('filters by cids', function() {
        compMgr.applyAutoSharedObjects(['foo']);
        expect(fooLine.autoApplyMethod).toHaveBeenCalledWith(sharedObj);
        expect(barLine.autoApplyMethod).not.toHaveBeenCalled();
      });

    });

  });

});
