/**
 * The global glimpse namespace.
 * An embedded live example:
 *     @example
 *     glimpse.graph({title: 'Live Metrics'})
 *       .data({id: 'latency', data: latencyData}) // xLabel: 'Time', yLabel: 'Latency',
 *       .layer({renderer: 'barGraph', dataSourceId: 'latency'}) // z-index
 *       .layer({renderer: 'lineGraph', dataSourceId: 'latency'})
 *       .style('{$id} { font: 13px sans-serif; }')
 *       .style('@media only screen and (max-width:500px){ {$id} text, {$id} line, .legend { display: none; } }')
 *       .render('#coolgraph');
 */
glimpse = { version: "0.0.1" };

var gl = glimpse;

gl.dispatch = d3.dispatch(
  /**
   * @event
   * Fired when scales change. You may call domain on the scale.
   * @param {Object} xScale the x scale.
   * @param {Object} yScale the y scale.
   */
  'pan'
);
