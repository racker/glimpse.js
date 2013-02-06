define([
  'layout/layoutmanager'
],
function (lm) {
  /*jshint maxlen: 150 */
  'use strict';

  function xmlString(strArr) {
    return '<svg id="svg-fixture">' + strArr.join('') + '</svg>';
  }

  describe('layoutmanager', function () {

    var fixture;

    function applyLayout(layout) {
      lm.setLayout(layout, jasmine.svgFixture(), 200, 200);
      fixture = jasmine.svgFixture().node();
    }

    describe('render layout template', function () {

      it('renders default layout template', function () {
        lm.setLayout('default', jasmine.svgFixture(), 700, 250);
        fixture = jasmine.svgFixture().node();

        expect(fixture).toHaveXML(xmlString([
            '<g gl-width="700" gl-height="250" class="gl-vgroup" split="15,85">',
              '<rect class="gl-layout-size" width="700" height="250" fill="none"/>',
                '<g gl-width="700" gl-height="37.5" transform="translate(0,0)">',
                  '<rect class="gl-layout-size" width="700" height="37.5" fill="none"/>',
                  '<g padding="1" gl-width="686" gl-height="36.26" transform="translate(7,0.37)" class="gl-info">',
                    '<rect class="gl-layout-size" width="686" height="36.26" fill="none"/>',
                  '</g>',
                '</g>',
                '<g gl-width="700" gl-height="212.5" transform="translate(0,37)">',
                  '<rect class="gl-layout-size" width="700" height="212.5" fill="none"/>',
                  '<g padding="1" padding-bottom="10" gl-width="686" gl-height="186.56" transform="translate(7,2.12)" class="gl-unframed">',
                    '<rect class="gl-layout-size" width="686" height="186.56" fill="none"/>',
                    '<g gl-width="686" gl-height="186" class="gl-framed"><rect class="gl-layout-size" width="686" height="186" fill="none"/>',
                  '</g>',
                '</g>',
              '</g>',
            '</g>']));

      });

      it('renders layout 1', function () {
        applyLayout({
          'class': 'someclass'
        });
        expect(fixture).toHaveXML(xmlString([
          '<g gl-width="200" gl-height="200" class="someclass">',
            '<rect class="gl-layout-size" width="200" height="200" fill="none"/>',
          '</g>'
        ]));
      });

      it('renders layout 2', function () {
        applyLayout({
          'class': 'someclass',
          children: [{'class': 'someotherclass'}]
        });
        expect(fixture).toHaveXML(xmlString([
          '<g gl-width="200" gl-height="200" class="someclass">',
          '<rect class="gl-layout-size" width="200" height="200" fill="none"/>',
            '<g gl-width="200" gl-height="200" class="someotherclass">',
              '<rect class="gl-layout-size" width="200" height="200" fill="none"/>',
            '</g>',
          '</g>'
        ]));
      });

      it('renders layout 3 - vgroup', function() {
        applyLayout({
          'class': 'gl-vgroup someclass',
          'split': [50, 50],
          children: [{
            'class': 'box1'
          },{
            'class': 'box2'
          }]
        });
        expect(fixture).toHaveXML(xmlString([
          '<g gl-width="200" gl-height="200" class="gl-vgroup someclass" split="50,50">',
            '<rect class="gl-layout-size" width="200" height="200" fill="none"/>',
            '<g gl-width="200" gl-height="100" class="box1" transform="translate(0,0)">',
              '<rect class="gl-layout-size" width="200" height="100" fill="none"/>',
            '</g>',
            '<g gl-width="200" gl-height="100" class="box2" transform="translate(0,100)">',
              '<rect class="gl-layout-size" width="200" height="100" fill="none"/>',
            '</g>',
          '</g>']));
      });

      it('renders layout 4 - hgroup', function() {
        applyLayout({
          'class': 'gl-hgroup someclass',
          'split': [50, 50],
          children: [{
            'class': 'box1'
          },{
            'class': 'box2'
          }]
        });
        expect(fixture).toHaveXML(xmlString([
          '<g gl-width="200" gl-height="200" class="gl-hgroup someclass" split="50,50">',
            '<rect class="gl-layout-size" width="200" height="200" fill="none"/>',
            '<g gl-width="100" gl-height="200" class="box1" transform="translate(0,0)">',
              '<rect class="gl-layout-size" width="100" height="200" fill="none"/>',
            '</g>',
            '<g gl-width="100" gl-height="200" class="box2" transform="translate(100,0)">',
              '<rect class="gl-layout-size" width="100" height="200" fill="none"/>',
            '</g>',
          '</g>']));
      });

    });

    describe('padding', function() {

      it('hgroup - padding', function() {
        applyLayout({
          'class': 'gl-hgroup someclass',
          'split': [50, 50],
          children: [{
            padding: 2,
            'class': 'box1'
          },{
            padding: 4,
            'class': 'box2'
          }]
        });
        expect(fixture).toHaveXML(xmlString([
          '<g gl-width="200" gl-height="200" class="gl-hgroup someclass" split="50,50">',
            '<rect class="gl-layout-size" width="200" height="200" fill="none"/>',
            '<g gl-width="100" gl-height="200" transform="translate(0,0)">',
              '<rect class="gl-layout-size" width="100" height="200" fill="none"/>',
              '<g padding="2" gl-width="96" gl-height="192" transform="translate(2,4)" class="box1">',
                '<rect class="gl-layout-size" width="96" height="192" fill="none"/>',
              '</g>',
            '</g>',
            '<g gl-width="100" gl-height="200" transform="translate(100,0)">',
              '<rect class="gl-layout-size" width="100" height="200" fill="none"/>',
              '<g padding="4" gl-width="92" gl-height="184" transform="translate(4,8)" class="box2">',
                '<rect class="gl-layout-size" width="92" height="184" fill="none"/>',
              '</g>',
            '</g>',
          '</g>'
          ]));
      });

      it('vgroup - padding', function() {
        applyLayout({
          'class': 'gl-vgroup someclass',
          'split': [50, 50],
          children: [{
            padding: 2,
            'class': 'box1'
          },{
            padding: 4,
            'class': 'box2'
          }]
        });
        expect(fixture).toHaveXML(xmlString([
          '<g gl-width="200" gl-height="200" class="gl-vgroup someclass" split="50,50">',
            '<rect class="gl-layout-size" width="200" height="200" fill="none"/>',
            '<g gl-width="200" gl-height="100" transform="translate(0,0)">',
              '<rect class="gl-layout-size" width="200" height="100" fill="none"/>',
              '<g padding="2" gl-width="192" gl-height="96" transform="translate(4,2)" class="box1">',
                '<rect class="gl-layout-size" width="192" height="96" fill="none"/>',
              '</g>',
            '</g>',
            '<g gl-width="200" gl-height="100" transform="translate(0,100)">',
              '<rect class="gl-layout-size" width="200" height="100" fill="none"/>',
                '<g padding="4" gl-width="184" gl-height="92" transform="translate(8,4)" class="box2">',
                  '<rect class="gl-layout-size" width="184" height="92" fill="none"/>',
                '</g>',
              '</g>',
            '</g>'
          ]));
      });
    });

  });

});
