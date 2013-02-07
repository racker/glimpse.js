define(
function() {
  'use strict';


  return {

    /**
     * @private
     * Default formatter for a date/time domain.
     * Text is in the format:
     *    ShortMonth Day, HH:MM AM/PM - ShortMonth Day, HH:MM AM/PM UTC
     * @param {Array} domain Contains min and max of the domain.
     * @return {String}
     * @see https://github.com/mbostock/d3/wiki/Time-Formatting#wiki-format
     */
    timeDomain: function(domain) {
      var formatter;

      formatter = d3.time.format.utc('%b %-e, %I:%M %p');
      return formatter(domain[0]) + ' - ' + formatter(domain[1]) + ' UTC';
    }
  };

});
