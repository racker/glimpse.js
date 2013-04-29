/**
 * @fileOverview
 * Helper functions for computing the domain.
 */
define([
  'd3',
  'core/object'
], function (d3, obj) {
  'use strict';

  var computeFn = {

    /**
     * Computes the extent for the given dimension.
     * Config arguments: none
     */
    'extent': function(sel, dim) {
      return sel.dim(dim).concat().extent().get();
    },

    /**
     * Computes the time interval.
     * Config arguments:
     * unit: may be 'day', 'month', 'year' etc
     * period: an integer multiplier for the unit
     */
    'interval': function(sel, dim, config) {
      var extent = computeFn.extent(sel, dim) || [0, 1],
          unitStr = obj.get(config, 'unit'),
          unit = obj.get(d3.time, unitStr),
          period = obj.get(config, 'period'),
          offset;

      if (unit) {
        offset = +unit.offset(
          extent[1],
          -(period || 1)
        );
        extent[0] = +extent[0] > +offset ? extent[0] : offset;
      }
      return extent;
    }

  };

  /**
   * Applies the appropriate compute function as specified
   * in the config.
   * If a compute function is not specified, the extents is
   * computed.
   */
  function compute(dc, dim, domainConfig) {
    var fnName = domainConfig.compute || 'extent',
        fn = computeFn[fnName];
    if (domainConfig.sources === '') {
      return domainConfig['default'];
    } else {
      return fn(dc.select(domainConfig.sources), dim, domainConfig.args);
    }
  }

  /**
   * Applies the modifiers specified in the domain config.
   * Modifiers may be force or maxMultiplier.
   */
  function modify(domain, domainConfig) {
    var modifier = domainConfig.modifier;
    if (modifier) {
      if (modifier.force) {
        if (Array.isArray(modifier.force)) {
          domain = domain.concat(modifier.force);
        } else {
          domain.push(modifier.force);
        }
        domain = d3.extent(domain);
      }
      if (modifier.maxMultiplier) {
        domain[1] = Math.round(domain[1] * modifier.maxMultiplier);
      }
    }
    return domain;
  }

  /**
   * Compute the overall data source dependencies for the domain.
   * This is required to generate the correct dependency graph for
   * domain evaluation.
   */
  function domainDeps(config) {
    var deps = {};
    Object.keys(config).forEach(function(dim) {
      config[dim].sources.split(',').forEach(function(dep) {
        deps[dep.trim()] = true;
      });
    });
    return Object.keys(deps).join(',');
  }

  return {

    /**
     * Add compute function by name.
     */
    addComputeFn: function(name, computeFn) {
      computeFn[name] = computeFn;
    },

    /*
     * Remove compute function by name.
     */
    removeComputeFn: function(name) {
      delete computeFn[name];
    },

    /**
     * Compute domains based on configuration.
     */
    addDomainDerivation: function(config, dc) {
      dc.upsert({
        id: '$domain',
        sources: domainDeps(config),
        derivation: function() {
          var domainObj = {};
          Object.keys(config).forEach(function(dim) {
            var domainConfig = config[dim],
                domain;
            domain = compute(dc, dim, domainConfig);
            domain = modify(domain, domainConfig);
            if (!domain) {
              domain = domainConfig['default'];
            }
            domainObj[dim] = domain;
          });
          return domainObj;
        }
      });
    }

  };

});
