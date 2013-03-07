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
          '<g gl-width="700" gl-height="250" class="gl-vgroup" split="10,65,10,15">',
          '<rect class="gl-layout-size" width="700" height="250" fill="none"/>',
          '<g gl-width="700" gl-height="25" class="gl-info" transform="translate(0,0)">',
          '<rect class="gl-layout-size" width="700" height="25" fill="none"/>',
          '</g>',
          '<g gl-width="700" gl-height="162.5" class="gl-framed" transform="translate(0,25)">',
          '<rect class="gl-layout-size" width="700" height="162.5" fill="none"/>',
          '</g>',
          '<g gl-width="700" gl-height="25" transform="translate(0,187)">',
          '<rect class="gl-layout-size" width="700" height="25" fill="none"/>',
          '<g gl-padding="1" gl-padding-top="20" gl-width="686" gl-height="19.5" transform="translate(7,5.25)" class="gl-xaxis">',
          '<rect class="gl-layout-size" width="686" height="19.5" fill="none"/>',
          '</g>',
          '</g>',
          '<g gl-width="700" gl-height="37.5" transform="translate(0,212)">',
          '<rect class="gl-layout-size" width="700" height="37.5" fill="none"/>',
          '<g gl-padding-top="1" gl-padding-bottom="1" gl-width="700" gl-height="36.26" transform="translate(0,0.37)" class="gl-footer">',
          '<rect class="gl-layout-size" width="700" height="36.26" fill="none"/>',
          '</g>',
          '</g>',
          '</g>'
        ]));
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
              '<g gl-padding="2" gl-width="96" gl-height="192" transform="translate(2,4)" class="box1">',
                '<rect class="gl-layout-size" width="96" height="192" fill="none"/>',
              '</g>',
            '</g>',
            '<g gl-width="100" gl-height="200" transform="translate(100,0)">',
              '<rect class="gl-layout-size" width="100" height="200" fill="none"/>',
              '<g gl-padding="4" gl-width="92" gl-height="184" transform="translate(4,8)" class="box2">',
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
              '<g gl-padding="2" gl-width="192" gl-height="96" transform="translate(4,2)" class="box1">',
                '<rect class="gl-layout-size" width="192" height="96" fill="none"/>',
              '</g>',
            '</g>',
            '<g gl-width="200" gl-height="100" transform="translate(0,100)">',
              '<rect class="gl-layout-size" width="200" height="100" fill="none"/>',
                '<g gl-padding="4" gl-width="184" gl-height="92" transform="translate(8,4)" class="box2">',
                  '<rect class="gl-layout-size" width="184" height="92" fill="none"/>',
                '</g>',
              '</g>',
            '</g>'
          ]));
      });
    });

  });

});
