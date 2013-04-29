define([
  'data/collection',
  'data/domain'
], function (collection, domain) {
  'use strict';

  describe('data doamian', function () {

    var dc;

    beforeEach(function() {
      dc = collection.create();
    });

    describe('compute', function() {
      var fakeData, xExtents, yExtents;

      fakeData = [
        {
          id:'fakeData1',
          data: [
            { x: 50, y: 10},
            { x: 145, y: 20},
            { x: 250, y: 40}
          ]
        },
        {
          id:'fakeData2',
          data: [
            { x: 10, y: 5},
            { x: 100, y: 20},
            { x: 200, y: 30}
          ]
        },
        {
          id:'fakeData3',
          data: [
            { x: 10, y: 50},
            { x: 150, y: 45},
            { x: 500, y: 35}
          ]
        }
      ];

      beforeEach(function() {
        dc.add([
          {
            id: 'data1',
           data: fakeData[0].data,
            dimensions: {
              x: 'x',
              y: 'y'
           }
          },
          {
            id: 'data2',
            data: fakeData[1].data,
           dimensions: {
              x: 'x',
              y: 'y'
            }
          },
          {
            id: 'data3',
            data: fakeData[2].data,
            dimensions: {
              x: 'x',
              y: 'y'
            }
          },
          {
            id: 'data4',
            sources: '*',
            derivation: function () {
              return {
                x: 1000,
                y: 1000
              };
            }
          }
        ]);
      });

      describe('extents', function() {

        it('calculates the extents for the provided sources', function() {
          domain.addDomainDerivation({
            x: {
              sources: 'data1,data2',
              compute: 'extent',
              'default': [0, 0]
            }
          }, dc);
          dc.updateDerivations();
          xExtents = dc.get('$domain').x;
          expect(xExtents).toEqual([10, 250]);
        });

        it('returns the extents of all non-derived sources if called with *',
          function() {
            domain.addDomainDerivation({
              x: {
                sources: '*',
                compute: 'extent',
                'default': [0, 0]
              }
            }, dc);
            dc.updateDerivations();
            xExtents = dc.get('$domain').x;
            expect(xExtents).toEqual([10, 500]);
          }
        );

        it('returns default on no data of 0', function() {
          domain.addDomainDerivation({
            x: {
              sources: '',
              compute: 'extent',
              'default': [0, 0]
            }
          }, dc);
          dc.updateDerivations();
          xExtents = dc.get('$domain').x;
          expect(xExtents).toEqual([0, 0]);
        });

        it('returns non-zero default on no data', function() {
          domain.addDomainDerivation({
            x: {
              sources: '',
              compute: 'extent',
              'default': [100, 50]
            }
          }, dc);
          dc.updateDerivations();
          xExtents = dc.get('$domain').x;
          expect(xExtents).toEqual([100, 50]);
        });

        it('calculates the yExtents for the provided sources', function() {
          domain.addDomainDerivation({
            y: {
              sources: 'data1,data2',
              compute: 'extent',
              'default': [0, 0]
            }
          }, dc);
          dc.updateDerivations();
          yExtents = dc.get('$domain').y;
          expect(yExtents).toEqual([5, 40]);
        });

        it('returns the yExtents of all non-derived sources if called with *',
          function() {
            domain.addDomainDerivation({
              y: {
                sources: '*',
                compute: 'extent',
                'default': [0, 0]
              }
            }, dc);
            dc.updateDerivations();
            expect(dc.get('$domain').y).toEqual([5, 50]);
          }
        );

        it('computes multiple extents', function() {
          domain.addDomainDerivation({
            x: {
              sources: '*',
              compute: 'extent',
              'default': [0, 0]
            },
            y: {
              sources: '*',
              compute: 'extent',
              'default': [0, 0]
            }
          }, dc);
          dc.updateDerivations();
          expect(dc.get('$domain').x).toEqual([10, 500]);
          expect(dc.get('$domain').y).toEqual([5, 50]);
        });

      });

      describe('interval', function() {

        var intervalDc, timeData;

        timeData = [
          {
            id:'fakeData1',
            data: [
              { x: 1131696000000, y: 10},
              { x: 1005465600000, y: 20},
              { x: 1068537600000, y: 40}
            ]
          },
          {
            id:'fakeData2',
            data: [
              { x: 942307200000, y: 5},
              { x: 1037001600000, y: 20},
              { x: 879235200000, y: 30}
            ]
          },
          {
            id:'fakeData3',
            data: [
              { x: 1191999600000, y: 50},
              { x: 1034233200000, y: 45},
              { x: 1128927600000, y: 35}
            ]
          }
        ];

        beforeEach(function() {
          intervalDc = collection.create();
          intervalDc.add([
            {
              id: 'data1',
              data: timeData[0].data,
              dimensions: {
                x: 'x',
                y: 'y'
             }
            },
            {
              id: 'data2',
              data: timeData[1].data,
             dimensions: {
                x: 'x',
                y: 'y'
              }
            },
            {
              id: 'data3',
              data: timeData[2].data,
              dimensions: {
                x: 'x',
                y: 'y'
              }
            },
            {
              id: 'data4',
              sources: '*',
              derivation: function () {
                return {
                  x: 1000,
                  y: 1000
                };
              }
            }
          ]);
        });

        it('calculates the interval from sources for 1 day', function() {
          domain.addDomainDerivation({
            x: {
              sources: '*',
              compute: 'interval',
              args: {
                unit: 'day',
                period: 1
              },
              'default': [0, 0]
            }
          }, intervalDc);
          intervalDc.updateDerivations();
          expect(intervalDc.get('$domain').x)
            .toEqual([1191913200000, 1191999600000]);
        });

        it('calculates the interval from sources for 3 day', function() {
          domain.addDomainDerivation({
            x: {
              sources: '*',
              compute: 'interval',
              args: {
                unit: 'day',
                period: 3
              },
              'default': [0, 0]
            }
          }, intervalDc);
          intervalDc.updateDerivations();
          expect(intervalDc.get('$domain').x)
            .toEqual([1191740400000, 1191999600000]);
        });

        it('calculates the interval from sources for 1 week', function() {
          domain.addDomainDerivation({
            x: {
              sources: '*',
              compute: 'interval',
              args: {
                unit: 'week',
                period: 1
              },
              'default': [0, 0]
            }
          }, intervalDc);
          intervalDc.updateDerivations();
          expect(intervalDc.get('$domain').x)
            .toEqual([1191394800000, 1191999600000]);
        });

        it('calculates the interval from sources for 4 week', function() {
          domain.addDomainDerivation({
            x: {
              sources: '*',
              compute: 'interval',
              args: {
                unit: 'week',
                period: 4
              },
              'default': [0, 0]
            }
          }, intervalDc);
          intervalDc.updateDerivations();
          expect(intervalDc.get('$domain').x)
            .toEqual([1189580400000, 1191999600000]);
        });


        it('calculates the interval from sources for 1 month', function() {
          domain.addDomainDerivation({
            x: {
              sources: '*',
              compute: 'interval',
              args: {
                unit: 'month',
                period: 1
              },
              'default': [0, 0]
            }
          }, intervalDc);
          intervalDc.updateDerivations();
          expect(intervalDc.get('$domain').x)
            .toEqual([1189407600000, 1191999600000]);
        });

      });

      describe('modifiers', function() {

        describe('maxMultiplier', function() {

          it('applies maxMultiplier of 1.2', function() {
            domain.addDomainDerivation({
              y: {
                sources: '*',
                compute: 'extent',
                modifier: {
                  maxMultiplier: 1.2
                },
                'default': [0, 0]
              }
            }, dc);
            dc.updateDerivations();
            expect(dc.get('$domain').y).toEqual([5, 60]);
          });

          it('applies maxMultiplier of 0.5', function() {
            domain.addDomainDerivation({
              y: {
                sources: '*',
                compute: 'extent',
                modifier: {
                  maxMultiplier: 0.5
                },
                'default': [0, 0]
              }
            }, dc);
            dc.updateDerivations();
            expect(dc.get('$domain').y).toEqual([5, 25]);
          });

        });

        describe('force', function() {

          it('applies force modifier of 200', function() {
            domain.addDomainDerivation({
              y: {
                sources: '*',
                compute: 'extent',
                modifier: {
                  force: 200
                },
                'default': [0, 0]
              }
            }, dc);
            dc.updateDerivations();
            expect(dc.get('$domain').y).toEqual([5, 200]);
          });

          it('applies negative force modifier', function() {
            domain.addDomainDerivation({
              y: {
                sources: '*',
                compute: 'extent',
                modifier: {
                  force: -100
                },
                'default': [0, 0]
              }
            }, dc);
            dc.updateDerivations();
            expect(dc.get('$domain').y).toEqual([-100, 50]);
          });

          it('applies force modifier array', function() {
            domain.addDomainDerivation({
              y: {
                sources: '*',
                compute: 'extent',
                modifier: {
                  force: [-100, 200]
                },
                'default': [0, 0]
              }
            }, dc);
            dc.updateDerivations();
            expect(dc.get('$domain').y).toEqual([-100, 200]);
          });

        });

      });

   });

  });

});
