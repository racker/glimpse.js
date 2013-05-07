define([
  'layout/layoutmanager'
],
function (lm) {
  /*jshint maxlen: 150 */
  'use strict';

  /*
  function xmlString(strArr) {
    return '<svg id="svg-fixture">' + strArr.join('') + '</svg>';
  }*/

  describe('layoutmanager', function () {

    var fixture, selection;

    function applyLayout(layout) {
      selection = jasmine.svgFixture();
      lm.setLayout(layout, selection, 200, 200);
      fixture = jasmine.svgFixture().node();
    }

      // TODO: fix this rediculous test.

      //it('renders default layout template', function () {
        //lm.setLayout('default', jasmine.svgFixture(), 700, 250);
        //fixture = jasmine.svgFixture().node();

        //expect(fixture).toHaveXML(xmlString([
          //'<g gl-width="700" gl-height="250" class="gl-vgroup" split="10,65,10,15">',
          //'<rect class="gl-layout-size" width="700" height="250" fill="none"/>',
          //'<g gl-width="700" gl-height="25" class="gl-info" transform="translate(0,0)">',
          //'<rect class="gl-layout-size" width="700" height="25" fill="none"/>',
          //'</g>',
          //'<g gl-width="700" gl-height="162.5" gl-border-color="#999" gl-border-style="solid"',
          //' gl-border-width="1,1,1,1" gl-background-color="#fff" transform="translate(0,25)">',
          //'<rect class="gl-layout-size" width="700" height="162.5" fill="#fff" stroke="#999"',
          //' stroke-width="1" stroke-dasharray="700,0,162.5,0,700,0,162.5"/>',
          //'<g gl-padding-top="5" gl-width="700" gl-height="153.9" transform="translate(0,8.100000000000001)"',
          //' class="gl-framed">',
          //'<rect class="gl-layout-size" width="700" height="153.9" fill="none"/>',
          //'</g>',
          //'</g>',
          //'<g gl-width="700" gl-height="25" transform="translate(0,187)">',
          //'<rect class="gl-layout-size" width="700" height="25" fill="none"/>',
          //'<g gl-padding="1" gl-padding-top="20" gl-width="686" gl-height="19.5" transform="translate(7,5.25)"',
          //' class="gl-xaxis">',
          //'<rect class="gl-layout-size" width="686" height="19.5" fill="none"/>',
          //'</g>',
          //'</g>',
          //'<g gl-width="700" gl-height="37.5" gl-border-color="#999" gl-border-style="dotted"',
          //' gl-border-width="1,0,0,0" transform="translate(0,212)">',
          //'<rect class="gl-layout-size" width="700" height="37.5" fill="none"/>',
          //'<line x1="0" y1="0" x2="700" y2="0" class="gl-dotted-border-top gl-line-border"',
          //' stroke="#999" stroke-width="1" stroke-dasharray="1,1"/>',
          //'<g gl-padding="1" gl-padding-top="1" gl-padding-bottom="1" gl-width="686"',
          //' gl-height="35.519999999999996" transform="translate(7,0.74)" class="gl-footer">',
          //'<rect class="gl-layout-size" width="686" height="35.519999999999996" fill="none"/>',
          //'</g>',
          //'</g>',
          //'</g>'
        //]));
      //});
      //

    it('adds a gl-clip attribute', function() {
      applyLayout({
        'class': 'someclass',
        clip: true,
      });
      expect(jasmine.svgFixture().select('.someclass').node())
        .toHaveAttr('gl-clip', 'true');
    });

    describe('render simple layout', function () {
      var gNode, rectNode;

      beforeEach(function() {
        applyLayout({
          'class': 'someclass'
        });
        gNode = fixture.childNodes[0];
        rectNode = gNode.childNodes[0];
      });

      it('renders a <g>', function() {
        expect(gNode.tagName).toBe('g');
      });

      it('has the correct <g> node attrs', function() {
        expect(gNode).toHaveAttr({
          'gl-width': 200,
          'gl-height': 200,
          'class': 'someclass'
        });
      });

      it('only renders 1 child node under <g>', function() {
        expect(gNode.childNodes.length).toBe(1);
      });

      it('renders the <rect> node', function() {
        expect(rectNode.tagName).toBe('rect');
      });

      it('renders correct <rect> node attrs', function() {
        expect(rectNode).toHaveAttr({
          class: 'gl-layout',
          fill: 'none',
          width: 200,
          height: 200
        });
      });

    });

    describe('renders complex layouts', function() {

      describe('renders layout 2', function() {
        var someclassBox, someotherclassBox;

        beforeEach(function() {
          applyLayout({
            'class': 'someclass',
            children: [{'class': 'someotherclass'}]
          });
          someclassBox = selection.selectAttr('class', 'someclass');
          someotherclassBox = selection.selectAttr('class', 'someotherclass');
        });

        it('sets the correct height and width on someclassBox', function() {
          expect(someclassBox.node()).toHaveAttr({
            'gl-height': 200,
            'gl-width': 200
          });
        });

        it('sets the correct height and width on someotherclassBox', function() {
          expect(someotherclassBox.node()).toHaveAttr({
            'gl-height': 200,
            'gl-width': 200
          });
        });

        it('sizes someclassBox', function() {
          expect(someclassBox.size()).toEqual([200, 200]);
        });

        it('sizes someotherclassBox', function() {
          expect(someotherclassBox.size()).toEqual([200, 200]);
        });

      });

      describe('renders layout 3 - vgroup', function() {
        var box1, box2;
        beforeEach(function() {
          applyLayout({
            name: 'gl-vgroup',
            'class': 'someclass',
            'split': [50, 50],
            children: [{
              'class': 'box1'
            },{
              'class': 'box2'
            }]
          });
          box1 = selection.selectAttr('class', 'box1');
          box2 = selection.selectAttr('class', 'box2');
        });

        it('sets the correct height and width on box1', function() {
          expect(box1.node()).toHaveAttr({
            'gl-height': 100,
            'gl-width': 200
          });
        });

        it('sets the correct height and width on box2', function() {
          expect(box2.node()).toHaveAttr({
            'gl-height': 100,
            'gl-width': 200
          });
        });

        it('sizes box1', function() {
          expect(box1.size()).toEqual([200, 100]);
        });

        it('sizes box2', function() {
          expect(box2.size()).toEqual([200, 100]);
        });

        it('sets translate on box1', function() {
          expect(box1.node()).toHaveTranslate(0, 0);
        });

        it('sets translate on box2', function() {
          expect(box2.node()).toHaveTranslate(0, 100);
        });

      });

      describe('renders layout 4 - hgroup', function() {
        var box1, box2;
        beforeEach(function() {
          applyLayout({
            'class': 'someclass',
            name: 'gl-hgroup',
            split: [50, 50],
            children: [{
              'class': 'box1'
            },{
              'class': 'box2'
            }]
          });
          box1 = selection.selectAttr('class', 'box1');
          box2 = selection.selectAttr('class', 'box2');
        });

        it('sets the correct height and width on box1', function() {
          expect(box1.node()).toHaveAttr({
            'gl-height': 200,
            'gl-width': 100
          });
        });

        it('sets the correct height and width on box2', function() {
          expect(box2.node()).toHaveAttr({
            'gl-height': 200,
            'gl-width': 100
          });
        });

        it('sizes box1', function() {
          expect(box1.size()).toEqual([100, 200]);
        });

        it('sizes box2', function() {
          expect(box2.size()).toEqual([100, 200]);
        });

        it('sets translate on box1', function() {
          expect(box1.node()).toHaveTranslate(0, 0);
        });

        it('sets translate on box2', function() {
          expect(box2.node()).toHaveTranslate(100, 0);
        });

      });

    });

    describe('padding', function() {

      describe('hgroup - padding', function() {
        var box1, box2;
        beforeEach(function() {
          applyLayout({
            name: 'gl-hgroup',
            'class': 'someclass',
            'split': [50, 50],
            children: [{
              padding: 2,
              'class': 'box1'
            },{
              padding: 4,
              'class': 'box2'
            }]
          });
          box1 = selection.selectAttr('class', 'box1');
          box2 = selection.selectAttr('class', 'box2');
        });

        it('sets padding on box1', function() {
          expect(box1.node()).toHaveAttr({
            'gl-padding': 2,
            'gl-height': 192,
            'gl-width': 96
          });
        });

        it('sets padding on box2', function() {
          expect(box2.node()).toHaveAttr({
            'gl-padding': 4,
            'gl-height': 184,
            'gl-width': 92
          });
        });

        it('sizes box1', function() {
          expect(box1.size()).toEqual([96, 192]);
        });

        it('sizes box2', function() {
          expect(box2.size()).toEqual([92, 184]);
        });

      });

      describe('vgroup - padding', function() {
        var box1, box2;
        beforeEach(function() {
          applyLayout({
            'class': 'someclass',
            name: 'gl-vgroup',
            'split': [50, 50],
            children: [{
              padding: 2,
              name: 'box1'
            },{
              padding: 4,
              name: 'box2'
            }]
          });
          box1 = selection.selectAttr('gl-container-name', 'box1');
          box2 = selection.selectAttr('gl-container-name', 'box2');
        });

        it('sets padding on box1', function() {
          expect(box1.node()).toHaveAttr({
            'gl-padding': 2,
            'gl-height': 96,
            'gl-width': 192
          });
        });

        it('sets padding on box2', function() {
          expect(box2.node()).toHaveAttr({
            'gl-padding': 4,
            'gl-height': 92,
            'gl-width': 184
          });
        });

        it('sizes box1', function() {
          expect(box1.size()).toEqual([192, 96]);
        });

        it('sizes box2', function() {
          expect(box2.size()).toEqual([184, 92]);
        });

      });

    });

    describe('border', function() {

      it('applies border', function() {
        var lines;
        applyLayout({
          'class': 'gl-hgroup someclass',
          'split': [100],
          children: [{
            border: 2,
            'class': 'box1'
          }]
        });
        lines = jasmine.svgFixture().selectAll('line');
        expect(lines[0].length).toBe(4);
      });

      it('readjusts the height and width after applying border',
        function() {
        applyLayout({
          'class': 'gl-hgroup someclass',
          'split': [100],
          children: [{
            border: 2,
            'class': 'box1'
          }]
        });
        expect(jasmine.svgFixture().select('.box1').height())
          .toBe(196);
        expect(jasmine.svgFixture().select('.box1').width())
          .toBe(196);
      });

    });

  });

});
