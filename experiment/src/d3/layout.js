(function(d3) {
  /**
   * @method selection.layout(value)
   * D3 convenience function to manage layout.
   * Takes in type (horizontal, vertical, diagonal), seperator.
   */
  d3.selection.prototype.layout = function(settings) {
    this.each(function() { console.log(this); });
  };

  function position(pos) {
    this.each(function() {
      var nodeBBox = this.getBBox(),
          parentBBox = this.parentNode.getBBox(),
          x = 0, y = 0;
      switch(pos) {
        case 'center':
          x = (parentBBox.width - nodeBBox.width)/2;
          y = (parentBBox.height - nodeBBox.height)/2;
        break;
        // add top-left, top-right etc
      }
      d3.select(this).attr({
        x: x,
        y: y
      });
    });
  };

  d3.selection.prototype.position = position;

  d3.selection.prototype.center = gl_partial(position, 'center');

})(d3);
