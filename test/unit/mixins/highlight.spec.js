define([
  'core/object',
  'mixins/mixins',
  'events/pubsub',
  'data/collection'
],
function(obj, mixins, pubsubModule, dc) {
  'use strict';

  describe('mixins.highlight', function() {
    var component, selection, root, config, pubsub,
      dataConfig, dataCollection;

    dataConfig = [{
      id: 'fooData',
      title: 'Foo bar',
      data: [
        { 'x': 0, 'y': 100 },
        { 'x': 1, 'y': 50 },
        { 'x': 2, 'y': 25 },
        { 'x': 3, 'y': 75 }
      ],
      color: '#ff7f0e',
      dimensions: {
        r: function(d) { return d.x*5; }
      }
    }];

    dataCollection = dc.create();
    dataCollection.add(dataConfig);

    function createComponent() {
      var component;

      selection = jasmine.svgFixture();
      root = d3.select('#svg-fixture').append('g')
        .attr({
          'class': 'gl-component'
        });

      config = {
        cid: 'foo',
        dataId: 'fooData',
        xScale: d3.time.scale(),
        yScale: d3.scale.linear(),
        highlightRadius: 4,
        highlightFill: '#fff',
        highlightStrokeWidth: 2,
        showHighlight: true
      };

      component = {
        root: function() {return root; },
        config: function() {return config; },
        scope: function(eventName) { return 'foo' + eventName; },
        _: {
          config: config,
          root: root,
          dataCollection: dataCollection
        },
        data: function() { return dataConfig[0]; }
      };

      return component;
    }

    beforeEach(function() {
      component = createComponent();
      obj.extend(component, mixins.highlight);
      pubsub = pubsubModule.getSingleton();
    });

    it('applies highlight methods to the component', function() {
      expect(component.highlight).toBeDefined();
      expect(component.pubsubHighlightEvents).toBeDefined();
      expect(component.initHighlight).toBeDefined();
      expect(component.highlightOnHover).toBeDefined();
    });

    it('defines event methods', function() {
      expect(component.handleMouseMove).toBeDefined();
      expect(component.handleMouseOut).toBeDefined();
    });

     describe('highlight', function() {

      beforeEach(function(){
        spyOn(component, 'highlight');
        spyOn(component, 'pubsubHighlightEvents');
        component.initHighlight();
      });

      it('calls highlight function', function() {
        expect(component.highlight).toHaveBeenCalled();
      });

     it('calls pubsubHighlightEvents function', function() {
        expect(component.pubsubHighlightEvents).toHaveBeenCalled();
      });
    });

    describe('highlight', function() {
      var circle;

      beforeEach(function(){
        component.highlight();
        circle = root.select('circle');
      });

      it('adds a circle to the root', function() {
        expect(circle).toBeDefinedAndNotNull();
      });

      it('adds class with component id', function() {
        expect(circle.node()).toHaveAttr('class', 'gl-highlight-foo');
      });

      it('sets the radius to configured value', function() {
        expect(circle.node()).toHaveAttr('r', config.highlightRadius);
      });

      it('sets the visibility to hidden', function() {
        expect(circle.node()).toHaveAttr('visibility', 'hidden');
      });

      it('sets the fill to configured value', function() {
        expect(circle.node()).toHaveAttr('fill', config.highlightFill);
      });

      it('sets the stroke-width to configured value', function() {
        expect(circle.node()).toHaveAttr(
          'stroke-width', config.highlightStrokeWidth
        );
      });

      it('adds only one circle to the root', function() {
        var circles;
        component.highlight();
        circles = root.selectAll('circle');
        expect(circles.length).toBe(1);
      });

    });

    describe('handleMouseOut', function() {
      var circle;
      beforeEach(function(){
        component.highlight();
        circle = root.select('circle').attr('visibility', 'visible');
        component.handleMouseOut(component);
      });

      it('sets the visibility to hidden', function() {
        expect(circle.node()).toHaveAttr('visibility', 'hidden');
      });

      it('applies transition on the highlight if set',
        function() {
          var circle;
          runs(function() {
            config.showHighlightTransition = true;
            config.highlightTransDuration = 100;
            config.highlightTransDelay = 100;
            component.handleMouseOut(component);
          });
          waits(250);
          runs(function() {
            circle = root.select('circle');
            expect(circle.node()).toHaveAttr('r', 0);
          });

      });

    });

    describe('pubsubHighlightEvents', function() {
      beforeEach(function(){
        obj.extend(component, mixins.component);
        component.init();
        spyOn(component._.globalPubsub, 'sub');
        spyOn(component._.globalPubsub, 'pub');
        component.pubsubHighlightEvents(component._.globalPubsub, {});
      });

      it('subscribes to mouseout and mousemove', function() {
        expect(component._.globalPubsub.sub.callCount).toBe(2);
      });

      it('attaches event for mousemove', function() {
        component.emit('mousemove');
        expect(component._.globalPubsub.pub).toHaveBeenCalled();
      });

      it('attaches event for mouseout', function() {
        component.emit('mouseout');
        expect(component._.globalPubsub.pub).toHaveBeenCalled();
      });

    });

    describe('handleMouseMove', function() {
      var circle;

      beforeEach(function(){
        component.highlight();
        spyOn(d3, 'mouse').andReturn([1, 20]);
        component.handleMouseMove(
          root.select('.gl-component'),
          component,
          dataCollection
        );
        circle = root.select('circle');
      });

      it('sets the visibility of the circle to visible', function() {
        expect(circle.node()).toHaveAttr('visibility', 'visible');
      });

      it('translates the circle to the nearest data point', function() {
        expect(circle.node()).toHaveAttr('transform', 'translate(1,50)');
      });

      it('sets radius based using dimension if type of component is scatter',
        function() {
          config.type = 'scatter';
          component.handleMouseMove(
            root.select('.gl-component'),
            component,
            dataCollection
          );
          circle = root.select('circle');
          expect(circle.node()).toHaveAttr('r', 5);
      });

    });

     describe('highlightOnHover', function() {
      var circle;

      beforeEach(function(){
        component.highlight();
        component.highlightOnHover(
          component,
          dataCollection,
          1
        );
        circle = root.select('circle');
      });

      it('sets the visibility of the circle to visible', function() {
        expect(circle.node()).toHaveAttr('visibility', 'visible');
      });

      it('translates the circle to the nearest data point', function() {
        expect(circle.node()).toHaveAttr('transform', 'translate(1,50)');
      });

    });

  });

});
