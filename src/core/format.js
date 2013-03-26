define(
function() {
  'use strict';


  return {

    /**
     * Default formatter for a date/time domain.
     * Text is in the format:
     *    ShortMonth Day, HH:MM AM/PM - ShortMonth Day, HH:MM AM/PM UTC
     * @private
     * @param {Array} domain Contains min and max of the domain.
     * @param {Boolean} optUseUTC Optional parameter to set utc format
     * @return {String}
     * @see https://github.com/mbostock/d3/wiki/Time-Formatting#wiki-format
     */
    timeDomain: function(domain, optUseUTC) {
      var formatter, specifier;
      specifier = '%b %-e, %I:%M %p';
      formatter = !!optUseUTC ? d3.time.format.utc(specifier) :
        d3.time.format(specifier);
      return formatter(domain[0]) + ' - ' + formatter(domain[1]) + ' UTC';
    }
  };

});
