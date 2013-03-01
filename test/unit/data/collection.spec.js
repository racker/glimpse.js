define([
  'data/collection',
  'data/selection/selection'
], function (dc, sel) {
  'use strict';

  describe('data collection', function () {

    var dataCollection;

    beforeEach(function() {
      dataCollection = dc.create();
    });

    describe('.create()', function() {

      it('creates and returns an object', function() {
        expect(dc.create()).toBeDefined();
      });

    });

    describe('.add()/.get()', function() {

      it('returns empty array if data is not added', function() {
        expect(dataCollection.get()).toEqual([]);
      });

      it('returns correct data by id', function() {
        var data = {id: 'test', data: 'nice' };
        dataCollection.add(data);
        expect(dataCollection.get('test')).toBe(data);
      });

      it('returns dataset as array - when added individually', function() {
        var data1 = {id: 'test1', data: 'nice' },
            data2 = {id: 'test2', data: 'nice' };
        dataCollection.add(data1);
        dataCollection.add(data2);
        expect(dataCollection.get()).toEqual([data1, data2]);
        expect(dataCollection.get('test1')).toBe(data1);
        expect(dataCollection.get('test2')).toBe(data2);
      });

      it('returns dataset as array - when added as an array', function() {
        var data1 = {id: 'test1', data: 'nice' },
            data2 = {id: 'test2', data: 'nice' };
        dataCollection.add([data1, data2]);
        expect(dataCollection.get()).toEqual([data1, data2]);
        expect(dataCollection.get('test1')).toBe(data1);
        expect(dataCollection.get('test2')).toBe(data2);
      });

    });

    describe('.add()', function() {

      it('adds a non-derived source wouth mutating it', function() {
        var data = {id: 'test', data: 'nice' };
        dataCollection.add(data);
        expect(dataCollection.get('test')).toBe(data);
      });

      it('adds a non-derived source wouth mutating it', function() {
        var data = {id: 'test', data: 'nice' };
        dataCollection.add(data);
        expect(dataCollection.get('test')).toBe(data);
      });

      it('adds a derived sources does not call the derivation fn', function() {
        var derivationFn = jasmine.createSpy(),
            data = {id: 'test', sources:'*', derivation: derivationFn };
        dataCollection.add(data);
        expect(derivationFn).not.toHaveBeenCalled();
      });

      it('adds a derived sources calls the derivation fn', function() {
        var derivationFn = jasmine.createSpy(),
            data = {id: 'test', sources:'*', derivation: derivationFn };
        dataCollection.add(data);
        dataCollection.updateDerivations();
        expect(derivationFn).toHaveBeenCalled();
      });


      it('adds derived data calls the deriv fn with a src sel', function() {
        var derivationFn = jasmine.createSpy(),
            depX = {id: 'depX', data: 'this is dep x'},
            data = {id: 'test', sources:'depX', derivation: derivationFn };
        dataCollection.add(depX);
        dataCollection.add(data);
        dataCollection.updateDerivations();
        expect(derivationFn).toHaveBeenCalledWith(sel.create(depX));
      });

      it('adds derived data calls the deriv fn with sources sel', function() {
        var derivationFn = jasmine.createSpy(),
            depX = {id: 'depX', data: 'this is dep x'},
            depY = {id: 'depY', data: 'this is dep y'},
            data = {id: 'test', sources:'depX,depY', derivation: derivationFn };
        dataCollection.add([depX, depY]);
        dataCollection.add(data);
        dataCollection.updateDerivations();
        expect(derivationFn).toHaveBeenCalledWith(sel.create([depX, depY]));
      });

      it('adds derived data calls the deriv fn with sources sel 2', function() {
        var derivationFn = jasmine.createSpy(),
            depX = {id: 'depX', data: 'this is dep x'},
            depY = {id: 'depY', data: 'this is dep y'},
            data = {id: 'test', sources:'depY,depX', derivation: derivationFn };
        dataCollection.add([depX, depY]);
        dataCollection.add(data);
        dataCollection.updateDerivations();
        expect(derivationFn).toHaveBeenCalledWith(sel.create([depY, depX]));
      });

      it('adds derived data calls the deriv fn with sources *', function() {
        var derivationFn = jasmine.createSpy(),
            depX = {id: 'depX', data: 'this is dep x'},
            depY = {id: 'depY', data: 'this is dep y'},
            depZ = {id: 'depZ', data: 'this is dep z'},
            data = {id: 'test', sources:'*', derivation: derivationFn };
        dataCollection.add([depX, depY, depZ]);
        dataCollection.add(data);
        dataCollection.updateDerivations();
        expect(derivationFn).toHaveBeenCalledWith(
          sel.create([depX, depY, depZ]));
      });

      it('adds derived data src * does not include derived data', function() {
        var derivationFn = jasmine.createSpy(),
            depX = {id: 'depX', data: 'this is dep x'},
            depY = {id: 'depY', data: 'this is dep y'},
            depZ = {id: 'depZ', data: 'this is dep z'},
            deriv1 = {id: 'test', sources:'*', derivation: derivationFn },
            data = {id: 'test', sources:'*', derivation: derivationFn };
        dataCollection.add([depX, depY, depZ]);
        dataCollection.add(deriv1);
        dataCollection.add(data);
        dataCollection.updateDerivations();
        expect(derivationFn).toHaveBeenCalledWith(
          sel.create([depX, depY, depZ]));
      });

    });

    describe('generates correct derived data', function() {

      it('returns correct derived data', function() {
        var derivationFn = jasmine.createSpy().andReturn('XYZ'),
            depX = {id: 'depX', data: 'this is dep x'},
            depY = {id: 'depY', data: 'this is dep y'},
            data = {id: 'test', sources:'*', derivation: derivationFn };
        dataCollection.add([depX, depY]);
        dataCollection.add(data);
        dataCollection.updateDerivations();
        expect(dataCollection.get('test')).toBe('XYZ');
      });

    });

    describe('.select()', function() {

      it('returns empty sel if * source is selected on empty dc', function() {
        expect(dataCollection.select('*')).toEqual(sel.create());
      });

      it('returns empty sel if non-valid sources selected on dc', function() {
        expect(dataCollection.select('ORD, DFW')).toEqual(sel.create());
      });

      it('returns correct sel', function() {
        var depX = {id: 'depX', data: 'this is dep x'},
            depY = {id: 'depY', data: 'this is dep y'},
            data = {id: 'test', sources:'*', derivation: function() {} };
        dataCollection.add([depX, depY]);
        dataCollection.add(data);
        expect(dataCollection.select('*')).toEqual(sel.create([depX, depY]));
        expect(dataCollection.select('depX')).toEqual(sel.create(depX));
        expect(dataCollection.select('depY')).toEqual(sel.create(depY));
        expect(dataCollection.select('depX,depY')).toEqual(
          sel.create([depX, depY]));
        expect(dataCollection.select('depY,depX')).toEqual(
          sel.create([depY, depX]));
        expect(dataCollection.select('depY,depY')).toEqual(
          sel.create([depY, depY]));

      });

    });

    describe('.append()', function() {

      it('appends the data to correct data source array by id', function() {
        var depX = {id: 'data1', data: [1, 2, 3] };
        dataCollection.add(depX);
        expect(dataCollection.get('data1').data).toEqual([1,2,3]);
        dataCollection.append('data1', [4,5,6]);
        expect(dataCollection.get('data1').data).toEqual([1,2,3,4,5,6]);
      });

      it('appends the data to correct data source object by id', function() {
        var depX = {id: 'data1', data: [{id: 1}, {id: 2}]};
        dataCollection.add(depX);
        expect(dataCollection.get('data1').data).toEqual([{id: 1}, {id: 2}]);
        dataCollection.append('data1', [{id: 3}, {id: 4}]);
        expect(dataCollection.get('data1').data)
          .toEqual([{id: 1}, {id: 2}, {id: 3}, {id: 4}]);
      });

    });

    describe('.upsert()', function() {

      it('adds an data attribute in place', function() {
        var depX = {id: 'data1', data: [1, 2, 3] },
            depY = {id: 'data2', data: [1, 2, 3] };
        dataCollection.add([depX, depY]);
        expect(dataCollection.get('data1')).toEqual({
          id: 'data1', data: [1,2,3]
        });
        dataCollection.upsert({ id: 'data1', 'title': 'What!!'});
        expect(dataCollection.get('data1')).toEqual({
          id: 'data1', data: [1,2,3], title: 'What!!'
        });
      });

     it('adds many data attributes in place', function() {
        var depX = {id: 'data1', data: [1, 2, 3] },
            depY = {id: 'data2', data: [1, 2, 3] };
        dataCollection.add([depX, depY]);
        expect(dataCollection.get('data1')).toEqual({
          id: 'data1', data: [1,2,3]
        });
        dataCollection.upsert({ id: 'data1', 'title': 'What!!', color: 'blue'});
        expect(dataCollection.get('data1')).toEqual({
          id: 'data1', data: [1,2,3], title: 'What!!', color: 'blue'
        });
      });

      it('replaces a data attribute in place', function() {
        var depX = {id: 'data1', data: [1, 2, 3] },
            depY = {id: 'data2', data: [1, 2, 3] };
        dataCollection.add([depX, depY]);
        expect(dataCollection.get('data1')).toEqual({
          id: 'data1', data: [1,2,3]
        });
        dataCollection.upsert({ id: 'data1', data: [4,5,6], 'title': 'What!!'});
        expect(dataCollection.get('data1')).toEqual({
          id: 'data1', data: [4,5,6], title: 'What!!'
        });
      });



    });

  });

});
