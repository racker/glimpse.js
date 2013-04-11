define(
function() {
  'use strict';

  function getSuffix(optSuffix) {
    return optSuffix ? ' ' + optSuffix : '';
  }

  return {

    /**
     * Default formatter for a date/time domain using UTC time.
     * Text is in the format:
     *    ShortMonth Day, HH:MM AM/PM - ShortMonth Day, HH:MM AM/PM
     * @public
     * @param {Array} domain Contains min and max of the domain.
     * @param {String} optSuffix
     * @return {String}
     * @see https://github.com/mbostock/d3/wiki/Time-Formatting#wiki-format
     */
    timeDomainUTC: function(domain, optSuffix) {
      var formatter, dateStart, dateEnd;
      formatter = d3.time.format.utc('%b %-e, %I:%M %p');
      dateStart = domain[0] instanceof Date ? domain[0] : new Date(domain[0]);
      dateEnd = domain[1] instanceof Date ? domain[1] : new Date(domain[1]);
      return formatter(dateStart) + ' - ' +
          formatter(dateEnd) + getSuffix(optSuffix);
    },

    /**
     * Formatter for a date/time domain using local time.
     * Text is in the format:
     *    ShortMonth Day, HH:MM AM/PM - ShortMonth Day, HH:MM AM/PM -0700
     * @public
     * @param {Array} domain Contains min and max of the domain.
     * @param {String} optSuffix
     * @return {String}
     * @see https://github.com/mbostock/d3/wiki/Time-Formatting#wiki-format
     */
    timeDomain: function(domain, optSuffix) {
      var formatter, dateStart, dateEnd;
      formatter = d3.time.format('%b %-e, %I:%M %p');
      dateStart = domain[0] instanceof Date ? domain[0] : new Date(domain[0]);
      dateEnd = domain[1] instanceof Date ? domain[1] : new Date(domain[1]);
      return formatter(dateStart) + ' - ' +
          formatter(dateEnd) + getSuffix(optSuffix);
    },

    /**
     * Standard formatter for non-time domains.
     * Text is in the format:
     *   start - end unit
     *
     * @param {Array} domain
     * @param {String} optSuffix
     * @return {String}
     */
    standardDomain: function(domain, optSuffix) {
      return domain[0] + ' - ' + domain[1] + getSuffix(optSuffix);
    }

  };

});
