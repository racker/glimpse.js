define([
  'components/label'
],
function(label) {
  'use strict';

  describe('components.label', function() {
    var selection, testLabel, svgNode, root, textContent;

    beforeEach(function() {
      textContent = 'some random text';
      selection = jasmine.svgFixture();
      svgNode = selection.node();
      testLabel = label()
        .text(textContent);
      spyOn(testLabel, 'update').andCallThrough();
    });

    describe('config()', function() {

      it('adds convenience functions for common config options', function() {
        expect(testLabel).toHaveProperties(
          'cid',
          'cssClass',
          'color',
          'fontFamily',
          'fontSize',
          'fontWeight',
          'show',
          'hide'
        );
      });

    });

    describe('render()', function() {

      beforeEach(function() {
        testLabel.render(selection);
        root = selection.select('.gl-label');
      });

      it('renders to the provided selection', function() {
        expect(root.node().parentNode).toBe(svgNode);
      });

      it('creates a root <g> element', function() {
        expect(root.node().nodeName).toBe('g');
      });

      it('adds the correct internal css classes', function() {
        expect(root.node()).toHaveClasses('gl-component', 'gl-label');
      });

      it('creates a <text> element', function() {
        expect(root.select('text').node().nodeName).toBe('text');
      });

      it('sets the text content', function() {
        expect(root.select('text').text()).toBe(textContent);
      });

      it('expect text to have dominant-baseline of hanging', function() {
        expect(root.select('text').style('dominant-baseline'))
          .toBe('hanging');
      });

      it('calls update()', function() {
        expect(testLabel.update).toHaveBeenCalled();
      });

    });

    describe('update()', function() {
      var textSelection;

      beforeEach(function() {
        testLabel.render(selection);
        root = selection.select('.gl-label');
        textSelection = root.select('text');
      });

      it('does nothing if render() hanst been called', function() {
        var newLabel = label();
        jasmine.cleanFixtures();
        newLabel.update();
        expect(jasmine.svgFixture().node().childNodes.length).toBe(0);
      });

      it('updates the text content)', function() {
        testLabel.text('foo');
        testLabel.update();
        expect(textSelection.text()).toBe('foo');
      });

      it('updates the cid', function() {
        testLabel.cid('my-id');
        testLabel.update();
        expect(root.node()).toHaveAttr('gl-cid', 'my-id');
      });

      it('updates the css class', function() {
        testLabel.cssClass('my-class');
        testLabel.update();
        expect(root.node()).toHaveClasses('my-class');
      });

      it('updates the text color', function() {
        testLabel.color('red');
        testLabel.update();
        expect(textSelection.node()).toHaveAttr('fill', 'red');
      });

      it('updates the font family', function() {
        testLabel.fontFamily('Courier');
        testLabel.update();
        expect(textSelection.node()).toHaveAttr('font-family', 'Courier');
      });

      it('updates the font size', function() {
        testLabel.fontSize(22);
        testLabel.update();
        expect(textSelection.node()).toHaveAttr('font-size', 22);
      });

      it('updates the font weight', function() {
        testLabel.fontWeight('bold');
        testLabel.update();
        expect(textSelection.node()).toHaveAttr('font-weight', 'bold');
      });

    });

    describe('text()', function() {
      var textNode;

      beforeEach(function() {
        testLabel.render(selection);
        root = selection.select('.gl-label');
        textNode = root.select('text').node();
      });

      it('sets static text', function() {
        testLabel.text('foo').update();
        expect(root.select('text').text()).toBe('foo');
      });

      it('sets text as a function', function() {
        var fn = function() { return 'bar'; };
        testLabel.text(fn).update();
        expect(root.select('text').text()).toBe('bar');
      });

      it('sets text as a function from data', function() {
        var data = { id: 'testData', text: 'bang' },
          fn = function(d) { return d.text; };
        testLabel.data([data]).config('dataId', 'testData').text(fn).update();
        expect(root.select('text').text()).toBe('bang');
      });

      it('applies the data function', function() {
        var data = { id: 'testData', text: 'bang' },
          fn = function(d) { return d.text; };
        testLabel.data([data]).config('dataId', 'testData').text(fn).update();
        expect(testLabel.text()).toBe('bang');
      });

    });

    describe('data()', function() {

      it('gets/sets data', function() {
        var data = { id: 'testData', text: 'bang' };
        testLabel.data([data]).config('dataId', 'testData');
        expect(testLabel.data()).toBe(data);
      });

    });

  });

});
