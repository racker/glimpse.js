define([
  'data/collection',
  'data/selection/selection',
  'core/array'
], function (dc, sel, array) {
  'use strict';

  describe('data collection', function () {

    var dataCollection,
        handlerSpy;

    beforeEach(function() {
      dataCollection = dc.create();
      handlerSpy = jasmine.createSpy();
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

      it('returns null on invalid data ids', function() {
        var data1 = {id: 'test1', data: 'nice' },
            data2 = {id: 'test2', data: 'nice' };
        dataCollection.add(data1);
        dataCollection.add(data2);
        expect(dataCollection.get()).toEqual([data1, data2]);
        expect(dataCollection.get('pqr')).toBe(null);
        expect(dataCollection.get('xyz')).toBe(null);
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

      it('returns errors string on getting an uncomputed derived source',
        function() {
          dataCollection.add({
            id: 'newds',
            sources: '',
            derivation: function() {
              return 'result';
            }
          });
          expect(dataCollection.get('newds'))
            .toBe('gl-error-not-computed');
        }
      );

      it('returns computed value on gettting a derived source',
        function() {
          dataCollection.add({
            id: 'newds',
            sources: '',
            derivation: function() {
              return 'result';
            }
          });
          dataCollection.updateDerivations();
          expect(dataCollection.get('newds')).toBe('result');
        }
      );


    });

    describe('.add()', function() {

      beforeEach(function() {
        dataCollection.dispatch.on('error', handlerSpy);
      });

      it('dispatches a "error" event if id not unique', function() {
        var data = {id: 'test', data: 'nice' },
            data1 = {id: 'test', data: 'nice' };
        dataCollection.add(data);
        dataCollection.add(data1);
        expect(handlerSpy).toHaveBeenCalledOnce();
      });

      it('does not dispatch a "error" event if id is unique', function() {
        var data = {id: 'test', data: 'nice' },
            data1 = {id: 'test1', data: 'nice' };
        dataCollection.add(data);
        dataCollection.add(data1);
        expect(handlerSpy).not.toHaveBeenCalled();
      });

      it('does not add/overwrite data to Coll if id not unique', function() {
        var data = {id: 'test', data: 'nice' },
            data1 = {id: 'test', data: 'not nice' };
        dataCollection.add(data);
        dataCollection.add(data1);
        expect(dataCollection.get('test')).toBe(data);
        expect(dataCollection.get().length).toBe(1);
      });

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

    describe('tagging', function() {

      var domain1, domain2, lat1, lat2, lat3;

      beforeEach(function() {
        domain1 = {id: 'd1', tags: ['#domain'], data: 'domainData1'};
        domain2 = {id: 'd2', tags: ['#domain'], data: 'domainData2'};
        lat1 = {id: 'l1', tags: ['#lat'], data: 'latData1'};
        lat2 = {id: 'l2', tags: ['#lat'], data: 'latData2'};
        lat3 = {id: 'l3', tags: ['#lat'], data: 'latData3'};
        dataCollection.add([domain1, domain2, lat1, lat2, lat3]);
      });

      it('* source returns empty', function() {
        expect(dataCollection.select('*')).toEqual(sel.create());
      });

      it('selection by tag #domain returns correct selection', function() {
        expect(dataCollection.select('#domain'))
          .toEqual(sel.create([domain1, domain2]));
      });

      it('selection of #domain by ids returns correct selection', function() {
        expect(dataCollection.select('d1'))
          .toEqual(sel.create(domain1));
        expect(dataCollection.select('d2'))
          .toEqual(sel.create(domain2));
        expect(dataCollection.select('d1,d2'))
          .toEqual(sel.create([domain1, domain2]));
      });

      it('selection by tag #lat returns correct selection', function() {
        expect(dataCollection.select('#lat'))
          .toEqual(sel.create([lat1, lat2, lat3]));
      });

      it('selection of #lat by ids returns correct selection', function() {
        expect(dataCollection.select('l1'))
          .toEqual(sel.create(lat1));
        expect(dataCollection.select('l2'))
          .toEqual(sel.create(lat2));
        expect(dataCollection.select('l3'))
          .toEqual(sel.create(lat3));
        expect(dataCollection.select('l1,l2,l3'))
          .toEqual(sel.create([lat1, lat2, lat3]));
      });

      it('returns empty sel if non-valid sources selected on dc', function() {
        expect(dataCollection.select('ORD, DFW')).toEqual(sel.create());
      });

      it('selection by tag and id works', function() {
        expect(dataCollection.select('#lat, d1'))
          .toEqual(sel.create([lat1, lat2, lat3, domain1]));
        expect(dataCollection.select('l1,#domain'))
          .toEqual(sel.create([lat1, domain1, domain2]));
      });

      it('id and tag id collision resolution', function() {
        var c = dc.create(),
        dsId = {id: 'ds', tags: ['#domain'], data: 'domainData1'},
        ds1 = {id: 'l1', tags: ['ds'], data: 'latData1'},
        ds2 = {id: 'l2', tags: ['ds'], data: 'latData2'};
        c.add([dsId, ds1, ds2]);
        expect(c.select('ds'))
          .toEqual(sel.create(dsId));
      });

      describe('default tags', function() {

        var newDc;

        beforeEach(function() {
          newDc = dc.create();
        });

        it('adding non-derived src results in default tag of * and +',
          function() {
            newDc.add({id: 'test1', data: 'nothing'});
            expect(newDc.get('test1')).toEqual({
              id: 'test1', data: 'nothing', tags: ['*', '+']
            });
          }
        );

        it('specifying tags in non-derived src results in overriding default',
          function() {
            newDc.add({id: 'test1', tags: 'test', data: 'nothing'});
            expect(newDc.get('test1')).toEqual({
              id: 'test1', data: 'nothing', tags: 'test'
            });
          }
        );


        it('adding a derived src results in default tag of +',
          function() {
            newDc.add({
              id: 'test1',
              sources: '',
              derivation: function() {
                return { value: 'hello' };
              }
            });
            newDc.updateDerivations();
            expect(newDc.get('test1').tags).toEqual('+');
          }
        );

        it('specifying tags in a derived src results in overriding default',
          function() {
            newDc.add({
              id: 'test1',
              sources: '',
              tags: ['domain', 'test'],
              derivation: function() {
                return { value: 'hello' };
              }
            });
            newDc.updateDerivations();
            expect(newDc.get('test1').tags).toEqual(['domain', 'test']);
          }
        );

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

    describe('.extend()', function() {

      it('adds a data attribute in place', function() {
        var depX = {id: 'data1', tags: [], data: [1, 2, 3] },
            depY = {id: 'data2', tags: [], data: [1, 2, 3] };
        dataCollection.add([depX, depY]);
        expect(dataCollection.get('data1')).toEqual({
          id: 'data1', tags: [], data: [1,2,3]
        });
        dataCollection.extend({ id: 'data1', 'title': 'What!!'});
        expect(dataCollection.get('data1')).toEqual({
          id: 'data1',  tags: [], data: [1,2,3], title: 'What!!'
        });
      });

     it('adds many data attributes in place', function() {
        var depX = {id: 'data1', tags: ['lat'], data: [1, 2, 3] },
            depY = {id: 'data2', tags: ['lat'], data: [1, 2, 3] };
        dataCollection.add([depX, depY]);
        expect(dataCollection.get('data1')).toEqual({
          id: 'data1', tags: ['lat'], data: [1,2,3]
        });
        dataCollection.extend({ id: 'data1', 'title': 'What!!', color: 'blue'});
        expect(dataCollection.get('data1')).toEqual({
          id: 'data1', tags: ['lat'],
          data: [1,2,3], title: 'What!!', color: 'blue'
        });
      });

      it('replaces a data attribute in place', function() {
        var depX = {id: 'data1', tags: [], data: [1, 2, 3] },
            depY = {id: 'data2', tags: [], data: [1, 2, 3] };
        dataCollection.add([depX, depY]);
        expect(dataCollection.get('data1')).toEqual({
          id: 'data1', tags: [], data: [1,2,3]
        });
        dataCollection.extend({
          id: 'data1', tags: ['lat'],
          data: [4,5,6], 'title': 'What!!'
        });
        expect(dataCollection.get('data1')).toEqual({
          id: 'data1', tags:['lat'], data: [4,5,6], title: 'What!!'
        });
      });

    });

    describe('.upsert()', function() {

      it('replaces an existing data-source in place', function() {
        var depX = {id: 'data1', tags: [], data: [1, 2, 3] },
            depY = {id: 'data2', tags: [], data: [1, 2, 3] };
        dataCollection.add([depX, depY]);
        expect(dataCollection.get('data1')).toEqual({
          id: 'data1', tags: [], data: [1,2,3]
        });
        dataCollection.upsert({ id: 'data1', tags: ['lat'], 'title': 'What!!'});
        expect(dataCollection.get('data1')).toEqual({
          id: 'data1', tags: ['lat'], title: 'What!!'
        });
      });

      it('adding data src that does exist doesnt delegate to add', function() {
        var depX = {id: 'data1', data: [1, 2, 3] };
        dataCollection.add(depX);
        spyOn(dataCollection, 'add').andCallThrough();
        dataCollection.upsert(depX);
        expect(dataCollection.add).not.toHaveBeenCalled();
      });

      it('adding data src that does not exist delegates to add', function() {
         spyOn(dataCollection, 'add').andCallThrough();
        var depX = {id: 'data1', data: [1, 2, 3] };
        dataCollection.upsert(depX);
        expect(dataCollection.add).toHaveBeenCalled();
      });

    });

    describe('.remove()', function() {

      beforeEach(function() {
        dataCollection.add([{ id: 'one' }, { id: 'two' }]);
      });

      it('removes a data source by id', function() {
        dataCollection.remove('one');
        expect(dataCollection.get().length).toBe(1);
        expect(dataCollection.get()[0].id).toBe('two');
      });

    });

    describe('.updateDerivations', function() {

      var order;

      function genDerivation(str) {
        return function(sources) {
          order.push(str);
          if (array.contains(sources.all(), 'gl-error-circular-dependency')) {
            return 'gl-error-circular-dependency';
          }
          return str;
        };
      }

      function setupData1() {
        dataCollection.add([{
          id: 'A',
          sources: '*',
          derivation: genDerivation('A')
        }, {
          id: 'B',
          sources: '*',
          derivation: genDerivation('B')
        }]);
      }


      function setupData2() {
        dataCollection.add([{
          id: 'A',
          sources: 'B',
          derivation: genDerivation('A')
        }, {
          id: 'B',
          sources: '*',
          derivation: genDerivation('B')
        }]);
      }

      function setupData3() {
        dataCollection.add([{
          id: 'A',
          sources: 'B',
          derivation: genDerivation('A')
        }, {
          id: 'B',
          sources:'C, D',
          derivation: genDerivation('B')
        }, {
          id: 'C',
          sources: 'E',
          derivation: genDerivation('C')
        }, {
          id: 'D',
          sources: '*',
          derivation: genDerivation('D')
        }, {
          id: 'E',
          sources: 'F',
          derivation: genDerivation('E')
        }, {
          id: 'F',
          sources: 'D',
          derivation: genDerivation('F')
        }, {
          id: 'G',
          sources: '*',
          derivation: genDerivation('G')
        }]);
      }

      function setupData4() {
        dataCollection.add([{
          id: 'A',
          sources: 'B',
          derivation: genDerivation('A')
        }, {
          id: 'B',
          sources:'C, A',
          derivation: genDerivation('B')
        }, {
          id: 'C',
          sources: '*',
          derivation: genDerivation('C')
        }]);
      }

      function setupData5() {
        dataCollection.add([{
          id: 'A',
          sources: 'B',
          derivation: genDerivation('A')
        }, {
          id: 'B',
          sources: ['C', 'D'],
          derivation: genDerivation('B')
        }, {
          id: 'C',
          sources: 'E',
          derivation: genDerivation('C')
        }, {
          id: 'D',
          sources: '*',
          derivation: genDerivation('D')
        }, {
          id: 'E',
          sources: 'F',
          derivation: genDerivation('E')
        }, {
          id: 'F',
          sources: 'D',
          derivation: genDerivation('F')
        }, {
          id: 'G',
          sources: '*',
          derivation: genDerivation('G')
        }]);
      }

      function get(id) {
        return dataCollection.get(id);
      }

      beforeEach(function() {
        order = [];
      });

      it('evaluates derivided data in correct order for data 1', function() {
        setupData1();
        dataCollection.updateDerivations();

        expect(order).toEqual(['A', 'B']);
        expect(get('A')).toBe('A');
        expect(get('B')).toBe('B');
      });

      it('evaluates derivided data in correct order for data 2', function() {
        setupData2();
        dataCollection.updateDerivations();

        expect(order).toEqual(['B', 'A']);
        expect(get('A')).toBe('A');
        expect(get('B')).toBe('B');
      });

      it('evaluates derivided data in correct order for data 3', function() {
        setupData3();
        dataCollection.updateDerivations();

        expect(order).toEqual(['D', 'F', 'E', 'C', 'B', 'A', 'G']);
        expect(get('A')).toBe('A');
        expect(get('B')).toBe('B');
        expect(get('C')).toBe('C');
        expect(get('D')).toBe('D');
        expect(get('E')).toBe('E');
        expect(get('F')).toBe('F');
      });

      it('evaluates to its best effort on circular dependency', function() {
        setupData4();
        dataCollection.updateDerivations();

        expect(order).toEqual(['C', 'B', 'A', 'B', 'A']);
        expect(get('A')).toBe('gl-error-circular-dependency');
        expect(get('B')).toBe('gl-error-circular-dependency');
        expect(get('C')).toBe('C');

      });

      it('evaluates derivided data in order for mul selections', function() {
        setupData5();
        dataCollection.updateDerivations();

        expect(order).toEqual(['D', 'F', 'E', 'C', 'B', 'A', 'G']);
        expect(get('A')).toBe('A');
        expect(get('B')).toBe('B');
        expect(get('C')).toBe('C');
        expect(get('D')).toBe('D');
        expect(get('E')).toBe('E');
        expect(get('F')).toBe('F');
      });

    });

    describe('tags', function() {

      var newDc;

      beforeEach(function() {
        newDc = dc.create();
        newDc.add({
          id: 'test',
          title: 'test',
          tags: [],
          data: {'key': 'test'}
        });
      });

      describe('getTags/setTags()', function() {

        it('gets correct tag from the set', function() {
          newDc.addTags('test', 'hello');
          expect(newDc.getTags('test')).toEqual(['hello']);
        });

        it('gets correct tags from the set', function() {
          newDc.addTags('test', ['hello', 'bye']);
          expect(newDc.getTags('test')).toEqual(['hello', 'bye']);
        });

        it('sets a tag', function() {
          newDc.setTags('test', 'hello');
          expect(newDc.getTags('test')).toEqual(['hello']);
        });

        it('sets multiple tags', function() {
          newDc.setTags('test', ['hello', 'bye']);
          expect(newDc.getTags('test')).toEqual(['hello', 'bye']);
        });

        it('duplicate tags are not added using setTags', function() {
          newDc.setTags('test', ['hello', 'bye', 'bye', 'zebra']);
          expect(newDc.getTags('test')).toEqual(['hello', 'bye', 'zebra']);
        });

      });


      describe('addTags()', function() {

        it('adds an element to the set', function() {
          newDc.addTags('test', 'hello');
          expect(newDc.getTags('test')).toEqual(['hello']);
        });

        it('adds elements to the set', function() {
          newDc.addTags('test', ['hello', 'bye']);
          expect(newDc.getTags('test')).toEqual(['hello', 'bye']);
        });

        it('duplicate elements are not added to the set', function() {
          newDc.addTags('test', ['hello', 'bye']);
          newDc.addTags('test', ['bye', 'zebra']);
          expect(newDc.getTags('test')).toEqual(['hello', 'bye', 'zebra']);
        });

      });

      describe('removeTags()', function() {

        beforeEach(function() {
          newDc.addTags('test', ['abc', 'def', 'ghi']);
        });

        it('removes an element from the set', function() {
          newDc.removeTags('test', 'def');
          expect(newDc.getTags('test')).toEqual(['abc', 'ghi']);
          newDc.removeTags('test', 'ghi');
          expect(newDc.getTags('test')).toEqual(['abc']);
          newDc.removeTags('test', 'abc');
          expect(newDc.getTags('test')).toEqual([]);
        });

        it('removes elements from the set', function() {
          newDc.removeTags('test', ['abc', 'ghi']);
          expect(newDc.getTags('test')).toEqual(['def']);
        });

        it('no-op on removing non-existent elements', function() {
          newDc.removeTags('test', ['hello', 'bye']);
          expect(newDc.getTags('test')).toEqual(['abc', 'def', 'ghi']);
        });

      });

      describe('toggleTags()', function() {

        beforeEach(function() {
          newDc.addTags('test', ['USA', 'Canada', 'Mexico']);
        });

        it('toggles one element resulting in removal', function() {
          newDc.toggleTags('test', 'USA');
          expect(newDc.getTags('test')).toEqual(['Canada', 'Mexico']);
        });

        it('toggles multiple elements resulting in removal', function() {
          newDc.toggleTags('test', ['USA', 'Mexico']);
          expect(newDc.getTags('test')).toEqual(['Canada']);
        });

        it('toggles one element resulting in addition', function() {
          newDc.toggleTags('test', 'Zambia');
          expect(newDc.getTags('test'))
            .toEqual(['USA', 'Canada', 'Mexico', 'Zambia']);
        });

        it('toggles multiple elements resulting in additon', function() {
          newDc.toggleTags('test', ['Spain', 'Zambia']);
          expect(newDc.getTags('test'))
            .toEqual(['USA', 'Canada', 'Mexico', 'Spain', 'Zambia']);
        });

        it('toggles multiple elements resulting in addition & removal',
           function() {
            newDc.toggleTags('test', ['USA', 'Spain']);
            expect(newDc.getTags('test'))
              .toEqual(['Canada', 'Mexico', 'Spain']);
           }
        );

      });

    });

    describe('isEmpty', function() {
      it('returns true if dataCollection is empty', function(){
        expect(dataCollection.isEmpty()).toBe(true);
      });

      it('returns false if dataCollection is not empty', function(){
        dataCollection.add([{
          id: 'A',
          sources: 'B'
        }]);
        expect(dataCollection.isEmpty()).toBe(false);
      });

    });

    describe('evaluation of multiple selections', function() {

      var input;

      function genDerivation(str) {
        return function() {
          input[str] = arguments;
          return str;
        };
      }

      function setupData1() {
        dataCollection.add([{
          id: 'A',
          sources: 'B',
          derivation: genDerivation('A')
        }, {
          id: 'B',
          sources: ['C', 'A'],
          derivation: genDerivation('B')
        }, {
          id: 'C',
          sources: '*',
          derivation: genDerivation('C')
        }]);
      }

      function setupData2() {
        dataCollection.add([{
          id: 'A',
          sources: 'nonDerived',
          derivation: genDerivation('A')
        }, {
          id: 'B',
          sources: 'nonDerived',
          derivation: genDerivation('B')
        }, {
          id: 'C',
          sources: '*',
          derivation: genDerivation('C')
        }, {
          id: 'D',
          sources: ['A', 'B', 'C'],
          derivation: genDerivation('D')
        }
        ]);
      }


      beforeEach(function() {
        dataCollection.add({
          id: 'nonDerived',
          data: [1,2,3]
        });
        input = {};
      });

      it('passes right no of selections into deriv fn for data 1', function() {
        setupData1();
        dataCollection.updateDerivations();
        expect(input.A.length).toBe(1);
        expect(input.B.length).toBe(2);
        expect(input.C.length).toBe(1);
      });

     it('passes right values into deriv fn for data 1', function() {
        setupData1();
        dataCollection.updateDerivations();
        expect(input.A[0].get()).toBe('B');
        expect(input.B[0].get()).toBe('C');
        expect(input.C[0].get().id).toBe('nonDerived');
      });

      it('passes right no of selections into deriv fn for data 2', function() {
        setupData2();
        dataCollection.updateDerivations();
        expect(input.A.length).toBe(1);
        expect(input.B.length).toBe(1);
        expect(input.C.length).toBe(1);
        expect(input.D.length).toBe(3);
      });

     it('passes right values into deriv fn for data 2', function() {
        setupData2();
        dataCollection.updateDerivations();
        expect(input.A[0].get().id).toBe('nonDerived');
        expect(input.B[0].get().id).toBe('nonDerived');
        expect(input.C[0].get().id).toBe('nonDerived');
        expect(input.D[0].get()).toBe('A');
        expect(input.D[1].get()).toBe('B');
        expect(input.D[2].get()).toBe('C');
      });

    });

  });

});
