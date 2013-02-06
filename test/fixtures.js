(function() {
  'use strict';

  jasmine.htmlFixture = function() {
    var fixture = d3.select('#html-fixture'),
        body = d3.select(document.body);
    if (!fixture.empty()) {
      return fixture;
    }
    return body.append('div').attr('id', 'html-fixture');
  };

  jasmine.svgFixture = function () {
    var fixture = d3.select('#svg-fixture'),
        body = d3.select(document.body);
    if (!fixture.empty()) {
      return fixture;
    }
    return body.append('svg').attr('id', 'svg-fixture');
  };

  jasmine.cleanFixtures = function() {
    d3.selectAll('#html-fixture, #svg-fixture').remove();
  };

  afterEach(function() {
    jasmine.cleanFixtures();
  });

}());
