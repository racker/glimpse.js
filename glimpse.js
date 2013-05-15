(function (global) {

/**
 * almond 0.2.5 Copyright (c) 2011-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);

                name = baseParts.concat(name.split("/"));

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (typeof callback === 'function') {

            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback.apply(defined[name], args);

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        config = cfg;
        if (config.deps) {
            req(config.deps, config.callback);
        }
        return req;
    };

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

d3 = function() {
  var π = Math.PI, ε = 1e-6, d3 = {
    version: "3.0.8"
  }, d3_radians = π / 180, d3_degrees = 180 / π, d3_document = document, d3_window = window;
  function d3_target(d) {
    return d.target;
  }
  function d3_source(d) {
    return d.source;
  }
  var d3_format_decimalPoint = ".", d3_format_thousandsSeparator = ",", d3_format_grouping = [ 3, 3 ];
  if (!Date.now) Date.now = function() {
    return +new Date();
  };
  try {
    d3_document.createElement("div").style.setProperty("opacity", 0, "");
  } catch (error) {
    var d3_style_prototype = d3_window.CSSStyleDeclaration.prototype, d3_style_setProperty = d3_style_prototype.setProperty;
    d3_style_prototype.setProperty = function(name, value, priority) {
      d3_style_setProperty.call(this, name, value + "", priority);
    };
  }
  function d3_class(ctor, properties) {
    try {
      for (var key in properties) {
        Object.defineProperty(ctor.prototype, key, {
          value: properties[key],
          enumerable: false
        });
      }
    } catch (e) {
      ctor.prototype = properties;
    }
  }
  var d3_array = d3_arraySlice;
  function d3_arrayCopy(pseudoarray) {
    var i = -1, n = pseudoarray.length, array = [];
    while (++i < n) array.push(pseudoarray[i]);
    return array;
  }
  function d3_arraySlice(pseudoarray) {
    return Array.prototype.slice.call(pseudoarray);
  }
  try {
    d3_array(d3_document.documentElement.childNodes)[0].nodeType;
  } catch (e) {
    d3_array = d3_arrayCopy;
  }
  var d3_arraySubclass = [].__proto__ ? function(array, prototype) {
    array.__proto__ = prototype;
  } : function(array, prototype) {
    for (var property in prototype) array[property] = prototype[property];
  };
  d3.map = function(object) {
    var map = new d3_Map();
    for (var key in object) map.set(key, object[key]);
    return map;
  };
  function d3_Map() {}
  d3_class(d3_Map, {
    has: function(key) {
      return d3_map_prefix + key in this;
    },
    get: function(key) {
      return this[d3_map_prefix + key];
    },
    set: function(key, value) {
      return this[d3_map_prefix + key] = value;
    },
    remove: function(key) {
      key = d3_map_prefix + key;
      return key in this && delete this[key];
    },
    keys: function() {
      var keys = [];
      this.forEach(function(key) {
        keys.push(key);
      });
      return keys;
    },
    values: function() {
      var values = [];
      this.forEach(function(key, value) {
        values.push(value);
      });
      return values;
    },
    entries: function() {
      var entries = [];
      this.forEach(function(key, value) {
        entries.push({
          key: key,
          value: value
        });
      });
      return entries;
    },
    forEach: function(f) {
      for (var key in this) {
        if (key.charCodeAt(0) === d3_map_prefixCode) {
          f.call(this, key.substring(1), this[key]);
        }
      }
    }
  });
  var d3_map_prefix = "\0", d3_map_prefixCode = d3_map_prefix.charCodeAt(0);
  function d3_identity(d) {
    return d;
  }
  function d3_true() {
    return true;
  }
  function d3_functor(v) {
    return typeof v === "function" ? v : function() {
      return v;
    };
  }
  d3.functor = d3_functor;
  d3.rebind = function(target, source) {
    var i = 1, n = arguments.length, method;
    while (++i < n) target[method = arguments[i]] = d3_rebind(target, source, source[method]);
    return target;
  };
  function d3_rebind(target, source, method) {
    return function() {
      var value = method.apply(source, arguments);
      return value === source ? target : value;
    };
  }
  d3.ascending = function(a, b) {
    return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
  };
  d3.descending = function(a, b) {
    return b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
  };
  d3.mean = function(array, f) {
    var n = array.length, a, m = 0, i = -1, j = 0;
    if (arguments.length === 1) {
      while (++i < n) if (d3_number(a = array[i])) m += (a - m) / ++j;
    } else {
      while (++i < n) if (d3_number(a = f.call(array, array[i], i))) m += (a - m) / ++j;
    }
    return j ? m : undefined;
  };
  d3.median = function(array, f) {
    if (arguments.length > 1) array = array.map(f);
    array = array.filter(d3_number);
    return array.length ? d3.quantile(array.sort(d3.ascending), .5) : undefined;
  };
  d3.min = function(array, f) {
    var i = -1, n = array.length, a, b;
    if (arguments.length === 1) {
      while (++i < n && ((a = array[i]) == null || a != a)) a = undefined;
      while (++i < n) if ((b = array[i]) != null && a > b) a = b;
    } else {
      while (++i < n && ((a = f.call(array, array[i], i)) == null || a != a)) a = undefined;
      while (++i < n) if ((b = f.call(array, array[i], i)) != null && a > b) a = b;
    }
    return a;
  };
  d3.max = function(array, f) {
    var i = -1, n = array.length, a, b;
    if (arguments.length === 1) {
      while (++i < n && ((a = array[i]) == null || a != a)) a = undefined;
      while (++i < n) if ((b = array[i]) != null && b > a) a = b;
    } else {
      while (++i < n && ((a = f.call(array, array[i], i)) == null || a != a)) a = undefined;
      while (++i < n) if ((b = f.call(array, array[i], i)) != null && b > a) a = b;
    }
    return a;
  };
  d3.extent = function(array, f) {
    var i = -1, n = array.length, a, b, c;
    if (arguments.length === 1) {
      while (++i < n && ((a = c = array[i]) == null || a != a)) a = c = undefined;
      while (++i < n) if ((b = array[i]) != null) {
        if (a > b) a = b;
        if (c < b) c = b;
      }
    } else {
      while (++i < n && ((a = c = f.call(array, array[i], i)) == null || a != a)) a = undefined;
      while (++i < n) if ((b = f.call(array, array[i], i)) != null) {
        if (a > b) a = b;
        if (c < b) c = b;
      }
    }
    return [ a, c ];
  };
  d3.random = {
    normal: function(µ, σ) {
      var n = arguments.length;
      if (n < 2) σ = 1;
      if (n < 1) µ = 0;
      return function() {
        var x, y, r;
        do {
          x = Math.random() * 2 - 1;
          y = Math.random() * 2 - 1;
          r = x * x + y * y;
        } while (!r || r > 1);
        return µ + σ * x * Math.sqrt(-2 * Math.log(r) / r);
      };
    },
    logNormal: function() {
      var random = d3.random.normal.apply(d3, arguments);
      return function() {
        return Math.exp(random());
      };
    },
    irwinHall: function(m) {
      return function() {
        for (var s = 0, j = 0; j < m; j++) s += Math.random();
        return s / m;
      };
    }
  };
  function d3_number(x) {
    return x != null && !isNaN(x);
  }
  d3.sum = function(array, f) {
    var s = 0, n = array.length, a, i = -1;
    if (arguments.length === 1) {
      while (++i < n) if (!isNaN(a = +array[i])) s += a;
    } else {
      while (++i < n) if (!isNaN(a = +f.call(array, array[i], i))) s += a;
    }
    return s;
  };
  d3.quantile = function(values, p) {
    var H = (values.length - 1) * p + 1, h = Math.floor(H), v = +values[h - 1], e = H - h;
    return e ? v + e * (values[h] - v) : v;
  };
  d3.shuffle = function(array) {
    var m = array.length, t, i;
    while (m) {
      i = Math.random() * m-- | 0;
      t = array[m], array[m] = array[i], array[i] = t;
    }
    return array;
  };
  d3.transpose = function(matrix) {
    return d3.zip.apply(d3, matrix);
  };
  d3.zip = function() {
    if (!(n = arguments.length)) return [];
    for (var i = -1, m = d3.min(arguments, d3_zipLength), zips = new Array(m); ++i < m; ) {
      for (var j = -1, n, zip = zips[i] = new Array(n); ++j < n; ) {
        zip[j] = arguments[j][i];
      }
    }
    return zips;
  };
  function d3_zipLength(d) {
    return d.length;
  }
  d3.bisector = function(f) {
    return {
      left: function(a, x, lo, hi) {
        if (arguments.length < 3) lo = 0;
        if (arguments.length < 4) hi = a.length;
        while (lo < hi) {
          var mid = lo + hi >>> 1;
          if (f.call(a, a[mid], mid) < x) lo = mid + 1; else hi = mid;
        }
        return lo;
      },
      right: function(a, x, lo, hi) {
        if (arguments.length < 3) lo = 0;
        if (arguments.length < 4) hi = a.length;
        while (lo < hi) {
          var mid = lo + hi >>> 1;
          if (x < f.call(a, a[mid], mid)) hi = mid; else lo = mid + 1;
        }
        return lo;
      }
    };
  };
  var d3_bisector = d3.bisector(function(d) {
    return d;
  });
  d3.bisectLeft = d3_bisector.left;
  d3.bisect = d3.bisectRight = d3_bisector.right;
  d3.nest = function() {
    var nest = {}, keys = [], sortKeys = [], sortValues, rollup;
    function map(array, depth) {
      if (depth >= keys.length) return rollup ? rollup.call(nest, array) : sortValues ? array.sort(sortValues) : array;
      var i = -1, n = array.length, key = keys[depth++], keyValue, object, valuesByKey = new d3_Map(), values, o = {};
      while (++i < n) {
        if (values = valuesByKey.get(keyValue = key(object = array[i]))) {
          values.push(object);
        } else {
          valuesByKey.set(keyValue, [ object ]);
        }
      }
      valuesByKey.forEach(function(keyValue, values) {
        o[keyValue] = map(values, depth);
      });
      return o;
    }
    function entries(map, depth) {
      if (depth >= keys.length) return map;
      var a = [], sortKey = sortKeys[depth++], key;
      for (key in map) {
        a.push({
          key: key,
          values: entries(map[key], depth)
        });
      }
      if (sortKey) a.sort(function(a, b) {
        return sortKey(a.key, b.key);
      });
      return a;
    }
    nest.map = function(array) {
      return map(array, 0);
    };
    nest.entries = function(array) {
      return entries(map(array, 0), 0);
    };
    nest.key = function(d) {
      keys.push(d);
      return nest;
    };
    nest.sortKeys = function(order) {
      sortKeys[keys.length - 1] = order;
      return nest;
    };
    nest.sortValues = function(order) {
      sortValues = order;
      return nest;
    };
    nest.rollup = function(f) {
      rollup = f;
      return nest;
    };
    return nest;
  };
  d3.keys = function(map) {
    var keys = [];
    for (var key in map) keys.push(key);
    return keys;
  };
  d3.values = function(map) {
    var values = [];
    for (var key in map) values.push(map[key]);
    return values;
  };
  d3.entries = function(map) {
    var entries = [];
    for (var key in map) entries.push({
      key: key,
      value: map[key]
    });
    return entries;
  };
  d3.permute = function(array, indexes) {
    var permutes = [], i = -1, n = indexes.length;
    while (++i < n) permutes[i] = array[indexes[i]];
    return permutes;
  };
  d3.merge = function(arrays) {
    return Array.prototype.concat.apply([], arrays);
  };
  function d3_collapse(s) {
    return s.trim().replace(/\s+/g, " ");
  }
  d3.range = function(start, stop, step) {
    if (arguments.length < 3) {
      step = 1;
      if (arguments.length < 2) {
        stop = start;
        start = 0;
      }
    }
    if ((stop - start) / step === Infinity) throw new Error("infinite range");
    var range = [], k = d3_range_integerScale(Math.abs(step)), i = -1, j;
    start *= k, stop *= k, step *= k;
    if (step < 0) while ((j = start + step * ++i) > stop) range.push(j / k); else while ((j = start + step * ++i) < stop) range.push(j / k);
    return range;
  };
  function d3_range_integerScale(x) {
    var k = 1;
    while (x * k % 1) k *= 10;
    return k;
  }
  d3.requote = function(s) {
    return s.replace(d3_requote_re, "\\$&");
  };
  var d3_requote_re = /[\\\^\$\*\+\?\|\[\]\(\)\.\{\}]/g;
  d3.round = function(x, n) {
    return n ? Math.round(x * (n = Math.pow(10, n))) / n : Math.round(x);
  };
  d3.xhr = function(url, mimeType, callback) {
    var xhr = {}, dispatch = d3.dispatch("progress", "load", "error"), headers = {}, response = d3_identity, request = new (d3_window.XDomainRequest && /^(http(s)?:)?\/\//.test(url) ? XDomainRequest : XMLHttpRequest)();
    "onload" in request ? request.onload = request.onerror = respond : request.onreadystatechange = function() {
      request.readyState > 3 && respond();
    };
    function respond() {
      var s = request.status;
      !s && request.responseText || s >= 200 && s < 300 || s === 304 ? dispatch.load.call(xhr, response.call(xhr, request)) : dispatch.error.call(xhr, request);
    }
    request.onprogress = function(event) {
      var o = d3.event;
      d3.event = event;
      try {
        dispatch.progress.call(xhr, request);
      } finally {
        d3.event = o;
      }
    };
    xhr.header = function(name, value) {
      name = (name + "").toLowerCase();
      if (arguments.length < 2) return headers[name];
      if (value == null) delete headers[name]; else headers[name] = value + "";
      return xhr;
    };
    xhr.mimeType = function(value) {
      if (!arguments.length) return mimeType;
      mimeType = value == null ? null : value + "";
      return xhr;
    };
    xhr.response = function(value) {
      response = value;
      return xhr;
    };
    [ "get", "post" ].forEach(function(method) {
      xhr[method] = function() {
        return xhr.send.apply(xhr, [ method ].concat(d3_array(arguments)));
      };
    });
    xhr.send = function(method, data, callback) {
      if (arguments.length === 2 && typeof data === "function") callback = data, data = null;
      request.open(method, url, true);
      if (mimeType != null && !("accept" in headers)) headers["accept"] = mimeType + ",*/*";
      if (request.setRequestHeader) for (var name in headers) request.setRequestHeader(name, headers[name]);
      if (mimeType != null && request.overrideMimeType) request.overrideMimeType(mimeType);
      if (callback != null) xhr.on("error", callback).on("load", function(request) {
        callback(null, request);
      });
      request.send(data == null ? null : data);
      return xhr;
    };
    xhr.abort = function() {
      request.abort();
      return xhr;
    };
    d3.rebind(xhr, dispatch, "on");
    if (arguments.length === 2 && typeof mimeType === "function") callback = mimeType, 
    mimeType = null;
    return callback == null ? xhr : xhr.get(d3_xhr_fixCallback(callback));
  };
  function d3_xhr_fixCallback(callback) {
    return callback.length === 1 ? function(error, request) {
      callback(error == null ? request : null);
    } : callback;
  }
  d3.text = function() {
    return d3.xhr.apply(d3, arguments).response(d3_text);
  };
  function d3_text(request) {
    return request.responseText;
  }
  d3.json = function(url, callback) {
    return d3.xhr(url, "application/json", callback).response(d3_json);
  };
  function d3_json(request) {
    return JSON.parse(request.responseText);
  }
  d3.html = function(url, callback) {
    return d3.xhr(url, "text/html", callback).response(d3_html);
  };
  function d3_html(request) {
    var range = d3_document.createRange();
    range.selectNode(d3_document.body);
    return range.createContextualFragment(request.responseText);
  }
  d3.xml = function() {
    return d3.xhr.apply(d3, arguments).response(d3_xml);
  };
  function d3_xml(request) {
    return request.responseXML;
  }
  var d3_nsPrefix = {
    svg: "http://www.w3.org/2000/svg",
    xhtml: "http://www.w3.org/1999/xhtml",
    xlink: "http://www.w3.org/1999/xlink",
    xml: "http://www.w3.org/XML/1998/namespace",
    xmlns: "http://www.w3.org/2000/xmlns/"
  };
  d3.ns = {
    prefix: d3_nsPrefix,
    qualify: function(name) {
      var i = name.indexOf(":"), prefix = name;
      if (i >= 0) {
        prefix = name.substring(0, i);
        name = name.substring(i + 1);
      }
      return d3_nsPrefix.hasOwnProperty(prefix) ? {
        space: d3_nsPrefix[prefix],
        local: name
      } : name;
    }
  };
  d3.dispatch = function() {
    var dispatch = new d3_dispatch(), i = -1, n = arguments.length;
    while (++i < n) dispatch[arguments[i]] = d3_dispatch_event(dispatch);
    return dispatch;
  };
  function d3_dispatch() {}
  d3_dispatch.prototype.on = function(type, listener) {
    var i = type.indexOf("."), name = "";
    if (i > 0) {
      name = type.substring(i + 1);
      type = type.substring(0, i);
    }
    return arguments.length < 2 ? this[type].on(name) : this[type].on(name, listener);
  };
  function d3_dispatch_event(dispatch) {
    var listeners = [], listenerByName = new d3_Map();
    function event() {
      var z = listeners, i = -1, n = z.length, l;
      while (++i < n) if (l = z[i].on) l.apply(this, arguments);
      return dispatch;
    }
    event.on = function(name, listener) {
      var l = listenerByName.get(name), i;
      if (arguments.length < 2) return l && l.on;
      if (l) {
        l.on = null;
        listeners = listeners.slice(0, i = listeners.indexOf(l)).concat(listeners.slice(i + 1));
        listenerByName.remove(name);
      }
      if (listener) listeners.push(listenerByName.set(name, {
        on: listener
      }));
      return dispatch;
    };
    return event;
  }
  d3.format = function(specifier) {
    var match = d3_format_re.exec(specifier), fill = match[1] || " ", align = match[2] || ">", sign = match[3] || "", basePrefix = match[4] || "", zfill = match[5], width = +match[6], comma = match[7], precision = match[8], type = match[9], scale = 1, suffix = "", integer = false;
    if (precision) precision = +precision.substring(1);
    if (zfill || fill === "0" && align === "=") {
      zfill = fill = "0";
      align = "=";
      if (comma) width -= Math.floor((width - 1) / 4);
    }
    switch (type) {
     case "n":
      comma = true;
      type = "g";
      break;

     case "%":
      scale = 100;
      suffix = "%";
      type = "f";
      break;

     case "p":
      scale = 100;
      suffix = "%";
      type = "r";
      break;

     case "b":
     case "o":
     case "x":
     case "X":
      if (basePrefix) basePrefix = "0" + type.toLowerCase();

     case "c":
     case "d":
      integer = true;
      precision = 0;
      break;

     case "s":
      scale = -1;
      type = "r";
      break;
    }
    if (basePrefix === "#") basePrefix = "";
    if (type == "r" && !precision) type = "g";
    type = d3_format_types.get(type) || d3_format_typeDefault;
    var zcomma = zfill && comma;
    return function(value) {
      if (integer && value % 1) return "";
      var negative = value < 0 || value === 0 && 1 / value < 0 ? (value = -value, "-") : sign;
      if (scale < 0) {
        var prefix = d3.formatPrefix(value, precision);
        value = prefix.scale(value);
        suffix = prefix.symbol;
      } else {
        value *= scale;
      }
      value = type(value, precision);
      if (!zfill && comma) value = d3_format_group(value);
      var length = basePrefix.length + value.length + (zcomma ? 0 : negative.length), padding = length < width ? new Array(length = width - length + 1).join(fill) : "";
      if (zcomma) value = d3_format_group(padding + value);
      if (d3_format_decimalPoint) value.replace(".", d3_format_decimalPoint);
      negative += basePrefix;
      return (align === "<" ? negative + value + padding : align === ">" ? padding + negative + value : align === "^" ? padding.substring(0, length >>= 1) + negative + value + padding.substring(length) : negative + (zcomma ? value : padding + value)) + suffix;
    };
  };
  var d3_format_re = /(?:([^{])?([<>=^]))?([+\- ])?(#)?(0)?([0-9]+)?(,)?(\.[0-9]+)?([a-zA-Z%])?/;
  var d3_format_types = d3.map({
    b: function(x) {
      return x.toString(2);
    },
    c: function(x) {
      return String.fromCharCode(x);
    },
    o: function(x) {
      return x.toString(8);
    },
    x: function(x) {
      return x.toString(16);
    },
    X: function(x) {
      return x.toString(16).toUpperCase();
    },
    g: function(x, p) {
      return x.toPrecision(p);
    },
    e: function(x, p) {
      return x.toExponential(p);
    },
    f: function(x, p) {
      return x.toFixed(p);
    },
    r: function(x, p) {
      return (x = d3.round(x, d3_format_precision(x, p))).toFixed(Math.max(0, Math.min(20, d3_format_precision(x * (1 + 1e-15), p))));
    }
  });
  function d3_format_precision(x, p) {
    return p - (x ? Math.ceil(Math.log(x) / Math.LN10) : 1);
  }
  function d3_format_typeDefault(x) {
    return x + "";
  }
  var d3_format_group = d3_identity;
  if (d3_format_grouping) {
    var d3_format_groupingLength = d3_format_grouping.length;
    d3_format_group = function(value) {
      var i = value.lastIndexOf("."), f = i >= 0 ? "." + value.substring(i + 1) : (i = value.length, 
      ""), t = [], j = 0, g = d3_format_grouping[0];
      while (i > 0 && g > 0) {
        t.push(value.substring(i -= g, i + g));
        g = d3_format_grouping[j = (j + 1) % d3_format_groupingLength];
      }
      return t.reverse().join(d3_format_thousandsSeparator || "") + f;
    };
  }
  var d3_formatPrefixes = [ "y", "z", "a", "f", "p", "n", "µ", "m", "", "k", "M", "G", "T", "P", "E", "Z", "Y" ].map(d3_formatPrefix);
  d3.formatPrefix = function(value, precision) {
    var i = 0;
    if (value) {
      if (value < 0) value *= -1;
      if (precision) value = d3.round(value, d3_format_precision(value, precision));
      i = 1 + Math.floor(1e-12 + Math.log(value) / Math.LN10);
      i = Math.max(-24, Math.min(24, Math.floor((i <= 0 ? i + 1 : i - 1) / 3) * 3));
    }
    return d3_formatPrefixes[8 + i / 3];
  };
  function d3_formatPrefix(d, i) {
    var k = Math.pow(10, Math.abs(8 - i) * 3);
    return {
      scale: i > 8 ? function(d) {
        return d / k;
      } : function(d) {
        return d * k;
      },
      symbol: d
    };
  }
  var d3_ease_default = function() {
    return d3_identity;
  };
  var d3_ease = d3.map({
    linear: d3_ease_default,
    poly: d3_ease_poly,
    quad: function() {
      return d3_ease_quad;
    },
    cubic: function() {
      return d3_ease_cubic;
    },
    sin: function() {
      return d3_ease_sin;
    },
    exp: function() {
      return d3_ease_exp;
    },
    circle: function() {
      return d3_ease_circle;
    },
    elastic: d3_ease_elastic,
    back: d3_ease_back,
    bounce: function() {
      return d3_ease_bounce;
    }
  });
  var d3_ease_mode = d3.map({
    "in": d3_identity,
    out: d3_ease_reverse,
    "in-out": d3_ease_reflect,
    "out-in": function(f) {
      return d3_ease_reflect(d3_ease_reverse(f));
    }
  });
  d3.ease = function(name) {
    var i = name.indexOf("-"), t = i >= 0 ? name.substring(0, i) : name, m = i >= 0 ? name.substring(i + 1) : "in";
    t = d3_ease.get(t) || d3_ease_default;
    m = d3_ease_mode.get(m) || d3_identity;
    return d3_ease_clamp(m(t.apply(null, Array.prototype.slice.call(arguments, 1))));
  };
  function d3_ease_clamp(f) {
    return function(t) {
      return t <= 0 ? 0 : t >= 1 ? 1 : f(t);
    };
  }
  function d3_ease_reverse(f) {
    return function(t) {
      return 1 - f(1 - t);
    };
  }
  function d3_ease_reflect(f) {
    return function(t) {
      return .5 * (t < .5 ? f(2 * t) : 2 - f(2 - 2 * t));
    };
  }
  function d3_ease_quad(t) {
    return t * t;
  }
  function d3_ease_cubic(t) {
    return t * t * t;
  }
  function d3_ease_cubicInOut(t) {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    var t2 = t * t, t3 = t2 * t;
    return 4 * (t < .5 ? t3 : 3 * (t - t2) + t3 - .75);
  }
  function d3_ease_poly(e) {
    return function(t) {
      return Math.pow(t, e);
    };
  }
  function d3_ease_sin(t) {
    return 1 - Math.cos(t * π / 2);
  }
  function d3_ease_exp(t) {
    return Math.pow(2, 10 * (t - 1));
  }
  function d3_ease_circle(t) {
    return 1 - Math.sqrt(1 - t * t);
  }
  function d3_ease_elastic(a, p) {
    var s;
    if (arguments.length < 2) p = .45;
    if (arguments.length) s = p / (2 * π) * Math.asin(1 / a); else a = 1, s = p / 4;
    return function(t) {
      return 1 + a * Math.pow(2, 10 * -t) * Math.sin((t - s) * 2 * π / p);
    };
  }
  function d3_ease_back(s) {
    if (!s) s = 1.70158;
    return function(t) {
      return t * t * ((s + 1) * t - s);
    };
  }
  function d3_ease_bounce(t) {
    return t < 1 / 2.75 ? 7.5625 * t * t : t < 2 / 2.75 ? 7.5625 * (t -= 1.5 / 2.75) * t + .75 : t < 2.5 / 2.75 ? 7.5625 * (t -= 2.25 / 2.75) * t + .9375 : 7.5625 * (t -= 2.625 / 2.75) * t + .984375;
  }
  d3.event = null;
  function d3_eventCancel() {
    d3.event.stopPropagation();
    d3.event.preventDefault();
  }
  function d3_eventSource() {
    var e = d3.event, s;
    while (s = e.sourceEvent) e = s;
    return e;
  }
  function d3_eventDispatch(target) {
    var dispatch = new d3_dispatch(), i = 0, n = arguments.length;
    while (++i < n) dispatch[arguments[i]] = d3_dispatch_event(dispatch);
    dispatch.of = function(thiz, argumentz) {
      return function(e1) {
        try {
          var e0 = e1.sourceEvent = d3.event;
          e1.target = target;
          d3.event = e1;
          dispatch[e1.type].apply(thiz, argumentz);
        } finally {
          d3.event = e0;
        }
      };
    };
    return dispatch;
  }
  d3.transform = function(string) {
    var g = d3_document.createElementNS(d3.ns.prefix.svg, "g");
    return (d3.transform = function(string) {
      g.setAttribute("transform", string);
      var t = g.transform.baseVal.consolidate();
      return new d3_transform(t ? t.matrix : d3_transformIdentity);
    })(string);
  };
  function d3_transform(m) {
    var r0 = [ m.a, m.b ], r1 = [ m.c, m.d ], kx = d3_transformNormalize(r0), kz = d3_transformDot(r0, r1), ky = d3_transformNormalize(d3_transformCombine(r1, r0, -kz)) || 0;
    if (r0[0] * r1[1] < r1[0] * r0[1]) {
      r0[0] *= -1;
      r0[1] *= -1;
      kx *= -1;
      kz *= -1;
    }
    this.rotate = (kx ? Math.atan2(r0[1], r0[0]) : Math.atan2(-r1[0], r1[1])) * d3_degrees;
    this.translate = [ m.e, m.f ];
    this.scale = [ kx, ky ];
    this.skew = ky ? Math.atan2(kz, ky) * d3_degrees : 0;
  }
  d3_transform.prototype.toString = function() {
    return "translate(" + this.translate + ")rotate(" + this.rotate + ")skewX(" + this.skew + ")scale(" + this.scale + ")";
  };
  function d3_transformDot(a, b) {
    return a[0] * b[0] + a[1] * b[1];
  }
  function d3_transformNormalize(a) {
    var k = Math.sqrt(d3_transformDot(a, a));
    if (k) {
      a[0] /= k;
      a[1] /= k;
    }
    return k;
  }
  function d3_transformCombine(a, b, k) {
    a[0] += k * b[0];
    a[1] += k * b[1];
    return a;
  }
  var d3_transformIdentity = {
    a: 1,
    b: 0,
    c: 0,
    d: 1,
    e: 0,
    f: 0
  };
  d3.interpolate = function(a, b) {
    var i = d3.interpolators.length, f;
    while (--i >= 0 && !(f = d3.interpolators[i](a, b))) ;
    return f;
  };
  d3.interpolateNumber = function(a, b) {
    b -= a;
    return function(t) {
      return a + b * t;
    };
  };
  d3.interpolateRound = function(a, b) {
    b -= a;
    return function(t) {
      return Math.round(a + b * t);
    };
  };
  d3.interpolateString = function(a, b) {
    var m, i, j, s0 = 0, s1 = 0, s = [], q = [], n, o;
    d3_interpolate_number.lastIndex = 0;
    for (i = 0; m = d3_interpolate_number.exec(b); ++i) {
      if (m.index) s.push(b.substring(s0, s1 = m.index));
      q.push({
        i: s.length,
        x: m[0]
      });
      s.push(null);
      s0 = d3_interpolate_number.lastIndex;
    }
    if (s0 < b.length) s.push(b.substring(s0));
    for (i = 0, n = q.length; (m = d3_interpolate_number.exec(a)) && i < n; ++i) {
      o = q[i];
      if (o.x == m[0]) {
        if (o.i) {
          if (s[o.i + 1] == null) {
            s[o.i - 1] += o.x;
            s.splice(o.i, 1);
            for (j = i + 1; j < n; ++j) q[j].i--;
          } else {
            s[o.i - 1] += o.x + s[o.i + 1];
            s.splice(o.i, 2);
            for (j = i + 1; j < n; ++j) q[j].i -= 2;
          }
        } else {
          if (s[o.i + 1] == null) {
            s[o.i] = o.x;
          } else {
            s[o.i] = o.x + s[o.i + 1];
            s.splice(o.i + 1, 1);
            for (j = i + 1; j < n; ++j) q[j].i--;
          }
        }
        q.splice(i, 1);
        n--;
        i--;
      } else {
        o.x = d3.interpolateNumber(parseFloat(m[0]), parseFloat(o.x));
      }
    }
    while (i < n) {
      o = q.pop();
      if (s[o.i + 1] == null) {
        s[o.i] = o.x;
      } else {
        s[o.i] = o.x + s[o.i + 1];
        s.splice(o.i + 1, 1);
      }
      n--;
    }
    if (s.length === 1) {
      return s[0] == null ? q[0].x : function() {
        return b;
      };
    }
    return function(t) {
      for (i = 0; i < n; ++i) s[(o = q[i]).i] = o.x(t);
      return s.join("");
    };
  };
  d3.interpolateTransform = function(a, b) {
    var s = [], q = [], n, A = d3.transform(a), B = d3.transform(b), ta = A.translate, tb = B.translate, ra = A.rotate, rb = B.rotate, wa = A.skew, wb = B.skew, ka = A.scale, kb = B.scale;
    if (ta[0] != tb[0] || ta[1] != tb[1]) {
      s.push("translate(", null, ",", null, ")");
      q.push({
        i: 1,
        x: d3.interpolateNumber(ta[0], tb[0])
      }, {
        i: 3,
        x: d3.interpolateNumber(ta[1], tb[1])
      });
    } else if (tb[0] || tb[1]) {
      s.push("translate(" + tb + ")");
    } else {
      s.push("");
    }
    if (ra != rb) {
      if (ra - rb > 180) rb += 360; else if (rb - ra > 180) ra += 360;
      q.push({
        i: s.push(s.pop() + "rotate(", null, ")") - 2,
        x: d3.interpolateNumber(ra, rb)
      });
    } else if (rb) {
      s.push(s.pop() + "rotate(" + rb + ")");
    }
    if (wa != wb) {
      q.push({
        i: s.push(s.pop() + "skewX(", null, ")") - 2,
        x: d3.interpolateNumber(wa, wb)
      });
    } else if (wb) {
      s.push(s.pop() + "skewX(" + wb + ")");
    }
    if (ka[0] != kb[0] || ka[1] != kb[1]) {
      n = s.push(s.pop() + "scale(", null, ",", null, ")");
      q.push({
        i: n - 4,
        x: d3.interpolateNumber(ka[0], kb[0])
      }, {
        i: n - 2,
        x: d3.interpolateNumber(ka[1], kb[1])
      });
    } else if (kb[0] != 1 || kb[1] != 1) {
      s.push(s.pop() + "scale(" + kb + ")");
    }
    n = q.length;
    return function(t) {
      var i = -1, o;
      while (++i < n) s[(o = q[i]).i] = o.x(t);
      return s.join("");
    };
  };
  d3.interpolateRgb = function(a, b) {
    a = d3.rgb(a);
    b = d3.rgb(b);
    var ar = a.r, ag = a.g, ab = a.b, br = b.r - ar, bg = b.g - ag, bb = b.b - ab;
    return function(t) {
      return "#" + d3_rgb_hex(Math.round(ar + br * t)) + d3_rgb_hex(Math.round(ag + bg * t)) + d3_rgb_hex(Math.round(ab + bb * t));
    };
  };
  d3.interpolateHsl = function(a, b) {
    a = d3.hsl(a);
    b = d3.hsl(b);
    var h0 = a.h, s0 = a.s, l0 = a.l, h1 = b.h - h0, s1 = b.s - s0, l1 = b.l - l0;
    if (h1 > 180) h1 -= 360; else if (h1 < -180) h1 += 360;
    return function(t) {
      return d3_hsl_rgb(h0 + h1 * t, s0 + s1 * t, l0 + l1 * t) + "";
    };
  };
  d3.interpolateLab = function(a, b) {
    a = d3.lab(a);
    b = d3.lab(b);
    var al = a.l, aa = a.a, ab = a.b, bl = b.l - al, ba = b.a - aa, bb = b.b - ab;
    return function(t) {
      return d3_lab_rgb(al + bl * t, aa + ba * t, ab + bb * t) + "";
    };
  };
  d3.interpolateHcl = function(a, b) {
    a = d3.hcl(a);
    b = d3.hcl(b);
    var ah = a.h, ac = a.c, al = a.l, bh = b.h - ah, bc = b.c - ac, bl = b.l - al;
    if (bh > 180) bh -= 360; else if (bh < -180) bh += 360;
    return function(t) {
      return d3_hcl_lab(ah + bh * t, ac + bc * t, al + bl * t) + "";
    };
  };
  d3.interpolateArray = function(a, b) {
    var x = [], c = [], na = a.length, nb = b.length, n0 = Math.min(a.length, b.length), i;
    for (i = 0; i < n0; ++i) x.push(d3.interpolate(a[i], b[i]));
    for (;i < na; ++i) c[i] = a[i];
    for (;i < nb; ++i) c[i] = b[i];
    return function(t) {
      for (i = 0; i < n0; ++i) c[i] = x[i](t);
      return c;
    };
  };
  d3.interpolateObject = function(a, b) {
    var i = {}, c = {}, k;
    for (k in a) {
      if (k in b) {
        i[k] = d3_interpolateByName(k)(a[k], b[k]);
      } else {
        c[k] = a[k];
      }
    }
    for (k in b) {
      if (!(k in a)) {
        c[k] = b[k];
      }
    }
    return function(t) {
      for (k in i) c[k] = i[k](t);
      return c;
    };
  };
  var d3_interpolate_number = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g;
  function d3_interpolateByName(name) {
    return name == "transform" ? d3.interpolateTransform : d3.interpolate;
  }
  d3.interpolators = [ d3.interpolateObject, function(a, b) {
    return b instanceof Array && d3.interpolateArray(a, b);
  }, function(a, b) {
    return (typeof a === "string" || typeof b === "string") && d3.interpolateString(a + "", b + "");
  }, function(a, b) {
    return (typeof b === "string" ? d3_rgb_names.has(b) || /^(#|rgb\(|hsl\()/.test(b) : b instanceof d3_Color) && d3.interpolateRgb(a, b);
  }, function(a, b) {
    return !isNaN(a = +a) && !isNaN(b = +b) && d3.interpolateNumber(a, b);
  } ];
  function d3_uninterpolateNumber(a, b) {
    b = b - (a = +a) ? 1 / (b - a) : 0;
    return function(x) {
      return (x - a) * b;
    };
  }
  function d3_uninterpolateClamp(a, b) {
    b = b - (a = +a) ? 1 / (b - a) : 0;
    return function(x) {
      return Math.max(0, Math.min(1, (x - a) * b));
    };
  }
  function d3_Color() {}
  d3_Color.prototype.toString = function() {
    return this.rgb() + "";
  };
  d3.rgb = function(r, g, b) {
    return arguments.length === 1 ? r instanceof d3_Rgb ? d3_rgb(r.r, r.g, r.b) : d3_rgb_parse("" + r, d3_rgb, d3_hsl_rgb) : d3_rgb(~~r, ~~g, ~~b);
  };
  function d3_rgb(r, g, b) {
    return new d3_Rgb(r, g, b);
  }
  function d3_Rgb(r, g, b) {
    this.r = r;
    this.g = g;
    this.b = b;
  }
  var d3_rgbPrototype = d3_Rgb.prototype = new d3_Color();
  d3_rgbPrototype.brighter = function(k) {
    k = Math.pow(.7, arguments.length ? k : 1);
    var r = this.r, g = this.g, b = this.b, i = 30;
    if (!r && !g && !b) return d3_rgb(i, i, i);
    if (r && r < i) r = i;
    if (g && g < i) g = i;
    if (b && b < i) b = i;
    return d3_rgb(Math.min(255, Math.floor(r / k)), Math.min(255, Math.floor(g / k)), Math.min(255, Math.floor(b / k)));
  };
  d3_rgbPrototype.darker = function(k) {
    k = Math.pow(.7, arguments.length ? k : 1);
    return d3_rgb(Math.floor(k * this.r), Math.floor(k * this.g), Math.floor(k * this.b));
  };
  d3_rgbPrototype.hsl = function() {
    return d3_rgb_hsl(this.r, this.g, this.b);
  };
  d3_rgbPrototype.toString = function() {
    return "#" + d3_rgb_hex(this.r) + d3_rgb_hex(this.g) + d3_rgb_hex(this.b);
  };
  function d3_rgb_hex(v) {
    return v < 16 ? "0" + Math.max(0, v).toString(16) : Math.min(255, v).toString(16);
  }
  function d3_rgb_parse(format, rgb, hsl) {
    var r = 0, g = 0, b = 0, m1, m2, name;
    m1 = /([a-z]+)\((.*)\)/i.exec(format);
    if (m1) {
      m2 = m1[2].split(",");
      switch (m1[1]) {
       case "hsl":
        {
          return hsl(parseFloat(m2[0]), parseFloat(m2[1]) / 100, parseFloat(m2[2]) / 100);
        }

       case "rgb":
        {
          return rgb(d3_rgb_parseNumber(m2[0]), d3_rgb_parseNumber(m2[1]), d3_rgb_parseNumber(m2[2]));
        }
      }
    }
    if (name = d3_rgb_names.get(format)) return rgb(name.r, name.g, name.b);
    if (format != null && format.charAt(0) === "#") {
      if (format.length === 4) {
        r = format.charAt(1);
        r += r;
        g = format.charAt(2);
        g += g;
        b = format.charAt(3);
        b += b;
      } else if (format.length === 7) {
        r = format.substring(1, 3);
        g = format.substring(3, 5);
        b = format.substring(5, 7);
      }
      r = parseInt(r, 16);
      g = parseInt(g, 16);
      b = parseInt(b, 16);
    }
    return rgb(r, g, b);
  }
  function d3_rgb_hsl(r, g, b) {
    var min = Math.min(r /= 255, g /= 255, b /= 255), max = Math.max(r, g, b), d = max - min, h, s, l = (max + min) / 2;
    if (d) {
      s = l < .5 ? d / (max + min) : d / (2 - max - min);
      if (r == max) h = (g - b) / d + (g < b ? 6 : 0); else if (g == max) h = (b - r) / d + 2; else h = (r - g) / d + 4;
      h *= 60;
    } else {
      s = h = 0;
    }
    return d3_hsl(h, s, l);
  }
  function d3_rgb_lab(r, g, b) {
    r = d3_rgb_xyz(r);
    g = d3_rgb_xyz(g);
    b = d3_rgb_xyz(b);
    var x = d3_xyz_lab((.4124564 * r + .3575761 * g + .1804375 * b) / d3_lab_X), y = d3_xyz_lab((.2126729 * r + .7151522 * g + .072175 * b) / d3_lab_Y), z = d3_xyz_lab((.0193339 * r + .119192 * g + .9503041 * b) / d3_lab_Z);
    return d3_lab(116 * y - 16, 500 * (x - y), 200 * (y - z));
  }
  function d3_rgb_xyz(r) {
    return (r /= 255) <= .04045 ? r / 12.92 : Math.pow((r + .055) / 1.055, 2.4);
  }
  function d3_rgb_parseNumber(c) {
    var f = parseFloat(c);
    return c.charAt(c.length - 1) === "%" ? Math.round(f * 2.55) : f;
  }
  var d3_rgb_names = d3.map({
    aliceblue: "#f0f8ff",
    antiquewhite: "#faebd7",
    aqua: "#00ffff",
    aquamarine: "#7fffd4",
    azure: "#f0ffff",
    beige: "#f5f5dc",
    bisque: "#ffe4c4",
    black: "#000000",
    blanchedalmond: "#ffebcd",
    blue: "#0000ff",
    blueviolet: "#8a2be2",
    brown: "#a52a2a",
    burlywood: "#deb887",
    cadetblue: "#5f9ea0",
    chartreuse: "#7fff00",
    chocolate: "#d2691e",
    coral: "#ff7f50",
    cornflowerblue: "#6495ed",
    cornsilk: "#fff8dc",
    crimson: "#dc143c",
    cyan: "#00ffff",
    darkblue: "#00008b",
    darkcyan: "#008b8b",
    darkgoldenrod: "#b8860b",
    darkgray: "#a9a9a9",
    darkgreen: "#006400",
    darkgrey: "#a9a9a9",
    darkkhaki: "#bdb76b",
    darkmagenta: "#8b008b",
    darkolivegreen: "#556b2f",
    darkorange: "#ff8c00",
    darkorchid: "#9932cc",
    darkred: "#8b0000",
    darksalmon: "#e9967a",
    darkseagreen: "#8fbc8f",
    darkslateblue: "#483d8b",
    darkslategray: "#2f4f4f",
    darkslategrey: "#2f4f4f",
    darkturquoise: "#00ced1",
    darkviolet: "#9400d3",
    deeppink: "#ff1493",
    deepskyblue: "#00bfff",
    dimgray: "#696969",
    dimgrey: "#696969",
    dodgerblue: "#1e90ff",
    firebrick: "#b22222",
    floralwhite: "#fffaf0",
    forestgreen: "#228b22",
    fuchsia: "#ff00ff",
    gainsboro: "#dcdcdc",
    ghostwhite: "#f8f8ff",
    gold: "#ffd700",
    goldenrod: "#daa520",
    gray: "#808080",
    green: "#008000",
    greenyellow: "#adff2f",
    grey: "#808080",
    honeydew: "#f0fff0",
    hotpink: "#ff69b4",
    indianred: "#cd5c5c",
    indigo: "#4b0082",
    ivory: "#fffff0",
    khaki: "#f0e68c",
    lavender: "#e6e6fa",
    lavenderblush: "#fff0f5",
    lawngreen: "#7cfc00",
    lemonchiffon: "#fffacd",
    lightblue: "#add8e6",
    lightcoral: "#f08080",
    lightcyan: "#e0ffff",
    lightgoldenrodyellow: "#fafad2",
    lightgray: "#d3d3d3",
    lightgreen: "#90ee90",
    lightgrey: "#d3d3d3",
    lightpink: "#ffb6c1",
    lightsalmon: "#ffa07a",
    lightseagreen: "#20b2aa",
    lightskyblue: "#87cefa",
    lightslategray: "#778899",
    lightslategrey: "#778899",
    lightsteelblue: "#b0c4de",
    lightyellow: "#ffffe0",
    lime: "#00ff00",
    limegreen: "#32cd32",
    linen: "#faf0e6",
    magenta: "#ff00ff",
    maroon: "#800000",
    mediumaquamarine: "#66cdaa",
    mediumblue: "#0000cd",
    mediumorchid: "#ba55d3",
    mediumpurple: "#9370db",
    mediumseagreen: "#3cb371",
    mediumslateblue: "#7b68ee",
    mediumspringgreen: "#00fa9a",
    mediumturquoise: "#48d1cc",
    mediumvioletred: "#c71585",
    midnightblue: "#191970",
    mintcream: "#f5fffa",
    mistyrose: "#ffe4e1",
    moccasin: "#ffe4b5",
    navajowhite: "#ffdead",
    navy: "#000080",
    oldlace: "#fdf5e6",
    olive: "#808000",
    olivedrab: "#6b8e23",
    orange: "#ffa500",
    orangered: "#ff4500",
    orchid: "#da70d6",
    palegoldenrod: "#eee8aa",
    palegreen: "#98fb98",
    paleturquoise: "#afeeee",
    palevioletred: "#db7093",
    papayawhip: "#ffefd5",
    peachpuff: "#ffdab9",
    peru: "#cd853f",
    pink: "#ffc0cb",
    plum: "#dda0dd",
    powderblue: "#b0e0e6",
    purple: "#800080",
    red: "#ff0000",
    rosybrown: "#bc8f8f",
    royalblue: "#4169e1",
    saddlebrown: "#8b4513",
    salmon: "#fa8072",
    sandybrown: "#f4a460",
    seagreen: "#2e8b57",
    seashell: "#fff5ee",
    sienna: "#a0522d",
    silver: "#c0c0c0",
    skyblue: "#87ceeb",
    slateblue: "#6a5acd",
    slategray: "#708090",
    slategrey: "#708090",
    snow: "#fffafa",
    springgreen: "#00ff7f",
    steelblue: "#4682b4",
    tan: "#d2b48c",
    teal: "#008080",
    thistle: "#d8bfd8",
    tomato: "#ff6347",
    turquoise: "#40e0d0",
    violet: "#ee82ee",
    wheat: "#f5deb3",
    white: "#ffffff",
    whitesmoke: "#f5f5f5",
    yellow: "#ffff00",
    yellowgreen: "#9acd32"
  });
  d3_rgb_names.forEach(function(key, value) {
    d3_rgb_names.set(key, d3_rgb_parse(value, d3_rgb, d3_hsl_rgb));
  });
  d3.hsl = function(h, s, l) {
    return arguments.length === 1 ? h instanceof d3_Hsl ? d3_hsl(h.h, h.s, h.l) : d3_rgb_parse("" + h, d3_rgb_hsl, d3_hsl) : d3_hsl(+h, +s, +l);
  };
  function d3_hsl(h, s, l) {
    return new d3_Hsl(h, s, l);
  }
  function d3_Hsl(h, s, l) {
    this.h = h;
    this.s = s;
    this.l = l;
  }
  var d3_hslPrototype = d3_Hsl.prototype = new d3_Color();
  d3_hslPrototype.brighter = function(k) {
    k = Math.pow(.7, arguments.length ? k : 1);
    return d3_hsl(this.h, this.s, this.l / k);
  };
  d3_hslPrototype.darker = function(k) {
    k = Math.pow(.7, arguments.length ? k : 1);
    return d3_hsl(this.h, this.s, k * this.l);
  };
  d3_hslPrototype.rgb = function() {
    return d3_hsl_rgb(this.h, this.s, this.l);
  };
  function d3_hsl_rgb(h, s, l) {
    var m1, m2;
    h = h % 360;
    if (h < 0) h += 360;
    s = s < 0 ? 0 : s > 1 ? 1 : s;
    l = l < 0 ? 0 : l > 1 ? 1 : l;
    m2 = l <= .5 ? l * (1 + s) : l + s - l * s;
    m1 = 2 * l - m2;
    function v(h) {
      if (h > 360) h -= 360; else if (h < 0) h += 360;
      if (h < 60) return m1 + (m2 - m1) * h / 60;
      if (h < 180) return m2;
      if (h < 240) return m1 + (m2 - m1) * (240 - h) / 60;
      return m1;
    }
    function vv(h) {
      return Math.round(v(h) * 255);
    }
    return d3_rgb(vv(h + 120), vv(h), vv(h - 120));
  }
  d3.hcl = function(h, c, l) {
    return arguments.length === 1 ? h instanceof d3_Hcl ? d3_hcl(h.h, h.c, h.l) : h instanceof d3_Lab ? d3_lab_hcl(h.l, h.a, h.b) : d3_lab_hcl((h = d3_rgb_lab((h = d3.rgb(h)).r, h.g, h.b)).l, h.a, h.b) : d3_hcl(+h, +c, +l);
  };
  function d3_hcl(h, c, l) {
    return new d3_Hcl(h, c, l);
  }
  function d3_Hcl(h, c, l) {
    this.h = h;
    this.c = c;
    this.l = l;
  }
  var d3_hclPrototype = d3_Hcl.prototype = new d3_Color();
  d3_hclPrototype.brighter = function(k) {
    return d3_hcl(this.h, this.c, Math.min(100, this.l + d3_lab_K * (arguments.length ? k : 1)));
  };
  d3_hclPrototype.darker = function(k) {
    return d3_hcl(this.h, this.c, Math.max(0, this.l - d3_lab_K * (arguments.length ? k : 1)));
  };
  d3_hclPrototype.rgb = function() {
    return d3_hcl_lab(this.h, this.c, this.l).rgb();
  };
  function d3_hcl_lab(h, c, l) {
    return d3_lab(l, Math.cos(h *= d3_radians) * c, Math.sin(h) * c);
  }
  d3.lab = function(l, a, b) {
    return arguments.length === 1 ? l instanceof d3_Lab ? d3_lab(l.l, l.a, l.b) : l instanceof d3_Hcl ? d3_hcl_lab(l.l, l.c, l.h) : d3_rgb_lab((l = d3.rgb(l)).r, l.g, l.b) : d3_lab(+l, +a, +b);
  };
  function d3_lab(l, a, b) {
    return new d3_Lab(l, a, b);
  }
  function d3_Lab(l, a, b) {
    this.l = l;
    this.a = a;
    this.b = b;
  }
  var d3_lab_K = 18;
  var d3_lab_X = .95047, d3_lab_Y = 1, d3_lab_Z = 1.08883;
  var d3_labPrototype = d3_Lab.prototype = new d3_Color();
  d3_labPrototype.brighter = function(k) {
    return d3_lab(Math.min(100, this.l + d3_lab_K * (arguments.length ? k : 1)), this.a, this.b);
  };
  d3_labPrototype.darker = function(k) {
    return d3_lab(Math.max(0, this.l - d3_lab_K * (arguments.length ? k : 1)), this.a, this.b);
  };
  d3_labPrototype.rgb = function() {
    return d3_lab_rgb(this.l, this.a, this.b);
  };
  function d3_lab_rgb(l, a, b) {
    var y = (l + 16) / 116, x = y + a / 500, z = y - b / 200;
    x = d3_lab_xyz(x) * d3_lab_X;
    y = d3_lab_xyz(y) * d3_lab_Y;
    z = d3_lab_xyz(z) * d3_lab_Z;
    return d3_rgb(d3_xyz_rgb(3.2404542 * x - 1.5371385 * y - .4985314 * z), d3_xyz_rgb(-.969266 * x + 1.8760108 * y + .041556 * z), d3_xyz_rgb(.0556434 * x - .2040259 * y + 1.0572252 * z));
  }
  function d3_lab_hcl(l, a, b) {
    return d3_hcl(Math.atan2(b, a) / π * 180, Math.sqrt(a * a + b * b), l);
  }
  function d3_lab_xyz(x) {
    return x > .206893034 ? x * x * x : (x - 4 / 29) / 7.787037;
  }
  function d3_xyz_lab(x) {
    return x > .008856 ? Math.pow(x, 1 / 3) : 7.787037 * x + 4 / 29;
  }
  function d3_xyz_rgb(r) {
    return Math.round(255 * (r <= .00304 ? 12.92 * r : 1.055 * Math.pow(r, 1 / 2.4) - .055));
  }
  function d3_selection(groups) {
    d3_arraySubclass(groups, d3_selectionPrototype);
    return groups;
  }
  var d3_select = function(s, n) {
    return n.querySelector(s);
  }, d3_selectAll = function(s, n) {
    return n.querySelectorAll(s);
  }, d3_selectRoot = d3_document.documentElement, d3_selectMatcher = d3_selectRoot.matchesSelector || d3_selectRoot.webkitMatchesSelector || d3_selectRoot.mozMatchesSelector || d3_selectRoot.msMatchesSelector || d3_selectRoot.oMatchesSelector, d3_selectMatches = function(n, s) {
    return d3_selectMatcher.call(n, s);
  };
  if (typeof Sizzle === "function") {
    d3_select = function(s, n) {
      return Sizzle(s, n)[0] || null;
    };
    d3_selectAll = function(s, n) {
      return Sizzle.uniqueSort(Sizzle(s, n));
    };
    d3_selectMatches = Sizzle.matchesSelector;
  }
  var d3_selectionPrototype = [];
  d3.selection = function() {
    return d3_selectionRoot;
  };
  d3.selection.prototype = d3_selectionPrototype;
  d3_selectionPrototype.select = function(selector) {
    var subgroups = [], subgroup, subnode, group, node;
    if (typeof selector !== "function") selector = d3_selection_selector(selector);
    for (var j = -1, m = this.length; ++j < m; ) {
      subgroups.push(subgroup = []);
      subgroup.parentNode = (group = this[j]).parentNode;
      for (var i = -1, n = group.length; ++i < n; ) {
        if (node = group[i]) {
          subgroup.push(subnode = selector.call(node, node.__data__, i));
          if (subnode && "__data__" in node) subnode.__data__ = node.__data__;
        } else {
          subgroup.push(null);
        }
      }
    }
    return d3_selection(subgroups);
  };
  function d3_selection_selector(selector) {
    return function() {
      return d3_select(selector, this);
    };
  }
  d3_selectionPrototype.selectAll = function(selector) {
    var subgroups = [], subgroup, node;
    if (typeof selector !== "function") selector = d3_selection_selectorAll(selector);
    for (var j = -1, m = this.length; ++j < m; ) {
      for (var group = this[j], i = -1, n = group.length; ++i < n; ) {
        if (node = group[i]) {
          subgroups.push(subgroup = d3_array(selector.call(node, node.__data__, i)));
          subgroup.parentNode = node;
        }
      }
    }
    return d3_selection(subgroups);
  };
  function d3_selection_selectorAll(selector) {
    return function() {
      return d3_selectAll(selector, this);
    };
  }
  d3_selectionPrototype.attr = function(name, value) {
    if (arguments.length < 2) {
      if (typeof name === "string") {
        var node = this.node();
        name = d3.ns.qualify(name);
        return name.local ? node.getAttributeNS(name.space, name.local) : node.getAttribute(name);
      }
      for (value in name) this.each(d3_selection_attr(value, name[value]));
      return this;
    }
    return this.each(d3_selection_attr(name, value));
  };
  function d3_selection_attr(name, value) {
    name = d3.ns.qualify(name);
    function attrNull() {
      this.removeAttribute(name);
    }
    function attrNullNS() {
      this.removeAttributeNS(name.space, name.local);
    }
    function attrConstant() {
      this.setAttribute(name, value);
    }
    function attrConstantNS() {
      this.setAttributeNS(name.space, name.local, value);
    }
    function attrFunction() {
      var x = value.apply(this, arguments);
      if (x == null) this.removeAttribute(name); else this.setAttribute(name, x);
    }
    function attrFunctionNS() {
      var x = value.apply(this, arguments);
      if (x == null) this.removeAttributeNS(name.space, name.local); else this.setAttributeNS(name.space, name.local, x);
    }
    return value == null ? name.local ? attrNullNS : attrNull : typeof value === "function" ? name.local ? attrFunctionNS : attrFunction : name.local ? attrConstantNS : attrConstant;
  }
  d3_selectionPrototype.classed = function(name, value) {
    if (arguments.length < 2) {
      if (typeof name === "string") {
        var node = this.node(), n = (name = name.trim().split(/^|\s+/g)).length, i = -1;
        if (value = node.classList) {
          while (++i < n) if (!value.contains(name[i])) return false;
        } else {
          value = node.className;
          if (value.baseVal != null) value = value.baseVal;
          while (++i < n) if (!d3_selection_classedRe(name[i]).test(value)) return false;
        }
        return true;
      }
      for (value in name) this.each(d3_selection_classed(value, name[value]));
      return this;
    }
    return this.each(d3_selection_classed(name, value));
  };
  function d3_selection_classedRe(name) {
    return new RegExp("(?:^|\\s+)" + d3.requote(name) + "(?:\\s+|$)", "g");
  }
  function d3_selection_classed(name, value) {
    name = name.trim().split(/\s+/).map(d3_selection_classedName);
    var n = name.length;
    function classedConstant() {
      var i = -1;
      while (++i < n) name[i](this, value);
    }
    function classedFunction() {
      var i = -1, x = value.apply(this, arguments);
      while (++i < n) name[i](this, x);
    }
    return typeof value === "function" ? classedFunction : classedConstant;
  }
  function d3_selection_classedName(name) {
    var re = d3_selection_classedRe(name);
    return function(node, value) {
      if (c = node.classList) return value ? c.add(name) : c.remove(name);
      var c = node.className, cb = c.baseVal != null, cv = cb ? c.baseVal : c;
      if (value) {
        re.lastIndex = 0;
        if (!re.test(cv)) {
          cv = d3_collapse(cv + " " + name);
          if (cb) c.baseVal = cv; else node.className = cv;
        }
      } else if (cv) {
        cv = d3_collapse(cv.replace(re, " "));
        if (cb) c.baseVal = cv; else node.className = cv;
      }
    };
  }
  d3_selectionPrototype.style = function(name, value, priority) {
    var n = arguments.length;
    if (n < 3) {
      if (typeof name !== "string") {
        if (n < 2) value = "";
        for (priority in name) this.each(d3_selection_style(priority, name[priority], value));
        return this;
      }
      if (n < 2) return d3_window.getComputedStyle(this.node(), null).getPropertyValue(name);
      priority = "";
    }
    return this.each(d3_selection_style(name, value, priority));
  };
  function d3_selection_style(name, value, priority) {
    function styleNull() {
      this.style.removeProperty(name);
    }
    function styleConstant() {
      this.style.setProperty(name, value, priority);
    }
    function styleFunction() {
      var x = value.apply(this, arguments);
      if (x == null) this.style.removeProperty(name); else this.style.setProperty(name, x, priority);
    }
    return value == null ? styleNull : typeof value === "function" ? styleFunction : styleConstant;
  }
  d3_selectionPrototype.property = function(name, value) {
    if (arguments.length < 2) {
      if (typeof name === "string") return this.node()[name];
      for (value in name) this.each(d3_selection_property(value, name[value]));
      return this;
    }
    return this.each(d3_selection_property(name, value));
  };
  function d3_selection_property(name, value) {
    function propertyNull() {
      delete this[name];
    }
    function propertyConstant() {
      this[name] = value;
    }
    function propertyFunction() {
      var x = value.apply(this, arguments);
      if (x == null) delete this[name]; else this[name] = x;
    }
    return value == null ? propertyNull : typeof value === "function" ? propertyFunction : propertyConstant;
  }
  d3_selectionPrototype.text = function(value) {
    return arguments.length ? this.each(typeof value === "function" ? function() {
      var v = value.apply(this, arguments);
      this.textContent = v == null ? "" : v;
    } : value == null ? function() {
      this.textContent = "";
    } : function() {
      this.textContent = value;
    }) : this.node().textContent;
  };
  d3_selectionPrototype.html = function(value) {
    return arguments.length ? this.each(typeof value === "function" ? function() {
      var v = value.apply(this, arguments);
      this.innerHTML = v == null ? "" : v;
    } : value == null ? function() {
      this.innerHTML = "";
    } : function() {
      this.innerHTML = value;
    }) : this.node().innerHTML;
  };
  d3_selectionPrototype.append = function(name) {
    name = d3.ns.qualify(name);
    function append() {
      return this.appendChild(d3_document.createElementNS(this.namespaceURI, name));
    }
    function appendNS() {
      return this.appendChild(d3_document.createElementNS(name.space, name.local));
    }
    return this.select(name.local ? appendNS : append);
  };
  d3_selectionPrototype.insert = function(name, before) {
    name = d3.ns.qualify(name);
    function insert() {
      return this.insertBefore(d3_document.createElementNS(this.namespaceURI, name), d3_select(before, this));
    }
    function insertNS() {
      return this.insertBefore(d3_document.createElementNS(name.space, name.local), d3_select(before, this));
    }
    return this.select(name.local ? insertNS : insert);
  };
  d3_selectionPrototype.remove = function() {
    return this.each(function() {
      var parent = this.parentNode;
      if (parent) parent.removeChild(this);
    });
  };
  d3_selectionPrototype.data = function(value, key) {
    var i = -1, n = this.length, group, node;
    if (!arguments.length) {
      value = new Array(n = (group = this[0]).length);
      while (++i < n) {
        if (node = group[i]) {
          value[i] = node.__data__;
        }
      }
      return value;
    }
    function bind(group, groupData) {
      var i, n = group.length, m = groupData.length, n0 = Math.min(n, m), updateNodes = new Array(m), enterNodes = new Array(m), exitNodes = new Array(n), node, nodeData;
      if (key) {
        var nodeByKeyValue = new d3_Map(), dataByKeyValue = new d3_Map(), keyValues = [], keyValue;
        for (i = -1; ++i < n; ) {
          keyValue = key.call(node = group[i], node.__data__, i);
          if (nodeByKeyValue.has(keyValue)) {
            exitNodes[i] = node;
          } else {
            nodeByKeyValue.set(keyValue, node);
          }
          keyValues.push(keyValue);
        }
        for (i = -1; ++i < m; ) {
          keyValue = key.call(groupData, nodeData = groupData[i], i);
          if (node = nodeByKeyValue.get(keyValue)) {
            updateNodes[i] = node;
            node.__data__ = nodeData;
          } else if (!dataByKeyValue.has(keyValue)) {
            enterNodes[i] = d3_selection_dataNode(nodeData);
          }
          dataByKeyValue.set(keyValue, nodeData);
          nodeByKeyValue.remove(keyValue);
        }
        for (i = -1; ++i < n; ) {
          if (nodeByKeyValue.has(keyValues[i])) {
            exitNodes[i] = group[i];
          }
        }
      } else {
        for (i = -1; ++i < n0; ) {
          node = group[i];
          nodeData = groupData[i];
          if (node) {
            node.__data__ = nodeData;
            updateNodes[i] = node;
          } else {
            enterNodes[i] = d3_selection_dataNode(nodeData);
          }
        }
        for (;i < m; ++i) {
          enterNodes[i] = d3_selection_dataNode(groupData[i]);
        }
        for (;i < n; ++i) {
          exitNodes[i] = group[i];
        }
      }
      enterNodes.update = updateNodes;
      enterNodes.parentNode = updateNodes.parentNode = exitNodes.parentNode = group.parentNode;
      enter.push(enterNodes);
      update.push(updateNodes);
      exit.push(exitNodes);
    }
    var enter = d3_selection_enter([]), update = d3_selection([]), exit = d3_selection([]);
    if (typeof value === "function") {
      while (++i < n) {
        bind(group = this[i], value.call(group, group.parentNode.__data__, i));
      }
    } else {
      while (++i < n) {
        bind(group = this[i], value);
      }
    }
    update.enter = function() {
      return enter;
    };
    update.exit = function() {
      return exit;
    };
    return update;
  };
  function d3_selection_dataNode(data) {
    return {
      __data__: data
    };
  }
  d3_selectionPrototype.datum = function(value) {
    return arguments.length ? this.property("__data__", value) : this.property("__data__");
  };
  d3_selectionPrototype.filter = function(filter) {
    var subgroups = [], subgroup, group, node;
    if (typeof filter !== "function") filter = d3_selection_filter(filter);
    for (var j = 0, m = this.length; j < m; j++) {
      subgroups.push(subgroup = []);
      subgroup.parentNode = (group = this[j]).parentNode;
      for (var i = 0, n = group.length; i < n; i++) {
        if ((node = group[i]) && filter.call(node, node.__data__, i)) {
          subgroup.push(node);
        }
      }
    }
    return d3_selection(subgroups);
  };
  function d3_selection_filter(selector) {
    return function() {
      return d3_selectMatches(this, selector);
    };
  }
  d3_selectionPrototype.order = function() {
    for (var j = -1, m = this.length; ++j < m; ) {
      for (var group = this[j], i = group.length - 1, next = group[i], node; --i >= 0; ) {
        if (node = group[i]) {
          if (next && next !== node.nextSibling) next.parentNode.insertBefore(node, next);
          next = node;
        }
      }
    }
    return this;
  };
  d3_selectionPrototype.sort = function(comparator) {
    comparator = d3_selection_sortComparator.apply(this, arguments);
    for (var j = -1, m = this.length; ++j < m; ) this[j].sort(comparator);
    return this.order();
  };
  function d3_selection_sortComparator(comparator) {
    if (!arguments.length) comparator = d3.ascending;
    return function(a, b) {
      return !a - !b || comparator(a.__data__, b.__data__);
    };
  }
  d3_selectionPrototype.on = function(type, listener, capture) {
    var n = arguments.length;
    if (n < 3) {
      if (typeof type !== "string") {
        if (n < 2) listener = false;
        for (capture in type) this.each(d3_selection_on(capture, type[capture], listener));
        return this;
      }
      if (n < 2) return (n = this.node()["__on" + type]) && n._;
      capture = false;
    }
    return this.each(d3_selection_on(type, listener, capture));
  };
  function d3_selection_on(type, listener, capture) {
    var name = "__on" + type, i = type.indexOf(".");
    if (i > 0) type = type.substring(0, i);
    function onRemove() {
      var wrapper = this[name];
      if (wrapper) {
        this.removeEventListener(type, wrapper, wrapper.$);
        delete this[name];
      }
    }
    function onAdd() {
      var node = this, args = d3_array(arguments);
      onRemove.call(this);
      this.addEventListener(type, this[name] = wrapper, wrapper.$ = capture);
      wrapper._ = listener;
      function wrapper(e) {
        var o = d3.event;
        d3.event = e;
        args[0] = node.__data__;
        try {
          listener.apply(node, args);
        } finally {
          d3.event = o;
        }
      }
    }
    return listener ? onAdd : onRemove;
  }
  d3_selectionPrototype.each = function(callback) {
    return d3_selection_each(this, function(node, i, j) {
      callback.call(node, node.__data__, i, j);
    });
  };
  function d3_selection_each(groups, callback) {
    for (var j = 0, m = groups.length; j < m; j++) {
      for (var group = groups[j], i = 0, n = group.length, node; i < n; i++) {
        if (node = group[i]) callback(node, i, j);
      }
    }
    return groups;
  }
  d3_selectionPrototype.call = function(callback) {
    var args = d3_array(arguments);
    callback.apply(args[0] = this, args);
    return this;
  };
  d3_selectionPrototype.empty = function() {
    return !this.node();
  };
  d3_selectionPrototype.node = function() {
    for (var j = 0, m = this.length; j < m; j++) {
      for (var group = this[j], i = 0, n = group.length; i < n; i++) {
        var node = group[i];
        if (node) return node;
      }
    }
    return null;
  };
  d3_selectionPrototype.transition = function() {
    var id = d3_transitionInheritId || ++d3_transitionId, subgroups = [], subgroup, node, transition = Object.create(d3_transitionInherit);
    transition.time = Date.now();
    for (var j = -1, m = this.length; ++j < m; ) {
      subgroups.push(subgroup = []);
      for (var group = this[j], i = -1, n = group.length; ++i < n; ) {
        if (node = group[i]) d3_transitionNode(node, i, id, transition);
        subgroup.push(node);
      }
    }
    return d3_transition(subgroups, id);
  };
  var d3_selectionRoot = d3_selection([ [ d3_document ] ]);
  d3_selectionRoot[0].parentNode = d3_selectRoot;
  d3.select = function(selector) {
    return typeof selector === "string" ? d3_selectionRoot.select(selector) : d3_selection([ [ selector ] ]);
  };
  d3.selectAll = function(selector) {
    return typeof selector === "string" ? d3_selectionRoot.selectAll(selector) : d3_selection([ d3_array(selector) ]);
  };
  function d3_selection_enter(selection) {
    d3_arraySubclass(selection, d3_selection_enterPrototype);
    return selection;
  }
  var d3_selection_enterPrototype = [];
  d3.selection.enter = d3_selection_enter;
  d3.selection.enter.prototype = d3_selection_enterPrototype;
  d3_selection_enterPrototype.append = d3_selectionPrototype.append;
  d3_selection_enterPrototype.insert = d3_selectionPrototype.insert;
  d3_selection_enterPrototype.empty = d3_selectionPrototype.empty;
  d3_selection_enterPrototype.node = d3_selectionPrototype.node;
  d3_selection_enterPrototype.select = function(selector) {
    var subgroups = [], subgroup, subnode, upgroup, group, node;
    for (var j = -1, m = this.length; ++j < m; ) {
      upgroup = (group = this[j]).update;
      subgroups.push(subgroup = []);
      subgroup.parentNode = group.parentNode;
      for (var i = -1, n = group.length; ++i < n; ) {
        if (node = group[i]) {
          subgroup.push(upgroup[i] = subnode = selector.call(group.parentNode, node.__data__, i));
          subnode.__data__ = node.__data__;
        } else {
          subgroup.push(null);
        }
      }
    }
    return d3_selection(subgroups);
  };
  function d3_transition(groups, id) {
    d3_arraySubclass(groups, d3_transitionPrototype);
    groups.id = id;
    return groups;
  }
  var d3_transitionPrototype = [], d3_transitionId = 0, d3_transitionInheritId, d3_transitionInherit = {
    ease: d3_ease_cubicInOut,
    delay: 0,
    duration: 250
  };
  d3_transitionPrototype.call = d3_selectionPrototype.call;
  d3_transitionPrototype.empty = d3_selectionPrototype.empty;
  d3_transitionPrototype.node = d3_selectionPrototype.node;
  d3.transition = function(selection) {
    return arguments.length ? d3_transitionInheritId ? selection.transition() : selection : d3_selectionRoot.transition();
  };
  d3.transition.prototype = d3_transitionPrototype;
  function d3_transitionNode(node, i, id, inherit) {
    var lock = node.__transition__ || (node.__transition__ = {
      active: 0,
      count: 0
    }), transition = lock[id];
    if (!transition) {
      var time = inherit.time;
      transition = lock[id] = {
        tween: new d3_Map(),
        event: d3.dispatch("start", "end"),
        time: time,
        ease: inherit.ease,
        delay: inherit.delay,
        duration: inherit.duration
      };
      ++lock.count;
      d3.timer(function(elapsed) {
        var d = node.__data__, ease = transition.ease, event = transition.event, delay = transition.delay, duration = transition.duration, tweened = [];
        return delay <= elapsed ? start(elapsed) : d3.timer(start, delay, time), 1;
        function start(elapsed) {
          if (lock.active > id) return stop();
          lock.active = id;
          event.start.call(node, d, i);
          transition.tween.forEach(function(key, value) {
            if (value = value.call(node, d, i)) {
              tweened.push(value);
            }
          });
          if (!tick(elapsed)) d3.timer(tick, 0, time);
          return 1;
        }
        function tick(elapsed) {
          if (lock.active !== id) return stop();
          var t = (elapsed - delay) / duration, e = ease(t), n = tweened.length;
          while (n > 0) {
            tweened[--n].call(node, e);
          }
          if (t >= 1) {
            stop();
            event.end.call(node, d, i);
            return 1;
          }
        }
        function stop() {
          if (--lock.count) delete lock[id]; else delete node.__transition__;
          return 1;
        }
      }, 0, time);
      return transition;
    }
  }
  d3_transitionPrototype.select = function(selector) {
    var id = this.id, subgroups = [], subgroup, subnode, node;
    if (typeof selector !== "function") selector = d3_selection_selector(selector);
    for (var j = -1, m = this.length; ++j < m; ) {
      subgroups.push(subgroup = []);
      for (var group = this[j], i = -1, n = group.length; ++i < n; ) {
        if ((node = group[i]) && (subnode = selector.call(node, node.__data__, i))) {
          if ("__data__" in node) subnode.__data__ = node.__data__;
          d3_transitionNode(subnode, i, id, node.__transition__[id]);
          subgroup.push(subnode);
        } else {
          subgroup.push(null);
        }
      }
    }
    return d3_transition(subgroups, id);
  };
  d3_transitionPrototype.selectAll = function(selector) {
    var id = this.id, subgroups = [], subgroup, subnodes, node, subnode, transition;
    if (typeof selector !== "function") selector = d3_selection_selectorAll(selector);
    for (var j = -1, m = this.length; ++j < m; ) {
      for (var group = this[j], i = -1, n = group.length; ++i < n; ) {
        if (node = group[i]) {
          transition = node.__transition__[id];
          subnodes = selector.call(node, node.__data__, i);
          subgroups.push(subgroup = []);
          for (var k = -1, o = subnodes.length; ++k < o; ) {
            d3_transitionNode(subnode = subnodes[k], k, id, transition);
            subgroup.push(subnode);
          }
        }
      }
    }
    return d3_transition(subgroups, id);
  };
  d3_transitionPrototype.filter = function(filter) {
    var subgroups = [], subgroup, group, node;
    if (typeof filter !== "function") filter = d3_selection_filter(filter);
    for (var j = 0, m = this.length; j < m; j++) {
      subgroups.push(subgroup = []);
      for (var group = this[j], i = 0, n = group.length; i < n; i++) {
        if ((node = group[i]) && filter.call(node, node.__data__, i)) {
          subgroup.push(node);
        }
      }
    }
    return d3_transition(subgroups, this.id, this.time).ease(this.ease());
  };
  d3_transitionPrototype.attr = function(nameNS, value) {
    if (arguments.length < 2) {
      for (value in nameNS) this.attr(value, nameNS[value]);
      return this;
    }
    var interpolate = d3_interpolateByName(nameNS), name = d3.ns.qualify(nameNS);
    function attrNull() {
      this.removeAttribute(name);
    }
    function attrNullNS() {
      this.removeAttributeNS(name.space, name.local);
    }
    return d3_transition_tween(this, "attr." + nameNS, value, function(b) {
      function attrString() {
        var a = this.getAttribute(name), i;
        return a !== b && (i = interpolate(a, b), function(t) {
          this.setAttribute(name, i(t));
        });
      }
      function attrStringNS() {
        var a = this.getAttributeNS(name.space, name.local), i;
        return a !== b && (i = interpolate(a, b), function(t) {
          this.setAttributeNS(name.space, name.local, i(t));
        });
      }
      return b == null ? name.local ? attrNullNS : attrNull : (b += "", name.local ? attrStringNS : attrString);
    });
  };
  d3_transitionPrototype.attrTween = function(nameNS, tween) {
    var name = d3.ns.qualify(nameNS);
    function attrTween(d, i) {
      var f = tween.call(this, d, i, this.getAttribute(name));
      return f && function(t) {
        this.setAttribute(name, f(t));
      };
    }
    function attrTweenNS(d, i) {
      var f = tween.call(this, d, i, this.getAttributeNS(name.space, name.local));
      return f && function(t) {
        this.setAttributeNS(name.space, name.local, f(t));
      };
    }
    return this.tween("attr." + nameNS, name.local ? attrTweenNS : attrTween);
  };
  d3_transitionPrototype.style = function(name, value, priority) {
    var n = arguments.length;
    if (n < 3) {
      if (typeof name !== "string") {
        if (n < 2) value = "";
        for (priority in name) this.style(priority, name[priority], value);
        return this;
      }
      priority = "";
    }
    var interpolate = d3_interpolateByName(name);
    function styleNull() {
      this.style.removeProperty(name);
    }
    return d3_transition_tween(this, "style." + name, value, function(b) {
      function styleString() {
        var a = d3_window.getComputedStyle(this, null).getPropertyValue(name), i;
        return a !== b && (i = interpolate(a, b), function(t) {
          this.style.setProperty(name, i(t), priority);
        });
      }
      return b == null ? styleNull : (b += "", styleString);
    });
  };
  d3_transitionPrototype.styleTween = function(name, tween, priority) {
    if (arguments.length < 3) priority = "";
    return this.tween("style." + name, function(d, i) {
      var f = tween.call(this, d, i, d3_window.getComputedStyle(this, null).getPropertyValue(name));
      return f && function(t) {
        this.style.setProperty(name, f(t), priority);
      };
    });
  };
  d3_transitionPrototype.text = function(value) {
    return d3_transition_tween(this, "text", value, d3_transition_text);
  };
  function d3_transition_text(b) {
    if (b == null) b = "";
    return function() {
      this.textContent = b;
    };
  }
  d3_transitionPrototype.remove = function() {
    return this.each("end.transition", function() {
      var p;
      if (!this.__transition__ && (p = this.parentNode)) p.removeChild(this);
    });
  };
  d3_transitionPrototype.ease = function(value) {
    var id = this.id;
    if (arguments.length < 1) return this.node().__transition__[id].ease;
    if (typeof value !== "function") value = d3.ease.apply(d3, arguments);
    return d3_selection_each(this, function(node) {
      node.__transition__[id].ease = value;
    });
  };
  d3_transitionPrototype.delay = function(value) {
    var id = this.id;
    return d3_selection_each(this, typeof value === "function" ? function(node, i, j) {
      node.__transition__[id].delay = value.call(node, node.__data__, i, j) | 0;
    } : (value |= 0, function(node) {
      node.__transition__[id].delay = value;
    }));
  };
  d3_transitionPrototype.duration = function(value) {
    var id = this.id;
    return d3_selection_each(this, typeof value === "function" ? function(node, i, j) {
      node.__transition__[id].duration = Math.max(1, value.call(node, node.__data__, i, j) | 0);
    } : (value = Math.max(1, value | 0), function(node) {
      node.__transition__[id].duration = value;
    }));
  };
  d3_transitionPrototype.each = function(type, listener) {
    var id = this.id;
    if (arguments.length < 2) {
      var inherit = d3_transitionInherit, inheritId = d3_transitionInheritId;
      d3_transitionInheritId = id;
      d3_selection_each(this, function(node, i, j) {
        d3_transitionInherit = node.__transition__[id];
        type.call(node, node.__data__, i, j);
      });
      d3_transitionInherit = inherit;
      d3_transitionInheritId = inheritId;
    } else {
      d3_selection_each(this, function(node) {
        node.__transition__[id].event.on(type, listener);
      });
    }
    return this;
  };
  d3_transitionPrototype.transition = function() {
    var id0 = this.id, id1 = ++d3_transitionId, subgroups = [], subgroup, group, node, transition;
    for (var j = 0, m = this.length; j < m; j++) {
      subgroups.push(subgroup = []);
      for (var group = this[j], i = 0, n = group.length; i < n; i++) {
        if (node = group[i]) {
          transition = Object.create(node.__transition__[id0]);
          transition.delay += transition.duration;
          d3_transitionNode(node, i, id1, transition);
        }
        subgroup.push(node);
      }
    }
    return d3_transition(subgroups, id1);
  };
  d3_transitionPrototype.tween = function(name, tween) {
    var id = this.id;
    if (arguments.length < 2) return this.node().__transition__[id].tween.get(name);
    return d3_selection_each(this, tween == null ? function(node) {
      node.__transition__[id].tween.remove(name);
    } : function(node) {
      node.__transition__[id].tween.set(name, tween);
    });
  };
  function d3_transition_tween(groups, name, value, tween) {
    var id = groups.id;
    return d3_selection_each(groups, typeof value === "function" ? function(node, i, j) {
      node.__transition__[id].tween.set(name, tween(value.call(node, node.__data__, i, j)));
    } : (value = tween(value), function(node) {
      node.__transition__[id].tween.set(name, value);
    }));
  }
  var d3_timer_id = 0, d3_timer_byId = {}, d3_timer_queue = null, d3_timer_interval, d3_timer_timeout;
  d3.timer = function(callback, delay, then) {
    if (arguments.length < 3) {
      if (arguments.length < 2) delay = 0; else if (!isFinite(delay)) return;
      then = Date.now();
    }
    var timer = d3_timer_byId[callback.id];
    if (timer && timer.callback === callback) {
      timer.then = then;
      timer.delay = delay;
    } else d3_timer_byId[callback.id = ++d3_timer_id] = d3_timer_queue = {
      callback: callback,
      then: then,
      delay: delay,
      next: d3_timer_queue
    };
    if (!d3_timer_interval) {
      d3_timer_timeout = clearTimeout(d3_timer_timeout);
      d3_timer_interval = 1;
      d3_timer_frame(d3_timer_step);
    }
  };
  function d3_timer_step() {
    var elapsed, now = Date.now(), t1 = d3_timer_queue;
    while (t1) {
      elapsed = now - t1.then;
      if (elapsed >= t1.delay) t1.flush = t1.callback(elapsed);
      t1 = t1.next;
    }
    var delay = d3_timer_flush() - now;
    if (delay > 24) {
      if (isFinite(delay)) {
        clearTimeout(d3_timer_timeout);
        d3_timer_timeout = setTimeout(d3_timer_step, delay);
      }
      d3_timer_interval = 0;
    } else {
      d3_timer_interval = 1;
      d3_timer_frame(d3_timer_step);
    }
  }
  d3.timer.flush = function() {
    var elapsed, now = Date.now(), t1 = d3_timer_queue;
    while (t1) {
      elapsed = now - t1.then;
      if (!t1.delay) t1.flush = t1.callback(elapsed);
      t1 = t1.next;
    }
    d3_timer_flush();
  };
  function d3_timer_flush() {
    var t0 = null, t1 = d3_timer_queue, then = Infinity;
    while (t1) {
      if (t1.flush) {
        delete d3_timer_byId[t1.callback.id];
        t1 = t0 ? t0.next = t1.next : d3_timer_queue = t1.next;
      } else {
        then = Math.min(then, t1.then + t1.delay);
        t1 = (t0 = t1).next;
      }
    }
    return then;
  }
  var d3_timer_frame = d3_window.requestAnimationFrame || d3_window.webkitRequestAnimationFrame || d3_window.mozRequestAnimationFrame || d3_window.oRequestAnimationFrame || d3_window.msRequestAnimationFrame || function(callback) {
    setTimeout(callback, 17);
  };
  d3.mouse = function(container) {
    return d3_mousePoint(container, d3_eventSource());
  };
  var d3_mouse_bug44083 = /WebKit/.test(d3_window.navigator.userAgent) ? -1 : 0;
  function d3_mousePoint(container, e) {
    var svg = container.ownerSVGElement || container;
    if (svg.createSVGPoint) {
      var point = svg.createSVGPoint();
      if (d3_mouse_bug44083 < 0 && (d3_window.scrollX || d3_window.scrollY)) {
        svg = d3.select(d3_document.body).append("svg").style("position", "absolute").style("top", 0).style("left", 0);
        var ctm = svg[0][0].getScreenCTM();
        d3_mouse_bug44083 = !(ctm.f || ctm.e);
        svg.remove();
      }
      if (d3_mouse_bug44083) {
        point.x = e.pageX;
        point.y = e.pageY;
      } else {
        point.x = e.clientX;
        point.y = e.clientY;
      }
      point = point.matrixTransform(container.getScreenCTM().inverse());
      return [ point.x, point.y ];
    }
    var rect = container.getBoundingClientRect();
    return [ e.clientX - rect.left - container.clientLeft, e.clientY - rect.top - container.clientTop ];
  }
  d3.touches = function(container, touches) {
    if (arguments.length < 2) touches = d3_eventSource().touches;
    return touches ? d3_array(touches).map(function(touch) {
      var point = d3_mousePoint(container, touch);
      point.identifier = touch.identifier;
      return point;
    }) : [];
  };
  function d3_noop() {}
  d3.scale = {};
  function d3_scaleExtent(domain) {
    var start = domain[0], stop = domain[domain.length - 1];
    return start < stop ? [ start, stop ] : [ stop, start ];
  }
  function d3_scaleRange(scale) {
    return scale.rangeExtent ? scale.rangeExtent() : d3_scaleExtent(scale.range());
  }
  function d3_scale_nice(domain, nice) {
    var i0 = 0, i1 = domain.length - 1, x0 = domain[i0], x1 = domain[i1], dx;
    if (x1 < x0) {
      dx = i0, i0 = i1, i1 = dx;
      dx = x0, x0 = x1, x1 = dx;
    }
    if (nice = nice(x1 - x0)) {
      domain[i0] = nice.floor(x0);
      domain[i1] = nice.ceil(x1);
    }
    return domain;
  }
  function d3_scale_niceDefault() {
    return Math;
  }
  d3.scale.linear = function() {
    return d3_scale_linear([ 0, 1 ], [ 0, 1 ], d3.interpolate, false);
  };
  function d3_scale_linear(domain, range, interpolate, clamp) {
    var output, input;
    function rescale() {
      var linear = Math.min(domain.length, range.length) > 2 ? d3_scale_polylinear : d3_scale_bilinear, uninterpolate = clamp ? d3_uninterpolateClamp : d3_uninterpolateNumber;
      output = linear(domain, range, uninterpolate, interpolate);
      input = linear(range, domain, uninterpolate, d3.interpolate);
      return scale;
    }
    function scale(x) {
      return output(x);
    }
    scale.invert = function(y) {
      return input(y);
    };
    scale.domain = function(x) {
      if (!arguments.length) return domain;
      domain = x.map(Number);
      return rescale();
    };
    scale.range = function(x) {
      if (!arguments.length) return range;
      range = x;
      return rescale();
    };
    scale.rangeRound = function(x) {
      return scale.range(x).interpolate(d3.interpolateRound);
    };
    scale.clamp = function(x) {
      if (!arguments.length) return clamp;
      clamp = x;
      return rescale();
    };
    scale.interpolate = function(x) {
      if (!arguments.length) return interpolate;
      interpolate = x;
      return rescale();
    };
    scale.ticks = function(m) {
      return d3_scale_linearTicks(domain, m);
    };
    scale.tickFormat = function(m) {
      return d3_scale_linearTickFormat(domain, m);
    };
    scale.nice = function() {
      d3_scale_nice(domain, d3_scale_linearNice);
      return rescale();
    };
    scale.copy = function() {
      return d3_scale_linear(domain, range, interpolate, clamp);
    };
    return rescale();
  }
  function d3_scale_linearRebind(scale, linear) {
    return d3.rebind(scale, linear, "range", "rangeRound", "interpolate", "clamp");
  }
  function d3_scale_linearNice(dx) {
    dx = Math.pow(10, Math.round(Math.log(dx) / Math.LN10) - 1);
    return dx && {
      floor: function(x) {
        return Math.floor(x / dx) * dx;
      },
      ceil: function(x) {
        return Math.ceil(x / dx) * dx;
      }
    };
  }
  function d3_scale_linearTickRange(domain, m) {
    var extent = d3_scaleExtent(domain), span = extent[1] - extent[0], step = Math.pow(10, Math.floor(Math.log(span / m) / Math.LN10)), err = m / span * step;
    if (err <= .15) step *= 10; else if (err <= .35) step *= 5; else if (err <= .75) step *= 2;
    extent[0] = Math.ceil(extent[0] / step) * step;
    extent[1] = Math.floor(extent[1] / step) * step + step * .5;
    extent[2] = step;
    return extent;
  }
  function d3_scale_linearTicks(domain, m) {
    return d3.range.apply(d3, d3_scale_linearTickRange(domain, m));
  }
  function d3_scale_linearTickFormat(domain, m) {
    return d3.format(",." + Math.max(0, -Math.floor(Math.log(d3_scale_linearTickRange(domain, m)[2]) / Math.LN10 + .01)) + "f");
  }
  function d3_scale_bilinear(domain, range, uninterpolate, interpolate) {
    var u = uninterpolate(domain[0], domain[1]), i = interpolate(range[0], range[1]);
    return function(x) {
      return i(u(x));
    };
  }
  function d3_scale_polylinear(domain, range, uninterpolate, interpolate) {
    var u = [], i = [], j = 0, k = Math.min(domain.length, range.length) - 1;
    if (domain[k] < domain[0]) {
      domain = domain.slice().reverse();
      range = range.slice().reverse();
    }
    while (++j <= k) {
      u.push(uninterpolate(domain[j - 1], domain[j]));
      i.push(interpolate(range[j - 1], range[j]));
    }
    return function(x) {
      var j = d3.bisect(domain, x, 1, k) - 1;
      return i[j](u[j](x));
    };
  }
  d3.scale.log = function() {
    return d3_scale_log(d3.scale.linear(), d3_scale_logp);
  };
  function d3_scale_log(linear, log) {
    var pow = log.pow;
    function scale(x) {
      return linear(log(x));
    }
    scale.invert = function(x) {
      return pow(linear.invert(x));
    };
    scale.domain = function(x) {
      if (!arguments.length) return linear.domain().map(pow);
      log = x[0] < 0 ? d3_scale_logn : d3_scale_logp;
      pow = log.pow;
      linear.domain(x.map(log));
      return scale;
    };
    scale.nice = function() {
      linear.domain(d3_scale_nice(linear.domain(), d3_scale_niceDefault));
      return scale;
    };
    scale.ticks = function() {
      var extent = d3_scaleExtent(linear.domain()), ticks = [];
      if (extent.every(isFinite)) {
        var i = Math.floor(extent[0]), j = Math.ceil(extent[1]), u = pow(extent[0]), v = pow(extent[1]);
        if (log === d3_scale_logn) {
          ticks.push(pow(i));
          for (;i++ < j; ) for (var k = 9; k > 0; k--) ticks.push(pow(i) * k);
        } else {
          for (;i < j; i++) for (var k = 1; k < 10; k++) ticks.push(pow(i) * k);
          ticks.push(pow(i));
        }
        for (i = 0; ticks[i] < u; i++) {}
        for (j = ticks.length; ticks[j - 1] > v; j--) {}
        ticks = ticks.slice(i, j);
      }
      return ticks;
    };
    scale.tickFormat = function(n, format) {
      if (arguments.length < 2) format = d3_scale_logFormat;
      if (!arguments.length) return format;
      var k = Math.max(.1, n / scale.ticks().length), f = log === d3_scale_logn ? (e = -1e-12, 
      Math.floor) : (e = 1e-12, Math.ceil), e;
      return function(d) {
        return d / pow(f(log(d) + e)) <= k ? format(d) : "";
      };
    };
    scale.copy = function() {
      return d3_scale_log(linear.copy(), log);
    };
    return d3_scale_linearRebind(scale, linear);
  }
  var d3_scale_logFormat = d3.format(".0e");
  function d3_scale_logp(x) {
    return Math.log(x < 0 ? 0 : x) / Math.LN10;
  }
  function d3_scale_logn(x) {
    return -Math.log(x > 0 ? 0 : -x) / Math.LN10;
  }
  d3_scale_logp.pow = function(x) {
    return Math.pow(10, x);
  };
  d3_scale_logn.pow = function(x) {
    return -Math.pow(10, -x);
  };
  d3.scale.pow = function() {
    return d3_scale_pow(d3.scale.linear(), 1);
  };
  function d3_scale_pow(linear, exponent) {
    var powp = d3_scale_powPow(exponent), powb = d3_scale_powPow(1 / exponent);
    function scale(x) {
      return linear(powp(x));
    }
    scale.invert = function(x) {
      return powb(linear.invert(x));
    };
    scale.domain = function(x) {
      if (!arguments.length) return linear.domain().map(powb);
      linear.domain(x.map(powp));
      return scale;
    };
    scale.ticks = function(m) {
      return d3_scale_linearTicks(scale.domain(), m);
    };
    scale.tickFormat = function(m) {
      return d3_scale_linearTickFormat(scale.domain(), m);
    };
    scale.nice = function() {
      return scale.domain(d3_scale_nice(scale.domain(), d3_scale_linearNice));
    };
    scale.exponent = function(x) {
      if (!arguments.length) return exponent;
      var domain = scale.domain();
      powp = d3_scale_powPow(exponent = x);
      powb = d3_scale_powPow(1 / exponent);
      return scale.domain(domain);
    };
    scale.copy = function() {
      return d3_scale_pow(linear.copy(), exponent);
    };
    return d3_scale_linearRebind(scale, linear);
  }
  function d3_scale_powPow(e) {
    return function(x) {
      return x < 0 ? -Math.pow(-x, e) : Math.pow(x, e);
    };
  }
  d3.scale.sqrt = function() {
    return d3.scale.pow().exponent(.5);
  };
  d3.scale.ordinal = function() {
    return d3_scale_ordinal([], {
      t: "range",
      a: [ [] ]
    });
  };
  function d3_scale_ordinal(domain, ranger) {
    var index, range, rangeBand;
    function scale(x) {
      return range[((index.get(x) || index.set(x, domain.push(x))) - 1) % range.length];
    }
    function steps(start, step) {
      return d3.range(domain.length).map(function(i) {
        return start + step * i;
      });
    }
    scale.domain = function(x) {
      if (!arguments.length) return domain;
      domain = [];
      index = new d3_Map();
      var i = -1, n = x.length, xi;
      while (++i < n) if (!index.has(xi = x[i])) index.set(xi, domain.push(xi));
      return scale[ranger.t].apply(scale, ranger.a);
    };
    scale.range = function(x) {
      if (!arguments.length) return range;
      range = x;
      rangeBand = 0;
      ranger = {
        t: "range",
        a: arguments
      };
      return scale;
    };
    scale.rangePoints = function(x, padding) {
      if (arguments.length < 2) padding = 0;
      var start = x[0], stop = x[1], step = (stop - start) / (Math.max(1, domain.length - 1) + padding);
      range = steps(domain.length < 2 ? (start + stop) / 2 : start + step * padding / 2, step);
      rangeBand = 0;
      ranger = {
        t: "rangePoints",
        a: arguments
      };
      return scale;
    };
    scale.rangeBands = function(x, padding, outerPadding) {
      if (arguments.length < 2) padding = 0;
      if (arguments.length < 3) outerPadding = padding;
      var reverse = x[1] < x[0], start = x[reverse - 0], stop = x[1 - reverse], step = (stop - start) / (domain.length - padding + 2 * outerPadding);
      range = steps(start + step * outerPadding, step);
      if (reverse) range.reverse();
      rangeBand = step * (1 - padding);
      ranger = {
        t: "rangeBands",
        a: arguments
      };
      return scale;
    };
    scale.rangeRoundBands = function(x, padding, outerPadding) {
      if (arguments.length < 2) padding = 0;
      if (arguments.length < 3) outerPadding = padding;
      var reverse = x[1] < x[0], start = x[reverse - 0], stop = x[1 - reverse], step = Math.floor((stop - start) / (domain.length - padding + 2 * outerPadding)), error = stop - start - (domain.length - padding) * step;
      range = steps(start + Math.round(error / 2), step);
      if (reverse) range.reverse();
      rangeBand = Math.round(step * (1 - padding));
      ranger = {
        t: "rangeRoundBands",
        a: arguments
      };
      return scale;
    };
    scale.rangeBand = function() {
      return rangeBand;
    };
    scale.rangeExtent = function() {
      return d3_scaleExtent(ranger.a[0]);
    };
    scale.copy = function() {
      return d3_scale_ordinal(domain, ranger);
    };
    return scale.domain(domain);
  }
  d3.scale.category10 = function() {
    return d3.scale.ordinal().range(d3_category10);
  };
  d3.scale.category20 = function() {
    return d3.scale.ordinal().range(d3_category20);
  };
  d3.scale.category20b = function() {
    return d3.scale.ordinal().range(d3_category20b);
  };
  d3.scale.category20c = function() {
    return d3.scale.ordinal().range(d3_category20c);
  };
  var d3_category10 = [ "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf" ];
  var d3_category20 = [ "#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c", "#98df8a", "#d62728", "#ff9896", "#9467bd", "#c5b0d5", "#8c564b", "#c49c94", "#e377c2", "#f7b6d2", "#7f7f7f", "#c7c7c7", "#bcbd22", "#dbdb8d", "#17becf", "#9edae5" ];
  var d3_category20b = [ "#393b79", "#5254a3", "#6b6ecf", "#9c9ede", "#637939", "#8ca252", "#b5cf6b", "#cedb9c", "#8c6d31", "#bd9e39", "#e7ba52", "#e7cb94", "#843c39", "#ad494a", "#d6616b", "#e7969c", "#7b4173", "#a55194", "#ce6dbd", "#de9ed6" ];
  var d3_category20c = [ "#3182bd", "#6baed6", "#9ecae1", "#c6dbef", "#e6550d", "#fd8d3c", "#fdae6b", "#fdd0a2", "#31a354", "#74c476", "#a1d99b", "#c7e9c0", "#756bb1", "#9e9ac8", "#bcbddc", "#dadaeb", "#636363", "#969696", "#bdbdbd", "#d9d9d9" ];
  d3.scale.quantile = function() {
    return d3_scale_quantile([], []);
  };
  function d3_scale_quantile(domain, range) {
    var thresholds;
    function rescale() {
      var k = 0, q = range.length;
      thresholds = [];
      while (++k < q) thresholds[k - 1] = d3.quantile(domain, k / q);
      return scale;
    }
    function scale(x) {
      if (isNaN(x = +x)) return NaN;
      return range[d3.bisect(thresholds, x)];
    }
    scale.domain = function(x) {
      if (!arguments.length) return domain;
      domain = x.filter(function(d) {
        return !isNaN(d);
      }).sort(d3.ascending);
      return rescale();
    };
    scale.range = function(x) {
      if (!arguments.length) return range;
      range = x;
      return rescale();
    };
    scale.quantiles = function() {
      return thresholds;
    };
    scale.copy = function() {
      return d3_scale_quantile(domain, range);
    };
    return rescale();
  }
  d3.scale.quantize = function() {
    return d3_scale_quantize(0, 1, [ 0, 1 ]);
  };
  function d3_scale_quantize(x0, x1, range) {
    var kx, i;
    function scale(x) {
      return range[Math.max(0, Math.min(i, Math.floor(kx * (x - x0))))];
    }
    function rescale() {
      kx = range.length / (x1 - x0);
      i = range.length - 1;
      return scale;
    }
    scale.domain = function(x) {
      if (!arguments.length) return [ x0, x1 ];
      x0 = +x[0];
      x1 = +x[x.length - 1];
      return rescale();
    };
    scale.range = function(x) {
      if (!arguments.length) return range;
      range = x;
      return rescale();
    };
    scale.copy = function() {
      return d3_scale_quantize(x0, x1, range);
    };
    return rescale();
  }
  d3.scale.threshold = function() {
    return d3_scale_threshold([ .5 ], [ 0, 1 ]);
  };
  function d3_scale_threshold(domain, range) {
    function scale(x) {
      return range[d3.bisect(domain, x)];
    }
    scale.domain = function(_) {
      if (!arguments.length) return domain;
      domain = _;
      return scale;
    };
    scale.range = function(_) {
      if (!arguments.length) return range;
      range = _;
      return scale;
    };
    scale.copy = function() {
      return d3_scale_threshold(domain, range);
    };
    return scale;
  }
  d3.scale.identity = function() {
    return d3_scale_identity([ 0, 1 ]);
  };
  function d3_scale_identity(domain) {
    function identity(x) {
      return +x;
    }
    identity.invert = identity;
    identity.domain = identity.range = function(x) {
      if (!arguments.length) return domain;
      domain = x.map(identity);
      return identity;
    };
    identity.ticks = function(m) {
      return d3_scale_linearTicks(domain, m);
    };
    identity.tickFormat = function(m) {
      return d3_scale_linearTickFormat(domain, m);
    };
    identity.copy = function() {
      return d3_scale_identity(domain);
    };
    return identity;
  }
  d3.svg = {};
  d3.svg.arc = function() {
    var innerRadius = d3_svg_arcInnerRadius, outerRadius = d3_svg_arcOuterRadius, startAngle = d3_svg_arcStartAngle, endAngle = d3_svg_arcEndAngle;
    function arc() {
      var r0 = innerRadius.apply(this, arguments), r1 = outerRadius.apply(this, arguments), a0 = startAngle.apply(this, arguments) + d3_svg_arcOffset, a1 = endAngle.apply(this, arguments) + d3_svg_arcOffset, da = (a1 < a0 && (da = a0, 
      a0 = a1, a1 = da), a1 - a0), df = da < π ? "0" : "1", c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      return da >= d3_svg_arcMax ? r0 ? "M0," + r1 + "A" + r1 + "," + r1 + " 0 1,1 0," + -r1 + "A" + r1 + "," + r1 + " 0 1,1 0," + r1 + "M0," + r0 + "A" + r0 + "," + r0 + " 0 1,0 0," + -r0 + "A" + r0 + "," + r0 + " 0 1,0 0," + r0 + "Z" : "M0," + r1 + "A" + r1 + "," + r1 + " 0 1,1 0," + -r1 + "A" + r1 + "," + r1 + " 0 1,1 0," + r1 + "Z" : r0 ? "M" + r1 * c0 + "," + r1 * s0 + "A" + r1 + "," + r1 + " 0 " + df + ",1 " + r1 * c1 + "," + r1 * s1 + "L" + r0 * c1 + "," + r0 * s1 + "A" + r0 + "," + r0 + " 0 " + df + ",0 " + r0 * c0 + "," + r0 * s0 + "Z" : "M" + r1 * c0 + "," + r1 * s0 + "A" + r1 + "," + r1 + " 0 " + df + ",1 " + r1 * c1 + "," + r1 * s1 + "L0,0" + "Z";
    }
    arc.innerRadius = function(v) {
      if (!arguments.length) return innerRadius;
      innerRadius = d3_functor(v);
      return arc;
    };
    arc.outerRadius = function(v) {
      if (!arguments.length) return outerRadius;
      outerRadius = d3_functor(v);
      return arc;
    };
    arc.startAngle = function(v) {
      if (!arguments.length) return startAngle;
      startAngle = d3_functor(v);
      return arc;
    };
    arc.endAngle = function(v) {
      if (!arguments.length) return endAngle;
      endAngle = d3_functor(v);
      return arc;
    };
    arc.centroid = function() {
      var r = (innerRadius.apply(this, arguments) + outerRadius.apply(this, arguments)) / 2, a = (startAngle.apply(this, arguments) + endAngle.apply(this, arguments)) / 2 + d3_svg_arcOffset;
      return [ Math.cos(a) * r, Math.sin(a) * r ];
    };
    return arc;
  };
  var d3_svg_arcOffset = -π / 2, d3_svg_arcMax = 2 * π - 1e-6;
  function d3_svg_arcInnerRadius(d) {
    return d.innerRadius;
  }
  function d3_svg_arcOuterRadius(d) {
    return d.outerRadius;
  }
  function d3_svg_arcStartAngle(d) {
    return d.startAngle;
  }
  function d3_svg_arcEndAngle(d) {
    return d.endAngle;
  }
  function d3_svg_line(projection) {
    var x = d3_svg_lineX, y = d3_svg_lineY, defined = d3_true, interpolate = d3_svg_lineLinear, interpolateKey = interpolate.key, tension = .7;
    function line(data) {
      var segments = [], points = [], i = -1, n = data.length, d, fx = d3_functor(x), fy = d3_functor(y);
      function segment() {
        segments.push("M", interpolate(projection(points), tension));
      }
      while (++i < n) {
        if (defined.call(this, d = data[i], i)) {
          points.push([ +fx.call(this, d, i), +fy.call(this, d, i) ]);
        } else if (points.length) {
          segment();
          points = [];
        }
      }
      if (points.length) segment();
      return segments.length ? segments.join("") : null;
    }
    line.x = function(_) {
      if (!arguments.length) return x;
      x = _;
      return line;
    };
    line.y = function(_) {
      if (!arguments.length) return y;
      y = _;
      return line;
    };
    line.defined = function(_) {
      if (!arguments.length) return defined;
      defined = _;
      return line;
    };
    line.interpolate = function(_) {
      if (!arguments.length) return interpolateKey;
      if (typeof _ === "function") interpolateKey = interpolate = _; else interpolateKey = (interpolate = d3_svg_lineInterpolators.get(_) || d3_svg_lineLinear).key;
      return line;
    };
    line.tension = function(_) {
      if (!arguments.length) return tension;
      tension = _;
      return line;
    };
    return line;
  }
  d3.svg.line = function() {
    return d3_svg_line(d3_identity);
  };
  function d3_svg_lineX(d) {
    return d[0];
  }
  function d3_svg_lineY(d) {
    return d[1];
  }
  var d3_svg_lineInterpolators = d3.map({
    linear: d3_svg_lineLinear,
    "linear-closed": d3_svg_lineLinearClosed,
    "step-before": d3_svg_lineStepBefore,
    "step-after": d3_svg_lineStepAfter,
    basis: d3_svg_lineBasis,
    "basis-open": d3_svg_lineBasisOpen,
    "basis-closed": d3_svg_lineBasisClosed,
    bundle: d3_svg_lineBundle,
    cardinal: d3_svg_lineCardinal,
    "cardinal-open": d3_svg_lineCardinalOpen,
    "cardinal-closed": d3_svg_lineCardinalClosed,
    monotone: d3_svg_lineMonotone
  });
  d3_svg_lineInterpolators.forEach(function(key, value) {
    value.key = key;
    value.closed = /-closed$/.test(key);
  });
  function d3_svg_lineLinear(points) {
    return points.join("L");
  }
  function d3_svg_lineLinearClosed(points) {
    return d3_svg_lineLinear(points) + "Z";
  }
  function d3_svg_lineStepBefore(points) {
    var i = 0, n = points.length, p = points[0], path = [ p[0], ",", p[1] ];
    while (++i < n) path.push("V", (p = points[i])[1], "H", p[0]);
    return path.join("");
  }
  function d3_svg_lineStepAfter(points) {
    var i = 0, n = points.length, p = points[0], path = [ p[0], ",", p[1] ];
    while (++i < n) path.push("H", (p = points[i])[0], "V", p[1]);
    return path.join("");
  }
  function d3_svg_lineCardinalOpen(points, tension) {
    return points.length < 4 ? d3_svg_lineLinear(points) : points[1] + d3_svg_lineHermite(points.slice(1, points.length - 1), d3_svg_lineCardinalTangents(points, tension));
  }
  function d3_svg_lineCardinalClosed(points, tension) {
    return points.length < 3 ? d3_svg_lineLinear(points) : points[0] + d3_svg_lineHermite((points.push(points[0]), 
    points), d3_svg_lineCardinalTangents([ points[points.length - 2] ].concat(points, [ points[1] ]), tension));
  }
  function d3_svg_lineCardinal(points, tension) {
    return points.length < 3 ? d3_svg_lineLinear(points) : points[0] + d3_svg_lineHermite(points, d3_svg_lineCardinalTangents(points, tension));
  }
  function d3_svg_lineHermite(points, tangents) {
    if (tangents.length < 1 || points.length != tangents.length && points.length != tangents.length + 2) {
      return d3_svg_lineLinear(points);
    }
    var quad = points.length != tangents.length, path = "", p0 = points[0], p = points[1], t0 = tangents[0], t = t0, pi = 1;
    if (quad) {
      path += "Q" + (p[0] - t0[0] * 2 / 3) + "," + (p[1] - t0[1] * 2 / 3) + "," + p[0] + "," + p[1];
      p0 = points[1];
      pi = 2;
    }
    if (tangents.length > 1) {
      t = tangents[1];
      p = points[pi];
      pi++;
      path += "C" + (p0[0] + t0[0]) + "," + (p0[1] + t0[1]) + "," + (p[0] - t[0]) + "," + (p[1] - t[1]) + "," + p[0] + "," + p[1];
      for (var i = 2; i < tangents.length; i++, pi++) {
        p = points[pi];
        t = tangents[i];
        path += "S" + (p[0] - t[0]) + "," + (p[1] - t[1]) + "," + p[0] + "," + p[1];
      }
    }
    if (quad) {
      var lp = points[pi];
      path += "Q" + (p[0] + t[0] * 2 / 3) + "," + (p[1] + t[1] * 2 / 3) + "," + lp[0] + "," + lp[1];
    }
    return path;
  }
  function d3_svg_lineCardinalTangents(points, tension) {
    var tangents = [], a = (1 - tension) / 2, p0, p1 = points[0], p2 = points[1], i = 1, n = points.length;
    while (++i < n) {
      p0 = p1;
      p1 = p2;
      p2 = points[i];
      tangents.push([ a * (p2[0] - p0[0]), a * (p2[1] - p0[1]) ]);
    }
    return tangents;
  }
  function d3_svg_lineBasis(points) {
    if (points.length < 3) return d3_svg_lineLinear(points);
    var i = 1, n = points.length, pi = points[0], x0 = pi[0], y0 = pi[1], px = [ x0, x0, x0, (pi = points[1])[0] ], py = [ y0, y0, y0, pi[1] ], path = [ x0, ",", y0 ];
    d3_svg_lineBasisBezier(path, px, py);
    while (++i < n) {
      pi = points[i];
      px.shift();
      px.push(pi[0]);
      py.shift();
      py.push(pi[1]);
      d3_svg_lineBasisBezier(path, px, py);
    }
    i = -1;
    while (++i < 2) {
      px.shift();
      px.push(pi[0]);
      py.shift();
      py.push(pi[1]);
      d3_svg_lineBasisBezier(path, px, py);
    }
    return path.join("");
  }
  function d3_svg_lineBasisOpen(points) {
    if (points.length < 4) return d3_svg_lineLinear(points);
    var path = [], i = -1, n = points.length, pi, px = [ 0 ], py = [ 0 ];
    while (++i < 3) {
      pi = points[i];
      px.push(pi[0]);
      py.push(pi[1]);
    }
    path.push(d3_svg_lineDot4(d3_svg_lineBasisBezier3, px) + "," + d3_svg_lineDot4(d3_svg_lineBasisBezier3, py));
    --i;
    while (++i < n) {
      pi = points[i];
      px.shift();
      px.push(pi[0]);
      py.shift();
      py.push(pi[1]);
      d3_svg_lineBasisBezier(path, px, py);
    }
    return path.join("");
  }
  function d3_svg_lineBasisClosed(points) {
    var path, i = -1, n = points.length, m = n + 4, pi, px = [], py = [];
    while (++i < 4) {
      pi = points[i % n];
      px.push(pi[0]);
      py.push(pi[1]);
    }
    path = [ d3_svg_lineDot4(d3_svg_lineBasisBezier3, px), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier3, py) ];
    --i;
    while (++i < m) {
      pi = points[i % n];
      px.shift();
      px.push(pi[0]);
      py.shift();
      py.push(pi[1]);
      d3_svg_lineBasisBezier(path, px, py);
    }
    return path.join("");
  }
  function d3_svg_lineBundle(points, tension) {
    var n = points.length - 1;
    if (n) {
      var x0 = points[0][0], y0 = points[0][1], dx = points[n][0] - x0, dy = points[n][1] - y0, i = -1, p, t;
      while (++i <= n) {
        p = points[i];
        t = i / n;
        p[0] = tension * p[0] + (1 - tension) * (x0 + t * dx);
        p[1] = tension * p[1] + (1 - tension) * (y0 + t * dy);
      }
    }
    return d3_svg_lineBasis(points);
  }
  function d3_svg_lineDot4(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  }
  var d3_svg_lineBasisBezier1 = [ 0, 2 / 3, 1 / 3, 0 ], d3_svg_lineBasisBezier2 = [ 0, 1 / 3, 2 / 3, 0 ], d3_svg_lineBasisBezier3 = [ 0, 1 / 6, 2 / 3, 1 / 6 ];
  function d3_svg_lineBasisBezier(path, x, y) {
    path.push("C", d3_svg_lineDot4(d3_svg_lineBasisBezier1, x), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier1, y), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier2, x), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier2, y), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier3, x), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier3, y));
  }
  function d3_svg_lineSlope(p0, p1) {
    return (p1[1] - p0[1]) / (p1[0] - p0[0]);
  }
  function d3_svg_lineFiniteDifferences(points) {
    var i = 0, j = points.length - 1, m = [], p0 = points[0], p1 = points[1], d = m[0] = d3_svg_lineSlope(p0, p1);
    while (++i < j) {
      m[i] = (d + (d = d3_svg_lineSlope(p0 = p1, p1 = points[i + 1]))) / 2;
    }
    m[i] = d;
    return m;
  }
  function d3_svg_lineMonotoneTangents(points) {
    var tangents = [], d, a, b, s, m = d3_svg_lineFiniteDifferences(points), i = -1, j = points.length - 1;
    while (++i < j) {
      d = d3_svg_lineSlope(points[i], points[i + 1]);
      if (Math.abs(d) < 1e-6) {
        m[i] = m[i + 1] = 0;
      } else {
        a = m[i] / d;
        b = m[i + 1] / d;
        s = a * a + b * b;
        if (s > 9) {
          s = d * 3 / Math.sqrt(s);
          m[i] = s * a;
          m[i + 1] = s * b;
        }
      }
    }
    i = -1;
    while (++i <= j) {
      s = (points[Math.min(j, i + 1)][0] - points[Math.max(0, i - 1)][0]) / (6 * (1 + m[i] * m[i]));
      tangents.push([ s || 0, m[i] * s || 0 ]);
    }
    return tangents;
  }
  function d3_svg_lineMonotone(points) {
    return points.length < 3 ? d3_svg_lineLinear(points) : points[0] + d3_svg_lineHermite(points, d3_svg_lineMonotoneTangents(points));
  }
  d3.svg.line.radial = function() {
    var line = d3_svg_line(d3_svg_lineRadial);
    line.radius = line.x, delete line.x;
    line.angle = line.y, delete line.y;
    return line;
  };
  function d3_svg_lineRadial(points) {
    var point, i = -1, n = points.length, r, a;
    while (++i < n) {
      point = points[i];
      r = point[0];
      a = point[1] + d3_svg_arcOffset;
      point[0] = r * Math.cos(a);
      point[1] = r * Math.sin(a);
    }
    return points;
  }
  function d3_svg_area(projection) {
    var x0 = d3_svg_lineX, x1 = d3_svg_lineX, y0 = 0, y1 = d3_svg_lineY, defined = d3_true, interpolate = d3_svg_lineLinear, interpolateKey = interpolate.key, interpolateReverse = interpolate, L = "L", tension = .7;
    function area(data) {
      var segments = [], points0 = [], points1 = [], i = -1, n = data.length, d, fx0 = d3_functor(x0), fy0 = d3_functor(y0), fx1 = x0 === x1 ? function() {
        return x;
      } : d3_functor(x1), fy1 = y0 === y1 ? function() {
        return y;
      } : d3_functor(y1), x, y;
      function segment() {
        segments.push("M", interpolate(projection(points1), tension), L, interpolateReverse(projection(points0.reverse()), tension), "Z");
      }
      while (++i < n) {
        if (defined.call(this, d = data[i], i)) {
          points0.push([ x = +fx0.call(this, d, i), y = +fy0.call(this, d, i) ]);
          points1.push([ +fx1.call(this, d, i), +fy1.call(this, d, i) ]);
        } else if (points0.length) {
          segment();
          points0 = [];
          points1 = [];
        }
      }
      if (points0.length) segment();
      return segments.length ? segments.join("") : null;
    }
    area.x = function(_) {
      if (!arguments.length) return x1;
      x0 = x1 = _;
      return area;
    };
    area.x0 = function(_) {
      if (!arguments.length) return x0;
      x0 = _;
      return area;
    };
    area.x1 = function(_) {
      if (!arguments.length) return x1;
      x1 = _;
      return area;
    };
    area.y = function(_) {
      if (!arguments.length) return y1;
      y0 = y1 = _;
      return area;
    };
    area.y0 = function(_) {
      if (!arguments.length) return y0;
      y0 = _;
      return area;
    };
    area.y1 = function(_) {
      if (!arguments.length) return y1;
      y1 = _;
      return area;
    };
    area.defined = function(_) {
      if (!arguments.length) return defined;
      defined = _;
      return area;
    };
    area.interpolate = function(_) {
      if (!arguments.length) return interpolateKey;
      if (typeof _ === "function") interpolateKey = interpolate = _; else interpolateKey = (interpolate = d3_svg_lineInterpolators.get(_) || d3_svg_lineLinear).key;
      interpolateReverse = interpolate.reverse || interpolate;
      L = interpolate.closed ? "M" : "L";
      return area;
    };
    area.tension = function(_) {
      if (!arguments.length) return tension;
      tension = _;
      return area;
    };
    return area;
  }
  d3_svg_lineStepBefore.reverse = d3_svg_lineStepAfter;
  d3_svg_lineStepAfter.reverse = d3_svg_lineStepBefore;
  d3.svg.area = function() {
    return d3_svg_area(d3_identity);
  };
  d3.svg.area.radial = function() {
    var area = d3_svg_area(d3_svg_lineRadial);
    area.radius = area.x, delete area.x;
    area.innerRadius = area.x0, delete area.x0;
    area.outerRadius = area.x1, delete area.x1;
    area.angle = area.y, delete area.y;
    area.startAngle = area.y0, delete area.y0;
    area.endAngle = area.y1, delete area.y1;
    return area;
  };
  d3.svg.chord = function() {
    var source = d3_source, target = d3_target, radius = d3_svg_chordRadius, startAngle = d3_svg_arcStartAngle, endAngle = d3_svg_arcEndAngle;
    function chord(d, i) {
      var s = subgroup(this, source, d, i), t = subgroup(this, target, d, i);
      return "M" + s.p0 + arc(s.r, s.p1, s.a1 - s.a0) + (equals(s, t) ? curve(s.r, s.p1, s.r, s.p0) : curve(s.r, s.p1, t.r, t.p0) + arc(t.r, t.p1, t.a1 - t.a0) + curve(t.r, t.p1, s.r, s.p0)) + "Z";
    }
    function subgroup(self, f, d, i) {
      var subgroup = f.call(self, d, i), r = radius.call(self, subgroup, i), a0 = startAngle.call(self, subgroup, i) + d3_svg_arcOffset, a1 = endAngle.call(self, subgroup, i) + d3_svg_arcOffset;
      return {
        r: r,
        a0: a0,
        a1: a1,
        p0: [ r * Math.cos(a0), r * Math.sin(a0) ],
        p1: [ r * Math.cos(a1), r * Math.sin(a1) ]
      };
    }
    function equals(a, b) {
      return a.a0 == b.a0 && a.a1 == b.a1;
    }
    function arc(r, p, a) {
      return "A" + r + "," + r + " 0 " + +(a > π) + ",1 " + p;
    }
    function curve(r0, p0, r1, p1) {
      return "Q 0,0 " + p1;
    }
    chord.radius = function(v) {
      if (!arguments.length) return radius;
      radius = d3_functor(v);
      return chord;
    };
    chord.source = function(v) {
      if (!arguments.length) return source;
      source = d3_functor(v);
      return chord;
    };
    chord.target = function(v) {
      if (!arguments.length) return target;
      target = d3_functor(v);
      return chord;
    };
    chord.startAngle = function(v) {
      if (!arguments.length) return startAngle;
      startAngle = d3_functor(v);
      return chord;
    };
    chord.endAngle = function(v) {
      if (!arguments.length) return endAngle;
      endAngle = d3_functor(v);
      return chord;
    };
    return chord;
  };
  function d3_svg_chordRadius(d) {
    return d.radius;
  }
  d3.svg.diagonal = function() {
    var source = d3_source, target = d3_target, projection = d3_svg_diagonalProjection;
    function diagonal(d, i) {
      var p0 = source.call(this, d, i), p3 = target.call(this, d, i), m = (p0.y + p3.y) / 2, p = [ p0, {
        x: p0.x,
        y: m
      }, {
        x: p3.x,
        y: m
      }, p3 ];
      p = p.map(projection);
      return "M" + p[0] + "C" + p[1] + " " + p[2] + " " + p[3];
    }
    diagonal.source = function(x) {
      if (!arguments.length) return source;
      source = d3_functor(x);
      return diagonal;
    };
    diagonal.target = function(x) {
      if (!arguments.length) return target;
      target = d3_functor(x);
      return diagonal;
    };
    diagonal.projection = function(x) {
      if (!arguments.length) return projection;
      projection = x;
      return diagonal;
    };
    return diagonal;
  };
  function d3_svg_diagonalProjection(d) {
    return [ d.x, d.y ];
  }
  d3.svg.diagonal.radial = function() {
    var diagonal = d3.svg.diagonal(), projection = d3_svg_diagonalProjection, projection_ = diagonal.projection;
    diagonal.projection = function(x) {
      return arguments.length ? projection_(d3_svg_diagonalRadialProjection(projection = x)) : projection;
    };
    return diagonal;
  };
  function d3_svg_diagonalRadialProjection(projection) {
    return function() {
      var d = projection.apply(this, arguments), r = d[0], a = d[1] + d3_svg_arcOffset;
      return [ r * Math.cos(a), r * Math.sin(a) ];
    };
  }
  d3.svg.symbol = function() {
    var type = d3_svg_symbolType, size = d3_svg_symbolSize;
    function symbol(d, i) {
      return (d3_svg_symbols.get(type.call(this, d, i)) || d3_svg_symbolCircle)(size.call(this, d, i));
    }
    symbol.type = function(x) {
      if (!arguments.length) return type;
      type = d3_functor(x);
      return symbol;
    };
    symbol.size = function(x) {
      if (!arguments.length) return size;
      size = d3_functor(x);
      return symbol;
    };
    return symbol;
  };
  function d3_svg_symbolSize() {
    return 64;
  }
  function d3_svg_symbolType() {
    return "circle";
  }
  function d3_svg_symbolCircle(size) {
    var r = Math.sqrt(size / π);
    return "M0," + r + "A" + r + "," + r + " 0 1,1 0," + -r + "A" + r + "," + r + " 0 1,1 0," + r + "Z";
  }
  var d3_svg_symbols = d3.map({
    circle: d3_svg_symbolCircle,
    cross: function(size) {
      var r = Math.sqrt(size / 5) / 2;
      return "M" + -3 * r + "," + -r + "H" + -r + "V" + -3 * r + "H" + r + "V" + -r + "H" + 3 * r + "V" + r + "H" + r + "V" + 3 * r + "H" + -r + "V" + r + "H" + -3 * r + "Z";
    },
    diamond: function(size) {
      var ry = Math.sqrt(size / (2 * d3_svg_symbolTan30)), rx = ry * d3_svg_symbolTan30;
      return "M0," + -ry + "L" + rx + ",0" + " 0," + ry + " " + -rx + ",0" + "Z";
    },
    square: function(size) {
      var r = Math.sqrt(size) / 2;
      return "M" + -r + "," + -r + "L" + r + "," + -r + " " + r + "," + r + " " + -r + "," + r + "Z";
    },
    "triangle-down": function(size) {
      var rx = Math.sqrt(size / d3_svg_symbolSqrt3), ry = rx * d3_svg_symbolSqrt3 / 2;
      return "M0," + ry + "L" + rx + "," + -ry + " " + -rx + "," + -ry + "Z";
    },
    "triangle-up": function(size) {
      var rx = Math.sqrt(size / d3_svg_symbolSqrt3), ry = rx * d3_svg_symbolSqrt3 / 2;
      return "M0," + -ry + "L" + rx + "," + ry + " " + -rx + "," + ry + "Z";
    }
  });
  d3.svg.symbolTypes = d3_svg_symbols.keys();
  var d3_svg_symbolSqrt3 = Math.sqrt(3), d3_svg_symbolTan30 = Math.tan(30 * d3_radians);
  d3.svg.axis = function() {
    var scale = d3.scale.linear(), orient = d3_svg_axisDefaultOrient, tickMajorSize = 6, tickMinorSize = 6, tickEndSize = 6, tickPadding = 3, tickArguments_ = [ 10 ], tickValues = null, tickFormat_, tickSubdivide = 0;
    function axis(g) {
      g.each(function() {
        var g = d3.select(this);
        var ticks = tickValues == null ? scale.ticks ? scale.ticks.apply(scale, tickArguments_) : scale.domain() : tickValues, tickFormat = tickFormat_ == null ? scale.tickFormat ? scale.tickFormat.apply(scale, tickArguments_) : String : tickFormat_;
        var subticks = d3_svg_axisSubdivide(scale, ticks, tickSubdivide), subtick = g.selectAll(".tick.minor").data(subticks, String), subtickEnter = subtick.enter().insert("line", ".tick").attr("class", "tick minor").style("opacity", 1e-6), subtickExit = d3.transition(subtick.exit()).style("opacity", 1e-6).remove(), subtickUpdate = d3.transition(subtick).style("opacity", 1);
        var tick = g.selectAll(".tick.major").data(ticks, String), tickEnter = tick.enter().insert("g", "path").attr("class", "tick major").style("opacity", 1e-6), tickExit = d3.transition(tick.exit()).style("opacity", 1e-6).remove(), tickUpdate = d3.transition(tick).style("opacity", 1), tickTransform;
        var range = d3_scaleRange(scale), path = g.selectAll(".domain").data([ 0 ]), pathUpdate = (path.enter().append("path").attr("class", "domain"), 
        d3.transition(path));
        var scale1 = scale.copy(), scale0 = this.__chart__ || scale1;
        this.__chart__ = scale1;
        tickEnter.append("line");
        tickEnter.append("text");
        var lineEnter = tickEnter.select("line"), lineUpdate = tickUpdate.select("line"), text = tick.select("text").text(tickFormat), textEnter = tickEnter.select("text"), textUpdate = tickUpdate.select("text");
        switch (orient) {
         case "bottom":
          {
            tickTransform = d3_svg_axisX;
            subtickEnter.attr("y2", tickMinorSize);
            subtickUpdate.attr("x2", 0).attr("y2", tickMinorSize);
            lineEnter.attr("y2", tickMajorSize);
            textEnter.attr("y", Math.max(tickMajorSize, 0) + tickPadding);
            lineUpdate.attr("x2", 0).attr("y2", tickMajorSize);
            textUpdate.attr("x", 0).attr("y", Math.max(tickMajorSize, 0) + tickPadding);
            text.attr("dy", ".71em").style("text-anchor", "middle");
            pathUpdate.attr("d", "M" + range[0] + "," + tickEndSize + "V0H" + range[1] + "V" + tickEndSize);
            break;
          }

         case "top":
          {
            tickTransform = d3_svg_axisX;
            subtickEnter.attr("y2", -tickMinorSize);
            subtickUpdate.attr("x2", 0).attr("y2", -tickMinorSize);
            lineEnter.attr("y2", -tickMajorSize);
            textEnter.attr("y", -(Math.max(tickMajorSize, 0) + tickPadding));
            lineUpdate.attr("x2", 0).attr("y2", -tickMajorSize);
            textUpdate.attr("x", 0).attr("y", -(Math.max(tickMajorSize, 0) + tickPadding));
            text.attr("dy", "0em").style("text-anchor", "middle");
            pathUpdate.attr("d", "M" + range[0] + "," + -tickEndSize + "V0H" + range[1] + "V" + -tickEndSize);
            break;
          }

         case "left":
          {
            tickTransform = d3_svg_axisY;
            subtickEnter.attr("x2", -tickMinorSize);
            subtickUpdate.attr("x2", -tickMinorSize).attr("y2", 0);
            lineEnter.attr("x2", -tickMajorSize);
            textEnter.attr("x", -(Math.max(tickMajorSize, 0) + tickPadding));
            lineUpdate.attr("x2", -tickMajorSize).attr("y2", 0);
            textUpdate.attr("x", -(Math.max(tickMajorSize, 0) + tickPadding)).attr("y", 0);
            text.attr("dy", ".32em").style("text-anchor", "end");
            pathUpdate.attr("d", "M" + -tickEndSize + "," + range[0] + "H0V" + range[1] + "H" + -tickEndSize);
            break;
          }

         case "right":
          {
            tickTransform = d3_svg_axisY;
            subtickEnter.attr("x2", tickMinorSize);
            subtickUpdate.attr("x2", tickMinorSize).attr("y2", 0);
            lineEnter.attr("x2", tickMajorSize);
            textEnter.attr("x", Math.max(tickMajorSize, 0) + tickPadding);
            lineUpdate.attr("x2", tickMajorSize).attr("y2", 0);
            textUpdate.attr("x", Math.max(tickMajorSize, 0) + tickPadding).attr("y", 0);
            text.attr("dy", ".32em").style("text-anchor", "start");
            pathUpdate.attr("d", "M" + tickEndSize + "," + range[0] + "H0V" + range[1] + "H" + tickEndSize);
            break;
          }
        }
        if (scale.ticks) {
          tickEnter.call(tickTransform, scale0);
          tickUpdate.call(tickTransform, scale1);
          tickExit.call(tickTransform, scale1);
          subtickEnter.call(tickTransform, scale0);
          subtickUpdate.call(tickTransform, scale1);
          subtickExit.call(tickTransform, scale1);
        } else {
          var dx = scale1.rangeBand() / 2, x = function(d) {
            return scale1(d) + dx;
          };
          tickEnter.call(tickTransform, x);
          tickUpdate.call(tickTransform, x);
        }
      });
    }
    axis.scale = function(x) {
      if (!arguments.length) return scale;
      scale = x;
      return axis;
    };
    axis.orient = function(x) {
      if (!arguments.length) return orient;
      orient = x in d3_svg_axisOrients ? x + "" : d3_svg_axisDefaultOrient;
      return axis;
    };
    axis.ticks = function() {
      if (!arguments.length) return tickArguments_;
      tickArguments_ = arguments;
      return axis;
    };
    axis.tickValues = function(x) {
      if (!arguments.length) return tickValues;
      tickValues = x;
      return axis;
    };
    axis.tickFormat = function(x) {
      if (!arguments.length) return tickFormat_;
      tickFormat_ = x;
      return axis;
    };
    axis.tickSize = function(x, y) {
      if (!arguments.length) return tickMajorSize;
      var n = arguments.length - 1;
      tickMajorSize = +x;
      tickMinorSize = n > 1 ? +y : tickMajorSize;
      tickEndSize = n > 0 ? +arguments[n] : tickMajorSize;
      return axis;
    };
    axis.tickPadding = function(x) {
      if (!arguments.length) return tickPadding;
      tickPadding = +x;
      return axis;
    };
    axis.tickSubdivide = function(x) {
      if (!arguments.length) return tickSubdivide;
      tickSubdivide = +x;
      return axis;
    };
    return axis;
  };
  var d3_svg_axisDefaultOrient = "bottom", d3_svg_axisOrients = {
    top: 1,
    right: 1,
    bottom: 1,
    left: 1
  };
  function d3_svg_axisX(selection, x) {
    selection.attr("transform", function(d) {
      return "translate(" + x(d) + ",0)";
    });
  }
  function d3_svg_axisY(selection, y) {
    selection.attr("transform", function(d) {
      return "translate(0," + y(d) + ")";
    });
  }
  function d3_svg_axisSubdivide(scale, ticks, m) {
    subticks = [];
    if (m && ticks.length > 1) {
      var extent = d3_scaleExtent(scale.domain()), subticks, i = -1, n = ticks.length, d = (ticks[1] - ticks[0]) / ++m, j, v;
      while (++i < n) {
        for (j = m; --j > 0; ) {
          if ((v = +ticks[i] - j * d) >= extent[0]) {
            subticks.push(v);
          }
        }
      }
      for (--i, j = 0; ++j < m && (v = +ticks[i] + j * d) < extent[1]; ) {
        subticks.push(v);
      }
    }
    return subticks;
  }
  d3.svg.brush = function() {
    var event = d3_eventDispatch(brush, "brushstart", "brush", "brushend"), x = null, y = null, resizes = d3_svg_brushResizes[0], extent = [ [ 0, 0 ], [ 0, 0 ] ], extentDomain;
    function brush(g) {
      g.each(function() {
        var g = d3.select(this), bg = g.selectAll(".background").data([ 0 ]), fg = g.selectAll(".extent").data([ 0 ]), tz = g.selectAll(".resize").data(resizes, String), e;
        g.style("pointer-events", "all").on("mousedown.brush", brushstart).on("touchstart.brush", brushstart);
        bg.enter().append("rect").attr("class", "background").style("visibility", "hidden").style("cursor", "crosshair");
        fg.enter().append("rect").attr("class", "extent").style("cursor", "move");
        tz.enter().append("g").attr("class", function(d) {
          return "resize " + d;
        }).style("cursor", function(d) {
          return d3_svg_brushCursor[d];
        }).append("rect").attr("x", function(d) {
          return /[ew]$/.test(d) ? -3 : null;
        }).attr("y", function(d) {
          return /^[ns]/.test(d) ? -3 : null;
        }).attr("width", 6).attr("height", 6).style("visibility", "hidden");
        tz.style("display", brush.empty() ? "none" : null);
        tz.exit().remove();
        if (x) {
          e = d3_scaleRange(x);
          bg.attr("x", e[0]).attr("width", e[1] - e[0]);
          redrawX(g);
        }
        if (y) {
          e = d3_scaleRange(y);
          bg.attr("y", e[0]).attr("height", e[1] - e[0]);
          redrawY(g);
        }
        redraw(g);
      });
    }
    function redraw(g) {
      g.selectAll(".resize").attr("transform", function(d) {
        return "translate(" + extent[+/e$/.test(d)][0] + "," + extent[+/^s/.test(d)][1] + ")";
      });
    }
    function redrawX(g) {
      g.select(".extent").attr("x", extent[0][0]);
      g.selectAll(".extent,.n>rect,.s>rect").attr("width", extent[1][0] - extent[0][0]);
    }
    function redrawY(g) {
      g.select(".extent").attr("y", extent[0][1]);
      g.selectAll(".extent,.e>rect,.w>rect").attr("height", extent[1][1] - extent[0][1]);
    }
    function brushstart() {
      var target = this, eventTarget = d3.select(d3.event.target), event_ = event.of(target, arguments), g = d3.select(target), resizing = eventTarget.datum(), resizingX = !/^(n|s)$/.test(resizing) && x, resizingY = !/^(e|w)$/.test(resizing) && y, dragging = eventTarget.classed("extent"), center, origin = mouse(), offset;
      var w = d3.select(d3_window).on("mousemove.brush", brushmove).on("mouseup.brush", brushend).on("touchmove.brush", brushmove).on("touchend.brush", brushend).on("keydown.brush", keydown).on("keyup.brush", keyup);
      if (dragging) {
        origin[0] = extent[0][0] - origin[0];
        origin[1] = extent[0][1] - origin[1];
      } else if (resizing) {
        var ex = +/w$/.test(resizing), ey = +/^n/.test(resizing);
        offset = [ extent[1 - ex][0] - origin[0], extent[1 - ey][1] - origin[1] ];
        origin[0] = extent[ex][0];
        origin[1] = extent[ey][1];
      } else if (d3.event.altKey) center = origin.slice();
      g.style("pointer-events", "none").selectAll(".resize").style("display", null);
      d3.select("body").style("cursor", eventTarget.style("cursor"));
      event_({
        type: "brushstart"
      });
      brushmove();
      d3_eventCancel();
      function mouse() {
        var touches = d3.event.changedTouches;
        return touches ? d3.touches(target, touches)[0] : d3.mouse(target);
      }
      function keydown() {
        if (d3.event.keyCode == 32) {
          if (!dragging) {
            center = null;
            origin[0] -= extent[1][0];
            origin[1] -= extent[1][1];
            dragging = 2;
          }
          d3_eventCancel();
        }
      }
      function keyup() {
        if (d3.event.keyCode == 32 && dragging == 2) {
          origin[0] += extent[1][0];
          origin[1] += extent[1][1];
          dragging = 0;
          d3_eventCancel();
        }
      }
      function brushmove() {
        var point = mouse(), moved = false;
        if (offset) {
          point[0] += offset[0];
          point[1] += offset[1];
        }
        if (!dragging) {
          if (d3.event.altKey) {
            if (!center) center = [ (extent[0][0] + extent[1][0]) / 2, (extent[0][1] + extent[1][1]) / 2 ];
            origin[0] = extent[+(point[0] < center[0])][0];
            origin[1] = extent[+(point[1] < center[1])][1];
          } else center = null;
        }
        if (resizingX && move1(point, x, 0)) {
          redrawX(g);
          moved = true;
        }
        if (resizingY && move1(point, y, 1)) {
          redrawY(g);
          moved = true;
        }
        if (moved) {
          redraw(g);
          event_({
            type: "brush",
            mode: dragging ? "move" : "resize"
          });
        }
      }
      function move1(point, scale, i) {
        var range = d3_scaleRange(scale), r0 = range[0], r1 = range[1], position = origin[i], size = extent[1][i] - extent[0][i], min, max;
        if (dragging) {
          r0 -= position;
          r1 -= size + position;
        }
        min = Math.max(r0, Math.min(r1, point[i]));
        if (dragging) {
          max = (min += position) + size;
        } else {
          if (center) position = Math.max(r0, Math.min(r1, 2 * center[i] - min));
          if (position < min) {
            max = min;
            min = position;
          } else {
            max = position;
          }
        }
        if (extent[0][i] !== min || extent[1][i] !== max) {
          extentDomain = null;
          extent[0][i] = min;
          extent[1][i] = max;
          return true;
        }
      }
      function brushend() {
        brushmove();
        g.style("pointer-events", "all").selectAll(".resize").style("display", brush.empty() ? "none" : null);
        d3.select("body").style("cursor", null);
        w.on("mousemove.brush", null).on("mouseup.brush", null).on("touchmove.brush", null).on("touchend.brush", null).on("keydown.brush", null).on("keyup.brush", null);
        event_({
          type: "brushend"
        });
        d3_eventCancel();
      }
    }
    brush.x = function(z) {
      if (!arguments.length) return x;
      x = z;
      resizes = d3_svg_brushResizes[!x << 1 | !y];
      return brush;
    };
    brush.y = function(z) {
      if (!arguments.length) return y;
      y = z;
      resizes = d3_svg_brushResizes[!x << 1 | !y];
      return brush;
    };
    brush.extent = function(z) {
      var x0, x1, y0, y1, t;
      if (!arguments.length) {
        z = extentDomain || extent;
        if (x) {
          x0 = z[0][0], x1 = z[1][0];
          if (!extentDomain) {
            x0 = extent[0][0], x1 = extent[1][0];
            if (x.invert) x0 = x.invert(x0), x1 = x.invert(x1);
            if (x1 < x0) t = x0, x0 = x1, x1 = t;
          }
        }
        if (y) {
          y0 = z[0][1], y1 = z[1][1];
          if (!extentDomain) {
            y0 = extent[0][1], y1 = extent[1][1];
            if (y.invert) y0 = y.invert(y0), y1 = y.invert(y1);
            if (y1 < y0) t = y0, y0 = y1, y1 = t;
          }
        }
        return x && y ? [ [ x0, y0 ], [ x1, y1 ] ] : x ? [ x0, x1 ] : y && [ y0, y1 ];
      }
      extentDomain = [ [ 0, 0 ], [ 0, 0 ] ];
      if (x) {
        x0 = z[0], x1 = z[1];
        if (y) x0 = x0[0], x1 = x1[0];
        extentDomain[0][0] = x0, extentDomain[1][0] = x1;
        if (x.invert) x0 = x(x0), x1 = x(x1);
        if (x1 < x0) t = x0, x0 = x1, x1 = t;
        extent[0][0] = x0 | 0, extent[1][0] = x1 | 0;
      }
      if (y) {
        y0 = z[0], y1 = z[1];
        if (x) y0 = y0[1], y1 = y1[1];
        extentDomain[0][1] = y0, extentDomain[1][1] = y1;
        if (y.invert) y0 = y(y0), y1 = y(y1);
        if (y1 < y0) t = y0, y0 = y1, y1 = t;
        extent[0][1] = y0 | 0, extent[1][1] = y1 | 0;
      }
      return brush;
    };
    brush.clear = function() {
      extentDomain = null;
      extent[0][0] = extent[0][1] = extent[1][0] = extent[1][1] = 0;
      return brush;
    };
    brush.empty = function() {
      return x && extent[0][0] === extent[1][0] || y && extent[0][1] === extent[1][1];
    };
    return d3.rebind(brush, event, "on");
  };
  var d3_svg_brushCursor = {
    n: "ns-resize",
    e: "ew-resize",
    s: "ns-resize",
    w: "ew-resize",
    nw: "nwse-resize",
    ne: "nesw-resize",
    se: "nwse-resize",
    sw: "nesw-resize"
  };
  var d3_svg_brushResizes = [ [ "n", "e", "s", "w", "nw", "ne", "se", "sw" ], [ "e", "w" ], [ "n", "s" ], [] ];
  d3.behavior = {};
  d3.behavior.drag = function() {
    var event = d3_eventDispatch(drag, "drag", "dragstart", "dragend"), origin = null;
    function drag() {
      this.on("mousedown.drag", mousedown).on("touchstart.drag", mousedown);
    }
    function mousedown() {
      var target = this, event_ = event.of(target, arguments), eventTarget = d3.event.target, touchId = d3.event.touches ? d3.event.changedTouches[0].identifier : null, offset, origin_ = point(), moved = 0;
      var w = d3.select(d3_window).on(touchId != null ? "touchmove.drag-" + touchId : "mousemove.drag", dragmove).on(touchId != null ? "touchend.drag-" + touchId : "mouseup.drag", dragend, true);
      if (origin) {
        offset = origin.apply(target, arguments);
        offset = [ offset.x - origin_[0], offset.y - origin_[1] ];
      } else {
        offset = [ 0, 0 ];
      }
      if (touchId == null) d3_eventCancel();
      event_({
        type: "dragstart"
      });
      function point() {
        var p = target.parentNode;
        return touchId != null ? d3.touches(p).filter(function(p) {
          return p.identifier === touchId;
        })[0] : d3.mouse(p);
      }
      function dragmove() {
        if (!target.parentNode) return dragend();
        var p = point(), dx = p[0] - origin_[0], dy = p[1] - origin_[1];
        moved |= dx | dy;
        origin_ = p;
        d3_eventCancel();
        event_({
          type: "drag",
          x: p[0] + offset[0],
          y: p[1] + offset[1],
          dx: dx,
          dy: dy
        });
      }
      function dragend() {
        event_({
          type: "dragend"
        });
        if (moved) {
          d3_eventCancel();
          if (d3.event.target === eventTarget) w.on("click.drag", click, true);
        }
        w.on(touchId != null ? "touchmove.drag-" + touchId : "mousemove.drag", null).on(touchId != null ? "touchend.drag-" + touchId : "mouseup.drag", null);
      }
      function click() {
        d3_eventCancel();
        w.on("click.drag", null);
      }
    }
    drag.origin = function(x) {
      if (!arguments.length) return origin;
      origin = x;
      return drag;
    };
    return d3.rebind(drag, event, "on");
  };
  d3.behavior.zoom = function() {
    var translate = [ 0, 0 ], translate0, scale = 1, scale0, scaleExtent = d3_behavior_zoomInfinity, event = d3_eventDispatch(zoom, "zoom"), x0, x1, y0, y1, touchtime;
    function zoom() {
      this.on("mousedown.zoom", mousedown).on("mousemove.zoom", mousemove).on(d3_behavior_zoomWheel + ".zoom", mousewheel).on("dblclick.zoom", dblclick).on("touchstart.zoom", touchstart).on("touchmove.zoom", touchmove).on("touchend.zoom", touchstart);
    }
    zoom.translate = function(x) {
      if (!arguments.length) return translate;
      translate = x.map(Number);
      rescale();
      return zoom;
    };
    zoom.scale = function(x) {
      if (!arguments.length) return scale;
      scale = +x;
      rescale();
      return zoom;
    };
    zoom.scaleExtent = function(x) {
      if (!arguments.length) return scaleExtent;
      scaleExtent = x == null ? d3_behavior_zoomInfinity : x.map(Number);
      return zoom;
    };
    zoom.x = function(z) {
      if (!arguments.length) return x1;
      x1 = z;
      x0 = z.copy();
      translate = [ 0, 0 ];
      scale = 1;
      return zoom;
    };
    zoom.y = function(z) {
      if (!arguments.length) return y1;
      y1 = z;
      y0 = z.copy();
      translate = [ 0, 0 ];
      scale = 1;
      return zoom;
    };
    function location(p) {
      return [ (p[0] - translate[0]) / scale, (p[1] - translate[1]) / scale ];
    }
    function point(l) {
      return [ l[0] * scale + translate[0], l[1] * scale + translate[1] ];
    }
    function scaleTo(s) {
      scale = Math.max(scaleExtent[0], Math.min(scaleExtent[1], s));
    }
    function translateTo(p, l) {
      l = point(l);
      translate[0] += p[0] - l[0];
      translate[1] += p[1] - l[1];
    }
    function rescale() {
      if (x1) x1.domain(x0.range().map(function(x) {
        return (x - translate[0]) / scale;
      }).map(x0.invert));
      if (y1) y1.domain(y0.range().map(function(y) {
        return (y - translate[1]) / scale;
      }).map(y0.invert));
    }
    function dispatch(event) {
      rescale();
      d3.event.preventDefault();
      event({
        type: "zoom",
        scale: scale,
        translate: translate
      });
    }
    function mousedown() {
      var target = this, event_ = event.of(target, arguments), eventTarget = d3.event.target, moved = 0, w = d3.select(d3_window).on("mousemove.zoom", mousemove).on("mouseup.zoom", mouseup), l = location(d3.mouse(target));
      d3_window.focus();
      d3_eventCancel();
      function mousemove() {
        moved = 1;
        translateTo(d3.mouse(target), l);
        dispatch(event_);
      }
      function mouseup() {
        if (moved) d3_eventCancel();
        w.on("mousemove.zoom", null).on("mouseup.zoom", null);
        if (moved && d3.event.target === eventTarget) w.on("click.zoom", click, true);
      }
      function click() {
        d3_eventCancel();
        w.on("click.zoom", null);
      }
    }
    function mousewheel() {
      if (!translate0) translate0 = location(d3.mouse(this));
      scaleTo(Math.pow(2, d3_behavior_zoomDelta() * .002) * scale);
      translateTo(d3.mouse(this), translate0);
      dispatch(event.of(this, arguments));
    }
    function mousemove() {
      translate0 = null;
    }
    function dblclick() {
      var p = d3.mouse(this), l = location(p), k = Math.log(scale) / Math.LN2;
      scaleTo(Math.pow(2, d3.event.shiftKey ? Math.ceil(k) - 1 : Math.floor(k) + 1));
      translateTo(p, l);
      dispatch(event.of(this, arguments));
    }
    function touchstart() {
      var touches = d3.touches(this), now = Date.now();
      scale0 = scale;
      translate0 = {};
      touches.forEach(function(t) {
        translate0[t.identifier] = location(t);
      });
      d3_eventCancel();
      if (touches.length === 1) {
        if (now - touchtime < 500) {
          var p = touches[0], l = location(touches[0]);
          scaleTo(scale * 2);
          translateTo(p, l);
          dispatch(event.of(this, arguments));
        }
        touchtime = now;
      }
    }
    function touchmove() {
      var touches = d3.touches(this), p0 = touches[0], l0 = translate0[p0.identifier];
      if (p1 = touches[1]) {
        var p1, l1 = translate0[p1.identifier];
        p0 = [ (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 ];
        l0 = [ (l0[0] + l1[0]) / 2, (l0[1] + l1[1]) / 2 ];
        scaleTo(d3.event.scale * scale0);
      }
      translateTo(p0, l0);
      touchtime = null;
      dispatch(event.of(this, arguments));
    }
    return d3.rebind(zoom, event, "on");
  };
  var d3_behavior_zoomInfinity = [ 0, Infinity ];
  var d3_behavior_zoomDelta, d3_behavior_zoomWheel = "onwheel" in document ? (d3_behavior_zoomDelta = function() {
    return -d3.event.deltaY * (d3.event.deltaMode ? 120 : 1);
  }, "wheel") : "onmousewheel" in document ? (d3_behavior_zoomDelta = function() {
    return d3.event.wheelDelta;
  }, "mousewheel") : (d3_behavior_zoomDelta = function() {
    return -d3.event.detail;
  }, "MozMousePixelScroll");
  d3.layout = {};
  d3.layout.bundle = function() {
    return function(links) {
      var paths = [], i = -1, n = links.length;
      while (++i < n) paths.push(d3_layout_bundlePath(links[i]));
      return paths;
    };
  };
  function d3_layout_bundlePath(link) {
    var start = link.source, end = link.target, lca = d3_layout_bundleLeastCommonAncestor(start, end), points = [ start ];
    while (start !== lca) {
      start = start.parent;
      points.push(start);
    }
    var k = points.length;
    while (end !== lca) {
      points.splice(k, 0, end);
      end = end.parent;
    }
    return points;
  }
  function d3_layout_bundleAncestors(node) {
    var ancestors = [], parent = node.parent;
    while (parent != null) {
      ancestors.push(node);
      node = parent;
      parent = parent.parent;
    }
    ancestors.push(node);
    return ancestors;
  }
  function d3_layout_bundleLeastCommonAncestor(a, b) {
    if (a === b) return a;
    var aNodes = d3_layout_bundleAncestors(a), bNodes = d3_layout_bundleAncestors(b), aNode = aNodes.pop(), bNode = bNodes.pop(), sharedNode = null;
    while (aNode === bNode) {
      sharedNode = aNode;
      aNode = aNodes.pop();
      bNode = bNodes.pop();
    }
    return sharedNode;
  }
  d3.layout.chord = function() {
    var chord = {}, chords, groups, matrix, n, padding = 0, sortGroups, sortSubgroups, sortChords;
    function relayout() {
      var subgroups = {}, groupSums = [], groupIndex = d3.range(n), subgroupIndex = [], k, x, x0, i, j;
      chords = [];
      groups = [];
      k = 0, i = -1;
      while (++i < n) {
        x = 0, j = -1;
        while (++j < n) {
          x += matrix[i][j];
        }
        groupSums.push(x);
        subgroupIndex.push(d3.range(n));
        k += x;
      }
      if (sortGroups) {
        groupIndex.sort(function(a, b) {
          return sortGroups(groupSums[a], groupSums[b]);
        });
      }
      if (sortSubgroups) {
        subgroupIndex.forEach(function(d, i) {
          d.sort(function(a, b) {
            return sortSubgroups(matrix[i][a], matrix[i][b]);
          });
        });
      }
      k = (2 * π - padding * n) / k;
      x = 0, i = -1;
      while (++i < n) {
        x0 = x, j = -1;
        while (++j < n) {
          var di = groupIndex[i], dj = subgroupIndex[di][j], v = matrix[di][dj], a0 = x, a1 = x += v * k;
          subgroups[di + "-" + dj] = {
            index: di,
            subindex: dj,
            startAngle: a0,
            endAngle: a1,
            value: v
          };
        }
        groups[di] = {
          index: di,
          startAngle: x0,
          endAngle: x,
          value: (x - x0) / k
        };
        x += padding;
      }
      i = -1;
      while (++i < n) {
        j = i - 1;
        while (++j < n) {
          var source = subgroups[i + "-" + j], target = subgroups[j + "-" + i];
          if (source.value || target.value) {
            chords.push(source.value < target.value ? {
              source: target,
              target: source
            } : {
              source: source,
              target: target
            });
          }
        }
      }
      if (sortChords) resort();
    }
    function resort() {
      chords.sort(function(a, b) {
        return sortChords((a.source.value + a.target.value) / 2, (b.source.value + b.target.value) / 2);
      });
    }
    chord.matrix = function(x) {
      if (!arguments.length) return matrix;
      n = (matrix = x) && matrix.length;
      chords = groups = null;
      return chord;
    };
    chord.padding = function(x) {
      if (!arguments.length) return padding;
      padding = x;
      chords = groups = null;
      return chord;
    };
    chord.sortGroups = function(x) {
      if (!arguments.length) return sortGroups;
      sortGroups = x;
      chords = groups = null;
      return chord;
    };
    chord.sortSubgroups = function(x) {
      if (!arguments.length) return sortSubgroups;
      sortSubgroups = x;
      chords = null;
      return chord;
    };
    chord.sortChords = function(x) {
      if (!arguments.length) return sortChords;
      sortChords = x;
      if (chords) resort();
      return chord;
    };
    chord.chords = function() {
      if (!chords) relayout();
      return chords;
    };
    chord.groups = function() {
      if (!groups) relayout();
      return groups;
    };
    return chord;
  };
  d3.layout.force = function() {
    var force = {}, event = d3.dispatch("start", "tick", "end"), size = [ 1, 1 ], drag, alpha, friction = .9, linkDistance = d3_layout_forceLinkDistance, linkStrength = d3_layout_forceLinkStrength, charge = -30, gravity = .1, theta = .8, nodes = [], links = [], distances, strengths, charges;
    function repulse(node) {
      return function(quad, x1, _, x2) {
        if (quad.point !== node) {
          var dx = quad.cx - node.x, dy = quad.cy - node.y, dn = 1 / Math.sqrt(dx * dx + dy * dy);
          if ((x2 - x1) * dn < theta) {
            var k = quad.charge * dn * dn;
            node.px -= dx * k;
            node.py -= dy * k;
            return true;
          }
          if (quad.point && isFinite(dn)) {
            var k = quad.pointCharge * dn * dn;
            node.px -= dx * k;
            node.py -= dy * k;
          }
        }
        return !quad.charge;
      };
    }
    force.tick = function() {
      if ((alpha *= .99) < .005) {
        event.end({
          type: "end",
          alpha: alpha = 0
        });
        return true;
      }
      var n = nodes.length, m = links.length, q, i, o, s, t, l, k, x, y;
      for (i = 0; i < m; ++i) {
        o = links[i];
        s = o.source;
        t = o.target;
        x = t.x - s.x;
        y = t.y - s.y;
        if (l = x * x + y * y) {
          l = alpha * strengths[i] * ((l = Math.sqrt(l)) - distances[i]) / l;
          x *= l;
          y *= l;
          t.x -= x * (k = s.weight / (t.weight + s.weight));
          t.y -= y * k;
          s.x += x * (k = 1 - k);
          s.y += y * k;
        }
      }
      if (k = alpha * gravity) {
        x = size[0] / 2;
        y = size[1] / 2;
        i = -1;
        if (k) while (++i < n) {
          o = nodes[i];
          o.x += (x - o.x) * k;
          o.y += (y - o.y) * k;
        }
      }
      if (charge) {
        d3_layout_forceAccumulate(q = d3.geom.quadtree(nodes), alpha, charges);
        i = -1;
        while (++i < n) {
          if (!(o = nodes[i]).fixed) {
            q.visit(repulse(o));
          }
        }
      }
      i = -1;
      while (++i < n) {
        o = nodes[i];
        if (o.fixed) {
          o.x = o.px;
          o.y = o.py;
        } else {
          o.x -= (o.px - (o.px = o.x)) * friction;
          o.y -= (o.py - (o.py = o.y)) * friction;
        }
      }
      event.tick({
        type: "tick",
        alpha: alpha
      });
    };
    force.nodes = function(x) {
      if (!arguments.length) return nodes;
      nodes = x;
      return force;
    };
    force.links = function(x) {
      if (!arguments.length) return links;
      links = x;
      return force;
    };
    force.size = function(x) {
      if (!arguments.length) return size;
      size = x;
      return force;
    };
    force.linkDistance = function(x) {
      if (!arguments.length) return linkDistance;
      linkDistance = typeof x === "function" ? x : +x;
      return force;
    };
    force.distance = force.linkDistance;
    force.linkStrength = function(x) {
      if (!arguments.length) return linkStrength;
      linkStrength = typeof x === "function" ? x : +x;
      return force;
    };
    force.friction = function(x) {
      if (!arguments.length) return friction;
      friction = +x;
      return force;
    };
    force.charge = function(x) {
      if (!arguments.length) return charge;
      charge = typeof x === "function" ? x : +x;
      return force;
    };
    force.gravity = function(x) {
      if (!arguments.length) return gravity;
      gravity = +x;
      return force;
    };
    force.theta = function(x) {
      if (!arguments.length) return theta;
      theta = +x;
      return force;
    };
    force.alpha = function(x) {
      if (!arguments.length) return alpha;
      x = +x;
      if (alpha) {
        if (x > 0) alpha = x; else alpha = 0;
      } else if (x > 0) {
        event.start({
          type: "start",
          alpha: alpha = x
        });
        d3.timer(force.tick);
      }
      return force;
    };
    force.start = function() {
      var i, j, n = nodes.length, m = links.length, w = size[0], h = size[1], neighbors, o;
      for (i = 0; i < n; ++i) {
        (o = nodes[i]).index = i;
        o.weight = 0;
      }
      for (i = 0; i < m; ++i) {
        o = links[i];
        if (typeof o.source == "number") o.source = nodes[o.source];
        if (typeof o.target == "number") o.target = nodes[o.target];
        ++o.source.weight;
        ++o.target.weight;
      }
      for (i = 0; i < n; ++i) {
        o = nodes[i];
        if (isNaN(o.x)) o.x = position("x", w);
        if (isNaN(o.y)) o.y = position("y", h);
        if (isNaN(o.px)) o.px = o.x;
        if (isNaN(o.py)) o.py = o.y;
      }
      distances = [];
      if (typeof linkDistance === "function") for (i = 0; i < m; ++i) distances[i] = +linkDistance.call(this, links[i], i); else for (i = 0; i < m; ++i) distances[i] = linkDistance;
      strengths = [];
      if (typeof linkStrength === "function") for (i = 0; i < m; ++i) strengths[i] = +linkStrength.call(this, links[i], i); else for (i = 0; i < m; ++i) strengths[i] = linkStrength;
      charges = [];
      if (typeof charge === "function") for (i = 0; i < n; ++i) charges[i] = +charge.call(this, nodes[i], i); else for (i = 0; i < n; ++i) charges[i] = charge;
      function position(dimension, size) {
        var neighbors = neighbor(i), j = -1, m = neighbors.length, x;
        while (++j < m) if (!isNaN(x = neighbors[j][dimension])) return x;
        return Math.random() * size;
      }
      function neighbor() {
        if (!neighbors) {
          neighbors = [];
          for (j = 0; j < n; ++j) {
            neighbors[j] = [];
          }
          for (j = 0; j < m; ++j) {
            var o = links[j];
            neighbors[o.source.index].push(o.target);
            neighbors[o.target.index].push(o.source);
          }
        }
        return neighbors[i];
      }
      return force.resume();
    };
    force.resume = function() {
      return force.alpha(.1);
    };
    force.stop = function() {
      return force.alpha(0);
    };
    force.drag = function() {
      if (!drag) drag = d3.behavior.drag().origin(d3_identity).on("dragstart.force", d3_layout_forceDragstart).on("drag.force", dragmove).on("dragend.force", d3_layout_forceDragend);
      if (!arguments.length) return drag;
      this.on("mouseover.force", d3_layout_forceMouseover).on("mouseout.force", d3_layout_forceMouseout).call(drag);
    };
    function dragmove(d) {
      d.px = d3.event.x, d.py = d3.event.y;
      force.resume();
    }
    return d3.rebind(force, event, "on");
  };
  function d3_layout_forceDragstart(d) {
    d.fixed |= 2;
  }
  function d3_layout_forceDragend(d) {
    d.fixed &= ~6;
  }
  function d3_layout_forceMouseover(d) {
    d.fixed |= 4;
    d.px = d.x, d.py = d.y;
  }
  function d3_layout_forceMouseout(d) {
    d.fixed &= ~4;
  }
  function d3_layout_forceAccumulate(quad, alpha, charges) {
    var cx = 0, cy = 0;
    quad.charge = 0;
    if (!quad.leaf) {
      var nodes = quad.nodes, n = nodes.length, i = -1, c;
      while (++i < n) {
        c = nodes[i];
        if (c == null) continue;
        d3_layout_forceAccumulate(c, alpha, charges);
        quad.charge += c.charge;
        cx += c.charge * c.cx;
        cy += c.charge * c.cy;
      }
    }
    if (quad.point) {
      if (!quad.leaf) {
        quad.point.x += Math.random() - .5;
        quad.point.y += Math.random() - .5;
      }
      var k = alpha * charges[quad.point.index];
      quad.charge += quad.pointCharge = k;
      cx += k * quad.point.x;
      cy += k * quad.point.y;
    }
    quad.cx = cx / quad.charge;
    quad.cy = cy / quad.charge;
  }
  var d3_layout_forceLinkDistance = 20, d3_layout_forceLinkStrength = 1;
  d3.layout.partition = function() {
    var hierarchy = d3.layout.hierarchy(), size = [ 1, 1 ];
    function position(node, x, dx, dy) {
      var children = node.children;
      node.x = x;
      node.y = node.depth * dy;
      node.dx = dx;
      node.dy = dy;
      if (children && (n = children.length)) {
        var i = -1, n, c, d;
        dx = node.value ? dx / node.value : 0;
        while (++i < n) {
          position(c = children[i], x, d = c.value * dx, dy);
          x += d;
        }
      }
    }
    function depth(node) {
      var children = node.children, d = 0;
      if (children && (n = children.length)) {
        var i = -1, n;
        while (++i < n) d = Math.max(d, depth(children[i]));
      }
      return 1 + d;
    }
    function partition(d, i) {
      var nodes = hierarchy.call(this, d, i);
      position(nodes[0], 0, size[0], size[1] / depth(nodes[0]));
      return nodes;
    }
    partition.size = function(x) {
      if (!arguments.length) return size;
      size = x;
      return partition;
    };
    return d3_layout_hierarchyRebind(partition, hierarchy);
  };
  d3.layout.pie = function() {
    var value = Number, sort = d3_layout_pieSortByValue, startAngle = 0, endAngle = 2 * π;
    function pie(data) {
      var values = data.map(function(d, i) {
        return +value.call(pie, d, i);
      });
      var a = +(typeof startAngle === "function" ? startAngle.apply(this, arguments) : startAngle);
      var k = ((typeof endAngle === "function" ? endAngle.apply(this, arguments) : endAngle) - startAngle) / d3.sum(values);
      var index = d3.range(data.length);
      if (sort != null) index.sort(sort === d3_layout_pieSortByValue ? function(i, j) {
        return values[j] - values[i];
      } : function(i, j) {
        return sort(data[i], data[j]);
      });
      var arcs = [];
      index.forEach(function(i) {
        var d;
        arcs[i] = {
          data: data[i],
          value: d = values[i],
          startAngle: a,
          endAngle: a += d * k
        };
      });
      return arcs;
    }
    pie.value = function(x) {
      if (!arguments.length) return value;
      value = x;
      return pie;
    };
    pie.sort = function(x) {
      if (!arguments.length) return sort;
      sort = x;
      return pie;
    };
    pie.startAngle = function(x) {
      if (!arguments.length) return startAngle;
      startAngle = x;
      return pie;
    };
    pie.endAngle = function(x) {
      if (!arguments.length) return endAngle;
      endAngle = x;
      return pie;
    };
    return pie;
  };
  var d3_layout_pieSortByValue = {};
  d3.layout.stack = function() {
    var values = d3_identity, order = d3_layout_stackOrderDefault, offset = d3_layout_stackOffsetZero, out = d3_layout_stackOut, x = d3_layout_stackX, y = d3_layout_stackY;
    function stack(data, index) {
      var series = data.map(function(d, i) {
        return values.call(stack, d, i);
      });
      var points = series.map(function(d) {
        return d.map(function(v, i) {
          return [ x.call(stack, v, i), y.call(stack, v, i) ];
        });
      });
      var orders = order.call(stack, points, index);
      series = d3.permute(series, orders);
      points = d3.permute(points, orders);
      var offsets = offset.call(stack, points, index);
      var n = series.length, m = series[0].length, i, j, o;
      for (j = 0; j < m; ++j) {
        out.call(stack, series[0][j], o = offsets[j], points[0][j][1]);
        for (i = 1; i < n; ++i) {
          out.call(stack, series[i][j], o += points[i - 1][j][1], points[i][j][1]);
        }
      }
      return data;
    }
    stack.values = function(x) {
      if (!arguments.length) return values;
      values = x;
      return stack;
    };
    stack.order = function(x) {
      if (!arguments.length) return order;
      order = typeof x === "function" ? x : d3_layout_stackOrders.get(x) || d3_layout_stackOrderDefault;
      return stack;
    };
    stack.offset = function(x) {
      if (!arguments.length) return offset;
      offset = typeof x === "function" ? x : d3_layout_stackOffsets.get(x) || d3_layout_stackOffsetZero;
      return stack;
    };
    stack.x = function(z) {
      if (!arguments.length) return x;
      x = z;
      return stack;
    };
    stack.y = function(z) {
      if (!arguments.length) return y;
      y = z;
      return stack;
    };
    stack.out = function(z) {
      if (!arguments.length) return out;
      out = z;
      return stack;
    };
    return stack;
  };
  function d3_layout_stackX(d) {
    return d.x;
  }
  function d3_layout_stackY(d) {
    return d.y;
  }
  function d3_layout_stackOut(d, y0, y) {
    d.y0 = y0;
    d.y = y;
  }
  var d3_layout_stackOrders = d3.map({
    "inside-out": function(data) {
      var n = data.length, i, j, max = data.map(d3_layout_stackMaxIndex), sums = data.map(d3_layout_stackReduceSum), index = d3.range(n).sort(function(a, b) {
        return max[a] - max[b];
      }), top = 0, bottom = 0, tops = [], bottoms = [];
      for (i = 0; i < n; ++i) {
        j = index[i];
        if (top < bottom) {
          top += sums[j];
          tops.push(j);
        } else {
          bottom += sums[j];
          bottoms.push(j);
        }
      }
      return bottoms.reverse().concat(tops);
    },
    reverse: function(data) {
      return d3.range(data.length).reverse();
    },
    "default": d3_layout_stackOrderDefault
  });
  var d3_layout_stackOffsets = d3.map({
    silhouette: function(data) {
      var n = data.length, m = data[0].length, sums = [], max = 0, i, j, o, y0 = [];
      for (j = 0; j < m; ++j) {
        for (i = 0, o = 0; i < n; i++) o += data[i][j][1];
        if (o > max) max = o;
        sums.push(o);
      }
      for (j = 0; j < m; ++j) {
        y0[j] = (max - sums[j]) / 2;
      }
      return y0;
    },
    wiggle: function(data) {
      var n = data.length, x = data[0], m = x.length, i, j, k, s1, s2, s3, dx, o, o0, y0 = [];
      y0[0] = o = o0 = 0;
      for (j = 1; j < m; ++j) {
        for (i = 0, s1 = 0; i < n; ++i) s1 += data[i][j][1];
        for (i = 0, s2 = 0, dx = x[j][0] - x[j - 1][0]; i < n; ++i) {
          for (k = 0, s3 = (data[i][j][1] - data[i][j - 1][1]) / (2 * dx); k < i; ++k) {
            s3 += (data[k][j][1] - data[k][j - 1][1]) / dx;
          }
          s2 += s3 * data[i][j][1];
        }
        y0[j] = o -= s1 ? s2 / s1 * dx : 0;
        if (o < o0) o0 = o;
      }
      for (j = 0; j < m; ++j) y0[j] -= o0;
      return y0;
    },
    expand: function(data) {
      var n = data.length, m = data[0].length, k = 1 / n, i, j, o, y0 = [];
      for (j = 0; j < m; ++j) {
        for (i = 0, o = 0; i < n; i++) o += data[i][j][1];
        if (o) for (i = 0; i < n; i++) data[i][j][1] /= o; else for (i = 0; i < n; i++) data[i][j][1] = k;
      }
      for (j = 0; j < m; ++j) y0[j] = 0;
      return y0;
    },
    zero: d3_layout_stackOffsetZero
  });
  function d3_layout_stackOrderDefault(data) {
    return d3.range(data.length);
  }
  function d3_layout_stackOffsetZero(data) {
    var j = -1, m = data[0].length, y0 = [];
    while (++j < m) y0[j] = 0;
    return y0;
  }
  function d3_layout_stackMaxIndex(array) {
    var i = 1, j = 0, v = array[0][1], k, n = array.length;
    for (;i < n; ++i) {
      if ((k = array[i][1]) > v) {
        j = i;
        v = k;
      }
    }
    return j;
  }
  function d3_layout_stackReduceSum(d) {
    return d.reduce(d3_layout_stackSum, 0);
  }
  function d3_layout_stackSum(p, d) {
    return p + d[1];
  }
  d3.layout.histogram = function() {
    var frequency = true, valuer = Number, ranger = d3_layout_histogramRange, binner = d3_layout_histogramBinSturges;
    function histogram(data, i) {
      var bins = [], values = data.map(valuer, this), range = ranger.call(this, values, i), thresholds = binner.call(this, range, values, i), bin, i = -1, n = values.length, m = thresholds.length - 1, k = frequency ? 1 : 1 / n, x;
      while (++i < m) {
        bin = bins[i] = [];
        bin.dx = thresholds[i + 1] - (bin.x = thresholds[i]);
        bin.y = 0;
      }
      if (m > 0) {
        i = -1;
        while (++i < n) {
          x = values[i];
          if (x >= range[0] && x <= range[1]) {
            bin = bins[d3.bisect(thresholds, x, 1, m) - 1];
            bin.y += k;
            bin.push(data[i]);
          }
        }
      }
      return bins;
    }
    histogram.value = function(x) {
      if (!arguments.length) return valuer;
      valuer = x;
      return histogram;
    };
    histogram.range = function(x) {
      if (!arguments.length) return ranger;
      ranger = d3_functor(x);
      return histogram;
    };
    histogram.bins = function(x) {
      if (!arguments.length) return binner;
      binner = typeof x === "number" ? function(range) {
        return d3_layout_histogramBinFixed(range, x);
      } : d3_functor(x);
      return histogram;
    };
    histogram.frequency = function(x) {
      if (!arguments.length) return frequency;
      frequency = !!x;
      return histogram;
    };
    return histogram;
  };
  function d3_layout_histogramBinSturges(range, values) {
    return d3_layout_histogramBinFixed(range, Math.ceil(Math.log(values.length) / Math.LN2 + 1));
  }
  function d3_layout_histogramBinFixed(range, n) {
    var x = -1, b = +range[0], m = (range[1] - b) / n, f = [];
    while (++x <= n) f[x] = m * x + b;
    return f;
  }
  function d3_layout_histogramRange(values) {
    return [ d3.min(values), d3.max(values) ];
  }
  d3.layout.hierarchy = function() {
    var sort = d3_layout_hierarchySort, children = d3_layout_hierarchyChildren, value = d3_layout_hierarchyValue;
    function recurse(node, depth, nodes) {
      var childs = children.call(hierarchy, node, depth);
      node.depth = depth;
      nodes.push(node);
      if (childs && (n = childs.length)) {
        var i = -1, n, c = node.children = [], v = 0, j = depth + 1, d;
        while (++i < n) {
          d = recurse(childs[i], j, nodes);
          d.parent = node;
          c.push(d);
          v += d.value;
        }
        if (sort) c.sort(sort);
        if (value) node.value = v;
      } else if (value) {
        node.value = +value.call(hierarchy, node, depth) || 0;
      }
      return node;
    }
    function revalue(node, depth) {
      var children = node.children, v = 0;
      if (children && (n = children.length)) {
        var i = -1, n, j = depth + 1;
        while (++i < n) v += revalue(children[i], j);
      } else if (value) {
        v = +value.call(hierarchy, node, depth) || 0;
      }
      if (value) node.value = v;
      return v;
    }
    function hierarchy(d) {
      var nodes = [];
      recurse(d, 0, nodes);
      return nodes;
    }
    hierarchy.sort = function(x) {
      if (!arguments.length) return sort;
      sort = x;
      return hierarchy;
    };
    hierarchy.children = function(x) {
      if (!arguments.length) return children;
      children = x;
      return hierarchy;
    };
    hierarchy.value = function(x) {
      if (!arguments.length) return value;
      value = x;
      return hierarchy;
    };
    hierarchy.revalue = function(root) {
      revalue(root, 0);
      return root;
    };
    return hierarchy;
  };
  function d3_layout_hierarchyRebind(object, hierarchy) {
    d3.rebind(object, hierarchy, "sort", "children", "value");
    object.nodes = object;
    object.links = d3_layout_hierarchyLinks;
    return object;
  }
  function d3_layout_hierarchyChildren(d) {
    return d.children;
  }
  function d3_layout_hierarchyValue(d) {
    return d.value;
  }
  function d3_layout_hierarchySort(a, b) {
    return b.value - a.value;
  }
  function d3_layout_hierarchyLinks(nodes) {
    return d3.merge(nodes.map(function(parent) {
      return (parent.children || []).map(function(child) {
        return {
          source: parent,
          target: child
        };
      });
    }));
  }
  d3.layout.pack = function() {
    var hierarchy = d3.layout.hierarchy().sort(d3_layout_packSort), padding = 0, size = [ 1, 1 ];
    function pack(d, i) {
      var nodes = hierarchy.call(this, d, i), root = nodes[0];
      root.x = 0;
      root.y = 0;
      d3_layout_treeVisitAfter(root, function(d) {
        d.r = Math.sqrt(d.value);
      });
      d3_layout_treeVisitAfter(root, d3_layout_packSiblings);
      var w = size[0], h = size[1], k = Math.max(2 * root.r / w, 2 * root.r / h);
      if (padding > 0) {
        var dr = padding * k / 2;
        d3_layout_treeVisitAfter(root, function(d) {
          d.r += dr;
        });
        d3_layout_treeVisitAfter(root, d3_layout_packSiblings);
        d3_layout_treeVisitAfter(root, function(d) {
          d.r -= dr;
        });
        k = Math.max(2 * root.r / w, 2 * root.r / h);
      }
      d3_layout_packTransform(root, w / 2, h / 2, 1 / k);
      return nodes;
    }
    pack.size = function(x) {
      if (!arguments.length) return size;
      size = x;
      return pack;
    };
    pack.padding = function(_) {
      if (!arguments.length) return padding;
      padding = +_;
      return pack;
    };
    return d3_layout_hierarchyRebind(pack, hierarchy);
  };
  function d3_layout_packSort(a, b) {
    return a.value - b.value;
  }
  function d3_layout_packInsert(a, b) {
    var c = a._pack_next;
    a._pack_next = b;
    b._pack_prev = a;
    b._pack_next = c;
    c._pack_prev = b;
  }
  function d3_layout_packSplice(a, b) {
    a._pack_next = b;
    b._pack_prev = a;
  }
  function d3_layout_packIntersects(a, b) {
    var dx = b.x - a.x, dy = b.y - a.y, dr = a.r + b.r;
    return dr * dr - dx * dx - dy * dy > .001;
  }
  function d3_layout_packSiblings(node) {
    if (!(nodes = node.children) || !(n = nodes.length)) return;
    var nodes, xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity, a, b, c, i, j, k, n;
    function bound(node) {
      xMin = Math.min(node.x - node.r, xMin);
      xMax = Math.max(node.x + node.r, xMax);
      yMin = Math.min(node.y - node.r, yMin);
      yMax = Math.max(node.y + node.r, yMax);
    }
    nodes.forEach(d3_layout_packLink);
    a = nodes[0];
    a.x = -a.r;
    a.y = 0;
    bound(a);
    if (n > 1) {
      b = nodes[1];
      b.x = b.r;
      b.y = 0;
      bound(b);
      if (n > 2) {
        c = nodes[2];
        d3_layout_packPlace(a, b, c);
        bound(c);
        d3_layout_packInsert(a, c);
        a._pack_prev = c;
        d3_layout_packInsert(c, b);
        b = a._pack_next;
        for (i = 3; i < n; i++) {
          d3_layout_packPlace(a, b, c = nodes[i]);
          var isect = 0, s1 = 1, s2 = 1;
          for (j = b._pack_next; j !== b; j = j._pack_next, s1++) {
            if (d3_layout_packIntersects(j, c)) {
              isect = 1;
              break;
            }
          }
          if (isect == 1) {
            for (k = a._pack_prev; k !== j._pack_prev; k = k._pack_prev, s2++) {
              if (d3_layout_packIntersects(k, c)) {
                break;
              }
            }
          }
          if (isect) {
            if (s1 < s2 || s1 == s2 && b.r < a.r) d3_layout_packSplice(a, b = j); else d3_layout_packSplice(a = k, b);
            i--;
          } else {
            d3_layout_packInsert(a, c);
            b = c;
            bound(c);
          }
        }
      }
    }
    var cx = (xMin + xMax) / 2, cy = (yMin + yMax) / 2, cr = 0;
    for (i = 0; i < n; i++) {
      c = nodes[i];
      c.x -= cx;
      c.y -= cy;
      cr = Math.max(cr, c.r + Math.sqrt(c.x * c.x + c.y * c.y));
    }
    node.r = cr;
    nodes.forEach(d3_layout_packUnlink);
  }
  function d3_layout_packLink(node) {
    node._pack_next = node._pack_prev = node;
  }
  function d3_layout_packUnlink(node) {
    delete node._pack_next;
    delete node._pack_prev;
  }
  function d3_layout_packTransform(node, x, y, k) {
    var children = node.children;
    node.x = x += k * node.x;
    node.y = y += k * node.y;
    node.r *= k;
    if (children) {
      var i = -1, n = children.length;
      while (++i < n) d3_layout_packTransform(children[i], x, y, k);
    }
  }
  function d3_layout_packPlace(a, b, c) {
    var db = a.r + c.r, dx = b.x - a.x, dy = b.y - a.y;
    if (db && (dx || dy)) {
      var da = b.r + c.r, dc = dx * dx + dy * dy;
      da *= da;
      db *= db;
      var x = .5 + (db - da) / (2 * dc), y = Math.sqrt(Math.max(0, 2 * da * (db + dc) - (db -= dc) * db - da * da)) / (2 * dc);
      c.x = a.x + x * dx + y * dy;
      c.y = a.y + x * dy - y * dx;
    } else {
      c.x = a.x + db;
      c.y = a.y;
    }
  }
  d3.layout.cluster = function() {
    var hierarchy = d3.layout.hierarchy().sort(null).value(null), separation = d3_layout_treeSeparation, size = [ 1, 1 ];
    function cluster(d, i) {
      var nodes = hierarchy.call(this, d, i), root = nodes[0], previousNode, x = 0;
      d3_layout_treeVisitAfter(root, function(node) {
        var children = node.children;
        if (children && children.length) {
          node.x = d3_layout_clusterX(children);
          node.y = d3_layout_clusterY(children);
        } else {
          node.x = previousNode ? x += separation(node, previousNode) : 0;
          node.y = 0;
          previousNode = node;
        }
      });
      var left = d3_layout_clusterLeft(root), right = d3_layout_clusterRight(root), x0 = left.x - separation(left, right) / 2, x1 = right.x + separation(right, left) / 2;
      d3_layout_treeVisitAfter(root, function(node) {
        node.x = (node.x - x0) / (x1 - x0) * size[0];
        node.y = (1 - (root.y ? node.y / root.y : 1)) * size[1];
      });
      return nodes;
    }
    cluster.separation = function(x) {
      if (!arguments.length) return separation;
      separation = x;
      return cluster;
    };
    cluster.size = function(x) {
      if (!arguments.length) return size;
      size = x;
      return cluster;
    };
    return d3_layout_hierarchyRebind(cluster, hierarchy);
  };
  function d3_layout_clusterY(children) {
    return 1 + d3.max(children, function(child) {
      return child.y;
    });
  }
  function d3_layout_clusterX(children) {
    return children.reduce(function(x, child) {
      return x + child.x;
    }, 0) / children.length;
  }
  function d3_layout_clusterLeft(node) {
    var children = node.children;
    return children && children.length ? d3_layout_clusterLeft(children[0]) : node;
  }
  function d3_layout_clusterRight(node) {
    var children = node.children, n;
    return children && (n = children.length) ? d3_layout_clusterRight(children[n - 1]) : node;
  }
  d3.layout.tree = function() {
    var hierarchy = d3.layout.hierarchy().sort(null).value(null), separation = d3_layout_treeSeparation, size = [ 1, 1 ];
    function tree(d, i) {
      var nodes = hierarchy.call(this, d, i), root = nodes[0];
      function firstWalk(node, previousSibling) {
        var children = node.children, layout = node._tree;
        if (children && (n = children.length)) {
          var n, firstChild = children[0], previousChild, ancestor = firstChild, child, i = -1;
          while (++i < n) {
            child = children[i];
            firstWalk(child, previousChild);
            ancestor = apportion(child, previousChild, ancestor);
            previousChild = child;
          }
          d3_layout_treeShift(node);
          var midpoint = .5 * (firstChild._tree.prelim + child._tree.prelim);
          if (previousSibling) {
            layout.prelim = previousSibling._tree.prelim + separation(node, previousSibling);
            layout.mod = layout.prelim - midpoint;
          } else {
            layout.prelim = midpoint;
          }
        } else {
          if (previousSibling) {
            layout.prelim = previousSibling._tree.prelim + separation(node, previousSibling);
          }
        }
      }
      function secondWalk(node, x) {
        node.x = node._tree.prelim + x;
        var children = node.children;
        if (children && (n = children.length)) {
          var i = -1, n;
          x += node._tree.mod;
          while (++i < n) {
            secondWalk(children[i], x);
          }
        }
      }
      function apportion(node, previousSibling, ancestor) {
        if (previousSibling) {
          var vip = node, vop = node, vim = previousSibling, vom = node.parent.children[0], sip = vip._tree.mod, sop = vop._tree.mod, sim = vim._tree.mod, som = vom._tree.mod, shift;
          while (vim = d3_layout_treeRight(vim), vip = d3_layout_treeLeft(vip), vim && vip) {
            vom = d3_layout_treeLeft(vom);
            vop = d3_layout_treeRight(vop);
            vop._tree.ancestor = node;
            shift = vim._tree.prelim + sim - vip._tree.prelim - sip + separation(vim, vip);
            if (shift > 0) {
              d3_layout_treeMove(d3_layout_treeAncestor(vim, node, ancestor), node, shift);
              sip += shift;
              sop += shift;
            }
            sim += vim._tree.mod;
            sip += vip._tree.mod;
            som += vom._tree.mod;
            sop += vop._tree.mod;
          }
          if (vim && !d3_layout_treeRight(vop)) {
            vop._tree.thread = vim;
            vop._tree.mod += sim - sop;
          }
          if (vip && !d3_layout_treeLeft(vom)) {
            vom._tree.thread = vip;
            vom._tree.mod += sip - som;
            ancestor = node;
          }
        }
        return ancestor;
      }
      d3_layout_treeVisitAfter(root, function(node, previousSibling) {
        node._tree = {
          ancestor: node,
          prelim: 0,
          mod: 0,
          change: 0,
          shift: 0,
          number: previousSibling ? previousSibling._tree.number + 1 : 0
        };
      });
      firstWalk(root);
      secondWalk(root, -root._tree.prelim);
      var left = d3_layout_treeSearch(root, d3_layout_treeLeftmost), right = d3_layout_treeSearch(root, d3_layout_treeRightmost), deep = d3_layout_treeSearch(root, d3_layout_treeDeepest), x0 = left.x - separation(left, right) / 2, x1 = right.x + separation(right, left) / 2, y1 = deep.depth || 1;
      d3_layout_treeVisitAfter(root, function(node) {
        node.x = (node.x - x0) / (x1 - x0) * size[0];
        node.y = node.depth / y1 * size[1];
        delete node._tree;
      });
      return nodes;
    }
    tree.separation = function(x) {
      if (!arguments.length) return separation;
      separation = x;
      return tree;
    };
    tree.size = function(x) {
      if (!arguments.length) return size;
      size = x;
      return tree;
    };
    return d3_layout_hierarchyRebind(tree, hierarchy);
  };
  function d3_layout_treeSeparation(a, b) {
    return a.parent == b.parent ? 1 : 2;
  }
  function d3_layout_treeLeft(node) {
    var children = node.children;
    return children && children.length ? children[0] : node._tree.thread;
  }
  function d3_layout_treeRight(node) {
    var children = node.children, n;
    return children && (n = children.length) ? children[n - 1] : node._tree.thread;
  }
  function d3_layout_treeSearch(node, compare) {
    var children = node.children;
    if (children && (n = children.length)) {
      var child, n, i = -1;
      while (++i < n) {
        if (compare(child = d3_layout_treeSearch(children[i], compare), node) > 0) {
          node = child;
        }
      }
    }
    return node;
  }
  function d3_layout_treeRightmost(a, b) {
    return a.x - b.x;
  }
  function d3_layout_treeLeftmost(a, b) {
    return b.x - a.x;
  }
  function d3_layout_treeDeepest(a, b) {
    return a.depth - b.depth;
  }
  function d3_layout_treeVisitAfter(node, callback) {
    function visit(node, previousSibling) {
      var children = node.children;
      if (children && (n = children.length)) {
        var child, previousChild = null, i = -1, n;
        while (++i < n) {
          child = children[i];
          visit(child, previousChild);
          previousChild = child;
        }
      }
      callback(node, previousSibling);
    }
    visit(node, null);
  }
  function d3_layout_treeShift(node) {
    var shift = 0, change = 0, children = node.children, i = children.length, child;
    while (--i >= 0) {
      child = children[i]._tree;
      child.prelim += shift;
      child.mod += shift;
      shift += child.shift + (change += child.change);
    }
  }
  function d3_layout_treeMove(ancestor, node, shift) {
    ancestor = ancestor._tree;
    node = node._tree;
    var change = shift / (node.number - ancestor.number);
    ancestor.change += change;
    node.change -= change;
    node.shift += shift;
    node.prelim += shift;
    node.mod += shift;
  }
  function d3_layout_treeAncestor(vim, node, ancestor) {
    return vim._tree.ancestor.parent == node.parent ? vim._tree.ancestor : ancestor;
  }
  d3.layout.treemap = function() {
    var hierarchy = d3.layout.hierarchy(), round = Math.round, size = [ 1, 1 ], padding = null, pad = d3_layout_treemapPadNull, sticky = false, stickies, mode = "squarify", ratio = .5 * (1 + Math.sqrt(5));
    function scale(children, k) {
      var i = -1, n = children.length, child, area;
      while (++i < n) {
        area = (child = children[i]).value * (k < 0 ? 0 : k);
        child.area = isNaN(area) || area <= 0 ? 0 : area;
      }
    }
    function squarify(node) {
      var children = node.children;
      if (children && children.length) {
        var rect = pad(node), row = [], remaining = children.slice(), child, best = Infinity, score, u = mode === "slice" ? rect.dx : mode === "dice" ? rect.dy : mode === "slice-dice" ? node.depth & 1 ? rect.dy : rect.dx : Math.min(rect.dx, rect.dy), n;
        scale(remaining, rect.dx * rect.dy / node.value);
        row.area = 0;
        while ((n = remaining.length) > 0) {
          row.push(child = remaining[n - 1]);
          row.area += child.area;
          if (mode !== "squarify" || (score = worst(row, u)) <= best) {
            remaining.pop();
            best = score;
          } else {
            row.area -= row.pop().area;
            position(row, u, rect, false);
            u = Math.min(rect.dx, rect.dy);
            row.length = row.area = 0;
            best = Infinity;
          }
        }
        if (row.length) {
          position(row, u, rect, true);
          row.length = row.area = 0;
        }
        children.forEach(squarify);
      }
    }
    function stickify(node) {
      var children = node.children;
      if (children && children.length) {
        var rect = pad(node), remaining = children.slice(), child, row = [];
        scale(remaining, rect.dx * rect.dy / node.value);
        row.area = 0;
        while (child = remaining.pop()) {
          row.push(child);
          row.area += child.area;
          if (child.z != null) {
            position(row, child.z ? rect.dx : rect.dy, rect, !remaining.length);
            row.length = row.area = 0;
          }
        }
        children.forEach(stickify);
      }
    }
    function worst(row, u) {
      var s = row.area, r, rmax = 0, rmin = Infinity, i = -1, n = row.length;
      while (++i < n) {
        if (!(r = row[i].area)) continue;
        if (r < rmin) rmin = r;
        if (r > rmax) rmax = r;
      }
      s *= s;
      u *= u;
      return s ? Math.max(u * rmax * ratio / s, s / (u * rmin * ratio)) : Infinity;
    }
    function position(row, u, rect, flush) {
      var i = -1, n = row.length, x = rect.x, y = rect.y, v = u ? round(row.area / u) : 0, o;
      if (u == rect.dx) {
        if (flush || v > rect.dy) v = rect.dy;
        while (++i < n) {
          o = row[i];
          o.x = x;
          o.y = y;
          o.dy = v;
          x += o.dx = Math.min(rect.x + rect.dx - x, v ? round(o.area / v) : 0);
        }
        o.z = true;
        o.dx += rect.x + rect.dx - x;
        rect.y += v;
        rect.dy -= v;
      } else {
        if (flush || v > rect.dx) v = rect.dx;
        while (++i < n) {
          o = row[i];
          o.x = x;
          o.y = y;
          o.dx = v;
          y += o.dy = Math.min(rect.y + rect.dy - y, v ? round(o.area / v) : 0);
        }
        o.z = false;
        o.dy += rect.y + rect.dy - y;
        rect.x += v;
        rect.dx -= v;
      }
    }
    function treemap(d) {
      var nodes = stickies || hierarchy(d), root = nodes[0];
      root.x = 0;
      root.y = 0;
      root.dx = size[0];
      root.dy = size[1];
      if (stickies) hierarchy.revalue(root);
      scale([ root ], root.dx * root.dy / root.value);
      (stickies ? stickify : squarify)(root);
      if (sticky) stickies = nodes;
      return nodes;
    }
    treemap.size = function(x) {
      if (!arguments.length) return size;
      size = x;
      return treemap;
    };
    treemap.padding = function(x) {
      if (!arguments.length) return padding;
      function padFunction(node) {
        var p = x.call(treemap, node, node.depth);
        return p == null ? d3_layout_treemapPadNull(node) : d3_layout_treemapPad(node, typeof p === "number" ? [ p, p, p, p ] : p);
      }
      function padConstant(node) {
        return d3_layout_treemapPad(node, x);
      }
      var type;
      pad = (padding = x) == null ? d3_layout_treemapPadNull : (type = typeof x) === "function" ? padFunction : type === "number" ? (x = [ x, x, x, x ], 
      padConstant) : padConstant;
      return treemap;
    };
    treemap.round = function(x) {
      if (!arguments.length) return round != Number;
      round = x ? Math.round : Number;
      return treemap;
    };
    treemap.sticky = function(x) {
      if (!arguments.length) return sticky;
      sticky = x;
      stickies = null;
      return treemap;
    };
    treemap.ratio = function(x) {
      if (!arguments.length) return ratio;
      ratio = x;
      return treemap;
    };
    treemap.mode = function(x) {
      if (!arguments.length) return mode;
      mode = x + "";
      return treemap;
    };
    return d3_layout_hierarchyRebind(treemap, hierarchy);
  };
  function d3_layout_treemapPadNull(node) {
    return {
      x: node.x,
      y: node.y,
      dx: node.dx,
      dy: node.dy
    };
  }
  function d3_layout_treemapPad(node, padding) {
    var x = node.x + padding[3], y = node.y + padding[0], dx = node.dx - padding[1] - padding[3], dy = node.dy - padding[0] - padding[2];
    if (dx < 0) {
      x += dx / 2;
      dx = 0;
    }
    if (dy < 0) {
      y += dy / 2;
      dy = 0;
    }
    return {
      x: x,
      y: y,
      dx: dx,
      dy: dy
    };
  }
  function d3_dsv(delimiter, mimeType) {
    var reFormat = new RegExp('["' + delimiter + "\n]"), delimiterCode = delimiter.charCodeAt(0);
    function dsv(url, callback) {
      return d3.xhr(url, mimeType, callback).response(response);
    }
    function response(request) {
      return dsv.parse(request.responseText);
    }
    dsv.parse = function(text) {
      var o;
      return dsv.parseRows(text, function(row) {
        if (o) return o(row);
        o = new Function("d", "return {" + row.map(function(name, i) {
          return JSON.stringify(name) + ": d[" + i + "]";
        }).join(",") + "}");
      });
    };
    dsv.parseRows = function(text, f) {
      var EOL = {}, EOF = {}, rows = [], N = text.length, I = 0, n = 0, t, eol;
      function token() {
        if (I >= N) return EOF;
        if (eol) return eol = false, EOL;
        var j = I;
        if (text.charCodeAt(j) === 34) {
          var i = j;
          while (i++ < N) {
            if (text.charCodeAt(i) === 34) {
              if (text.charCodeAt(i + 1) !== 34) break;
              ++i;
            }
          }
          I = i + 2;
          var c = text.charCodeAt(i + 1);
          if (c === 13) {
            eol = true;
            if (text.charCodeAt(i + 2) === 10) ++I;
          } else if (c === 10) {
            eol = true;
          }
          return text.substring(j + 1, i).replace(/""/g, '"');
        }
        while (I < N) {
          var c = text.charCodeAt(I++), k = 1;
          if (c === 10) eol = true; else if (c === 13) {
            eol = true;
            if (text.charCodeAt(I) === 10) ++I, ++k;
          } else if (c !== delimiterCode) continue;
          return text.substring(j, I - k);
        }
        return text.substring(j);
      }
      while ((t = token()) !== EOF) {
        var a = [];
        while (t !== EOL && t !== EOF) {
          a.push(t);
          t = token();
        }
        if (f && !(a = f(a, n++))) continue;
        rows.push(a);
      }
      return rows;
    };
    dsv.format = function(rows) {
      return rows.map(formatRow).join("\n");
    };
    function formatRow(row) {
      return row.map(formatValue).join(delimiter);
    }
    function formatValue(text) {
      return reFormat.test(text) ? '"' + text.replace(/\"/g, '""') + '"' : text;
    }
    return dsv;
  }
  d3.csv = d3_dsv(",", "text/csv");
  d3.tsv = d3_dsv("	", "text/tab-separated-values");
  d3.geo = {};
  d3.geo.stream = function(object, listener) {
    if (d3_geo_streamObjectType.hasOwnProperty(object.type)) {
      d3_geo_streamObjectType[object.type](object, listener);
    } else {
      d3_geo_streamGeometry(object, listener);
    }
  };
  function d3_geo_streamGeometry(geometry, listener) {
    if (d3_geo_streamGeometryType.hasOwnProperty(geometry.type)) {
      d3_geo_streamGeometryType[geometry.type](geometry, listener);
    }
  }
  var d3_geo_streamObjectType = {
    Feature: function(feature, listener) {
      d3_geo_streamGeometry(feature.geometry, listener);
    },
    FeatureCollection: function(object, listener) {
      var features = object.features, i = -1, n = features.length;
      while (++i < n) d3_geo_streamGeometry(features[i].geometry, listener);
    }
  };
  var d3_geo_streamGeometryType = {
    Sphere: function(object, listener) {
      listener.sphere();
    },
    Point: function(object, listener) {
      var coordinate = object.coordinates;
      listener.point(coordinate[0], coordinate[1]);
    },
    MultiPoint: function(object, listener) {
      var coordinates = object.coordinates, i = -1, n = coordinates.length, coordinate;
      while (++i < n) coordinate = coordinates[i], listener.point(coordinate[0], coordinate[1]);
    },
    LineString: function(object, listener) {
      d3_geo_streamLine(object.coordinates, listener, 0);
    },
    MultiLineString: function(object, listener) {
      var coordinates = object.coordinates, i = -1, n = coordinates.length;
      while (++i < n) d3_geo_streamLine(coordinates[i], listener, 0);
    },
    Polygon: function(object, listener) {
      d3_geo_streamPolygon(object.coordinates, listener);
    },
    MultiPolygon: function(object, listener) {
      var coordinates = object.coordinates, i = -1, n = coordinates.length;
      while (++i < n) d3_geo_streamPolygon(coordinates[i], listener);
    },
    GeometryCollection: function(object, listener) {
      var geometries = object.geometries, i = -1, n = geometries.length;
      while (++i < n) d3_geo_streamGeometry(geometries[i], listener);
    }
  };
  function d3_geo_streamLine(coordinates, listener, closed) {
    var i = -1, n = coordinates.length - closed, coordinate;
    listener.lineStart();
    while (++i < n) coordinate = coordinates[i], listener.point(coordinate[0], coordinate[1]);
    listener.lineEnd();
  }
  function d3_geo_streamPolygon(coordinates, listener) {
    var i = -1, n = coordinates.length;
    listener.polygonStart();
    while (++i < n) d3_geo_streamLine(coordinates[i], listener, 1);
    listener.polygonEnd();
  }
  function d3_geo_spherical(cartesian) {
    return [ Math.atan2(cartesian[1], cartesian[0]), Math.asin(Math.max(-1, Math.min(1, cartesian[2]))) ];
  }
  function d3_geo_sphericalEqual(a, b) {
    return Math.abs(a[0] - b[0]) < ε && Math.abs(a[1] - b[1]) < ε;
  }
  function d3_geo_cartesian(spherical) {
    var λ = spherical[0], φ = spherical[1], cosφ = Math.cos(φ);
    return [ cosφ * Math.cos(λ), cosφ * Math.sin(λ), Math.sin(φ) ];
  }
  function d3_geo_cartesianDot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
  function d3_geo_cartesianCross(a, b) {
    return [ a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0] ];
  }
  function d3_geo_cartesianAdd(a, b) {
    a[0] += b[0];
    a[1] += b[1];
    a[2] += b[2];
  }
  function d3_geo_cartesianScale(vector, k) {
    return [ vector[0] * k, vector[1] * k, vector[2] * k ];
  }
  function d3_geo_cartesianNormalize(d) {
    var l = Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);
    d[0] /= l;
    d[1] /= l;
    d[2] /= l;
  }
  function d3_geo_resample(project) {
    var δ2 = .5, maxDepth = 16;
    function resample(stream) {
      var λ0, x0, y0, a0, b0, c0;
      var resample = {
        point: point,
        lineStart: lineStart,
        lineEnd: lineEnd,
        polygonStart: function() {
          stream.polygonStart();
          resample.lineStart = polygonLineStart;
        },
        polygonEnd: function() {
          stream.polygonEnd();
          resample.lineStart = lineStart;
        }
      };
      function point(x, y) {
        x = project(x, y);
        stream.point(x[0], x[1]);
      }
      function lineStart() {
        x0 = NaN;
        resample.point = linePoint;
        stream.lineStart();
      }
      function linePoint(λ, φ) {
        var c = d3_geo_cartesian([ λ, φ ]), p = project(λ, φ);
        resampleLineTo(x0, y0, λ0, a0, b0, c0, x0 = p[0], y0 = p[1], λ0 = λ, a0 = c[0], b0 = c[1], c0 = c[2], maxDepth, stream);
        stream.point(x0, y0);
      }
      function lineEnd() {
        resample.point = point;
        stream.lineEnd();
      }
      function polygonLineStart() {
        var λ00, φ00, x00, y00, a00, b00, c00;
        lineStart();
        resample.point = function(λ, φ) {
          linePoint(λ00 = λ, φ00 = φ), x00 = x0, y00 = y0, a00 = a0, b00 = b0, c00 = c0;
          resample.point = linePoint;
        };
        resample.lineEnd = function() {
          resampleLineTo(x0, y0, λ0, a0, b0, c0, x00, y00, λ00, a00, b00, c00, maxDepth, stream);
          resample.lineEnd = lineEnd;
          lineEnd();
        };
      }
      return resample;
    }
    function resampleLineTo(x0, y0, λ0, a0, b0, c0, x1, y1, λ1, a1, b1, c1, depth, stream) {
      var dx = x1 - x0, dy = y1 - y0, d2 = dx * dx + dy * dy;
      if (d2 > 4 * δ2 && depth--) {
        var a = a0 + a1, b = b0 + b1, c = c0 + c1, m = Math.sqrt(a * a + b * b + c * c), φ2 = Math.asin(c /= m), λ2 = Math.abs(Math.abs(c) - 1) < ε ? (λ0 + λ1) / 2 : Math.atan2(b, a), p = project(λ2, φ2), x2 = p[0], y2 = p[1], dx2 = x2 - x0, dy2 = y2 - y0, dz = dy * dx2 - dx * dy2;
        if (dz * dz / d2 > δ2 || Math.abs((dx * dx2 + dy * dy2) / d2 - .5) > .3) {
          resampleLineTo(x0, y0, λ0, a0, b0, c0, x2, y2, λ2, a /= m, b /= m, c, depth, stream);
          stream.point(x2, y2);
          resampleLineTo(x2, y2, λ2, a, b, c, x1, y1, λ1, a1, b1, c1, depth, stream);
        }
      }
    }
    resample.precision = function(_) {
      if (!arguments.length) return Math.sqrt(δ2);
      maxDepth = (δ2 = _ * _) > 0 && 16;
      return resample;
    };
    return resample;
  }
  d3.geo.albersUsa = function() {
    var lower48 = d3.geo.albers();
    var alaska = d3.geo.albers().rotate([ 160, 0 ]).center([ 0, 60 ]).parallels([ 55, 65 ]);
    var hawaii = d3.geo.albers().rotate([ 160, 0 ]).center([ 0, 20 ]).parallels([ 8, 18 ]);
    var puertoRico = d3.geo.albers().rotate([ 60, 0 ]).center([ 0, 10 ]).parallels([ 8, 18 ]);
    function albersUsa(coordinates) {
      return projection(coordinates)(coordinates);
    }
    function projection(point) {
      var lon = point[0], lat = point[1];
      return lat > 50 ? alaska : lon < -140 ? hawaii : lat < 21 ? puertoRico : lower48;
    }
    albersUsa.scale = function(x) {
      if (!arguments.length) return lower48.scale();
      lower48.scale(x);
      alaska.scale(x * .6);
      hawaii.scale(x);
      puertoRico.scale(x * 1.5);
      return albersUsa.translate(lower48.translate());
    };
    albersUsa.translate = function(x) {
      if (!arguments.length) return lower48.translate();
      var dz = lower48.scale(), dx = x[0], dy = x[1];
      lower48.translate(x);
      alaska.translate([ dx - .4 * dz, dy + .17 * dz ]);
      hawaii.translate([ dx - .19 * dz, dy + .2 * dz ]);
      puertoRico.translate([ dx + .58 * dz, dy + .43 * dz ]);
      return albersUsa;
    };
    return albersUsa.scale(lower48.scale());
  };
  function d3_geo_albers(φ0, φ1) {
    var sinφ0 = Math.sin(φ0), n = (sinφ0 + Math.sin(φ1)) / 2, C = 1 + sinφ0 * (2 * n - sinφ0), ρ0 = Math.sqrt(C) / n;
    function albers(λ, φ) {
      var ρ = Math.sqrt(C - 2 * n * Math.sin(φ)) / n;
      return [ ρ * Math.sin(λ *= n), ρ0 - ρ * Math.cos(λ) ];
    }
    albers.invert = function(x, y) {
      var ρ0_y = ρ0 - y;
      return [ Math.atan2(x, ρ0_y) / n, Math.asin((C - (x * x + ρ0_y * ρ0_y) * n * n) / (2 * n)) ];
    };
    return albers;
  }
  (d3.geo.albers = function() {
    var φ0 = 29.5 * d3_radians, φ1 = 45.5 * d3_radians, m = d3_geo_projectionMutator(d3_geo_albers), p = m(φ0, φ1);
    p.parallels = function(_) {
      if (!arguments.length) return [ φ0 * d3_degrees, φ1 * d3_degrees ];
      return m(φ0 = _[0] * d3_radians, φ1 = _[1] * d3_radians);
    };
    return p.rotate([ 98, 0 ]).center([ 0, 38 ]).scale(1e3);
  }).raw = d3_geo_albers;
  var d3_geo_azimuthalEqualArea = d3_geo_azimuthal(function(cosλcosφ) {
    return Math.sqrt(2 / (1 + cosλcosφ));
  }, function(ρ) {
    return 2 * Math.asin(ρ / 2);
  });
  (d3.geo.azimuthalEqualArea = function() {
    return d3_geo_projection(d3_geo_azimuthalEqualArea);
  }).raw = d3_geo_azimuthalEqualArea;
  var d3_geo_azimuthalEquidistant = d3_geo_azimuthal(function(cosλcosφ) {
    var c = Math.acos(cosλcosφ);
    return c && c / Math.sin(c);
  }, d3_identity);
  (d3.geo.azimuthalEquidistant = function() {
    return d3_geo_projection(d3_geo_azimuthalEquidistant);
  }).raw = d3_geo_azimuthalEquidistant;
  d3.geo.bounds = d3_geo_bounds(d3_identity);
  function d3_geo_bounds(projectStream) {
    var x0, y0, x1, y1;
    var bound = {
      point: boundPoint,
      lineStart: d3_noop,
      lineEnd: d3_noop,
      polygonStart: function() {
        bound.lineEnd = boundPolygonLineEnd;
      },
      polygonEnd: function() {
        bound.point = boundPoint;
      }
    };
    function boundPoint(x, y) {
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
    function boundPolygonLineEnd() {
      bound.point = bound.lineEnd = d3_noop;
    }
    return function(feature) {
      y1 = x1 = -(x0 = y0 = Infinity);
      d3.geo.stream(feature, projectStream(bound));
      return [ [ x0, y0 ], [ x1, y1 ] ];
    };
  }
  d3.geo.centroid = function(object) {
    d3_geo_centroidDimension = d3_geo_centroidW = d3_geo_centroidX = d3_geo_centroidY = d3_geo_centroidZ = 0;
    d3.geo.stream(object, d3_geo_centroid);
    var m;
    if (d3_geo_centroidW && Math.abs(m = Math.sqrt(d3_geo_centroidX * d3_geo_centroidX + d3_geo_centroidY * d3_geo_centroidY + d3_geo_centroidZ * d3_geo_centroidZ)) > ε) {
      return [ Math.atan2(d3_geo_centroidY, d3_geo_centroidX) * d3_degrees, Math.asin(Math.max(-1, Math.min(1, d3_geo_centroidZ / m))) * d3_degrees ];
    }
  };
  var d3_geo_centroidDimension, d3_geo_centroidW, d3_geo_centroidX, d3_geo_centroidY, d3_geo_centroidZ;
  var d3_geo_centroid = {
    sphere: function() {
      if (d3_geo_centroidDimension < 2) {
        d3_geo_centroidDimension = 2;
        d3_geo_centroidW = d3_geo_centroidX = d3_geo_centroidY = d3_geo_centroidZ = 0;
      }
    },
    point: d3_geo_centroidPoint,
    lineStart: d3_geo_centroidLineStart,
    lineEnd: d3_geo_centroidLineEnd,
    polygonStart: function() {
      if (d3_geo_centroidDimension < 2) {
        d3_geo_centroidDimension = 2;
        d3_geo_centroidW = d3_geo_centroidX = d3_geo_centroidY = d3_geo_centroidZ = 0;
      }
      d3_geo_centroid.lineStart = d3_geo_centroidRingStart;
    },
    polygonEnd: function() {
      d3_geo_centroid.lineStart = d3_geo_centroidLineStart;
    }
  };
  function d3_geo_centroidPoint(λ, φ) {
    if (d3_geo_centroidDimension) return;
    ++d3_geo_centroidW;
    λ *= d3_radians;
    var cosφ = Math.cos(φ *= d3_radians);
    d3_geo_centroidX += (cosφ * Math.cos(λ) - d3_geo_centroidX) / d3_geo_centroidW;
    d3_geo_centroidY += (cosφ * Math.sin(λ) - d3_geo_centroidY) / d3_geo_centroidW;
    d3_geo_centroidZ += (Math.sin(φ) - d3_geo_centroidZ) / d3_geo_centroidW;
  }
  function d3_geo_centroidRingStart() {
    var λ00, φ00;
    d3_geo_centroidDimension = 1;
    d3_geo_centroidLineStart();
    d3_geo_centroidDimension = 2;
    var linePoint = d3_geo_centroid.point;
    d3_geo_centroid.point = function(λ, φ) {
      linePoint(λ00 = λ, φ00 = φ);
    };
    d3_geo_centroid.lineEnd = function() {
      d3_geo_centroid.point(λ00, φ00);
      d3_geo_centroidLineEnd();
      d3_geo_centroid.lineEnd = d3_geo_centroidLineEnd;
    };
  }
  function d3_geo_centroidLineStart() {
    var x0, y0, z0;
    if (d3_geo_centroidDimension > 1) return;
    if (d3_geo_centroidDimension < 1) {
      d3_geo_centroidDimension = 1;
      d3_geo_centroidW = d3_geo_centroidX = d3_geo_centroidY = d3_geo_centroidZ = 0;
    }
    d3_geo_centroid.point = function(λ, φ) {
      λ *= d3_radians;
      var cosφ = Math.cos(φ *= d3_radians);
      x0 = cosφ * Math.cos(λ);
      y0 = cosφ * Math.sin(λ);
      z0 = Math.sin(φ);
      d3_geo_centroid.point = nextPoint;
    };
    function nextPoint(λ, φ) {
      λ *= d3_radians;
      var cosφ = Math.cos(φ *= d3_radians), x = cosφ * Math.cos(λ), y = cosφ * Math.sin(λ), z = Math.sin(φ), w = Math.atan2(Math.sqrt((w = y0 * z - z0 * y) * w + (w = z0 * x - x0 * z) * w + (w = x0 * y - y0 * x) * w), x0 * x + y0 * y + z0 * z);
      d3_geo_centroidW += w;
      d3_geo_centroidX += w * (x0 + (x0 = x));
      d3_geo_centroidY += w * (y0 + (y0 = y));
      d3_geo_centroidZ += w * (z0 + (z0 = z));
    }
  }
  function d3_geo_centroidLineEnd() {
    d3_geo_centroid.point = d3_geo_centroidPoint;
  }
  d3.geo.circle = function() {
    var origin = [ 0, 0 ], angle, precision = 6, interpolate;
    function circle() {
      var center = typeof origin === "function" ? origin.apply(this, arguments) : origin, rotate = d3_geo_rotation(-center[0] * d3_radians, -center[1] * d3_radians, 0).invert, ring = [];
      interpolate(null, null, 1, {
        point: function(x, y) {
          ring.push(x = rotate(x, y));
          x[0] *= d3_degrees, x[1] *= d3_degrees;
        }
      });
      return {
        type: "Polygon",
        coordinates: [ ring ]
      };
    }
    circle.origin = function(x) {
      if (!arguments.length) return origin;
      origin = x;
      return circle;
    };
    circle.angle = function(x) {
      if (!arguments.length) return angle;
      interpolate = d3_geo_circleInterpolate((angle = +x) * d3_radians, precision * d3_radians);
      return circle;
    };
    circle.precision = function(_) {
      if (!arguments.length) return precision;
      interpolate = d3_geo_circleInterpolate(angle * d3_radians, (precision = +_) * d3_radians);
      return circle;
    };
    return circle.angle(90);
  };
  function d3_geo_circleInterpolate(radians, precision) {
    var cr = Math.cos(radians), sr = Math.sin(radians);
    return function(from, to, direction, listener) {
      if (from != null) {
        from = d3_geo_circleAngle(cr, from);
        to = d3_geo_circleAngle(cr, to);
        if (direction > 0 ? from < to : from > to) from += direction * 2 * π;
      } else {
        from = radians + direction * 2 * π;
        to = radians;
      }
      var point;
      for (var step = direction * precision, t = from; direction > 0 ? t > to : t < to; t -= step) {
        listener.point((point = d3_geo_spherical([ cr, -sr * Math.cos(t), -sr * Math.sin(t) ]))[0], point[1]);
      }
    };
  }
  function d3_geo_circleAngle(cr, point) {
    var a = d3_geo_cartesian(point);
    a[0] -= cr;
    d3_geo_cartesianNormalize(a);
    var angle = Math.acos(Math.max(-1, Math.min(1, -a[1])));
    return ((-a[2] < 0 ? -angle : angle) + 2 * Math.PI - ε) % (2 * Math.PI);
  }
  function d3_geo_clip(pointVisible, clipLine, interpolate) {
    return function(listener) {
      var line = clipLine(listener);
      var clip = {
        point: point,
        lineStart: lineStart,
        lineEnd: lineEnd,
        polygonStart: function() {
          clip.point = pointRing;
          clip.lineStart = ringStart;
          clip.lineEnd = ringEnd;
          invisible = false;
          invisibleArea = visibleArea = 0;
          segments = [];
          listener.polygonStart();
        },
        polygonEnd: function() {
          clip.point = point;
          clip.lineStart = lineStart;
          clip.lineEnd = lineEnd;
          segments = d3.merge(segments);
          if (segments.length) {
            d3_geo_clipPolygon(segments, interpolate, listener);
          } else if (visibleArea < -ε || invisible && invisibleArea < -ε) {
            listener.lineStart();
            interpolate(null, null, 1, listener);
            listener.lineEnd();
          }
          listener.polygonEnd();
          segments = null;
        },
        sphere: function() {
          listener.polygonStart();
          listener.lineStart();
          interpolate(null, null, 1, listener);
          listener.lineEnd();
          listener.polygonEnd();
        }
      };
      function point(λ, φ) {
        if (pointVisible(λ, φ)) listener.point(λ, φ);
      }
      function pointLine(λ, φ) {
        line.point(λ, φ);
      }
      function lineStart() {
        clip.point = pointLine;
        line.lineStart();
      }
      function lineEnd() {
        clip.point = point;
        line.lineEnd();
      }
      var segments, visibleArea, invisibleArea, invisible;
      var buffer = d3_geo_clipBufferListener(), ringListener = clipLine(buffer), ring;
      function pointRing(λ, φ) {
        ringListener.point(λ, φ);
        ring.push([ λ, φ ]);
      }
      function ringStart() {
        ringListener.lineStart();
        ring = [];
      }
      function ringEnd() {
        pointRing(ring[0][0], ring[0][1]);
        ringListener.lineEnd();
        var clean = ringListener.clean(), ringSegments = buffer.buffer(), segment, n = ringSegments.length;
        if (!n) {
          invisible = true;
          invisibleArea += d3_geo_clipAreaRing(ring, -1);
          ring = null;
          return;
        }
        ring = null;
        if (clean & 1) {
          segment = ringSegments[0];
          visibleArea += d3_geo_clipAreaRing(segment, 1);
          var n = segment.length - 1, i = -1, point;
          listener.lineStart();
          while (++i < n) listener.point((point = segment[i])[0], point[1]);
          listener.lineEnd();
          return;
        }
        if (n > 1 && clean & 2) ringSegments.push(ringSegments.pop().concat(ringSegments.shift()));
        segments.push(ringSegments.filter(d3_geo_clipSegmentLength1));
      }
      return clip;
    };
  }
  function d3_geo_clipPolygon(segments, interpolate, listener) {
    var subject = [], clip = [];
    segments.forEach(function(segment) {
      if ((n = segment.length) <= 1) return;
      var n, p0 = segment[0], p1 = segment[n - 1];
      if (d3_geo_sphericalEqual(p0, p1)) {
        listener.lineStart();
        for (var i = 0; i < n; ++i) listener.point((p0 = segment[i])[0], p0[1]);
        listener.lineEnd();
        return;
      }
      var a = {
        point: p0,
        points: segment,
        other: null,
        visited: false,
        entry: true,
        subject: true
      }, b = {
        point: p0,
        points: [ p0 ],
        other: a,
        visited: false,
        entry: false,
        subject: false
      };
      a.other = b;
      subject.push(a);
      clip.push(b);
      a = {
        point: p1,
        points: [ p1 ],
        other: null,
        visited: false,
        entry: false,
        subject: true
      };
      b = {
        point: p1,
        points: [ p1 ],
        other: a,
        visited: false,
        entry: true,
        subject: false
      };
      a.other = b;
      subject.push(a);
      clip.push(b);
    });
    clip.sort(d3_geo_clipSort);
    d3_geo_clipLinkCircular(subject);
    d3_geo_clipLinkCircular(clip);
    if (!subject.length) return;
    var start = subject[0], current, points, point;
    while (1) {
      current = start;
      while (current.visited) if ((current = current.next) === start) return;
      points = current.points;
      listener.lineStart();
      do {
        current.visited = current.other.visited = true;
        if (current.entry) {
          if (current.subject) {
            for (var i = 0; i < points.length; i++) listener.point((point = points[i])[0], point[1]);
          } else {
            interpolate(current.point, current.next.point, 1, listener);
          }
          current = current.next;
        } else {
          if (current.subject) {
            points = current.prev.points;
            for (var i = points.length; --i >= 0; ) listener.point((point = points[i])[0], point[1]);
          } else {
            interpolate(current.point, current.prev.point, -1, listener);
          }
          current = current.prev;
        }
        current = current.other;
        points = current.points;
      } while (!current.visited);
      listener.lineEnd();
    }
  }
  function d3_geo_clipLinkCircular(array) {
    if (!(n = array.length)) return;
    var n, i = 0, a = array[0], b;
    while (++i < n) {
      a.next = b = array[i];
      b.prev = a;
      a = b;
    }
    a.next = b = array[0];
    b.prev = a;
  }
  function d3_geo_clipSort(a, b) {
    return ((a = a.point)[0] < 0 ? a[1] - π / 2 - ε : π / 2 - a[1]) - ((b = b.point)[0] < 0 ? b[1] - π / 2 - ε : π / 2 - b[1]);
  }
  function d3_geo_clipSegmentLength1(segment) {
    return segment.length > 1;
  }
  function d3_geo_clipBufferListener() {
    var lines = [], line;
    return {
      lineStart: function() {
        lines.push(line = []);
      },
      point: function(λ, φ) {
        line.push([ λ, φ ]);
      },
      lineEnd: d3_noop,
      buffer: function() {
        var buffer = lines;
        lines = [];
        line = null;
        return buffer;
      }
    };
  }
  function d3_geo_clipAreaRing(ring, invisible) {
    if (!(n = ring.length)) return 0;
    var n, i = 0, area = 0, p = ring[0], λ = p[0], φ = p[1], cosφ = Math.cos(φ), x0 = Math.atan2(invisible * Math.sin(λ) * cosφ, Math.sin(φ)), y0 = 1 - invisible * Math.cos(λ) * cosφ, x1 = x0, x, y;
    while (++i < n) {
      p = ring[i];
      cosφ = Math.cos(φ = p[1]);
      x = Math.atan2(invisible * Math.sin(λ = p[0]) * cosφ, Math.sin(φ));
      y = 1 - invisible * Math.cos(λ) * cosφ;
      if (Math.abs(y0 - 2) < ε && Math.abs(y - 2) < ε) continue;
      if (Math.abs(y) < ε || Math.abs(y0) < ε) {} else if (Math.abs(Math.abs(x - x0) - π) < ε) {
        if (y + y0 > 2) area += 4 * (x - x0);
      } else if (Math.abs(y0 - 2) < ε) area += 4 * (x - x1); else area += ((3 * π + x - x0) % (2 * π) - π) * (y0 + y);
      x1 = x0, x0 = x, y0 = y;
    }
    return area;
  }
  var d3_geo_clipAntimeridian = d3_geo_clip(d3_true, d3_geo_clipAntimeridianLine, d3_geo_clipAntimeridianInterpolate);
  function d3_geo_clipAntimeridianLine(listener) {
    var λ0 = NaN, φ0 = NaN, sλ0 = NaN, clean;
    return {
      lineStart: function() {
        listener.lineStart();
        clean = 1;
      },
      point: function(λ1, φ1) {
        var sλ1 = λ1 > 0 ? π : -π, dλ = Math.abs(λ1 - λ0);
        if (Math.abs(dλ - π) < ε) {
          listener.point(λ0, φ0 = (φ0 + φ1) / 2 > 0 ? π / 2 : -π / 2);
          listener.point(sλ0, φ0);
          listener.lineEnd();
          listener.lineStart();
          listener.point(sλ1, φ0);
          listener.point(λ1, φ0);
          clean = 0;
        } else if (sλ0 !== sλ1 && dλ >= π) {
          if (Math.abs(λ0 - sλ0) < ε) λ0 -= sλ0 * ε;
          if (Math.abs(λ1 - sλ1) < ε) λ1 -= sλ1 * ε;
          φ0 = d3_geo_clipAntimeridianIntersect(λ0, φ0, λ1, φ1);
          listener.point(sλ0, φ0);
          listener.lineEnd();
          listener.lineStart();
          listener.point(sλ1, φ0);
          clean = 0;
        }
        listener.point(λ0 = λ1, φ0 = φ1);
        sλ0 = sλ1;
      },
      lineEnd: function() {
        listener.lineEnd();
        λ0 = φ0 = NaN;
      },
      clean: function() {
        return 2 - clean;
      }
    };
  }
  function d3_geo_clipAntimeridianIntersect(λ0, φ0, λ1, φ1) {
    var cosφ0, cosφ1, sinλ0_λ1 = Math.sin(λ0 - λ1);
    return Math.abs(sinλ0_λ1) > ε ? Math.atan((Math.sin(φ0) * (cosφ1 = Math.cos(φ1)) * Math.sin(λ1) - Math.sin(φ1) * (cosφ0 = Math.cos(φ0)) * Math.sin(λ0)) / (cosφ0 * cosφ1 * sinλ0_λ1)) : (φ0 + φ1) / 2;
  }
  function d3_geo_clipAntimeridianInterpolate(from, to, direction, listener) {
    var φ;
    if (from == null) {
      φ = direction * π / 2;
      listener.point(-π, φ);
      listener.point(0, φ);
      listener.point(π, φ);
      listener.point(π, 0);
      listener.point(π, -φ);
      listener.point(0, -φ);
      listener.point(-π, -φ);
      listener.point(-π, 0);
      listener.point(-π, φ);
    } else if (Math.abs(from[0] - to[0]) > ε) {
      var s = (from[0] < to[0] ? 1 : -1) * π;
      φ = direction * s / 2;
      listener.point(-s, φ);
      listener.point(0, φ);
      listener.point(s, φ);
    } else {
      listener.point(to[0], to[1]);
    }
  }
  function d3_geo_clipCircle(degrees) {
    var radians = degrees * d3_radians, cr = Math.cos(radians), interpolate = d3_geo_circleInterpolate(radians, 6 * d3_radians);
    return d3_geo_clip(visible, clipLine, interpolate);
    function visible(λ, φ) {
      return Math.cos(λ) * Math.cos(φ) > cr;
    }
    function clipLine(listener) {
      var point0, v0, v00, clean;
      return {
        lineStart: function() {
          v00 = v0 = false;
          clean = 1;
        },
        point: function(λ, φ) {
          var point1 = [ λ, φ ], point2, v = visible(λ, φ);
          if (!point0 && (v00 = v0 = v)) listener.lineStart();
          if (v !== v0) {
            point2 = intersect(point0, point1);
            if (d3_geo_sphericalEqual(point0, point2) || d3_geo_sphericalEqual(point1, point2)) {
              point1[0] += ε;
              point1[1] += ε;
              v = visible(point1[0], point1[1]);
            }
          }
          if (v !== v0) {
            clean = 0;
            if (v0 = v) {
              listener.lineStart();
              point2 = intersect(point1, point0);
              listener.point(point2[0], point2[1]);
            } else {
              point2 = intersect(point0, point1);
              listener.point(point2[0], point2[1]);
              listener.lineEnd();
            }
            point0 = point2;
          }
          if (v && (!point0 || !d3_geo_sphericalEqual(point0, point1))) listener.point(point1[0], point1[1]);
          point0 = point1;
        },
        lineEnd: function() {
          if (v0) listener.lineEnd();
          point0 = null;
        },
        clean: function() {
          return clean | (v00 && v0) << 1;
        }
      };
    }
    function intersect(a, b) {
      var pa = d3_geo_cartesian(a, 0), pb = d3_geo_cartesian(b, 0);
      var n1 = [ 1, 0, 0 ], n2 = d3_geo_cartesianCross(pa, pb), n2n2 = d3_geo_cartesianDot(n2, n2), n1n2 = n2[0], determinant = n2n2 - n1n2 * n1n2;
      if (!determinant) return a;
      var c1 = cr * n2n2 / determinant, c2 = -cr * n1n2 / determinant, n1xn2 = d3_geo_cartesianCross(n1, n2), A = d3_geo_cartesianScale(n1, c1), B = d3_geo_cartesianScale(n2, c2);
      d3_geo_cartesianAdd(A, B);
      var u = n1xn2, w = d3_geo_cartesianDot(A, u), uu = d3_geo_cartesianDot(u, u), t = Math.sqrt(w * w - uu * (d3_geo_cartesianDot(A, A) - 1)), q = d3_geo_cartesianScale(u, (-w - t) / uu);
      d3_geo_cartesianAdd(q, A);
      return d3_geo_spherical(q);
    }
  }
  function d3_geo_compose(a, b) {
    function compose(x, y) {
      return x = a(x, y), b(x[0], x[1]);
    }
    if (a.invert && b.invert) compose.invert = function(x, y) {
      return x = b.invert(x, y), x && a.invert(x[0], x[1]);
    };
    return compose;
  }
  function d3_geo_equirectangular(λ, φ) {
    return [ λ, φ ];
  }
  (d3.geo.equirectangular = function() {
    return d3_geo_projection(d3_geo_equirectangular).scale(250 / π);
  }).raw = d3_geo_equirectangular.invert = d3_geo_equirectangular;
  var d3_geo_gnomonic = d3_geo_azimuthal(function(cosλcosφ) {
    return 1 / cosλcosφ;
  }, Math.atan);
  (d3.geo.gnomonic = function() {
    return d3_geo_projection(d3_geo_gnomonic);
  }).raw = d3_geo_gnomonic;
  d3.geo.graticule = function() {
    var x1, x0, y1, y0, dx = 22.5, dy = dx, x, y, precision = 2.5;
    function graticule() {
      return {
        type: "MultiLineString",
        coordinates: lines()
      };
    }
    function lines() {
      return d3.range(Math.ceil(x0 / dx) * dx, x1, dx).map(x).concat(d3.range(Math.ceil(y0 / dy) * dy, y1, dy).map(y));
    }
    graticule.lines = function() {
      return lines().map(function(coordinates) {
        return {
          type: "LineString",
          coordinates: coordinates
        };
      });
    };
    graticule.outline = function() {
      return {
        type: "Polygon",
        coordinates: [ x(x0).concat(y(y1).slice(1), x(x1).reverse().slice(1), y(y0).reverse().slice(1)) ]
      };
    };
    graticule.extent = function(_) {
      if (!arguments.length) return [ [ x0, y0 ], [ x1, y1 ] ];
      x0 = +_[0][0], x1 = +_[1][0];
      y0 = +_[0][1], y1 = +_[1][1];
      if (x0 > x1) _ = x0, x0 = x1, x1 = _;
      if (y0 > y1) _ = y0, y0 = y1, y1 = _;
      return graticule.precision(precision);
    };
    graticule.step = function(_) {
      if (!arguments.length) return [ dx, dy ];
      dx = +_[0], dy = +_[1];
      return graticule;
    };
    graticule.precision = function(_) {
      if (!arguments.length) return precision;
      precision = +_;
      x = d3_geo_graticuleX(y0, y1, precision);
      y = d3_geo_graticuleY(x0, x1, precision);
      return graticule;
    };
    return graticule.extent([ [ -180 + ε, -90 + ε ], [ 180 - ε, 90 - ε ] ]);
  };
  function d3_geo_graticuleX(y0, y1, dy) {
    var y = d3.range(y0, y1 - ε, dy).concat(y1);
    return function(x) {
      return y.map(function(y) {
        return [ x, y ];
      });
    };
  }
  function d3_geo_graticuleY(x0, x1, dx) {
    var x = d3.range(x0, x1 - ε, dx).concat(x1);
    return function(y) {
      return x.map(function(x) {
        return [ x, y ];
      });
    };
  }
  function d3_geo_haversin(x) {
    return (x = Math.sin(x / 2)) * x;
  }
  d3.geo.interpolate = function(source, target) {
    return d3_geo_interpolate(source[0] * d3_radians, source[1] * d3_radians, target[0] * d3_radians, target[1] * d3_radians);
  };
  function d3_geo_interpolate(x0, y0, x1, y1) {
    var cy0 = Math.cos(y0), sy0 = Math.sin(y0), cy1 = Math.cos(y1), sy1 = Math.sin(y1), kx0 = cy0 * Math.cos(x0), ky0 = cy0 * Math.sin(x0), kx1 = cy1 * Math.cos(x1), ky1 = cy1 * Math.sin(x1), d = 2 * Math.asin(Math.sqrt(d3_geo_haversin(y1 - y0) + cy0 * cy1 * d3_geo_haversin(x1 - x0))), k = 1 / Math.sin(d);
    var interpolate = d ? function(t) {
      var B = Math.sin(t *= d) * k, A = Math.sin(d - t) * k, x = A * kx0 + B * kx1, y = A * ky0 + B * ky1, z = A * sy0 + B * sy1;
      return [ Math.atan2(y, x) * d3_degrees, Math.atan2(z, Math.sqrt(x * x + y * y)) * d3_degrees ];
    } : function() {
      return [ x0 * d3_degrees, y0 * d3_degrees ];
    };
    interpolate.distance = d;
    return interpolate;
  }
  d3.geo.greatArc = function() {
    var source = d3_source, source_, target = d3_target, target_, precision = 6 * d3_radians, interpolate;
    function greatArc() {
      var p0 = source_ || source.apply(this, arguments), p1 = target_ || target.apply(this, arguments), i = interpolate || d3.geo.interpolate(p0, p1), t = 0, dt = precision / i.distance, coordinates = [ p0 ];
      while ((t += dt) < 1) coordinates.push(i(t));
      coordinates.push(p1);
      return {
        type: "LineString",
        coordinates: coordinates
      };
    }
    greatArc.distance = function() {
      return (interpolate || d3.geo.interpolate(source_ || source.apply(this, arguments), target_ || target.apply(this, arguments))).distance;
    };
    greatArc.source = function(_) {
      if (!arguments.length) return source;
      source = _, source_ = typeof _ === "function" ? null : _;
      interpolate = source_ && target_ ? d3.geo.interpolate(source_, target_) : null;
      return greatArc;
    };
    greatArc.target = function(_) {
      if (!arguments.length) return target;
      target = _, target_ = typeof _ === "function" ? null : _;
      interpolate = source_ && target_ ? d3.geo.interpolate(source_, target_) : null;
      return greatArc;
    };
    greatArc.precision = function(_) {
      if (!arguments.length) return precision / d3_radians;
      precision = _ * d3_radians;
      return greatArc;
    };
    return greatArc;
  };
  function d3_geo_mercator(λ, φ) {
    return [ λ / (2 * π), Math.max(-.5, Math.min(+.5, Math.log(Math.tan(π / 4 + φ / 2)) / (2 * π))) ];
  }
  d3_geo_mercator.invert = function(x, y) {
    return [ 2 * π * x, 2 * Math.atan(Math.exp(2 * π * y)) - π / 2 ];
  };
  (d3.geo.mercator = function() {
    return d3_geo_projection(d3_geo_mercator).scale(500);
  }).raw = d3_geo_mercator;
  var d3_geo_orthographic = d3_geo_azimuthal(function() {
    return 1;
  }, Math.asin);
  (d3.geo.orthographic = function() {
    return d3_geo_projection(d3_geo_orthographic);
  }).raw = d3_geo_orthographic;
  d3.geo.path = function() {
    var pointRadius = 4.5, projection, context, projectStream, contextStream;
    function path(object) {
      if (object) d3.geo.stream(object, projectStream(contextStream.pointRadius(typeof pointRadius === "function" ? +pointRadius.apply(this, arguments) : pointRadius)));
      return contextStream.result();
    }
    path.area = function(object) {
      d3_geo_pathAreaSum = 0;
      d3.geo.stream(object, projectStream(d3_geo_pathArea));
      return d3_geo_pathAreaSum;
    };
    path.centroid = function(object) {
      d3_geo_centroidDimension = d3_geo_centroidX = d3_geo_centroidY = d3_geo_centroidZ = 0;
      d3.geo.stream(object, projectStream(d3_geo_pathCentroid));
      return d3_geo_centroidZ ? [ d3_geo_centroidX / d3_geo_centroidZ, d3_geo_centroidY / d3_geo_centroidZ ] : undefined;
    };
    path.bounds = function(object) {
      return d3_geo_bounds(projectStream)(object);
    };
    path.projection = function(_) {
      if (!arguments.length) return projection;
      projectStream = (projection = _) ? _.stream || d3_geo_pathProjectStream(_) : d3_identity;
      return path;
    };
    path.context = function(_) {
      if (!arguments.length) return context;
      contextStream = (context = _) == null ? new d3_geo_pathBuffer() : new d3_geo_pathContext(_);
      return path;
    };
    path.pointRadius = function(_) {
      if (!arguments.length) return pointRadius;
      pointRadius = typeof _ === "function" ? _ : +_;
      return path;
    };
    return path.projection(d3.geo.albersUsa()).context(null);
  };
  function d3_geo_pathCircle(radius) {
    return "m0," + radius + "a" + radius + "," + radius + " 0 1,1 0," + -2 * radius + "a" + radius + "," + radius + " 0 1,1 0," + +2 * radius + "z";
  }
  function d3_geo_pathProjectStream(project) {
    var resample = d3_geo_resample(function(λ, φ) {
      return project([ λ * d3_degrees, φ * d3_degrees ]);
    });
    return function(stream) {
      stream = resample(stream);
      return {
        point: function(λ, φ) {
          stream.point(λ * d3_radians, φ * d3_radians);
        },
        sphere: function() {
          stream.sphere();
        },
        lineStart: function() {
          stream.lineStart();
        },
        lineEnd: function() {
          stream.lineEnd();
        },
        polygonStart: function() {
          stream.polygonStart();
        },
        polygonEnd: function() {
          stream.polygonEnd();
        }
      };
    };
  }
  function d3_geo_pathBuffer() {
    var pointCircle = d3_geo_pathCircle(4.5), buffer = [];
    var stream = {
      point: point,
      lineStart: function() {
        stream.point = pointLineStart;
      },
      lineEnd: lineEnd,
      polygonStart: function() {
        stream.lineEnd = lineEndPolygon;
      },
      polygonEnd: function() {
        stream.lineEnd = lineEnd;
        stream.point = point;
      },
      pointRadius: function(_) {
        pointCircle = d3_geo_pathCircle(_);
        return stream;
      },
      result: function() {
        if (buffer.length) {
          var result = buffer.join("");
          buffer = [];
          return result;
        }
      }
    };
    function point(x, y) {
      buffer.push("M", x, ",", y, pointCircle);
    }
    function pointLineStart(x, y) {
      buffer.push("M", x, ",", y);
      stream.point = pointLine;
    }
    function pointLine(x, y) {
      buffer.push("L", x, ",", y);
    }
    function lineEnd() {
      stream.point = point;
    }
    function lineEndPolygon() {
      buffer.push("Z");
    }
    return stream;
  }
  function d3_geo_pathContext(context) {
    var pointRadius = 4.5;
    var stream = {
      point: point,
      lineStart: function() {
        stream.point = pointLineStart;
      },
      lineEnd: lineEnd,
      polygonStart: function() {
        stream.lineEnd = lineEndPolygon;
      },
      polygonEnd: function() {
        stream.lineEnd = lineEnd;
        stream.point = point;
      },
      pointRadius: function(_) {
        pointRadius = _;
        return stream;
      },
      result: d3_noop
    };
    function point(x, y) {
      context.moveTo(x, y);
      context.arc(x, y, pointRadius, 0, 2 * π);
    }
    function pointLineStart(x, y) {
      context.moveTo(x, y);
      stream.point = pointLine;
    }
    function pointLine(x, y) {
      context.lineTo(x, y);
    }
    function lineEnd() {
      stream.point = point;
    }
    function lineEndPolygon() {
      context.closePath();
    }
    return stream;
  }
  var d3_geo_pathAreaSum, d3_geo_pathAreaPolygon, d3_geo_pathArea = {
    point: d3_noop,
    lineStart: d3_noop,
    lineEnd: d3_noop,
    polygonStart: function() {
      d3_geo_pathAreaPolygon = 0;
      d3_geo_pathArea.lineStart = d3_geo_pathAreaRingStart;
    },
    polygonEnd: function() {
      d3_geo_pathArea.lineStart = d3_geo_pathArea.lineEnd = d3_geo_pathArea.point = d3_noop;
      d3_geo_pathAreaSum += Math.abs(d3_geo_pathAreaPolygon / 2);
    }
  };
  function d3_geo_pathAreaRingStart() {
    var x00, y00, x0, y0;
    d3_geo_pathArea.point = function(x, y) {
      d3_geo_pathArea.point = nextPoint;
      x00 = x0 = x, y00 = y0 = y;
    };
    function nextPoint(x, y) {
      d3_geo_pathAreaPolygon += y0 * x - x0 * y;
      x0 = x, y0 = y;
    }
    d3_geo_pathArea.lineEnd = function() {
      nextPoint(x00, y00);
    };
  }
  var d3_geo_pathCentroid = {
    point: d3_geo_pathCentroidPoint,
    lineStart: d3_geo_pathCentroidLineStart,
    lineEnd: d3_geo_pathCentroidLineEnd,
    polygonStart: function() {
      d3_geo_pathCentroid.lineStart = d3_geo_pathCentroidRingStart;
    },
    polygonEnd: function() {
      d3_geo_pathCentroid.point = d3_geo_pathCentroidPoint;
      d3_geo_pathCentroid.lineStart = d3_geo_pathCentroidLineStart;
      d3_geo_pathCentroid.lineEnd = d3_geo_pathCentroidLineEnd;
    }
  };
  function d3_geo_pathCentroidPoint(x, y) {
    if (d3_geo_centroidDimension) return;
    d3_geo_centroidX += x;
    d3_geo_centroidY += y;
    ++d3_geo_centroidZ;
  }
  function d3_geo_pathCentroidLineStart() {
    var x0, y0;
    if (d3_geo_centroidDimension !== 1) {
      if (d3_geo_centroidDimension < 1) {
        d3_geo_centroidDimension = 1;
        d3_geo_centroidX = d3_geo_centroidY = d3_geo_centroidZ = 0;
      } else return;
    }
    d3_geo_pathCentroid.point = function(x, y) {
      d3_geo_pathCentroid.point = nextPoint;
      x0 = x, y0 = y;
    };
    function nextPoint(x, y) {
      var dx = x - x0, dy = y - y0, z = Math.sqrt(dx * dx + dy * dy);
      d3_geo_centroidX += z * (x0 + x) / 2;
      d3_geo_centroidY += z * (y0 + y) / 2;
      d3_geo_centroidZ += z;
      x0 = x, y0 = y;
    }
  }
  function d3_geo_pathCentroidLineEnd() {
    d3_geo_pathCentroid.point = d3_geo_pathCentroidPoint;
  }
  function d3_geo_pathCentroidRingStart() {
    var x00, y00, x0, y0;
    if (d3_geo_centroidDimension < 2) {
      d3_geo_centroidDimension = 2;
      d3_geo_centroidX = d3_geo_centroidY = d3_geo_centroidZ = 0;
    }
    d3_geo_pathCentroid.point = function(x, y) {
      d3_geo_pathCentroid.point = nextPoint;
      x00 = x0 = x, y00 = y0 = y;
    };
    function nextPoint(x, y) {
      var z = y0 * x - x0 * y;
      d3_geo_centroidX += z * (x0 + x);
      d3_geo_centroidY += z * (y0 + y);
      d3_geo_centroidZ += z * 3;
      x0 = x, y0 = y;
    }
    d3_geo_pathCentroid.lineEnd = function() {
      nextPoint(x00, y00);
    };
  }
  d3.geo.area = function(object) {
    d3_geo_areaSum = 0;
    d3.geo.stream(object, d3_geo_area);
    return d3_geo_areaSum;
  };
  var d3_geo_areaSum, d3_geo_areaRingU, d3_geo_areaRingV;
  var d3_geo_area = {
    sphere: function() {
      d3_geo_areaSum += 4 * π;
    },
    point: d3_noop,
    lineStart: d3_noop,
    lineEnd: d3_noop,
    polygonStart: function() {
      d3_geo_areaRingU = 1, d3_geo_areaRingV = 0;
      d3_geo_area.lineStart = d3_geo_areaRingStart;
    },
    polygonEnd: function() {
      var area = 2 * Math.atan2(d3_geo_areaRingV, d3_geo_areaRingU);
      d3_geo_areaSum += area < 0 ? 4 * π + area : area;
      d3_geo_area.lineStart = d3_geo_area.lineEnd = d3_geo_area.point = d3_noop;
    }
  };
  function d3_geo_areaRingStart() {
    var λ00, φ00, λ0, cosφ0, sinφ0;
    d3_geo_area.point = function(λ, φ) {
      d3_geo_area.point = nextPoint;
      λ0 = (λ00 = λ) * d3_radians, cosφ0 = Math.cos(φ = (φ00 = φ) * d3_radians / 2 + π / 4), 
      sinφ0 = Math.sin(φ);
    };
    function nextPoint(λ, φ) {
      λ *= d3_radians;
      φ = φ * d3_radians / 2 + π / 4;
      var dλ = λ - λ0, cosφ = Math.cos(φ), sinφ = Math.sin(φ), k = sinφ0 * sinφ, u0 = d3_geo_areaRingU, v0 = d3_geo_areaRingV, u = cosφ0 * cosφ + k * Math.cos(dλ), v = k * Math.sin(dλ);
      d3_geo_areaRingU = u0 * u - v0 * v;
      d3_geo_areaRingV = v0 * u + u0 * v;
      λ0 = λ, cosφ0 = cosφ, sinφ0 = sinφ;
    }
    d3_geo_area.lineEnd = function() {
      nextPoint(λ00, φ00);
    };
  }
  d3.geo.projection = d3_geo_projection;
  d3.geo.projectionMutator = d3_geo_projectionMutator;
  function d3_geo_projection(project) {
    return d3_geo_projectionMutator(function() {
      return project;
    })();
  }
  function d3_geo_projectionMutator(projectAt) {
    var project, rotate, projectRotate, projectResample = d3_geo_resample(function(x, y) {
      x = project(x, y);
      return [ x[0] * k + δx, δy - x[1] * k ];
    }), k = 150, x = 480, y = 250, λ = 0, φ = 0, δλ = 0, δφ = 0, δγ = 0, δx, δy, clip = d3_geo_clipAntimeridian, clipAngle = null;
    function projection(point) {
      point = projectRotate(point[0] * d3_radians, point[1] * d3_radians);
      return [ point[0] * k + δx, δy - point[1] * k ];
    }
    function invert(point) {
      point = projectRotate.invert((point[0] - δx) / k, (δy - point[1]) / k);
      return point && [ point[0] * d3_degrees, point[1] * d3_degrees ];
    }
    projection.stream = function(stream) {
      return d3_geo_projectionRadiansRotate(rotate, clip(projectResample(stream)));
    };
    projection.clipAngle = function(_) {
      if (!arguments.length) return clipAngle;
      clip = _ == null ? (clipAngle = _, d3_geo_clipAntimeridian) : d3_geo_clipCircle(clipAngle = +_);
      return projection;
    };
    projection.scale = function(_) {
      if (!arguments.length) return k;
      k = +_;
      return reset();
    };
    projection.translate = function(_) {
      if (!arguments.length) return [ x, y ];
      x = +_[0];
      y = +_[1];
      return reset();
    };
    projection.center = function(_) {
      if (!arguments.length) return [ λ * d3_degrees, φ * d3_degrees ];
      λ = _[0] % 360 * d3_radians;
      φ = _[1] % 360 * d3_radians;
      return reset();
    };
    projection.rotate = function(_) {
      if (!arguments.length) return [ δλ * d3_degrees, δφ * d3_degrees, δγ * d3_degrees ];
      δλ = _[0] % 360 * d3_radians;
      δφ = _[1] % 360 * d3_radians;
      δγ = _.length > 2 ? _[2] % 360 * d3_radians : 0;
      return reset();
    };
    d3.rebind(projection, projectResample, "precision");
    function reset() {
      projectRotate = d3_geo_compose(rotate = d3_geo_rotation(δλ, δφ, δγ), project);
      var center = project(λ, φ);
      δx = x - center[0] * k;
      δy = y + center[1] * k;
      return projection;
    }
    return function() {
      project = projectAt.apply(this, arguments);
      projection.invert = project.invert && invert;
      return reset();
    };
  }
  function d3_geo_projectionRadiansRotate(rotate, stream) {
    return {
      point: function(x, y) {
        y = rotate(x * d3_radians, y * d3_radians), x = y[0];
        stream.point(x > π ? x - 2 * π : x < -π ? x + 2 * π : x, y[1]);
      },
      sphere: function() {
        stream.sphere();
      },
      lineStart: function() {
        stream.lineStart();
      },
      lineEnd: function() {
        stream.lineEnd();
      },
      polygonStart: function() {
        stream.polygonStart();
      },
      polygonEnd: function() {
        stream.polygonEnd();
      }
    };
  }
  function d3_geo_rotation(δλ, δφ, δγ) {
    return δλ ? δφ || δγ ? d3_geo_compose(d3_geo_rotationλ(δλ), d3_geo_rotationφγ(δφ, δγ)) : d3_geo_rotationλ(δλ) : δφ || δγ ? d3_geo_rotationφγ(δφ, δγ) : d3_geo_equirectangular;
  }
  function d3_geo_forwardRotationλ(δλ) {
    return function(λ, φ) {
      return λ += δλ, [ λ > π ? λ - 2 * π : λ < -π ? λ + 2 * π : λ, φ ];
    };
  }
  function d3_geo_rotationλ(δλ) {
    var rotation = d3_geo_forwardRotationλ(δλ);
    rotation.invert = d3_geo_forwardRotationλ(-δλ);
    return rotation;
  }
  function d3_geo_rotationφγ(δφ, δγ) {
    var cosδφ = Math.cos(δφ), sinδφ = Math.sin(δφ), cosδγ = Math.cos(δγ), sinδγ = Math.sin(δγ);
    function rotation(λ, φ) {
      var cosφ = Math.cos(φ), x = Math.cos(λ) * cosφ, y = Math.sin(λ) * cosφ, z = Math.sin(φ), k = z * cosδφ + x * sinδφ;
      return [ Math.atan2(y * cosδγ - k * sinδγ, x * cosδφ - z * sinδφ), Math.asin(Math.max(-1, Math.min(1, k * cosδγ + y * sinδγ))) ];
    }
    rotation.invert = function(λ, φ) {
      var cosφ = Math.cos(φ), x = Math.cos(λ) * cosφ, y = Math.sin(λ) * cosφ, z = Math.sin(φ), k = z * cosδγ - y * sinδγ;
      return [ Math.atan2(y * cosδγ + z * sinδγ, x * cosδφ + k * sinδφ), Math.asin(Math.max(-1, Math.min(1, k * cosδφ - x * sinδφ))) ];
    };
    return rotation;
  }
  var d3_geo_stereographic = d3_geo_azimuthal(function(cosλcosφ) {
    return 1 / (1 + cosλcosφ);
  }, function(ρ) {
    return 2 * Math.atan(ρ);
  });
  (d3.geo.stereographic = function() {
    return d3_geo_projection(d3_geo_stereographic);
  }).raw = d3_geo_stereographic;
  function d3_geo_azimuthal(scale, angle) {
    function azimuthal(λ, φ) {
      var cosλ = Math.cos(λ), cosφ = Math.cos(φ), k = scale(cosλ * cosφ);
      return [ k * cosφ * Math.sin(λ), k * Math.sin(φ) ];
    }
    azimuthal.invert = function(x, y) {
      var ρ = Math.sqrt(x * x + y * y), c = angle(ρ), sinc = Math.sin(c), cosc = Math.cos(c);
      return [ Math.atan2(x * sinc, ρ * cosc), Math.asin(ρ && y * sinc / ρ) ];
    };
    return azimuthal;
  }
  d3.geom = {};
  d3.geom.hull = function(vertices) {
    if (vertices.length < 3) return [];
    var len = vertices.length, plen = len - 1, points = [], stack = [], i, j, h = 0, x1, y1, x2, y2, u, v, a, sp;
    for (i = 1; i < len; ++i) {
      if (vertices[i][1] < vertices[h][1]) {
        h = i;
      } else if (vertices[i][1] == vertices[h][1]) {
        h = vertices[i][0] < vertices[h][0] ? i : h;
      }
    }
    for (i = 0; i < len; ++i) {
      if (i === h) continue;
      y1 = vertices[i][1] - vertices[h][1];
      x1 = vertices[i][0] - vertices[h][0];
      points.push({
        angle: Math.atan2(y1, x1),
        index: i
      });
    }
    points.sort(function(a, b) {
      return a.angle - b.angle;
    });
    a = points[0].angle;
    v = points[0].index;
    u = 0;
    for (i = 1; i < plen; ++i) {
      j = points[i].index;
      if (a == points[i].angle) {
        x1 = vertices[v][0] - vertices[h][0];
        y1 = vertices[v][1] - vertices[h][1];
        x2 = vertices[j][0] - vertices[h][0];
        y2 = vertices[j][1] - vertices[h][1];
        if (x1 * x1 + y1 * y1 >= x2 * x2 + y2 * y2) {
          points[i].index = -1;
        } else {
          points[u].index = -1;
          a = points[i].angle;
          u = i;
          v = j;
        }
      } else {
        a = points[i].angle;
        u = i;
        v = j;
      }
    }
    stack.push(h);
    for (i = 0, j = 0; i < 2; ++j) {
      if (points[j].index !== -1) {
        stack.push(points[j].index);
        i++;
      }
    }
    sp = stack.length;
    for (;j < plen; ++j) {
      if (points[j].index === -1) continue;
      while (!d3_geom_hullCCW(stack[sp - 2], stack[sp - 1], points[j].index, vertices)) {
        --sp;
      }
      stack[sp++] = points[j].index;
    }
    var poly = [];
    for (i = 0; i < sp; ++i) {
      poly.push(vertices[stack[i]]);
    }
    return poly;
  };
  function d3_geom_hullCCW(i1, i2, i3, v) {
    var t, a, b, c, d, e, f;
    t = v[i1];
    a = t[0];
    b = t[1];
    t = v[i2];
    c = t[0];
    d = t[1];
    t = v[i3];
    e = t[0];
    f = t[1];
    return (f - b) * (c - a) - (d - b) * (e - a) > 0;
  }
  d3.geom.polygon = function(coordinates) {
    coordinates.area = function() {
      var i = 0, n = coordinates.length, area = coordinates[n - 1][1] * coordinates[0][0] - coordinates[n - 1][0] * coordinates[0][1];
      while (++i < n) {
        area += coordinates[i - 1][1] * coordinates[i][0] - coordinates[i - 1][0] * coordinates[i][1];
      }
      return area * .5;
    };
    coordinates.centroid = function(k) {
      var i = -1, n = coordinates.length, x = 0, y = 0, a, b = coordinates[n - 1], c;
      if (!arguments.length) k = -1 / (6 * coordinates.area());
      while (++i < n) {
        a = b;
        b = coordinates[i];
        c = a[0] * b[1] - b[0] * a[1];
        x += (a[0] + b[0]) * c;
        y += (a[1] + b[1]) * c;
      }
      return [ x * k, y * k ];
    };
    coordinates.clip = function(subject) {
      var input, i = -1, n = coordinates.length, j, m, a = coordinates[n - 1], b, c, d;
      while (++i < n) {
        input = subject.slice();
        subject.length = 0;
        b = coordinates[i];
        c = input[(m = input.length) - 1];
        j = -1;
        while (++j < m) {
          d = input[j];
          if (d3_geom_polygonInside(d, a, b)) {
            if (!d3_geom_polygonInside(c, a, b)) {
              subject.push(d3_geom_polygonIntersect(c, d, a, b));
            }
            subject.push(d);
          } else if (d3_geom_polygonInside(c, a, b)) {
            subject.push(d3_geom_polygonIntersect(c, d, a, b));
          }
          c = d;
        }
        a = b;
      }
      return subject;
    };
    return coordinates;
  };
  function d3_geom_polygonInside(p, a, b) {
    return (b[0] - a[0]) * (p[1] - a[1]) < (b[1] - a[1]) * (p[0] - a[0]);
  }
  function d3_geom_polygonIntersect(c, d, a, b) {
    var x1 = c[0], x3 = a[0], x21 = d[0] - x1, x43 = b[0] - x3, y1 = c[1], y3 = a[1], y21 = d[1] - y1, y43 = b[1] - y3, ua = (x43 * (y1 - y3) - y43 * (x1 - x3)) / (y43 * x21 - x43 * y21);
    return [ x1 + ua * x21, y1 + ua * y21 ];
  }
  d3.geom.voronoi = function(vertices) {
    var polygons = vertices.map(function() {
      return [];
    }), Z = 1e6;
    d3_voronoi_tessellate(vertices, function(e) {
      var s1, s2, x1, x2, y1, y2;
      if (e.a === 1 && e.b >= 0) {
        s1 = e.ep.r;
        s2 = e.ep.l;
      } else {
        s1 = e.ep.l;
        s2 = e.ep.r;
      }
      if (e.a === 1) {
        y1 = s1 ? s1.y : -Z;
        x1 = e.c - e.b * y1;
        y2 = s2 ? s2.y : Z;
        x2 = e.c - e.b * y2;
      } else {
        x1 = s1 ? s1.x : -Z;
        y1 = e.c - e.a * x1;
        x2 = s2 ? s2.x : Z;
        y2 = e.c - e.a * x2;
      }
      var v1 = [ x1, y1 ], v2 = [ x2, y2 ];
      polygons[e.region.l.index].push(v1, v2);
      polygons[e.region.r.index].push(v1, v2);
    });
    polygons = polygons.map(function(polygon, i) {
      var cx = vertices[i][0], cy = vertices[i][1], angle = polygon.map(function(v) {
        return Math.atan2(v[0] - cx, v[1] - cy);
      }), order = d3.range(polygon.length).sort(function(a, b) {
        return angle[a] - angle[b];
      });
      return order.filter(function(d, i) {
        return !i || angle[d] - angle[order[i - 1]] > ε;
      }).map(function(d) {
        return polygon[d];
      });
    });
    polygons.forEach(function(polygon, i) {
      var n = polygon.length;
      if (!n) return polygon.push([ -Z, -Z ], [ -Z, Z ], [ Z, Z ], [ Z, -Z ]);
      if (n > 2) return;
      var p0 = vertices[i], p1 = polygon[0], p2 = polygon[1], x0 = p0[0], y0 = p0[1], x1 = p1[0], y1 = p1[1], x2 = p2[0], y2 = p2[1], dx = Math.abs(x2 - x1), dy = y2 - y1;
      if (Math.abs(dy) < ε) {
        var y = y0 < y1 ? -Z : Z;
        polygon.push([ -Z, y ], [ Z, y ]);
      } else if (dx < ε) {
        var x = x0 < x1 ? -Z : Z;
        polygon.push([ x, -Z ], [ x, Z ]);
      } else {
        var y = (x2 - x1) * (y1 - y0) < (x1 - x0) * (y2 - y1) ? Z : -Z, z = Math.abs(dy) - dx;
        if (Math.abs(z) < ε) {
          polygon.push([ dy < 0 ? y : -y, y ]);
        } else {
          if (z > 0) y *= -1;
          polygon.push([ -Z, y ], [ Z, y ]);
        }
      }
    });
    return polygons;
  };
  var d3_voronoi_opposite = {
    l: "r",
    r: "l"
  };
  function d3_voronoi_tessellate(vertices, callback) {
    var Sites = {
      list: vertices.map(function(v, i) {
        return {
          index: i,
          x: v[0],
          y: v[1]
        };
      }).sort(function(a, b) {
        return a.y < b.y ? -1 : a.y > b.y ? 1 : a.x < b.x ? -1 : a.x > b.x ? 1 : 0;
      }),
      bottomSite: null
    };
    var EdgeList = {
      list: [],
      leftEnd: null,
      rightEnd: null,
      init: function() {
        EdgeList.leftEnd = EdgeList.createHalfEdge(null, "l");
        EdgeList.rightEnd = EdgeList.createHalfEdge(null, "l");
        EdgeList.leftEnd.r = EdgeList.rightEnd;
        EdgeList.rightEnd.l = EdgeList.leftEnd;
        EdgeList.list.unshift(EdgeList.leftEnd, EdgeList.rightEnd);
      },
      createHalfEdge: function(edge, side) {
        return {
          edge: edge,
          side: side,
          vertex: null,
          l: null,
          r: null
        };
      },
      insert: function(lb, he) {
        he.l = lb;
        he.r = lb.r;
        lb.r.l = he;
        lb.r = he;
      },
      leftBound: function(p) {
        var he = EdgeList.leftEnd;
        do {
          he = he.r;
        } while (he != EdgeList.rightEnd && Geom.rightOf(he, p));
        he = he.l;
        return he;
      },
      del: function(he) {
        he.l.r = he.r;
        he.r.l = he.l;
        he.edge = null;
      },
      right: function(he) {
        return he.r;
      },
      left: function(he) {
        return he.l;
      },
      leftRegion: function(he) {
        return he.edge == null ? Sites.bottomSite : he.edge.region[he.side];
      },
      rightRegion: function(he) {
        return he.edge == null ? Sites.bottomSite : he.edge.region[d3_voronoi_opposite[he.side]];
      }
    };
    var Geom = {
      bisect: function(s1, s2) {
        var newEdge = {
          region: {
            l: s1,
            r: s2
          },
          ep: {
            l: null,
            r: null
          }
        };
        var dx = s2.x - s1.x, dy = s2.y - s1.y, adx = dx > 0 ? dx : -dx, ady = dy > 0 ? dy : -dy;
        newEdge.c = s1.x * dx + s1.y * dy + (dx * dx + dy * dy) * .5;
        if (adx > ady) {
          newEdge.a = 1;
          newEdge.b = dy / dx;
          newEdge.c /= dx;
        } else {
          newEdge.b = 1;
          newEdge.a = dx / dy;
          newEdge.c /= dy;
        }
        return newEdge;
      },
      intersect: function(el1, el2) {
        var e1 = el1.edge, e2 = el2.edge;
        if (!e1 || !e2 || e1.region.r == e2.region.r) {
          return null;
        }
        var d = e1.a * e2.b - e1.b * e2.a;
        if (Math.abs(d) < 1e-10) {
          return null;
        }
        var xint = (e1.c * e2.b - e2.c * e1.b) / d, yint = (e2.c * e1.a - e1.c * e2.a) / d, e1r = e1.region.r, e2r = e2.region.r, el, e;
        if (e1r.y < e2r.y || e1r.y == e2r.y && e1r.x < e2r.x) {
          el = el1;
          e = e1;
        } else {
          el = el2;
          e = e2;
        }
        var rightOfSite = xint >= e.region.r.x;
        if (rightOfSite && el.side === "l" || !rightOfSite && el.side === "r") {
          return null;
        }
        return {
          x: xint,
          y: yint
        };
      },
      rightOf: function(he, p) {
        var e = he.edge, topsite = e.region.r, rightOfSite = p.x > topsite.x;
        if (rightOfSite && he.side === "l") {
          return 1;
        }
        if (!rightOfSite && he.side === "r") {
          return 0;
        }
        if (e.a === 1) {
          var dyp = p.y - topsite.y, dxp = p.x - topsite.x, fast = 0, above = 0;
          if (!rightOfSite && e.b < 0 || rightOfSite && e.b >= 0) {
            above = fast = dyp >= e.b * dxp;
          } else {
            above = p.x + p.y * e.b > e.c;
            if (e.b < 0) {
              above = !above;
            }
            if (!above) {
              fast = 1;
            }
          }
          if (!fast) {
            var dxs = topsite.x - e.region.l.x;
            above = e.b * (dxp * dxp - dyp * dyp) < dxs * dyp * (1 + 2 * dxp / dxs + e.b * e.b);
            if (e.b < 0) {
              above = !above;
            }
          }
        } else {
          var yl = e.c - e.a * p.x, t1 = p.y - yl, t2 = p.x - topsite.x, t3 = yl - topsite.y;
          above = t1 * t1 > t2 * t2 + t3 * t3;
        }
        return he.side === "l" ? above : !above;
      },
      endPoint: function(edge, side, site) {
        edge.ep[side] = site;
        if (!edge.ep[d3_voronoi_opposite[side]]) return;
        callback(edge);
      },
      distance: function(s, t) {
        var dx = s.x - t.x, dy = s.y - t.y;
        return Math.sqrt(dx * dx + dy * dy);
      }
    };
    var EventQueue = {
      list: [],
      insert: function(he, site, offset) {
        he.vertex = site;
        he.ystar = site.y + offset;
        for (var i = 0, list = EventQueue.list, l = list.length; i < l; i++) {
          var next = list[i];
          if (he.ystar > next.ystar || he.ystar == next.ystar && site.x > next.vertex.x) {
            continue;
          } else {
            break;
          }
        }
        list.splice(i, 0, he);
      },
      del: function(he) {
        for (var i = 0, ls = EventQueue.list, l = ls.length; i < l && ls[i] != he; ++i) {}
        ls.splice(i, 1);
      },
      empty: function() {
        return EventQueue.list.length === 0;
      },
      nextEvent: function(he) {
        for (var i = 0, ls = EventQueue.list, l = ls.length; i < l; ++i) {
          if (ls[i] == he) return ls[i + 1];
        }
        return null;
      },
      min: function() {
        var elem = EventQueue.list[0];
        return {
          x: elem.vertex.x,
          y: elem.ystar
        };
      },
      extractMin: function() {
        return EventQueue.list.shift();
      }
    };
    EdgeList.init();
    Sites.bottomSite = Sites.list.shift();
    var newSite = Sites.list.shift(), newIntStar;
    var lbnd, rbnd, llbnd, rrbnd, bisector;
    var bot, top, temp, p, v;
    var e, pm;
    while (true) {
      if (!EventQueue.empty()) {
        newIntStar = EventQueue.min();
      }
      if (newSite && (EventQueue.empty() || newSite.y < newIntStar.y || newSite.y == newIntStar.y && newSite.x < newIntStar.x)) {
        lbnd = EdgeList.leftBound(newSite);
        rbnd = EdgeList.right(lbnd);
        bot = EdgeList.rightRegion(lbnd);
        e = Geom.bisect(bot, newSite);
        bisector = EdgeList.createHalfEdge(e, "l");
        EdgeList.insert(lbnd, bisector);
        p = Geom.intersect(lbnd, bisector);
        if (p) {
          EventQueue.del(lbnd);
          EventQueue.insert(lbnd, p, Geom.distance(p, newSite));
        }
        lbnd = bisector;
        bisector = EdgeList.createHalfEdge(e, "r");
        EdgeList.insert(lbnd, bisector);
        p = Geom.intersect(bisector, rbnd);
        if (p) {
          EventQueue.insert(bisector, p, Geom.distance(p, newSite));
        }
        newSite = Sites.list.shift();
      } else if (!EventQueue.empty()) {
        lbnd = EventQueue.extractMin();
        llbnd = EdgeList.left(lbnd);
        rbnd = EdgeList.right(lbnd);
        rrbnd = EdgeList.right(rbnd);
        bot = EdgeList.leftRegion(lbnd);
        top = EdgeList.rightRegion(rbnd);
        v = lbnd.vertex;
        Geom.endPoint(lbnd.edge, lbnd.side, v);
        Geom.endPoint(rbnd.edge, rbnd.side, v);
        EdgeList.del(lbnd);
        EventQueue.del(rbnd);
        EdgeList.del(rbnd);
        pm = "l";
        if (bot.y > top.y) {
          temp = bot;
          bot = top;
          top = temp;
          pm = "r";
        }
        e = Geom.bisect(bot, top);
        bisector = EdgeList.createHalfEdge(e, pm);
        EdgeList.insert(llbnd, bisector);
        Geom.endPoint(e, d3_voronoi_opposite[pm], v);
        p = Geom.intersect(llbnd, bisector);
        if (p) {
          EventQueue.del(llbnd);
          EventQueue.insert(llbnd, p, Geom.distance(p, bot));
        }
        p = Geom.intersect(bisector, rrbnd);
        if (p) {
          EventQueue.insert(bisector, p, Geom.distance(p, bot));
        }
      } else {
        break;
      }
    }
    for (lbnd = EdgeList.right(EdgeList.leftEnd); lbnd != EdgeList.rightEnd; lbnd = EdgeList.right(lbnd)) {
      callback(lbnd.edge);
    }
  }
  d3.geom.delaunay = function(vertices) {
    var edges = vertices.map(function() {
      return [];
    }), triangles = [];
    d3_voronoi_tessellate(vertices, function(e) {
      edges[e.region.l.index].push(vertices[e.region.r.index]);
    });
    edges.forEach(function(edge, i) {
      var v = vertices[i], cx = v[0], cy = v[1];
      edge.forEach(function(v) {
        v.angle = Math.atan2(v[0] - cx, v[1] - cy);
      });
      edge.sort(function(a, b) {
        return a.angle - b.angle;
      });
      for (var j = 0, m = edge.length - 1; j < m; j++) {
        triangles.push([ v, edge[j], edge[j + 1] ]);
      }
    });
    return triangles;
  };
  d3.geom.quadtree = function(points, x1, y1, x2, y2) {
    var p, i = -1, n = points.length;
    if (arguments.length < 5) {
      if (arguments.length === 3) {
        y2 = y1;
        x2 = x1;
        y1 = x1 = 0;
      } else {
        x1 = y1 = Infinity;
        x2 = y2 = -Infinity;
        while (++i < n) {
          p = points[i];
          if (p.x < x1) x1 = p.x;
          if (p.y < y1) y1 = p.y;
          if (p.x > x2) x2 = p.x;
          if (p.y > y2) y2 = p.y;
        }
      }
    }
    var dx = x2 - x1, dy = y2 - y1;
    if (dx > dy) y2 = y1 + dx; else x2 = x1 + dy;
    function insert(n, p, x1, y1, x2, y2) {
      if (isNaN(p.x) || isNaN(p.y)) return;
      if (n.leaf) {
        var v = n.point;
        if (v) {
          if (Math.abs(v.x - p.x) + Math.abs(v.y - p.y) < .01) {
            insertChild(n, p, x1, y1, x2, y2);
          } else {
            n.point = null;
            insertChild(n, v, x1, y1, x2, y2);
            insertChild(n, p, x1, y1, x2, y2);
          }
        } else {
          n.point = p;
        }
      } else {
        insertChild(n, p, x1, y1, x2, y2);
      }
    }
    function insertChild(n, p, x1, y1, x2, y2) {
      var sx = (x1 + x2) * .5, sy = (y1 + y2) * .5, right = p.x >= sx, bottom = p.y >= sy, i = (bottom << 1) + right;
      n.leaf = false;
      n = n.nodes[i] || (n.nodes[i] = d3_geom_quadtreeNode());
      if (right) x1 = sx; else x2 = sx;
      if (bottom) y1 = sy; else y2 = sy;
      insert(n, p, x1, y1, x2, y2);
    }
    var root = d3_geom_quadtreeNode();
    root.add = function(p) {
      insert(root, p, x1, y1, x2, y2);
    };
    root.visit = function(f) {
      d3_geom_quadtreeVisit(f, root, x1, y1, x2, y2);
    };
    points.forEach(root.add);
    return root;
  };
  function d3_geom_quadtreeNode() {
    return {
      leaf: true,
      nodes: [],
      point: null
    };
  }
  function d3_geom_quadtreeVisit(f, node, x1, y1, x2, y2) {
    if (!f(node, x1, y1, x2, y2)) {
      var sx = (x1 + x2) * .5, sy = (y1 + y2) * .5, children = node.nodes;
      if (children[0]) d3_geom_quadtreeVisit(f, children[0], x1, y1, sx, sy);
      if (children[1]) d3_geom_quadtreeVisit(f, children[1], sx, y1, x2, sy);
      if (children[2]) d3_geom_quadtreeVisit(f, children[2], x1, sy, sx, y2);
      if (children[3]) d3_geom_quadtreeVisit(f, children[3], sx, sy, x2, y2);
    }
  }
  d3.time = {};
  var d3_time = Date, d3_time_daySymbols = [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" ];
  function d3_time_utc() {
    this._ = new Date(arguments.length > 1 ? Date.UTC.apply(this, arguments) : arguments[0]);
  }
  d3_time_utc.prototype = {
    getDate: function() {
      return this._.getUTCDate();
    },
    getDay: function() {
      return this._.getUTCDay();
    },
    getFullYear: function() {
      return this._.getUTCFullYear();
    },
    getHours: function() {
      return this._.getUTCHours();
    },
    getMilliseconds: function() {
      return this._.getUTCMilliseconds();
    },
    getMinutes: function() {
      return this._.getUTCMinutes();
    },
    getMonth: function() {
      return this._.getUTCMonth();
    },
    getSeconds: function() {
      return this._.getUTCSeconds();
    },
    getTime: function() {
      return this._.getTime();
    },
    getTimezoneOffset: function() {
      return 0;
    },
    valueOf: function() {
      return this._.valueOf();
    },
    setDate: function() {
      d3_time_prototype.setUTCDate.apply(this._, arguments);
    },
    setDay: function() {
      d3_time_prototype.setUTCDay.apply(this._, arguments);
    },
    setFullYear: function() {
      d3_time_prototype.setUTCFullYear.apply(this._, arguments);
    },
    setHours: function() {
      d3_time_prototype.setUTCHours.apply(this._, arguments);
    },
    setMilliseconds: function() {
      d3_time_prototype.setUTCMilliseconds.apply(this._, arguments);
    },
    setMinutes: function() {
      d3_time_prototype.setUTCMinutes.apply(this._, arguments);
    },
    setMonth: function() {
      d3_time_prototype.setUTCMonth.apply(this._, arguments);
    },
    setSeconds: function() {
      d3_time_prototype.setUTCSeconds.apply(this._, arguments);
    },
    setTime: function() {
      d3_time_prototype.setTime.apply(this._, arguments);
    }
  };
  var d3_time_prototype = Date.prototype;
  var d3_time_formatDateTime = "%a %b %e %X %Y", d3_time_formatDate = "%m/%d/%Y", d3_time_formatTime = "%H:%M:%S";
  var d3_time_days = [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" ], d3_time_dayAbbreviations = [ "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" ], d3_time_months = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ], d3_time_monthAbbreviations = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];
  d3.time.format = function(template) {
    var n = template.length;
    function format(date) {
      var string = [], i = -1, j = 0, c, p, f;
      while (++i < n) {
        if (template.charCodeAt(i) === 37) {
          string.push(template.substring(j, i));
          if ((p = d3_time_formatPads[c = template.charAt(++i)]) != null) c = template.charAt(++i);
          if (f = d3_time_formats[c]) c = f(date, p == null ? c === "e" ? " " : "0" : p);
          string.push(c);
          j = i + 1;
        }
      }
      string.push(template.substring(j, i));
      return string.join("");
    }
    format.parse = function(string) {
      var d = {
        y: 1900,
        m: 0,
        d: 1,
        H: 0,
        M: 0,
        S: 0,
        L: 0
      }, i = d3_time_parse(d, template, string, 0);
      if (i != string.length) return null;
      if ("p" in d) d.H = d.H % 12 + d.p * 12;
      var date = new d3_time();
      date.setFullYear(d.y, d.m, d.d);
      date.setHours(d.H, d.M, d.S, d.L);
      return date;
    };
    format.toString = function() {
      return template;
    };
    return format;
  };
  function d3_time_parse(date, template, string, j) {
    var c, p, i = 0, n = template.length, m = string.length;
    while (i < n) {
      if (j >= m) return -1;
      c = template.charCodeAt(i++);
      if (c === 37) {
        p = d3_time_parsers[template.charAt(i++)];
        if (!p || (j = p(date, string, j)) < 0) return -1;
      } else if (c != string.charCodeAt(j++)) {
        return -1;
      }
    }
    return j;
  }
  function d3_time_formatRe(names) {
    return new RegExp("^(?:" + names.map(d3.requote).join("|") + ")", "i");
  }
  function d3_time_formatLookup(names) {
    var map = new d3_Map(), i = -1, n = names.length;
    while (++i < n) map.set(names[i].toLowerCase(), i);
    return map;
  }
  function d3_time_formatPad(value, fill, width) {
    value += "";
    var length = value.length;
    return length < width ? new Array(width - length + 1).join(fill) + value : value;
  }
  var d3_time_dayRe = d3_time_formatRe(d3_time_days), d3_time_dayAbbrevRe = d3_time_formatRe(d3_time_dayAbbreviations), d3_time_monthRe = d3_time_formatRe(d3_time_months), d3_time_monthLookup = d3_time_formatLookup(d3_time_months), d3_time_monthAbbrevRe = d3_time_formatRe(d3_time_monthAbbreviations), d3_time_monthAbbrevLookup = d3_time_formatLookup(d3_time_monthAbbreviations);
  var d3_time_formatPads = {
    "-": "",
    _: " ",
    "0": "0"
  };
  var d3_time_formats = {
    a: function(d) {
      return d3_time_dayAbbreviations[d.getDay()];
    },
    A: function(d) {
      return d3_time_days[d.getDay()];
    },
    b: function(d) {
      return d3_time_monthAbbreviations[d.getMonth()];
    },
    B: function(d) {
      return d3_time_months[d.getMonth()];
    },
    c: d3.time.format(d3_time_formatDateTime),
    d: function(d, p) {
      return d3_time_formatPad(d.getDate(), p, 2);
    },
    e: function(d, p) {
      return d3_time_formatPad(d.getDate(), p, 2);
    },
    H: function(d, p) {
      return d3_time_formatPad(d.getHours(), p, 2);
    },
    I: function(d, p) {
      return d3_time_formatPad(d.getHours() % 12 || 12, p, 2);
    },
    j: function(d, p) {
      return d3_time_formatPad(1 + d3.time.dayOfYear(d), p, 3);
    },
    L: function(d, p) {
      return d3_time_formatPad(d.getMilliseconds(), p, 3);
    },
    m: function(d, p) {
      return d3_time_formatPad(d.getMonth() + 1, p, 2);
    },
    M: function(d, p) {
      return d3_time_formatPad(d.getMinutes(), p, 2);
    },
    p: function(d) {
      return d.getHours() >= 12 ? "PM" : "AM";
    },
    S: function(d, p) {
      return d3_time_formatPad(d.getSeconds(), p, 2);
    },
    U: function(d, p) {
      return d3_time_formatPad(d3.time.sundayOfYear(d), p, 2);
    },
    w: function(d) {
      return d.getDay();
    },
    W: function(d, p) {
      return d3_time_formatPad(d3.time.mondayOfYear(d), p, 2);
    },
    x: d3.time.format(d3_time_formatDate),
    X: d3.time.format(d3_time_formatTime),
    y: function(d, p) {
      return d3_time_formatPad(d.getFullYear() % 100, p, 2);
    },
    Y: function(d, p) {
      return d3_time_formatPad(d.getFullYear() % 1e4, p, 4);
    },
    Z: d3_time_zone,
    "%": function() {
      return "%";
    }
  };
  var d3_time_parsers = {
    a: d3_time_parseWeekdayAbbrev,
    A: d3_time_parseWeekday,
    b: d3_time_parseMonthAbbrev,
    B: d3_time_parseMonth,
    c: d3_time_parseLocaleFull,
    d: d3_time_parseDay,
    e: d3_time_parseDay,
    H: d3_time_parseHour24,
    I: d3_time_parseHour24,
    L: d3_time_parseMilliseconds,
    m: d3_time_parseMonthNumber,
    M: d3_time_parseMinutes,
    p: d3_time_parseAmPm,
    S: d3_time_parseSeconds,
    x: d3_time_parseLocaleDate,
    X: d3_time_parseLocaleTime,
    y: d3_time_parseYear,
    Y: d3_time_parseFullYear
  };
  function d3_time_parseWeekdayAbbrev(date, string, i) {
    d3_time_dayAbbrevRe.lastIndex = 0;
    var n = d3_time_dayAbbrevRe.exec(string.substring(i));
    return n ? i += n[0].length : -1;
  }
  function d3_time_parseWeekday(date, string, i) {
    d3_time_dayRe.lastIndex = 0;
    var n = d3_time_dayRe.exec(string.substring(i));
    return n ? i += n[0].length : -1;
  }
  function d3_time_parseMonthAbbrev(date, string, i) {
    d3_time_monthAbbrevRe.lastIndex = 0;
    var n = d3_time_monthAbbrevRe.exec(string.substring(i));
    return n ? (date.m = d3_time_monthAbbrevLookup.get(n[0].toLowerCase()), i += n[0].length) : -1;
  }
  function d3_time_parseMonth(date, string, i) {
    d3_time_monthRe.lastIndex = 0;
    var n = d3_time_monthRe.exec(string.substring(i));
    return n ? (date.m = d3_time_monthLookup.get(n[0].toLowerCase()), i += n[0].length) : -1;
  }
  function d3_time_parseLocaleFull(date, string, i) {
    return d3_time_parse(date, d3_time_formats.c.toString(), string, i);
  }
  function d3_time_parseLocaleDate(date, string, i) {
    return d3_time_parse(date, d3_time_formats.x.toString(), string, i);
  }
  function d3_time_parseLocaleTime(date, string, i) {
    return d3_time_parse(date, d3_time_formats.X.toString(), string, i);
  }
  function d3_time_parseFullYear(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.substring(i, i + 4));
    return n ? (date.y = +n[0], i += n[0].length) : -1;
  }
  function d3_time_parseYear(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.substring(i, i + 2));
    return n ? (date.y = d3_time_expandYear(+n[0]), i += n[0].length) : -1;
  }
  function d3_time_expandYear(d) {
    return d + (d > 68 ? 1900 : 2e3);
  }
  function d3_time_parseMonthNumber(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.substring(i, i + 2));
    return n ? (date.m = n[0] - 1, i += n[0].length) : -1;
  }
  function d3_time_parseDay(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.substring(i, i + 2));
    return n ? (date.d = +n[0], i += n[0].length) : -1;
  }
  function d3_time_parseHour24(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.substring(i, i + 2));
    return n ? (date.H = +n[0], i += n[0].length) : -1;
  }
  function d3_time_parseMinutes(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.substring(i, i + 2));
    return n ? (date.M = +n[0], i += n[0].length) : -1;
  }
  function d3_time_parseSeconds(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.substring(i, i + 2));
    return n ? (date.S = +n[0], i += n[0].length) : -1;
  }
  function d3_time_parseMilliseconds(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.substring(i, i + 3));
    return n ? (date.L = +n[0], i += n[0].length) : -1;
  }
  var d3_time_numberRe = /^\s*\d+/;
  function d3_time_parseAmPm(date, string, i) {
    var n = d3_time_amPmLookup.get(string.substring(i, i += 2).toLowerCase());
    return n == null ? -1 : (date.p = n, i);
  }
  var d3_time_amPmLookup = d3.map({
    am: 0,
    pm: 1
  });
  function d3_time_zone(d) {
    var z = d.getTimezoneOffset(), zs = z > 0 ? "-" : "+", zh = ~~(Math.abs(z) / 60), zm = Math.abs(z) % 60;
    return zs + d3_time_formatPad(zh, "0", 2) + d3_time_formatPad(zm, "0", 2);
  }
  d3.time.format.utc = function(template) {
    var local = d3.time.format(template);
    function format(date) {
      try {
        d3_time = d3_time_utc;
        var utc = new d3_time();
        utc._ = date;
        return local(utc);
      } finally {
        d3_time = Date;
      }
    }
    format.parse = function(string) {
      try {
        d3_time = d3_time_utc;
        var date = local.parse(string);
        return date && date._;
      } finally {
        d3_time = Date;
      }
    };
    format.toString = local.toString;
    return format;
  };
  var d3_time_formatIso = d3.time.format.utc("%Y-%m-%dT%H:%M:%S.%LZ");
  d3.time.format.iso = Date.prototype.toISOString && +new Date("2000-01-01T00:00:00.000Z") ? d3_time_formatIsoNative : d3_time_formatIso;
  function d3_time_formatIsoNative(date) {
    return date.toISOString();
  }
  d3_time_formatIsoNative.parse = function(string) {
    var date = new Date(string);
    return isNaN(date) ? null : date;
  };
  d3_time_formatIsoNative.toString = d3_time_formatIso.toString;
  function d3_time_interval(local, step, number) {
    function round(date) {
      var d0 = local(date), d1 = offset(d0, 1);
      return date - d0 < d1 - date ? d0 : d1;
    }
    function ceil(date) {
      step(date = local(new d3_time(date - 1)), 1);
      return date;
    }
    function offset(date, k) {
      step(date = new d3_time(+date), k);
      return date;
    }
    function range(t0, t1, dt) {
      var time = ceil(t0), times = [];
      if (dt > 1) {
        while (time < t1) {
          if (!(number(time) % dt)) times.push(new Date(+time));
          step(time, 1);
        }
      } else {
        while (time < t1) times.push(new Date(+time)), step(time, 1);
      }
      return times;
    }
    function range_utc(t0, t1, dt) {
      try {
        d3_time = d3_time_utc;
        var utc = new d3_time_utc();
        utc._ = t0;
        return range(utc, t1, dt);
      } finally {
        d3_time = Date;
      }
    }
    local.floor = local;
    local.round = round;
    local.ceil = ceil;
    local.offset = offset;
    local.range = range;
    var utc = local.utc = d3_time_interval_utc(local);
    utc.floor = utc;
    utc.round = d3_time_interval_utc(round);
    utc.ceil = d3_time_interval_utc(ceil);
    utc.offset = d3_time_interval_utc(offset);
    utc.range = range_utc;
    return local;
  }
  function d3_time_interval_utc(method) {
    return function(date, k) {
      try {
        d3_time = d3_time_utc;
        var utc = new d3_time_utc();
        utc._ = date;
        return method(utc, k)._;
      } finally {
        d3_time = Date;
      }
    };
  }
  d3.time.second = d3_time_interval(function(date) {
    return new d3_time(Math.floor(date / 1e3) * 1e3);
  }, function(date, offset) {
    date.setTime(date.getTime() + Math.floor(offset) * 1e3);
  }, function(date) {
    return date.getSeconds();
  });
  d3.time.seconds = d3.time.second.range;
  d3.time.seconds.utc = d3.time.second.utc.range;
  d3.time.minute = d3_time_interval(function(date) {
    return new d3_time(Math.floor(date / 6e4) * 6e4);
  }, function(date, offset) {
    date.setTime(date.getTime() + Math.floor(offset) * 6e4);
  }, function(date) {
    return date.getMinutes();
  });
  d3.time.minutes = d3.time.minute.range;
  d3.time.minutes.utc = d3.time.minute.utc.range;
  d3.time.hour = d3_time_interval(function(date) {
    var timezone = date.getTimezoneOffset() / 60;
    return new d3_time((Math.floor(date / 36e5 - timezone) + timezone) * 36e5);
  }, function(date, offset) {
    date.setTime(date.getTime() + Math.floor(offset) * 36e5);
  }, function(date) {
    return date.getHours();
  });
  d3.time.hours = d3.time.hour.range;
  d3.time.hours.utc = d3.time.hour.utc.range;
  d3.time.day = d3_time_interval(function(date) {
    var day = new d3_time(1970, 0);
    day.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    return day;
  }, function(date, offset) {
    date.setDate(date.getDate() + offset);
  }, function(date) {
    return date.getDate() - 1;
  });
  d3.time.days = d3.time.day.range;
  d3.time.days.utc = d3.time.day.utc.range;
  d3.time.dayOfYear = function(date) {
    var year = d3.time.year(date);
    return Math.floor((date - year - (date.getTimezoneOffset() - year.getTimezoneOffset()) * 6e4) / 864e5);
  };
  d3_time_daySymbols.forEach(function(day, i) {
    day = day.toLowerCase();
    i = 7 - i;
    var interval = d3.time[day] = d3_time_interval(function(date) {
      (date = d3.time.day(date)).setDate(date.getDate() - (date.getDay() + i) % 7);
      return date;
    }, function(date, offset) {
      date.setDate(date.getDate() + Math.floor(offset) * 7);
    }, function(date) {
      var day = d3.time.year(date).getDay();
      return Math.floor((d3.time.dayOfYear(date) + (day + i) % 7) / 7) - (day !== i);
    });
    d3.time[day + "s"] = interval.range;
    d3.time[day + "s"].utc = interval.utc.range;
    d3.time[day + "OfYear"] = function(date) {
      var day = d3.time.year(date).getDay();
      return Math.floor((d3.time.dayOfYear(date) + (day + i) % 7) / 7);
    };
  });
  d3.time.week = d3.time.sunday;
  d3.time.weeks = d3.time.sunday.range;
  d3.time.weeks.utc = d3.time.sunday.utc.range;
  d3.time.weekOfYear = d3.time.sundayOfYear;
  d3.time.month = d3_time_interval(function(date) {
    date = d3.time.day(date);
    date.setDate(1);
    return date;
  }, function(date, offset) {
    date.setMonth(date.getMonth() + offset);
  }, function(date) {
    return date.getMonth();
  });
  d3.time.months = d3.time.month.range;
  d3.time.months.utc = d3.time.month.utc.range;
  d3.time.year = d3_time_interval(function(date) {
    date = d3.time.day(date);
    date.setMonth(0, 1);
    return date;
  }, function(date, offset) {
    date.setFullYear(date.getFullYear() + offset);
  }, function(date) {
    return date.getFullYear();
  });
  d3.time.years = d3.time.year.range;
  d3.time.years.utc = d3.time.year.utc.range;
  function d3_time_scale(linear, methods, format) {
    function scale(x) {
      return linear(x);
    }
    scale.invert = function(x) {
      return d3_time_scaleDate(linear.invert(x));
    };
    scale.domain = function(x) {
      if (!arguments.length) return linear.domain().map(d3_time_scaleDate);
      linear.domain(x);
      return scale;
    };
    scale.nice = function(m) {
      return scale.domain(d3_scale_nice(scale.domain(), function() {
        return m;
      }));
    };
    scale.ticks = function(m, k) {
      var extent = d3_time_scaleExtent(scale.domain());
      if (typeof m !== "function") {
        var span = extent[1] - extent[0], target = span / m, i = d3.bisect(d3_time_scaleSteps, target);
        if (i == d3_time_scaleSteps.length) return methods.year(extent, m);
        if (!i) return linear.ticks(m).map(d3_time_scaleDate);
        if (Math.log(target / d3_time_scaleSteps[i - 1]) < Math.log(d3_time_scaleSteps[i] / target)) --i;
        m = methods[i];
        k = m[1];
        m = m[0].range;
      }
      return m(extent[0], new Date(+extent[1] + 1), k);
    };
    scale.tickFormat = function() {
      return format;
    };
    scale.copy = function() {
      return d3_time_scale(linear.copy(), methods, format);
    };
    return d3.rebind(scale, linear, "range", "rangeRound", "interpolate", "clamp");
  }
  function d3_time_scaleExtent(domain) {
    var start = domain[0], stop = domain[domain.length - 1];
    return start < stop ? [ start, stop ] : [ stop, start ];
  }
  function d3_time_scaleDate(t) {
    return new Date(t);
  }
  function d3_time_scaleFormat(formats) {
    return function(date) {
      var i = formats.length - 1, f = formats[i];
      while (!f[1](date)) f = formats[--i];
      return f[0](date);
    };
  }
  function d3_time_scaleSetYear(y) {
    var d = new Date(y, 0, 1);
    d.setFullYear(y);
    return d;
  }
  function d3_time_scaleGetYear(d) {
    var y = d.getFullYear(), d0 = d3_time_scaleSetYear(y), d1 = d3_time_scaleSetYear(y + 1);
    return y + (d - d0) / (d1 - d0);
  }
  var d3_time_scaleSteps = [ 1e3, 5e3, 15e3, 3e4, 6e4, 3e5, 9e5, 18e5, 36e5, 108e5, 216e5, 432e5, 864e5, 1728e5, 6048e5, 2592e6, 7776e6, 31536e6 ];
  var d3_time_scaleLocalMethods = [ [ d3.time.second, 1 ], [ d3.time.second, 5 ], [ d3.time.second, 15 ], [ d3.time.second, 30 ], [ d3.time.minute, 1 ], [ d3.time.minute, 5 ], [ d3.time.minute, 15 ], [ d3.time.minute, 30 ], [ d3.time.hour, 1 ], [ d3.time.hour, 3 ], [ d3.time.hour, 6 ], [ d3.time.hour, 12 ], [ d3.time.day, 1 ], [ d3.time.day, 2 ], [ d3.time.week, 1 ], [ d3.time.month, 1 ], [ d3.time.month, 3 ], [ d3.time.year, 1 ] ];
  var d3_time_scaleLocalFormats = [ [ d3.time.format("%Y"), d3_true ], [ d3.time.format("%B"), function(d) {
    return d.getMonth();
  } ], [ d3.time.format("%b %d"), function(d) {
    return d.getDate() != 1;
  } ], [ d3.time.format("%a %d"), function(d) {
    return d.getDay() && d.getDate() != 1;
  } ], [ d3.time.format("%I %p"), function(d) {
    return d.getHours();
  } ], [ d3.time.format("%I:%M"), function(d) {
    return d.getMinutes();
  } ], [ d3.time.format(":%S"), function(d) {
    return d.getSeconds();
  } ], [ d3.time.format(".%L"), function(d) {
    return d.getMilliseconds();
  } ] ];
  var d3_time_scaleLinear = d3.scale.linear(), d3_time_scaleLocalFormat = d3_time_scaleFormat(d3_time_scaleLocalFormats);
  d3_time_scaleLocalMethods.year = function(extent, m) {
    return d3_time_scaleLinear.domain(extent.map(d3_time_scaleGetYear)).ticks(m).map(d3_time_scaleSetYear);
  };
  d3.time.scale = function() {
    return d3_time_scale(d3.scale.linear(), d3_time_scaleLocalMethods, d3_time_scaleLocalFormat);
  };
  var d3_time_scaleUTCMethods = d3_time_scaleLocalMethods.map(function(m) {
    return [ m[0].utc, m[1] ];
  });
  var d3_time_scaleUTCFormats = [ [ d3.time.format.utc("%Y"), d3_true ], [ d3.time.format.utc("%B"), function(d) {
    return d.getUTCMonth();
  } ], [ d3.time.format.utc("%b %d"), function(d) {
    return d.getUTCDate() != 1;
  } ], [ d3.time.format.utc("%a %d"), function(d) {
    return d.getUTCDay() && d.getUTCDate() != 1;
  } ], [ d3.time.format.utc("%I %p"), function(d) {
    return d.getUTCHours();
  } ], [ d3.time.format.utc("%I:%M"), function(d) {
    return d.getUTCMinutes();
  } ], [ d3.time.format.utc(":%S"), function(d) {
    return d.getUTCSeconds();
  } ], [ d3.time.format.utc(".%L"), function(d) {
    return d.getUTCMilliseconds();
  } ] ];
  var d3_time_scaleUTCFormat = d3_time_scaleFormat(d3_time_scaleUTCFormats);
  function d3_time_scaleUTCSetYear(y) {
    var d = new Date(Date.UTC(y, 0, 1));
    d.setUTCFullYear(y);
    return d;
  }
  function d3_time_scaleUTCGetYear(d) {
    var y = d.getUTCFullYear(), d0 = d3_time_scaleUTCSetYear(y), d1 = d3_time_scaleUTCSetYear(y + 1);
    return y + (d - d0) / (d1 - d0);
  }
  d3_time_scaleUTCMethods.year = function(extent, m) {
    return d3_time_scaleLinear.domain(extent.map(d3_time_scaleUTCGetYear)).ticks(m).map(d3_time_scaleUTCSetYear);
  };
  d3.time.scale.utc = function() {
    return d3_time_scale(d3.scale.linear(), d3_time_scaleUTCMethods, d3_time_scaleUTCFormat);
  };
  return d3;
}();
define("d3", (function (global) {
    return function () {
        var ret, fn;
        return ret || global.d3;
    };
}(this)));

// Array utility functions

define('core/array',[],
function () {
  

  var array;

  array = {

    /**
     * Finds the first occurance of an item in an array.
     */
    find: function (ary, fn) {
      var i, len = ary.length;
      for (i = 0; i < len; i += 1) {
        if (fn(ary[i])) {
          return ary[i];
        }
      }
    },

    /**
     * Search an array for the first element that satisfies
     *   a given condition and return its index.
     * @param {Array} arr The array to search.
     * @param {Function} f The function to call for every element. This function
     *     takes 3 arguments (the element, the index and the array) and should
     *     return a boolean.
     * @param {Object} optObj An optional "this" context for the function.
     * @return {number} The index of the first array element
     *    that passes the test, or -1 if no element is found.
     */
    findIndex: function (arr, fn, optObj) {
      var len, arr2, i;

      len = arr.length;  // must be fixed during loop... see docs
      arr2 = typeof arr === 'string' ? arr.split('') : arr;
      for (i = 0; i < len; i += 1) {
        if (i in arr2 && fn.call(optObj, arr2[i], i, arr)) {
          return i;
        }
      }
      return -1;
    },

    /**
     * Convert 'arguments' object into a real array,
     * starting at optional 'from' index.
     */
    convertArgs: function (args, from) {
      return Array.prototype.slice.call(args, from || 0);
    },

    /**
     * Appends array provided array
     * @param  {Array} arr
     * @param  {Array} arrToAppend
     */
    append: function (arr, arrToAppend) {
      Array.prototype.splice.apply(arr, [arr.length, 0].concat(arrToAppend));
      return arr;
    },

    /*
     * Converts input to an array object, if it isn't.
     * Returns empty array if input is null or undefined.
     */
    getArray: function (obj) {
      return obj ? (Array.isArray(obj) ? obj: [obj]) : [];
    },

    /**
     * Removes items from an array by mutating it.
     * @param {Array} arr The array to remove from.
     * @param {Object|Array} items The item or array of items to remove.
     * @return {Array} The items actually removed.
     */
    remove: function(arr, items) {
      var removedItems = [];
      array.getArray(items).forEach(function(item) {
        var index = arr.indexOf(item);
        if (index !== -1) {
          arr.splice(index, 1);
          removedItems.push(item);
        }
      });
      return removedItems;
    },

    /**
     * Check if an array contains an item.
     * @param {Array} arr The array to check.
     * @param {Object} item The item to check for.
     * @return {Boolean}
     */
    contains: function(arr, item) {
      if (item && Array.isArray(arr) && arr.length) {
        return arr.indexOf(item) !== -1;
      }
      return false;
    }

  };

  return array;

});

define('core/object',[
  'core/array'
],
function (array) {
  

  var Obj;
  Obj = {

    /**
     * Similar to underscore.js's extend() but es5 safe.
     */
    extend: function (target) {
      var sources = array.convertArgs(arguments, 1);
      sources.forEach(function (src) {
        if (typeof src !== 'object') {
          return;
        }
        Object.getOwnPropertyNames(src).forEach(function (propName) {
          Object.defineProperty(target, propName,
            Object.getOwnPropertyDescriptor(src, propName));
        });
      });
      return target;
    },

    isDef: function(val) {
      return val !== undefined;
    },

    isDefAndNotNull: function(val) {
      return val != null;
    },

    /**
     * Gets a property from an object by its path.
     *
     * @public
     * @prarm {Object} obj The object to retrieve from.
     * @param {String|Array} path The path to the property.
     * @return {Object}
     */
    get: function(obj, path) {
      var currentObj;
      currentObj = obj;
      if (!(this.isDefAndNotNull(path) && this.isDefAndNotNull(obj))) {
        return null;
      }
      array.getArray(path).every(function(p) {
        currentObj = currentObj[p];
        return this.isDefAndNotNull(currentObj);
      }, this);
      if (this.isDefAndNotNull(currentObj)) {
        return currentObj;
      }
      return null;
    },

    /**
     * Removes the list of items from the object
     *
     * @public
     * @prarm {Object} obj The object to remove from.
     * @param {String|Array} list The keys to remove
     * @return {Object}
     */
    remove: function(obj, list) {
      if (list) {
          if (typeof list === 'string') {
            delete obj[list];
          } else {
            list.forEach(function (l) {
              delete obj[l];
            });
          }
      }
      return obj;
    },

    /**
     * Overrides a method on an object. Passes a reference to the original
     *  "super" method as the first argument to the new method. The "super"
     *  will be bound to the original o object.
     *
     * @param {Object} o The object.
     * @param {String} methodName The name of the method to override.
     * @param {function} newFn The new function to replace it with.
     */
    override: function(o, methodName, newFn) {
      var supr;

      // supr method is the original method.
      supr = o[methodName].bind(o);
      // Replace the original method with the new one.
      o[methodName] = function() {
        var args = array.convertArgs(arguments, 0);
        // Pass reference to super method as 1st arg.
        args.unshift(supr);
        return newFn.apply(o, args);
      };
    }

  };

  return Obj;
});

/**
 * @fileOverview
 * Config mixin generator.
 * A function to generate a new object with a config() method.
 * Optionally adds various named getter/setter methods for individual
 * config options.
 */
define('core/config',[
  'core/object',
  'core/array'
],
function (obj, array) {
  

  var mixinGenerator;

  /**
   * Generates a config() mixin that gets/sets properties on the specified
   * configObj. Use with core.object.extend();
   * @param {Object} configObj Where to get/set properties.
   * @param {String} propNames... Optional series of property names to add
   *  convenience functions for.
   * @return {Object}
   */
  mixinGenerator = function(configObj) {

    var mixin = {},
        propNames = array.convertArgs(arguments, 1);

    function setValue(key, value) {
      configObj[key] = value;
    }

    function getValue(key) {
      return configObj[key];
    }

    // Generate all the individual property config functions.
    propNames.forEach(function (propName) {
      mixin[propName] = function (value) {
        if (!arguments.length) {
          return getValue(propName);
        }
        setValue(propName, value);
        return this;
      };
    }, this);

    /**
     * Adds specified methods to current context and rebinds them to src.
     * Similar to d3.rebind(), but also saves any set values in context obj
     * via config() mixin too.
     * @see https://github.com/mbostock/d3/wiki/Internals#wiki-rebind
     * @param {Object} src
     * @param {String} methods...
     */
    mixin.rebind = function(src) {
      var methods = array.convertArgs(arguments, 1);

      if (!this.__boundMethods__) {
        this.__boundMethods__ = [];
      }
      methods.forEach(function(method) {
        this.__boundMethods__.push(method);
        this[method] = function() {
          // Call setter on the bound object
          if (arguments.length) {
            src[method].apply(this, arguments);
          }
          if (arguments.length > 1) {
            // Set array on config if more than 1 arg.
            setValue.call(null, method, array.convertArgs(arguments));
          } else if (arguments.length === 1) {
            // Set the single value.
            setValue(method, arguments[0]);
          } else if (arguments.length === 0) {
            // No values to set, just return corresponding value.
            return getValue(method);
            //return src[method].call(this);
          }
          return this;
        };
      }, this);
    };

    /**
     * Calls all the bound methods for the target object using the target's
     * config. Assumes the config.mixin() is applied.
     * @param {String[]} filters Optionally apply on a subset of the
     *  bound methods.
     */
    mixin.reapply = function(filters) {
      var methods, value;
      if (!this.__boundMethods__) {
        return;
      }
      methods = this.__boundMethods__;
      if (filters) {
        methods = methods.filter(function(method) {
          return filters.indexOf(method) !== -1;
        });
      }
      methods.forEach(function(method) {
        value = getValue(method);
        if (value !== undefined) {
          this[method](getValue(method));
        }
      }, this);
    };

    /**
     * @desc A multi-property config function.
     * All use-cases that don't specificially return a value will return the
     *   context object.
     *
     * Uses:
     *  - Call with single object to set multiple config options.
     *  - Call with string to get a single config option.
     *    NOTE: if value is a function it will be executed.
     *  - Call with string and value to set a single config option.
     *  - Call with 0 args to get the object containing all config options.
     *    NOTE: this is the live object and should not be mutated.
     */
    mixin.config = function () {
      var args = array.convertArgs(arguments),
          argCount = args.length,
          firstArg,
          boundMethodFilter;

      if (argCount === 0) {
        // TODO: Might want to core.object.clone() this.
        return configObj;
      }
      firstArg = args[0];
      if (argCount === 1) {
        if (typeof firstArg === 'string') {
          return getValue(firstArg);
        }
        if (typeof firstArg === 'object') {
          obj.extend(configObj, firstArg);
          boundMethodFilter = Object.keys(firstArg);
        }
      } else {
        // 2 args.
        setValue(firstArg, args[1]);
        boundMethodFilter = [firstArg];
      }
      this.reapply(boundMethodFilter);
      return this;
    };

    return mixin;
  };

  return {
    mixin: mixinGenerator
  };

});

define('assets/assets',[],function() {
  

  var assets = '<svg id="gl-assets" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' +
'  <defs>' +
'  <svg id="gl-asset-icon-error" viewbox="0 0 12 12" width="12" height="12">' +
'    <path fill="#C40022" d="M1.922,10.923c-1.713,0-2.413-1.245-1.557-2.729l4.076-7.078c0.856-1.483,2.258-1.491,3.114-0.008 l4.078,7.09c0.856,1.483,0.156,2.725-1.557,2.725H1.922z">' +
'    </path>' +
'    <circle fill="#fff" cx="6" cy="8.75" r="1">' +
'    </circle>' +
'    <line x1="6" y1="3" x2="6" y2="6" stroke="#fff" stroke-width="2" stroke-linecap="round">' +
'    </line>' +
'  </svg>' +
'  <svg id="gl-asset-spinner">' +
'    <defs>' +
'      <line id="gl-asset-spinner-line" opacity="1" fill="none" stroke-linecap="round" stroke-width="1.4" x1="2.9" y1="2.9" x2="5" y2="5" stroke="#333">' +
'      </line>' +
'    </defs>' +
'    <g transform="translate(8, 8)">' +
'      <use xlink:href="#gl-asset-spinner-line" transform="rotate(30)">' +
'        <animate attributename="opacity" repeatcount="indefinite" attributetype="CSS" from="1" to="0.3" dur="1.2s" begin="0.1s">' +
'        </animate>' +
'      </use>' +
'      <use xlink:href="#gl-asset-spinner-line" transform="rotate(60)">' +
'        <animate attributename="opacity" repeatcount="indefinite" attributetype="CSS" from="1" to="0.3" dur="1.2s" begin="0.2s">' +
'        </animate>' +
'      </use>' +
'      <use xlink:href="#gl-asset-spinner-line" transform="rotate(90)">' +
'        <animate attributename="opacity" repeatcount="indefinite" attributetype="CSS" from="1" to="0.3" dur="1.2s" begin="0.3s">' +
'        </animate>' +
'      </use>' +
'      <use xlink:href="#gl-asset-spinner-line" transform="rotate(120)">' +
'        <animate attributename="opacity" repeatcount="indefinite" attributetype="CSS" from="1" to="0.3" dur="1.2s" begin="0.4s">' +
'        </animate>' +
'      </use>' +
'      <use xlink:href="#gl-asset-spinner-line" transform="rotate(150)">' +
'        <animate attributename="opacity" repeatcount="indefinite" attributetype="CSS" from="1" to="0.3" dur="1.2s" begin="0.5s">' +
'        </animate>' +
'      </use>' +
'      <use xlink:href="#gl-asset-spinner-line" transform="rotate(180)">' +
'        <animate attributename="opacity" repeatcount="indefinite" attributetype="CSS" from="1" to="0.3" dur="1.2s" begin="0.6s">' +
'        </animate>' +
'      </use>' +
'      <use xlink:href="#gl-asset-spinner-line" transform="rotate(210)">' +
'        <animate attributename="opacity" repeatcount="indefinite" attributetype="CSS" from="1" to="0.3" dur="1.2s" begin="0.7s">' +
'        </animate>' +
'      </use>' +
'      <use xlink:href="#gl-asset-spinner-line" transform="rotate(240)">' +
'        <animate attributename="opacity" repeatcount="indefinite" attributetype="CSS" from="1" to="0.3" dur="1.2s" begin="0.8s">' +
'        </animate>' +
'      </use>' +
'      <use xlink:href="#gl-asset-spinner-line" transform="rotate(270)">' +
'        <animate attributename="opacity" repeatcount="indefinite" attributetype="CSS" from="1" to="0.3" dur="1.2s" begin="0.9s">' +
'        </animate>' +
'      </use>' +
'      <use xlink:href="#gl-asset-spinner-line" transform="rotate(300)">' +
'        <animate attributename="opacity" repeatcount="indefinite" attributetype="CSS" from="1" to="0.3" dur="1.2s" begin="1s">' +
'        </animate>' +
'      </use>' +
'      <use xlink:href="#gl-asset-spinner-line" transform="rotate(330)">' +
'        <animate attributename="opacity" repeatcount="indefinite" attributetype="CSS" from="1" to="0.3" dur="1.2s" begin="1.1s">' +
'        </animate>' +
'      </use>' +
'      <use xlink:href="#gl-asset-spinner-line" transform="rotate(360)">' +
'        <animate attributename="opacity" repeatcount="indefinite" attributetype="CSS" from="1" to="0.3" dur="1.2s" begin="1.2s">' +
'        </animate>' +
'      </use>' +
'    </g>' +
'  </svg>' +
'  </defs>'+
'</svg>' +
'';
  return assets;
});
/**
 * @fileOverview
 * Loads SVG assets and injects them into the page.
 */
define('core/asset-loader',[
  'assets/assets'
],
function(assets) {
  

  return {

    /**
     * Loads all precompiled SVG assets into the DOM.
     */
    loadAll: function() {
      // Only append if it doesn't already exist.
      if (!d3.select('#gl-global-assets').empty()) {
        return;
      }
      d3.select(document.body).append('div')
        .attr({
          id: 'gl-global-assets'
        })
        .style({
          'height': '0px',
          'width': '0px',
          'display': 'none'
        })
      .html(assets);
    },

    /**
     * Removes the element containing all precompiled SVG assets.
     */
    removeAll: function() {
      var body = document.body;
      body.removeChild(body.querySelector('#gl-global-assets'));
    }

  };

});

/**
 * @fileOverview
 * String utility functions.
 */
define('core/string',[],
function () {
  

  return {

    /**
     * Generates a random string.
     */
    random: function () {
      // 2^31
      var x = 2147483648;
      return Math.floor(Math.random() * x).toString(36) +
        Math.abs(Math.floor(Math.random() * x) ^ (new Date()).getTime())
        .toString(36);
    },

    /**
     * Convenience function to create multiple class strings.
     */
    classes: function () {
      var r = Array.prototype.join.call(arguments, ' gl-');
      return r ? 'gl-' + r : '';
    },

    /**
     * Convenience function to string.
     */
    isString: function (item) {
      return typeof item === 'string';
    },

    /**
     * Determins if a string starts with a prefix or not.
     *
     * @param {String} str The string to check.
     * @param {String} prefix The prefix to search for.
     * @return {Boolean}
     */
    startsWith: function(str, prefix) {
      return typeof str === 'string' &&
        typeof prefix === 'string' &&
        str.slice(0, prefix.length) === prefix;
    }

  };

});

define('core/function',[
  'core/array'
],
function (array) {
  

  return {

    partial: function (fn) {
      var args = array.convertArgs(arguments, 1);
      return function() {
        var newArgs = array.convertArgs(arguments);
        newArgs.unshift.apply(newArgs, args);
        return fn.apply(this, newArgs);
      };
    }

  };

});

/**
 * @fileOverview
 * Utility selector to select a single node which has an attr with a
 *   certain value.
 */
define('d3-ext/select-attr',[
  'd3'
],
function(d3) {
  

  /**
   * Selects a sub-selection of the current selection which is the first
   *   node that has a matching attr and value.
   * @param attr The attribute to check.
   * @param value The value that attr must have set.
   * @return {d3.selection}
   */
  d3.selection.prototype.selectAttr = function(attr, value) {
    return this.select('[' + attr + '="' + value + '"]');
  };

  return d3;
});

/**
 * @fileOverview
 * Utility functions related to d3 selections.
 */
define('d3-ext/util',[
  'd3-ext/select-attr'
],
function() {
  

  return {

    /**
     * Same as d3.select but allows a d3.selection as input too.
     * @param {d3.selection|string} selection
     */
    select: function(selection) {
      return (Array.isArray(selection)) ?
        selection :
        d3.select(selection);
    },

    /**
     * Applies a function to a component target conditionally if it exists.
     *
     * @param {components.component} component
     * @param {d3.selection|string|null} selection
     * @param {Function} fn The function to apply if the target exists.
     *   This function will be passed the target as a single arg,
     *   and executed in the context of the component.
     * @return {null|*} Returns null if target is empty,
     *   otherwise whatever fn returns.
     */
    applyTarget: function(component, selection, fn) {
      var target, componentTarget;

      target = this.select(selection);
      componentTarget = component.config('target');
      if (componentTarget) {
        target = target.selectAttr('gl-container-name',
          componentTarget);
      }

      if (!target || target.empty()) {
        return null;
      }
      return fn.call(component, target);
    }

  };

});

define('mixins/toggle',[],function () {
  

  return {

    /**
    * @description Makes the component visible
    * @return {components.component}
    */
    show: function () {
      var root = this.root();
      if (root) {
        root.attr('display', null);
        if (this.dispatch && this.dispatch.show) {
          this.dispatch.show.call(this);
        }
      }
      return this;
    },

    /**
    * @description Hides the component
    * @return {components.component}
    */
    hide: function () {
      var root = this.root();
      if (root) {
        root.attr('display', 'none');
        if (this.dispatch && this.dispatch.hide) {
          this.dispatch.hide.call(this);
        }
      }
      return this;
    }

  };

});

/**
 * @fileOverview
 * Creates a default d3.dispatch with common component events.
 * Optionally can provide additional events.
 */
define('mixins/dispatch',[],function() {
  

  /**
   * List of event names common to all components.
   * @const
   */
  var COMMON_EVENTS = [
    'render',
    'update',
    'show',
    'hide',
    'destroy'
  ];

  /**
   * Creates a d3 event dispatcher with common events by default.
   * Optionally supplied additional events will also be added.
   *
   * @public
   * @param {string} arguments Any other event names to add.
   * @return {d3.dispatch}
   * @see https://github.com/mbostock/d3/wiki/Internals#wiki-d3_dispatch
   */
  return function() {
    var eventNames;

    eventNames = COMMON_EVENTS;
    if (arguments.length) {
      eventNames = Array.prototype.concat.apply(eventNames, arguments);
    }
    return d3.dispatch.apply(null, eventNames);
  };

});

/**
 * @fileOverview
 * These are methods that all components are expected to have.
 * Use this mixin as a convenience for noops and override as needed.
 */
define('mixins/lifecycle',[],function () {
  

  return {

    render: function() {
      // noop
      return this;
    },

    root: function() {
      // noop
    },

    isRendered: function() {
      return !!this.root();
    },

    update: function() {
      // noop
      return this;
    },

    destroy: function() {
      // noop
      return this;
    }

  };

});

define('mixins/mixins',[
  'mixins/toggle',
  'mixins/dispatch',
  'mixins/lifecycle'
],
function(toggle, dispatch, lifecycle) {
  

  return {
    toggle: toggle,
    lifecycle: lifecycle,
    dispatch: dispatch
  };

});

/**
 * @fileOverview
 * Accessor generator.
 */
define('data/accessors',[
  'core/object'
], function (obj) {
  

  var cache = {};

  function getAccessor(dimVal) {
    var splitPath, accessorFn;
    dimVal = dimVal.trim();
    accessorFn = cache[dimVal];
    if (accessorFn) {
      return accessorFn;
    }
    splitPath = dimVal.split('.');
    accessorFn = function(d) {
      return obj.get(d, splitPath);
    };
    cache[dimVal] = accessorFn;
    return accessorFn;
  }

  return {

    /**
     * Returns input if function.
     * If input is string, it returns a cached accessor
     * else generates a new accessor for the string.
     */
    get: function(accessor) {
      if (typeof accessor === 'function') {
        return accessor;
      }
      if (typeof accessor === 'string') {
        return getAccessor(accessor);
      }
    },

    /**
     * Clears the accessors cache.
     */
    clear: function() {
      cache = {};
    }

  };

});

/**
 * @fileOverview
 * Data functions.
 */
define('data/functions',[
  'core/object',
  'data/accessors'
], function (obj, accessors) {
  

  return {
    /**
     * Gets the data using the dimension accessor.
     */
    dimension: function(data, dim) {
      var dimValue;
      dimValue = obj.get(data, ['dimensions', dim]);
      if (!dimValue) {
        return accessors.get(dim);
      }
      return accessors.get(dimValue);
    }
  };

});

define('events/pubsub',[
  'core/array'
],
function(array) {
  

  /**
   * A global singleton instance.
   * @private
   */
  var globalInstance;

  function broker() {
    var callbackCache;

    /**
     * Cache object to hold all the topics and callback references.
     * @private
     */
    callbackCache = {};

    return {

      /**
       * Publishes an event for a topic.
       * Also takes additional arguments to pass along to subscribers.
       *
       * @public
       * @param {String} topic The topic/event name.
       * @return {events.pubsub}
       */
      pub: function(topic) {
        var args;

        if (!callbackCache[topic]) {
          return this;
        }
        args = array.convertArgs(arguments, 1);
        callbackCache[topic].forEach(function(callback) {
          callback.apply(this, args);
        });
        return this;
      },

      /**
       * Subscribes to an event for a topic.
       *
       * @public
       * @param {String} topic The topic/event name.
       * @param {Function} callback
       * @return {events.pubsub}
       */
      sub: function(topic, callback) {
        if (!callbackCache[topic]) {
          callbackCache[topic] = [];
        }
        callbackCache[topic].push(callback);
        return this;
      },

      /**
       * Unsubscribe all, or just particular, callbacks from a topic.
       *
       * @public
       * @param {String} topic
       * @param {Array|Function} optCallbacks
       * @return {events.pubsub}
       */
      unsub: function(topic, optCallbacks) {
        var subscribers;

        // No callbacks specified, remove all for that topic.
        if (!optCallbacks) {
          delete callbackCache[topic];
          return this;
        }
        subscribers = callbackCache[topic] || [];
        // No subscribers to remove, return early.
        if (!subscribers.length) {
          return this;
        }
        // Only remove specified callbacks for topic.
        array.remove(subscribers, optCallbacks);
        return this;
      },

      /**
       * Unsubscribe everything and reset the cache.
       *
       * @public
       * @return {events.pubsub}
       */
      clearAll: function() {
        callbackCache = {};
        return this;
      }
    };
  }

  return {

    /**
     * Creates a new pubsub instance.
     *
     * @public
     * @return {events.pubsub}
     */
    create: function() {
      return broker();
    },

    /**
     * Returns the global singleton instance if it exists, otherwise creates it.
     *
     * @public
     * @return {events.pubsub}
     */
    getSingleton: function() {
      if (globalInstance) {
        return globalInstance;
      }
      globalInstance = this.create();
      return globalInstance;
    },

    scope: function() {
      var scope =  arguments[0] ? arguments[0] + ':' : '';
      return function() {
        return scope + arguments[0];
      };
    }

  };

});

/**
 * @fileOverview
 * Reusuable line component.
 */
define('components/line',[
  'core/array',
  'core/config',
  'core/object',
  'core/string',
  'd3-ext/util',
  'mixins/mixins',
  'data/functions',
  'events/pubsub'
],
function(array, config, obj, string, d3util, mixins, dataFns, pubsub) {
  


  return function() {

    //Private variables
    var config_ = {},
      defaults_,
      dataCollection_,
      root_,
      scope_ = null,
      globalPubsub = pubsub.getSingleton();

    defaults_ = {
      type: 'line',
      target: null,
      cid: null,
      color: null,
      strokeWidth: 1.5,
      inLegend: true,
      lineGenerator: d3.svg.line(),
      interpolate: 'linear',
      xScale: null,
      yScale: null,
      opacity: 1,
      hiddenStates: null,
      rootId: null
    };

    /**
     * Updates the line component
     * @param  {d3.selection} selection
     */
    function update(selection) {
      selection
        .datum(line.data().data)
        .attr({
          'stroke-width': config_.strokeWidth,
          'stroke': config_.color,
          'opacity': config_.opacity,
          'd': config_.lineGenerator
      });
    }

    /**
     * Removes elements from the exit selection
     * @param  {d3.selection|Node|string} selection
     */
    function remove(selection) {
      if (selection && selection.exit) {
        selection.exit().remove();
      }
    }

    /**
     * Gets value of X for a data object
     * Converts into UTC data for time series.
     * @param  {Object} data
     * @param  {number} index
     * @return {string|number}
     */
    function getX(data, index) {
      var x, dataConfig;
      dataConfig = line.data();
      x = dataFns.dimension(
        dataConfig,
        'x'
      )(data, index);
      return x;
    }

    /**
     * Main function for line component
     * @return {components.line}
     */
    function line() {
      obj.extend(config_, defaults_);
      return line;
    }

    obj.extend(
      line,
      config.mixin(
        config_,
        'cid',
        'xScale',
        'yScale',
        'lineGenerator',
        'color',
        'rootId'
      ),
      mixins.lifecycle,
      mixins.toggle);

    /**
     * Event dispatcher.
     * @public
     */
    line.dispatch = mixins.dispatch();

    // TODO: this will be the same for all components
    // put this func somehwere else and apply as needed
    line.data = function(data) {
      if (data) {
        dataCollection_ = data;
        return line;
      }
      if (!dataCollection_) {
        return;
      }
      return dataCollection_.get(config_.dataId);
    };

    /**
     * Updates the line component with new/updated data/config
     * @return {components.line}
     */
    line.update = function() {
      var dataConfig, selection;

      if (!root_) {
        return line;
      }
      if (config_.cid) {
        root_.attr('gl-cid', config_.cid);
      }
      dataConfig = line.data();
      // Return early if there's no data.
      if (!dataConfig || !dataConfig.data) {
        return line;
      }
      // Configure the lineGenerator function
      config_.lineGenerator
        .x(function(d, i) {
          return config_.xScale(getX(d, i));
        })
        .y(function(d, i) {
          return config_.yScale(dataFns.dimension(dataConfig, 'y')(d, i));
        })
        .defined(function(d, i) {
          var minX;
          minX = config_.xScale.range()[0];
          return config_.xScale(getX(d, i))  >= minX;
        })
        .interpolate(config_.interpolate);
      selection = root_.select('.gl-path')
        .data(dataConfig.data);
      update(selection);
      remove(selection);
      line.dispatch.update.call(this);
      return line;
    };

    /**
     * Handles the sub of data-toggle event.
     * Checks presence of inactive tag
     * to show/hide the line component
     * @param  {string} dataId
     */
     line.handleDataToggle_ = function (args) {
      var id = config_.dataId;
      if (args === id) {
        if (dataCollection_.hasTags(id, 'inactive')) {
          line.hide();
        } else {
          line.show();
        }
      }
    };

    /**
     * Renders the line component
     * @param  {d3.selection|Node|string} selection
     * @return {components.line}
     */
    line.render = function(selection) {
      var scope;
      if (!root_) {
        root_ = d3util.applyTarget(line, selection, function(target) {
          var root = target.append('g')
            .attr({
              'class': string.classes('component', 'line')
            });
          root.append('path')
            .attr({
              'class': 'gl-path',
              'fill': 'none'
            });
          return root;
        });
      }
      scope = line.scope();
      globalPubsub.sub(scope('data-toggle'), line.handleDataToggle_);
      line.update();
      line.dispatch.render.call(this);
      return line;
    };

    /**
     * Returns the root_
     * @return {d3.selection}
     */
    line.root = function() {
      return root_;
    };

    /** Defines the rootId for line */
    //TODO create a mixin for scope
    line.scope = function() {
      if (!scope_) {
        scope_ = pubsub.scope(config_.rootId);
      }
      return scope_;
    };

    /**
     * Destroys the line and removes everything from the DOM.
     * @public
     */
    line.destroy = function() {
      var scope;

      if (root_) {
        root_.remove();
      }
      scope = line.scope();
      globalPubsub.unsub(scope('data-toggle'), line.handleDataToggle_);
      root_ = null;
      config_ = null;
      defaults_ = null;
      line.dispatch.destroy.call(this);
    };

    return line();

  };
});

/**
 * @fileOverview
 * A Legend component that displays keys containing color indicators and the
 * label text of data.
 */
define('components/legend',[
  'core/object',
  'core/config',
  'core/string',
  'core/array',
  'd3-ext/util',
  'mixins/mixins',
  'events/pubsub'
],
function(obj, config, string, array, d3util, mixins, pubsub) {
  

  return function() {

    // PRIVATE

    var defaults_,
      config_,
      root_,
      enter_,
      update_,
      remove_,
      dataCollection_,
      onClickHandler,
      globalPubsub;


    config_ = {};

    defaults_ = {
      type: 'legend',
      position: 'center-left',
      target: null,
      cid: null,
      indicatorWidth: 10,
      indicatorHeight: 10,
      indicatorSpacing: 4,
      fontColor: '#333',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      fontSize: 13,
      layout: 'horizontal',
      inactiveColor: 'grey',
      gap: 20,
      keys: [],
      hiddenStates: ['loading'],
      rootId: null,
      hideOnClick: true
    };

    globalPubsub = pubsub.getSingleton();

    /**
     * Handles the click event on legend.
     */
    onClickHandler = function(d) {
      var sel = d3.select(this),
      inactive = config_.inactiveColor,
      fontColor = config_.fontColor;

      if (dataCollection_.hasTags(d.dataId, 'inactive')) {
        sel.select('text').attr('fill', fontColor);
        sel.select('rect').attr('fill', d.color);
      } else {
        sel.select('text').attr('fill', inactive);
        sel.select('rect').attr('fill', inactive);
      }
      // toggles data's tag on the data collection
      dataCollection_.toggleTags(d.dataId, 'inactive', config_.rootId);
    };

    /**
     * Inserts new keys.
     * @param {d3.selection} selection
     */
    enter_ = function(selection) {
      var enterSelection;

      enterSelection = selection
        .enter()
          .append('g')
          .attr({
            'class': 'gl-legend-key',
            'gl-dataId': function(d) { return d.dataId; }
          });

      // Add new key indicator.
      enterSelection
        .append('rect')
        .attr({
          'class': 'gl-legend-key-indicator',
          'stroke': 'none',
          'x': 0,
          'y': 0
        });

      // Add new key text.
      enterSelection
        .append('text')
        .attr({
          'class': 'gl-legend-key-label',
          'text-anchor': 'start',
          'stroke': 'none'
        });

    };

    /**
     * Apply updates to the update selection.
     * @param {d3.selection} selection
     */
    update_ = function(selection) {
      var inactive, color;

      // Handle click event- toggle data inactive
      if(config_.hideOnClick) {
        selection
          .on('click', onClickHandler);
      } else {
        selection
          .on('click', null);
      }

      // The outer <g> element for each key.
      selection
        .attr({
          'font-family': config_.fontFamily,
          'font-size': config_.fontSize,
          'font-weight': config_.fontWeight
        });

      // Update key indicators.
      selection.selectAll('.gl-legend-key-indicator')
        .attr({
          'width': config_.indicatorWidth,
          'height': config_.indicatorHeight,
          'style': function() {
            return config_.hideOnClick ? 'cursor:pointer;' : null;
          },
          'fill': function(d) {
            inactive = dataCollection_.hasTags(d.dataId, 'inactive');
            color = inactive ? config_.inactiveColor : d3.functor(d.color)();
            return color;
          }
        });

      // Update key text.
      selection.selectAll('.gl-legend-key-label')
        .text(function(d) { return d.label; })
        .attr({
          'x': config_.indicatorWidth + config_.indicatorSpacing,
          'y': config_.indicatorHeight,
          'style': function() {
            return config_.hideOnClick ? 'cursor:pointer;' : null;
          },
          'fill': function(d) {
            inactive = dataCollection_.hasTags(d.dataId, 'inactive');
            color = inactive ? config_.inactiveColor : config_.fontColor;
            return color;
          }
        });
    };

    /**
     * Remove any keys that were removed.
     * @param {d3.selection} selection
     */
    remove_ = function(selection) {
      selection.exit().remove();
    };

    // PUBLIC

    /**
     * The main function.
     */
    function legend() {
      obj.extend(config_, defaults_);
      return legend;
    }

    // Apply Mixins.
    obj.extend(
      legend,
      config.mixin(
        config_,
        'cid',
        'keys',
        'fontColor',
        'fontFamily',
        'fontSize',
        'fontWeight',
        'indicatorWidth',
        'indicatorHeight',
        'rootId'
      ),
      mixins.lifecycle,
      mixins.toggle);

    /**
     * Event dispatcher.
     * @public
     */
    legend.dispatch = mixins.dispatch();


    /**
     * Gets/Sets the data to be used with the legend.
     * @param {Object} data Any data source.
     * @return {Object|dataCollection}
     */
    legend.data = function(data) {
      if (data) {
        dataCollection_ = data;
        return legend;
      }
      if (!dataCollection_) {
        return null;
      }
      return dataCollection_;
    };

    /**
     * Apply post-render updates.
     * Insert/update/remove DOM for each key.
     */
    legend.update = function() {
      var selection, dataConfig;

      // Return early if no data or render() hasn't been called yet.
      if (!config_.keys || !root_) {
        return legend;
      }
      if (config_.cid) {
        root_.attr('gl-cid', config_.cid);
      }

      dataConfig = legend.data();
      // Return early if there's no data.
      if (!dataConfig) {
        return legend;
      }

      // The selection of legend keys.
      selection = root_
        .selectAll('.gl-legend-key')
        .data(config_.keys, function(d) {
          return d.dataId;
        });
      remove_(selection);
      enter_(selection);
      update_(selection);
      root_.layout({type: config_.layout, gap: config_.gap});
      root_.position(config_.position);
      legend.dispatch.update.call(this);
      return legend;
    };

    /**
     * Render the legend to the selection.
     * Sets up initial DOM structure. Should only be called once.
     * @param {d3.selection|String} selection A d3 selection
     *    or a selector string.
     */
    legend.render = function(selection) {
      if (!root_) {
        root_ = d3util.applyTarget(legend, selection, function(target) {
          return target.append('g')
            .attr({
              'class': string.classes('component', 'legend')
            });
        });
      }
      legend.update();
      legend.dispatch.render.call(this);
      return legend;
    };

    /**
     * Returns the root_
     * @return {d3.selection}
     */
    legend.root = function () {
      return root_;
    };

    /**
     * Destroys the legend and removes everything from the DOM.
     * @public
     */
    legend.destroy = function() {
      if (root_) {
        root_.remove();
      }
      root_ = null;
      config_ = null;
      defaults_ = null;
      legend.dispatch.destroy.call(this);
    };

    return legend();
  };

});

/**
 * @fileOverview
 * Axis component.
 */
define('components/axis',[
  'core/object',
  'core/config',
  'core/string',
  'mixins/mixins',
  'd3-ext/util'
],
function(obj, config, string, mixins, d3util) {
  

  return function() {

    var config_,
      defaults_,
      root_,
      d3axis_;

    config_ = {};

    defaults_ = {
      type: 'axis',
      axisType: 'x',
      gap: 0,
      target: null,
      color: '#333',
      opacity: 0.8,
      fontFamily: 'arial',
      fontSize: 10,
      textBgColor: '#fff',
      textBgSize: 3,
      tickSize: 0,
      ticks: 3,
      hiddenStates: null,
      rootId: null
    };

    /**
     * Translates the zero tick on the Y-axis by 10
     * @private
     */
    function setZeroTickTranslate(selection) {
      var transform;
      transform = d3.transform(selection.attr('transform'));
      transform.translate[1] -= 10;
      selection.attr('transform', transform.toString());
    }

    /**
     * Changes the default formatting of the d3 axis.
     * @private
     */
    function formatAxis() {
      var zeroTick, zeroTickLabel;
      // remove boldness from default axis path
      root_.selectAll('path')
        .attr({
          'fill': 'none'
        });

      // update fonts
      root_.selectAll('text')
        .attr({
          'stroke': 'none',
          'fill': config_.color
        });

      //Apply padding to the first tick on Y axis
      if (config_.axisType === 'y') {
        zeroTick = root_.select('g');

        if (zeroTick.node()) {
          zeroTickLabel = zeroTick.text() +
            (config_.unit ? ' ' + config_.unit : '');
          zeroTick.select('text').text(zeroTickLabel);
          setZeroTickTranslate(zeroTick);
        }
      }

      // apply text background for greater readability.
      root_.selectAll('.gl-axis text').each(function() {

        var textBg = this.cloneNode(true);
        d3.select(textBg).attr({
          stroke: config_.textBgColor,
          'stroke-width': config_.textBgSize
        });
        this.parentNode.insertBefore(textBg, this);
      });

      // remove axis line
      root_.selectAll('.domain')
        .attr({
          'stroke': 'none'
        });
    }

    /**
     * Repositions the root node within the parent DOM to ensure it's always
     * last and therefore appears above other elements.
     *
     * @private
     */
    function repositionDOM() {
      var rootNode, parentNode;

      // Not rendered yet.
      if (!root_) {
        return;
      }
      rootNode = root_.node();
      if (rootNode.nextElementSibling) {
        parentNode = rootNode.parentNode;
        root_.remove();
        parentNode.appendChild(rootNode);
      }
    }

    /**
     * Main function for Axis component.
     */
    function axis() {
      obj.extend(config_, defaults_);
      d3axis_ = d3.svg.axis();
      axis.rebind(
        d3axis_,
        'scale',
        'orient',
        'ticks',
        'tickValues',
        'tickSubdivide',
        'tickSize',
        'tickPadding',
        'tickFormat');
      return axis;
    }

    // Apply mixins.
    obj.extend(
      axis,
      config.mixin(
        config_,
        'cid', 'rootId'),
      mixins.lifecycle,
      mixins.toggle);

    /**
     * Event dispatcher.
     * @public
     */
    axis.dispatch = mixins.dispatch();

    /**
     * Apply updates to the axis.
     */
    axis.update = function() {
      if (!root_) {
        return axis;
      }
      root_.selectAll('g').remove();
      axis.reapply();
      root_.call(d3axis_);
      root_.attr({
        'font-family': config_.fontFamily,
        'font-size': config_.fontSize,
        'class': string.classes('component',
            'axis', config_.axisType + '-axis '),
        'stroke': config_.color,
        'opacity': config_.opacity
      });
      if (config_.cid) {
        root_.attr('gl-cid', config_.cid);
      }

      formatAxis();
      repositionDOM();
      axis.dispatch.update.call(this);
      return axis;
    };

    /**
     * Render the axis to the selection
     * @param {d3.selection|String} selection A d3 selection
     * @return {component.axis}
     */
    axis.render = function(selection) {
      if (!root_) {
        root_ = d3util.applyTarget(axis, selection, function(target) {
          return target.append('g')
            .attr({
              'fill': 'none',
              'shape-rendering': 'crispEdges',
              'stroke-width': 1
            });
        });
      }
      axis.update();
      axis.dispatch.render.call(this);
      return axis;
    };

    /**
     * Gets or sets the d3axis function
     * @param  {d3.svg.axis} d3Axis
     * @return {component.axis}
     */
    axis.d3axis = function(d3Axis) {
      if (d3Axis) {
        d3axis_ = d3Axis;
        return axis;
      }
      return d3axis_;
    };

    /**
     * Returns the root_
     * @return {d3.selection}
     */
    axis.root = function() {
      return root_;
    };

    /**
     * Destroys the axis and removes everything from the DOM.
     * @public
     */
    axis.destroy = function() {
      if (root_) {
        root_.remove();
      }
      root_ = null;
      config_ = null;
      defaults_ = null;
      d3axis_ = null;
      axis.dispatch.destroy.call(this);
    };

    return axis();
  };

});

/**
 * @fileOverview
 * Component to render a single arbirtary text label.
 */
define('components/label',[
  'core/object',
  'core/config',
  'core/string',
  'core/array',
  'd3-ext/util',
  'mixins/mixins'
],
function(obj, config, string, array, d3util, mixins) {
  

  return function() {

    // PRIVATE

    var defaults_,
      config_,
      dataCollection_,
      root_;

    config_ = {};

    defaults_ = {
      type: 'label',
      cid: null,
      target: null,
      dataId: null,
      cssClass: null,
      text: null,
      gap: null,
      layout: 'horizontal',
      position: 'center-right',
      color: '#333',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'normal',
      fontSize: 13,
      hiddenStates: null,
      rootId: null
    };

    // PUBLIC

    /**
     * The main function.
     * @return {components.label}
     */
    function label() {
      obj.extend(config_, defaults_);
      return label;
    }

    // Apply Mixins
    obj.extend(
      label,
      config.mixin(
        config_,
        'cid',
        'target',
        'cssClass',
        'color',
        'fontFamily',
        'fontSize',
        'fontWeight',
        'rootId'
      ),
      mixins.lifecycle,
      mixins.toggle);

    /**
     * Event dispatcher.
     * @public
     */
    label.dispatch = mixins.dispatch();

    /**
     * Gets/Sets the data source to be used with the label.
     * Uses the configurable "text" accessor function to retrieve text.
     * @param {Object} data Any data source.
     * @return {Object|components.label}
     */
    label.data = function(data) {
      // Set data if provided.
      if (data) {
        dataCollection_ = data;
        return label;
      }
      // Find corresponding data group if dataId is set.
      if (dataCollection_ && config_.dataId) {
        return dataCollection_.get(config_.dataId);
      }
      // Otherwise return the entire raw data.
      return dataCollection_;
    };

    /**
     * @description Gets/sets the static text to display.
     *    Alternative to using data().
     * @param {string} text
     * @return {components.label|string}
     */
    label.text = function(text) {
      if (text) {
        config_.text = d3.functor(text);
        return label;
      }
      return d3.functor(config_.text).call(this);
    };

    /**
     * @description Does the initial render to the document.
     * @param {d3.selection|Node|string} A d3.selection, DOM node,
     *    or a selector string.
     * @return {components.label}
     */
    label.render = function(selection) {
      if (!root_) {
        root_ = d3util.applyTarget(label, selection, function(target) {
          var root = target.append('g')
            .attr({
              'class': string.classes('component', 'label')
            });
          // With  xml:space = preserve setting, SVG will simply convert all
          // newline and tab characters to blanks, and then display the result,
          // including leading and trailing blanks. the same text.
          root.append('text')
            .attr('xml:space', 'preserve');
          return root;
        });
      }
      label.update();
      label.dispatch.render.call(this);
      return label;
    };

    /**
     * @description Triggers a document updated based on new data/config.
     * @return {components.label}
     */
    label.update = function() {
      var text;

      text = label.text();
      // Return early if no data or render() hasn't been called yet.
      if (!root_ || !text) {
        return label;
      }
      if (config_.cssClass) {
        root_.classed(config_.cssClass, true);
      }
      if (config_.cid) {
        root_.attr('gl-cid', config_.cid);
      }
      root_.select('text').attr({
        'fill': config_.color,
        'font-family': config_.fontFamily,
        'font-size': config_.fontSize,
        'font-weight': config_.fontWeight,
        // NOTE: Need to manually set y position since dominant-baseline
        //   doesn't work in FF or IE.
        'y': config_.fontSize
      })
      .text(text);
      root_.position(config_.position);
      label.dispatch.update.call(this);
      return label;
    };

    /**
     * Returns the root_
     * @return {d3.selection}
     */
    label.root = function () {
      return root_;
    };

    /**
     * Destroys the label and removes everything from the DOM.
     * @public
     */
    label.destroy = function() {
      if (root_) {
        root_.remove();
      }
      root_ = null;
      config_ = null;
      defaults_ = null;
      label.dispatch.destroy.call(this);
    };

    return label();
  };

});

/**
 * @fileOverview
 * An overlay component that fills an area, hides its contents, and displays
 * a series of other components which render to the specified layout.
 */
define('components/overlay',[
  'core/object',
  'core/config',
  'core/string',
  'components/label',
  'mixins/mixins',
  'd3-ext/util'
],
function(obj, config, string, label, mixins, d3util) {
  

  return function() {

    var defaults_,
      config_,
      root_,
      updateChildren_;

    config_ = {};

    defaults_ = {
      cid: null,
      target: null,
      components: [],
      layoutConfig: { type: 'horizontal', position: 'center', gap: 6 },
      opacity: 1,
      backgroundColor: '#fff',
      type: 'overlay',
      hiddenStates: null,
      rootId: null
    };

    /**
     * Append background rect, all child components, and apply the layout.
     * @private
     */
    updateChildren_ = function() {
      var parentNode,
          componentsContainer;

      parentNode = d3.select(root_.node().parentNode);

      root_.select('rect').attr({
        width: parentNode.width(),
        height: parentNode.height(),
        opacity: config_.opacity,
        fill: config_.backgroundColor
      });
      componentsContainer = root_.select('g')
        .attr('class', 'gl-components');
      config_.components.forEach(function(component) {
        if (component.root()) {
          // If already rendered, just update instead.
          component.update();
        } else {
          component.render(componentsContainer);
        }
      });
      componentsContainer.layout(config_.layoutConfig);
    };

    function overlay() {
      obj.extend(config_, defaults_);
      return overlay;
    }

    // Apply Mixins
    obj.extend(
      overlay,
      config.mixin(
        config_,
        'cid',
        'target',
        'cssClass',
        'opacity',
        'backgroundColor',
        'layoutConfig',
        'rootId'
      ),
      mixins.lifecycle,
      mixins.toggle);

    /**
     * Event dispatcher.
     * @public
     */
    overlay.dispatch = mixins.dispatch();

    /*
     * Gets the root selection of this component.
     * @public
     * @return {d3.selection}
     */
    overlay.root = function () {
      return root_;
    };

    /**
     * Renders the component to the specified selection,
     * or to the configured target.
     * @public
     * @param {d3.selection|Node|String}
     * @return {components.overlay}
     */
    overlay.render = function(selection) {
      if (!root_) {
        root_ = d3util.applyTarget(overlay, selection, function(target) {
          var root = target.append('g')
            .attr({
              'class': string.classes('component', 'overlay')
            });
          root.append('rect');
          root.append('g');
          return root;
        });
      }
      overlay.update();
      overlay.dispatch.render.call(this);
      return overlay;
    };

    /**
     * Triggers an update of the component reapplying all specified config
     * updates.
     * @public
     * @return {componnets.update}
     */
    overlay.update = function() {
      if (!root_) {
        return overlay;
      }
      if (config_.cssClass) {
        root_.classed(config_.cssClass, true);
      }
      if (config_.cid) {
        root_.attr('gl-cid', config_.cid);
      }
      updateChildren_();
      overlay.dispatch.update.call(this);
      return overlay;
    };

    /**
     * Destroys this component and cleans up after itself.
     * @public
     */
    overlay.destroy = function() {
      // TODO: Need a more generalized way of removing sub-components.
      config_.components.forEach(function(label) {
        label.destroy();
      });
      if (root_) {
        root_.remove();
      }
      root_ = null;
      config_ = null;
      defaults_ = null;
      overlay.dispatch.destroy.call(this);
    };

    return overlay();

  };

});

/**
 * @fileOverview
 * A simple component to render out an asset.
 */
define('components/asset',[
  'core/object',
  'core/config',
  'core/string',
  'mixins/mixins',
  'd3-ext/util'
],
function(obj, config, string, mixins, d3util) {
  

  return function() {

    var defaults_,
      config_,
      root_;

    config_ = {};

    defaults_ = {
      cid: null,
      assetId: null,
      target: null,
      cssClass: null,
      hiddenStates: null,
      rootId: null
    };

    function asset() {
      obj.extend(config_, defaults_);
      return asset;
    }

    // Apply Mixins
    obj.extend(
      asset,
      config.mixin(
        config_,
        'cid',
        'assetId',
        'target',
        'cssClass',
        'rootId'
      ),
      mixins.lifecycle,
      mixins.toggle);

    /**
     * Event dispatcher.
     * @public
     */
    asset.dispatch = mixins.dispatch();

    /*
     * Gets the root selection of this component.
     * @public
     * @return {d3.selection}
     */
    asset.root = function() {
      return root_;
    };

    /**
     * Renders the component to the specified selection,
     * or to the configured target.
     * @public
     * @param {d3.selection|Node|String}
     * @return {components.overlay}
     */
    asset.render = function(selection) {
      if (!root_) {
        root_ = d3util.applyTarget(asset, selection, function(target) {
          return target.append('g')
            .attr({
              'class': string.classes('component', 'asset')
            });
        });
      }
      asset.update();
      asset.dispatch.render.call(this);
      return asset;
    };

    /**
     * Triggers an update of the component reapplying all specified config
     * updates.
     * @public
     * @return {componnets.update}
     */
    asset.update = function() {
      var useEl;

      if (!root_) {
        return asset;
      }
      if (config_.cssClass) {
        root_.classed(config_.cssClass, true);
      }
      if (config_.cid) {
        root_.attr('gl-cid', config_.cid);
      }
      useEl = root_.select('use');
      if (useEl.empty()) {
        useEl = root_.append('use');
      }
      useEl.attr({
        'class': config_.assetId,
        'xlink:href': '#' + config_.assetId
      });
      root_.position(config_.position);
      asset.dispatch.update.call(this);
      return asset;
    };

    /**
     * Destroys this component and cleans up after itself.
     * @public
     */
    asset.destroy = function() {
      if(root_) {
        root_.remove();
      }
      root_ = null;
      config_ = null;
      defaults_ = null;
      asset.dispatch.destroy.call(this);
    };

    return asset();

  };

});

/**
 * @fileOverview
 * Area component to draw filled areas in 2d space.
 */
define('components/area',[
  'core/array',
  'core/config',
  'core/object',
  'core/string',
  'd3-ext/util',
  'mixins/mixins',
  'data/functions'
],
function(array, config, obj, string, d3util, mixins, dataFns) {
  

  return function() {

    //Private variables
    var config_ = {},
      defaults_,
      dataCollection_,
      root_;

    defaults_ = {
      type: 'area',
      target: null,
      cid: null,
      xScale: null,
      yScale: null,
      cssClass: null,
      color: null,
      inLegend: true,
      areaGenerator: d3.svg.area(),
      opacity: 1,
      hiddenStates: null,
      rootId: null
    };

    /**
     * Updates the area generator function
     */
    function updateAreaGenerator() {
      var dataConfig,
          y0,
          y1;

      dataConfig = area.data();
      if (config_.cid) {
        root_.attr('gl-cid', config_.cid);
      }
      if (dataConfig.dimensions.y0) {
        // Use y0 for baseline if supplied.
        y0 = function(d, i) {
          return config_.yScale(dataFns.dimension(dataConfig, 'y0')(d, i));
        };
        y1 = function(d, i) {
          return config_.yScale(dataFns.dimension(dataConfig, 'y')(d, i) +
            dataFns.dimension(dataConfig, 'y0')(d, i));
        };
      } else {
        // Otherwise default to bottom of range.
        y0 = function() {
          return config_.yScale.range()[0];
        };
        y1 = function(d, i) {
          return config_.yScale(dataFns.dimension(dataConfig, 'y')(d, i));
        };
      }

      // Configure the areaGenerator function
      config_.areaGenerator
        .x(function(d, i) {
          var value;
          value = dataFns.dimension(dataConfig, 'x')(d, i);
          return config_.xScale(value);
        })
        .y0(y0)
        .y1(y1)
        .defined(function(d, i) {
          var minX, value;
          minX = 0;
          value = dataFns.dimension(dataConfig, 'x')(d, i);
          if (config_.xScale) {
            minX = config_.xScale.range()[0];
            value = config_.xScale(value);
          }
          return value >= minX;
        });
    }

    /**
     * Main function for area component
     * @return {components.area}
     */
    function area() {
      obj.extend(config_, defaults_);
      return area;
    }

    // Apply mixins.
    obj.extend(
      area,
      config.mixin(
        config_,
        'cid',
        'target',
        'xScale',
        'yScale',
        'color',
        'opacity',
        'cssClass',
        'areaGenerator',
        'rootId'
      ),
      mixins.lifecycle,
      mixins.toggle);

    /**
     * Event dispatcher.
     * @public
     */
    area.dispatch = mixins.dispatch();

    // TODO: this will be the same for all components
    // put this func somehwere else and apply as needed
    area.data = function(data) {
      if (data) {
        dataCollection_ = data;
        return area;
      }
      return dataCollection_.get(config_.dataId);
    };

    /**
     * Updates the area component with new/updated data/config
     * @return {components.area}
     */
    area.update = function() {
      if (!root_) {
        return area;
      }

      updateAreaGenerator();

      if (config_.cssClass) {
        root_.classed(config_.cssClass, true);
      }
      root_.select('.gl-path')
        .datum(area.data().data)
        .attr({
          'fill': config_.color,
          'opacity': config_.opacity,
          'd': config_.areaGenerator
        });
      area.dispatch.update.call(this);
      return area;
    };

    /**
     * Renders the area component
     * @param  {d3.selection|Node|string} selection
     * @return {components.area}
     */
    area.render = function(selection) {
      if (!root_) {
        root_ = d3util.applyTarget(area, selection, function(target) {
          var root = target.append('g')
            .attr({
              'class': string.classes('component', 'area')
            });
          root.append('path')
            .attr({
              'class': string.classes('path')
            });
          return root;
        });
      }
      area.update();
      area.dispatch.render.call(this);
      return area;
    };

    /**
     * Returns the root_
     * @return {d3.selection}
     */
    area.root = function() {
      return root_;
    };

    /**
     * Destroys the area and removes everything from the DOM.
     */
    area.destroy = function() {
      if(root_) {
        root_.remove();
      }
      root_ = null;
      config_ = null;
      defaults_ = null;
      area.dispatch.destroy.call(this);
    };

    return area();

  };
});

define('components/component',[
  'components/line',
  'components/legend',
  'components/axis',
  'components/label',
  'components/overlay',
  'components/asset',
  'components/area'
],
function(line, legend, axis, label, overlay, asset, area) {
  

  return {
    line: line,
    legend: legend,
    axis: axis,
    label: label,
    overlay: overlay,
    asset: asset,
    area: area
  };

});

/**
 * @fileOverview
 * Manages a collection of components.
 */
define('core/component-manager',[
  'core/object',
  'core/array',
  'core/string',
  'core/function',
  'components/component'
],
function(obj, array, string, func, components) {
  

  var staticMethods;

  /**
   * Determins if something is a config object or not.
   *
   * @private
   * @param {*} obj
   * @return {Boolean}
   */
  function isConfig(obj) {
    // All components are functions.
    var first = obj;
    if (Array.isArray(obj)) {
      first = obj[0];
    }
    return typeof first === 'object' ? true : false;
  }

  /**
   * Compares a component to a cid.
   *
   * @private
   * @param {String} x
   * @param {components.*} c
   * @return {Boolean}
   */
  function cidComparer(x, c) {
    return c.cid() === x;
  }

  /**
   * Maps a component to its cid.
   *
   * @private
   * @param {components.*} c
   * @return {String|null}
   */
  function cidMapper(c) {
    return c.cid();
  }

  /**
   * Adds a random string as a cid for any component which lacks a cid.
   *
   * @private
   * @param {Array} components
   */
  function validateCids(components) {
    components.forEach(function(c) {
      if (!c.cid()) {
        c.cid(string.random());
      }
    });
  }

  staticMethods = {

    /**
     * Creates a new instance of a component manager object.
     *
     * @param {Array} optComponents An array of components to add
     *    to the colleciton.
     * @return {core.component-manager}
     */
    create: function(optComponents) {
      var mgr = componentManager();
      if (optComponents) {
        mgr.add(optComponents);
      }
      return mgr;
    },

    /**
     * Parses a component or list of components from config(s).
     * TODO: Recursively parse child components too.
     *
     * @return {Array} An array of components.
     */
    parse: function(configs) {
      return array.getArray(configs).map(function(cnf) {
        return components[cnf.type]().config(cnf);
      });
    },

    /**
     * Serializes out all of the components into a group of configs.
     * TODO: Deep serialization by including child components.
     *
     * @return {Array} An array of component config JSON objects.
     */
    serialize: function(components) {
      return array.getArray(components).map(function(c) {
        return c.config();
      });
    }

  };

  function componentManager() {
    var componentList,
        sharedObjects,
        cidList;

    // Key value pair of all registered object refs shared across components.
    // Are in the format:
    //   { 'methodName': { value: sharedObjectValue, autoApply: false } }
    sharedObjects = {};

    // Internal array of all the components.
    componentList= [];

    //Internal obj of all ids
    cidList = {};

    return obj.extend({

      /**
       * Gets all components.
       * Optionally filters by cids.
       *
       * @param {Array|string|undefined} cids An array of cids.
       * @return {Array} All the matching components.
       */
      get: function(cids) {
        var component;

        if (!cids) {
          // Return a copy of all.
          return componentList.concat();
        }
        if (typeof cids === 'string') {
          component = array.find(componentList,
            func.partial(cidComparer, cids));
          return component ? [component] : [];
        }
        return this.filter(function(c) {
          return array.contains(cids, c.cid());
        }, this);
      },

      /**
       * Gets the first element in the resulting list of matching cids.
       *
       * @public
       * @param {Array} cids
       * @return {components.*|null}
       */
      first: function(cids) {
        var values;
        values = this.get(cids);
        return values.length ? values[0] : null;
      },

      /**
      * Event dispatcher.
      * @public
      */
      dispatch: d3.dispatch('error'),

      /**
       * Adds a new component to the collection.
       *
       * Example:
       *   add(component)
       *   add(componentConfig)
       *
       * @param {Array|Object|components.*} A component or a component config.
       * @return {Array} An array of created components.
      */
      add: function(config) {
        var instances, newCids;

        instances = config;
        if (isConfig(instances)) {
          instances = staticMethods.parse(instances);
        } else {
          instances = array.getArray(instances);
        }
        validateCids(instances);

        instances.forEach(function(c) {
          if(cidList[c.cid()]){
            this.dispatch.error();
            return;
          }
          cidList[c.cid()] = true;
          componentList.push(c);
        }, this);
        
        newCids = instances.map(cidMapper);
        this.applyAutoSharedObjects(newCids);
        return instances;
      },

      /**
       * Get all the cids of all the components.
       *
       * @return {Array} An array of cid strings.
       */
      cids: function() {
        return componentList.map(cidMapper);
      },

      /**
       * Applies a custom filter to the collection.
       *
       * @param {Function} fn
       * @param {Object} context
       * @return {Array} An array of matching components.
       */
      filter: function(fn, context) {
        return componentList.filter(fn, context);
      },

      /**
       * Removes components from the collection (without destroying them).
       * Also removes the cids from the the cidList.
       *
       * @param {Array|undefined} cids The cids of the comonents to remove.
       *    If not provided will remove all components.
       * @return {core.comopnent-manager}
       */
      remove: function(cids) {
        array.remove(componentList, this.get(cids));
        obj.remove(cidList, cids);
        return this;
      },

      /**
       * Destroys and removes specified component(s).
       *
       * @param {Array} cids
       * @return {core.component-manger}
       */
      destroy: function(cids) {
        this.get(cids).forEach(function(c) {
          c.destroy();
        });
        this.remove(cids);
        return this;
      },

      /**
       * Calls the same method on all the components.
       * Optionally filters by cids.
       *
       * @param {String} method The method name.
       * @param {Array|undefined} cids The cids to filter by.
       * @param {arguments} ... Any other args to pass to the method.
       * @return {core.component-manager}
       */
      applyMethod: function(method, cids) {
        var args = array.convertArgs(arguments, 2);
        this.get(cids).forEach(function(c) {
          if (typeof c[method] === 'function') {
            c[method].apply(c, args);
          }
        });
        return this;
      },

      /**
       * Registers a new shared object which may be set on any/all of the
       *   components.
       *
       * @public
       * @param {String} name
       * @param {*} value
       * @param {Boolean|undefined} optAutoApply
       * @return {core.component-manager}
       */
      registerSharedObject: function(name, value, optAutoApply) {
        sharedObjects[name] = {
          value: value,
          autoApply: optAutoApply || false
        };
        return this;
      },

      /**
       * Gets all the registered shared objects.
       *
       * @public
       * @return {Object}
       */
      getSharedObjects: function() {
        return sharedObjects;
      },

      /**
       * Sets the matching shared object on all components.
       *   Assumes that "name" is a setter method on the component.
       *
       * @public
       * @param {String} name
       * @param {Array} cids
       * @param {Boolean} optSupressUpdate
       * @return {core.component-manager}
       */
      applySharedObject: function(name, cids, optSupressUpdate) {
        if (sharedObjects[name]) {
          this.applyMethod(name, cids, sharedObjects[name].value);
          if (!optSupressUpdate) {
            this.update(cids);
          }
        }
        return this;
      },

      /**
       * Applies all the shared objects configured to be automatically applied.
       *   Optionally limits to cids.
       *
       * @public
       * @param {Array|undefined} cids
       * @return {core.component-manager}
       */
      applyAutoSharedObjects: function(cids) {
        Object.keys(sharedObjects).forEach(function(name) {
          if (sharedObjects[name].autoApply) {
            this.applySharedObject(name, cids, true);
          }
        }, this);
        this.update(cids);
        return this;
      },

      /**
       * Sets data for components. Optionally filters by cid(s).
       *
       * @param {data.collection} data The data colleciton to set.
       * @param {Array|undefined} cids Optionally filter by cids.
       */
      data: function(data, cids) {
        return this.applyMethod('data', cids, data);
      },

      /**
       * Renders component(s).
       *
       * @param {d3.selection|string} selection
       * @param {Array} cids Optional array of component ids.
       */
      render: function(selection, cids) {
        return this.applyMethod('render', cids, selection);
      },

      /**
       * Updates all components by default, or limit to cids
       */
      update: function(cids) {
        return this.applyMethod('update', cids);
      },

      /**
       * Show component(s) optionally restricted to provided cids.
       */
      show: function(cids) {
        return this.applyMethod('show', cids);
      },

      /**
       * Hide component(s) optionally restricted to provided cids.
       */
      hide: function(cids) {
        return this.applyMethod('hide', cids);
      }

    });
  }

  return staticMethods;

});

/**
 * @fileOverview
 * Layouts
 * Set of predefined layouts directly available for use.
 */
define('layout/layouts',[],function () {
  

  var layouts = {

    'default': {
      name: 'gl-vgroup',
      split: [10, 65, 10, 15],
      children: [
        {
          name: 'gl-info'
        },
        {
          name: 'gl-main',
          clip: true,
          border: 1,
          paddingTop: 4,
          borderColor: '#999',
          backgroundColor: '#fff'
        },
        {
          name: 'gl-xaxis',
          padding: 1,
          paddingTop: 20
        },
        {
          name: 'gl-footer',
          paddingTop: 1,
          paddingBottom: 1,
          padding: 1,
          borderStyle: 'dotted',
          borderTop: 1
        }
      ]
    },

   'threepane': {
      name: 'gl-vgroup',
      split: [15, 70, 15],
      children: [
        {
          name: 'gl-stat',
          padding: 1
        },
        {
          name: 'gl-main',
          padding: 1,
          paddingBottom: 10
        },
        {
          name: 'gl-info',
          padding: 1
        }
      ]
    }

  };

  return {

    /**
     * Get a layout by specifying id.
     */
    getLayout: function(id) {
      return layouts[id];
    },

    /**
     * Get the entire layouts object.
     */
    getLayouts: function() {
      return layouts;
    },

    /**
     * Provide an id and associated layout, for reuse.
     */
    setLayout: function(id, layout) {
      layouts[id] = layout;
    },

    /**
     * Remove a layout by its id.
     */
    removeLayout: function(id) {
      delete layouts[id];
    }

  };

});

/**
 * @fileOverview
 * Layout manager.
 */
define('layout/layoutmanager',[
  'layout/layouts',
  'core/array'
],
function (layouts, array) {
  

  function calculateDim(splits, length) {
    return splits.map(function(split) {
      return (parseInt(split, 10)/100) * length;
    });
  }

  function percent(number, percentage) {
    percentage = percentage || 1;
    return parseInt(number, 10) * (percentage/100);
  }

  function getPaddingContainer(node, nodeInfo) {
    var child, paddingLeft, paddingRight, paddingTop,
        paddingBottom, percentWidth, percentHeight;
    if (nodeInfo.padding) {
      paddingLeft = paddingRight = paddingTop =
        paddingBottom = nodeInfo.padding;
    } else {
      paddingLeft = paddingRight = paddingTop =
        paddingBottom = 0;
    }
    paddingLeft += nodeInfo.paddingLeft || 0;
    paddingRight += nodeInfo.paddingRight || 0;
    paddingTop += nodeInfo.paddingTop || 0;
    paddingBottom += nodeInfo.paddingBottom || 0;

    if (paddingLeft === 0 && paddingRight === 0 &&
          paddingTop === 0 && paddingBottom === 0) {
      return node;
    }

    child = node.append('g');
    child.attr({
      'gl-padding': nodeInfo.padding,
      'gl-padding-left': nodeInfo.paddingLeft,
      'gl-padding-right': nodeInfo.paddingRight,
      'gl-padding-top': nodeInfo.paddingTop,
      'gl-padding-bottom': nodeInfo.paddingBottom
    });
    percentWidth = percent(node.width());
    percentHeight = percent(node.height());
    child.size(
      percent(node.width(), 100 - (paddingLeft + paddingRight)),
      percent(node.height(), 100 - (paddingTop + paddingBottom)));
    child.position('top-left',
      percentWidth * paddingLeft, percentHeight * paddingTop);
    return child;
  }

  /**
   * Sizes the node based on the border parameters
   * @param  {d3 selection} node
   * @param  {Object} borderParams
   * {
   *    style: border style <'solid'|'dotted'|'dashed'>,
   *    color: border color <paint>,
   *    @see http://www.w3.org/TR/SVG/painting.html#SpecifyingPaint
   *    width: {Array} 4 element array corresponding to
   *      border width of each edge top, right, bottom and left
   *      Value : <percentage> | <length> | inherit | 0
   *      0 represents no border
   *  }
   * @return {d3 selection}
   */
  function resizeBorderedContainer(node, borderParams) {
    var child;

    if (!borderParams.hasBorder) {
      return node;
    }

    child = node.append('g');
    child.size(
      node.width() - (borderParams.width[1] + borderParams.width[3]),
      node.height() - (borderParams.width[0] + borderParams.width[2]));
    child.position('top-left',
      borderParams.width[3], borderParams.width[0]);
    child.attr({
      'gl-bordered': 'true'
    });
    return child;
  }

  /**
   * Computes border parameters required to set borders
   * @param  {Object} nodeInfo
   * @return {Object} borderParams
   * borderParams = {
   *    style: border style <'solid'|'dotted'|'dashed'>,
   *    color: border color <paint>,
   *    @see http://www.w3.org/TR/SVG/painting.html#SpecifyingPaint
   *    width: {Array} 4 element array corresponding to
   *      border width of each edge top, right, bottom and left
   *      Value : <percentage> | <length> | inherit | 0
   *      0 represents no border
   *  }
   */
  function getBorderParams(nodeInfo) {
    var borderParams = {},
      strokeWidth,
      width,
      hasBorder;

    width = [0, 0, 0, 0];
    hasBorder = false;

    if (nodeInfo.border) {
      strokeWidth = parseInt(nodeInfo.border, 10);
      width = [strokeWidth, strokeWidth, strokeWidth, strokeWidth];
      hasBorder = true;
    }
    if (nodeInfo.borderTop) {
      width[0] = parseInt(nodeInfo.borderTop, 10);
      hasBorder = true;
    }
    if (nodeInfo.borderRight) {
      width[1] = parseInt(nodeInfo.borderRight, 10);
      hasBorder = true;
    }
    if (nodeInfo.borderBottom) {
      width[2] = parseInt(nodeInfo.borderBottom, 10);
      hasBorder = true;
    }
    if (nodeInfo.borderLeft) {
      width[3] = parseInt(nodeInfo.borderLeft, 10);
      hasBorder = true;
    }

    borderParams = {
      color: nodeInfo.borderColor || '#999',
      style: nodeInfo.borderStyle || 'solid',
      width: width,
      hasBorder: hasBorder
    };

    return borderParams;

  }

  function applyLayout(node) {
    if (node.attr('gl-container-name') === 'gl-vgroup') {
      node.layout({type: 'vertical'});
    } else if (node.attr('gl-container-name') === 'gl-hgroup') {
      node.layout({type: 'horizontal'});
    }
  }

  return {

    /**
     * Renders the layout, which is either specified by its string id,
     * or the layout object.
     * Takes the root svg element, width and height.
     */
    setLayout: function(layout, root, width, height) {
      var layoutConfig, node, dim, borderParams;

      layoutConfig = (typeof layout === 'string') ?
        layouts.getLayout(layout) :
        layout;

      array.getArray(layoutConfig).forEach(function(nodeInfo) {
        node = root.append('g');

        node.size(width, height);
        if (nodeInfo.backgroundColor) {
          node.backgroundColor(nodeInfo.backgroundColor);
        }
        if (nodeInfo.clip === true) {
          node.clip();
        }
        borderParams = getBorderParams(nodeInfo);
        if (borderParams.hasBorder) {
          node.border(
            borderParams.style,
            borderParams.color,
            borderParams.width
          );
          node = resizeBorderedContainer(node, borderParams);

        }
        node = getPaddingContainer(node, nodeInfo);

        node.attr({
          'gl-container-name': nodeInfo.name,
          'gl-split': nodeInfo.split
        });
        if (nodeInfo.class) {
          node.classed(nodeInfo.class, true);
        }
        if (node.attr('gl-container-name') === 'gl-vgroup') {
          dim = calculateDim(nodeInfo.split, height);
          dim = dim.map(function(d) {
            return [width, d];
          });
        } else if (node.attr('gl-container-name') === 'gl-hgroup') {
          dim = calculateDim(nodeInfo.split, width);
          dim = dim.map(function(d) {
            return [d, height];
          });
        }
        array.getArray(nodeInfo.children).forEach(function(child, i) {
          if (dim) {
            this.setLayout(child, node, dim[i][0], dim[i][1]);
          } else {
            this.setLayout(child, node, node.width(), node.height());
          }
        }, this);
        applyLayout(node);
      }, this);

    }

  };
});

/**
 * @fileOverview
 * Very simple implementation for an unordered set.
 * Works with primitive types such as strings and numbers.
 */
define('core/set',[
  'core/object',
  'core/array'
],
function (obj, array) {
  

  function set() {
    var store = {};

    return {

      /**
       * Adds element(s) to the set.
       */
      add: function(elements) {
        elements = array.getArray(elements);
        elements.forEach(function(element) {
          store[element] = true;
        });
      },

      /**
       * Removes element(s) to the set.
       */
      remove: function(elements) {
        elements = array.getArray(elements);
        elements.forEach(function(element) {
          delete store[element];
        });
      },

      /**
       * Serializes the set to an array.
       * Note: order is not preserved.
       */
      toArray: function() {
        return Object.keys(store);
      },

      /**
       * Returns true if set is empty.
       */
      isEmpty: function() {
        return Object.keys(store).length === 0;
      },

      /**
       * Returns true if set contains all the elements specified.
       *         false otherwise.
       */
      contains: function(elements) {
        elements = array.getArray(elements);
        return elements.every(function(element) {
          return obj.isDef(store[element]);
        });
      },

      /**
       * Toggles the presence of the element(s).
       * If element is present, it is removed.
       * If element is absent, it is added.
       */
      toggle: function(elements) {
        elements = array.getArray(elements);
        elements.forEach(function(element) {
          if (this.contains(element)) {
            this.remove(element);
          } else {
            this.add(element);
          }
        }, this);
      }

    };
  }

  return {

    /**
     * Creates a new set.
     * Takes in optional elements to initialize the set.
     */
    create: function (elements) {
      var newSet = set();
      if (obj.isDef(array)) {
        newSet.add(elements);
      }
      return newSet;
    }

  };

});

/**
 * @fileOverview
 * Data Dimension.
 */
define('data/dimension/dimension',[
  'core/array'
], function (array) {
  

  var Dimension;

  function sumReduce(arr) {
    return arr.reduce(function(prevValue, curValue){
      return curValue + prevValue;
    });
  }

  /**
   * @constructor
   * Data Dimension.
   */
  Dimension = function(optDataSource) {
    this.dataSources_ = array.getArray(optDataSource);
  };

  /**
   * Adds a dimension to the dimension selection.
   */
  Dimension.prototype.add = function(data) {
    if(Array.isArray(data)) {
      array.append(this.dataSources_, data);
    } else {
      this.dataSources_.push(data);
    }
    return this;
  };

  /**
   * Generic map function that accepts and applies a function
   *   on its sources.
   */
  Dimension.prototype.map = function(fn, context) {
    return new Dimension(this.dataSources_.map(fn, context));
  };

  /**
   * Accepts and applies a filter fn on its dimension sources.
   */
  Dimension.prototype.filter = function(fn, context) {
    return this.map(function(dataSource) {
      return dataSource.filter(fn, context);
    });
  };

  /**
   * Sums all the values and returns the selection.
   */
  Dimension.prototype.sum = function() {
    return this.map(function(dataSource) {
      return sumReduce(dataSource);
    });
  };

  /**
   * Averages the values in the dimension selection.
   */
  Dimension.prototype.avg = function() {
    return this.map(function(dataSource) {
      return sumReduce(dataSource)/dataSource.length;
    });
  };

  /**
   * Computes the max values in the dimension selection.
   */
  Dimension.prototype.max = function() {
    return this.map(function(dataSource) {
      return d3.max(dataSource);
    });
  };

  /**
   * Computes the min values in the dimension selection.
   */
  Dimension.prototype.min = function() {
    return this.map(function(dataSource) {
      return d3.min(dataSource);
    });
  };

  /**
   * Computes the max/min values in the dimension selection.
   */
  Dimension.prototype.extent = function() {
    return this.map(function(dataSource) {
      return d3.extent(dataSource);
    });
  };

  /**
   * Rounds the values in the dimension selection.
   */
  Dimension.prototype.round = function() {
    return this.map(function(dataSource) {
      if (Array.isArray(dataSource)) {
        return dataSource.map(function(d) {
          return Math.round(d);
        });
      } else {
        return Math.round(dataSource);
      }
    });
  };

  /**
   * Concatinates the values in multiple sources into one.
   */
  Dimension.prototype.concat = function() {
    var arr = [];
    this.dataSources_.forEach(function(dataSource) {
      arr = arr.concat(dataSource);
    });
    return new Dimension([arr]);
  };

  /**
   * Returns the raw value of the selection.
   */
  Dimension.prototype.all = function() {
    return this.dataSources_;
  };

  /**
   * Returns a source by index.
   * Defaults to returning the first source.
   */
  Dimension.prototype.get = function(i) {
    i = i || 0;
    return this.dataSources_[i];
  };

  return {

    create: function(optDimensions) {
      return new Dimension(optDimensions);
    },

    getDimensionPrototype: function() {
      return Dimension.prototype;
    }

  };

});

/**
 * @fileOverview
 * Data Selection.
 */
define('data/selection/selection',[
  'data/dimension/dimension',
  'core/object',
  'core/array',
  'data/functions'
], function (dimension, obj, array, dataFns) {
  

  var Selection;

  /**
   * @constructor
   * Data Selection.
   */
  Selection = function(optDataSource) {
    this.dataSources_ = array.getArray(optDataSource);
  };

  Selection.prototype.add = function(data) {
    if(Array.isArray(data)) {
      array.append(this.dataSources_, data);
    } else {
      this.dataSources_.push(data);
    }
    return this;
  };

  /**
   * Applies filter using dimensions on data sources.
   * This will eventually be a more versatile function.
   * Assumes when two inputs are given, that the first is a dimension and
   * second is a range if it is an array.
   * TODO: If second arg is simple value, filter if equal to that value.
   *       If second arg is a function, use that function.
   */
  Selection.prototype.filter = function(dim, range) {
    return this.map(function(dataSource) {
      var filteredDataSource = {}, accessor;
      obj.extend(filteredDataSource, dataSource);
      accessor = dataFns.dimension(dataSource, dim);
      filteredDataSource.data =  filteredDataSource.data.filter(
        function(d) {
          var e = accessor(d);
          return e >= range[0] && e<= range[1];
        }
      );
      return filteredDataSource;
    });
  };

  /**
   * Filters the datasources by tags.
   * returns datasources which do not contain tags.
   * @param  {array|string} tags
   */
  Selection.prototype.filterByTags = function (tags) {
    return new Selection(this.dataSources_.filter(
      function(dataSource) {
        return array.getArray(tags).every(function(tag) {
          return !array.contains(dataSource.tags, tag);
        });
      })
    );
  };

  Selection.prototype.length = function() {
    return this.dataSources_.length;
  };

  Selection.prototype.map = function(fn) {
    return new Selection(this.dataSources_.map(fn));
  };

  Selection.prototype.dimMap = function(fn) {
    return dimension.create(this.dataSources_.map(fn));
  };

  Selection.prototype.all = function() {
    return this.dataSources_;
  };

  Selection.prototype.get = function(i) {
    i = i || 0;
    return this.dataSources_[i];
  };

  Selection.prototype.dim = function(dim) {
    return this.dimMap(function(dataSource) {
      return dataSource.data.map(dataFns.dimension(dataSource, dim));
    });
  };

  /**
   * Returns a new selection with the specified dimensions
   * in a flat form.
   * @param {string|Array.<string>} dims A list of dimensions.
   */
  Selection.prototype.flatten = function(dims) {
    return this.map(function(dataSource) {
      var newDataSource = {};
      obj.extend(newDataSource, dataSource);
      delete newDataSource.dimensions;
      newDataSource.data = dataSource.data.map(function(d) {
        var data = {};
        array.getArray(dims).forEach(function(dim) {
          data[dim] = dataFns.dimension(dataSource, dim)(d);
        });
        return data;
      });
      return newDataSource;
    });
  };

  return {

    create: function(optDataSource) {
      return new Selection(optDataSource);
    },
    getSelectionPrototype: function() {
      return Selection.prototype;
    }

  };

});

/**
 * @fileOverview
 * Difference quotient.
 */
define('data/selection/diff-quotient',[
  'core/object',
  'core/string',
  'data/functions',
  'data/selection/selection'
], function (obj, string, dataFns, selection) {
  

  var selectionPrototype = selection.getSelectionPrototype(),
      TIME_INTERVAL;

  /**
   * @const
   * @enum{string}
   * TODO: Move after creation of a constants file.
   */
  TIME_INTERVAL = {
    SECOND: 1000,
    MINUTE: 1000 * 60,
    HOUR: 1000 * 60 * 60,
    DAY: 1000 * 60 * 60 * 24
  };

  /**
   * Calculates the difference quotient on the data
   * TODO: Should accept dimension on which to work on.
   * @param {Object?} options
   * @param {(string|number)?} options.interval Optional interval specified as
   *   number or string such as second, minute, hour or day.
   */
  selectionPrototype.diffQuotient = function (options) {
    var data, mutatedData, interval,
        prevX, prevY, curX, curY, slope;
    options = options || {};
    interval = options.interval || 1;
    if (string.isString(interval)) {
      interval = TIME_INTERVAL[options.interval.toUpperCase()];
    }
    return this.map(function(source) {
      var r = {};
      data = source.data;
      mutatedData = [];
      data.forEach(function(d, i) {
        curX = dataFns.dimension(source, 'x')(d);
        curY = dataFns.dimension(source, 'y')(d);
        if (i !== 0) {
          slope = (curY - prevY) / (curX - prevX);
          mutatedData.push({
            x: curX,
            y: slope * interval
          });
        }
        prevX = curX;
        prevY = curY;
      });
      obj.extend(r, source);
      r.data = mutatedData;
      r.dimensions = {  x: 'x', y: 'y' };
      return r;
    });
  };

});

/**
 * @fileOverview
 * Stack data sources.
 */
define('data/selection/stack',[
  'core/object',
  'data/selection/selection'
], function (obj, selection) {
  

  var selectionPrototype = selection.getSelectionPrototype();

  /**
   * Applies a stacking function to the selected data sources.
   * Assumes presence of 'y' dimension, and adds a new 'y0' dimension.
   */
  selectionPrototype.stack = function() {
    var stack, flattenedSource;

    stack = d3.layout.stack()
      .values(function(d) {
        return d.data;
      });

    flattenedSource = this.flatten(['x','y']);

    stack(flattenedSource.all());
    flattenedSource.map(function(source) {
      source.id += '-stack';
      // Dimensions are not needed for flat fields.
      // Required because a component is checking for y0 dim.
      source.dimensions = {
        y0: 'y0'
      };
    });

    return flattenedSource;
  };

});

/**
 * @fileOverview
 * Data source mutators.
 */
define('data/collection',[
  'core/object',
  'core/array',
  'core/set',
  'data/selection/selection',
  'events/pubsub',
  'data/selection/diff-quotient',
  'data/selection/stack'
], function (obj, array, set, selection, pubsub) {
  

  /**
   * Computes the derivation by calling the
   * derivation function with the sources it needs.
   */
  function applyDerivation(dc, data) {
    var dataSelections, derivedData;
    dataSelections = array.getArray(data.sources).map(function(d) {
      return dc.select(d);
    });
    derivedData = data.derivation.apply(null, dataSelections);
    if (typeof derivedData === 'object' &&
         !Array.isArray(derivedData)) {
      obj.extend(derivedData, data);
    }
    return derivedData;
  }

  function getScopeFn(scope) {
    return pubsub.scope(scope);
  }

  /**
   * A data config is determined to derived config if
   * it contains a sources or derivation field.
   */
  function isDerivedDataConfig(data) {
    if (data) {
      return  obj.isDef(data.sources) ||
              obj.isDef(data.derivation);
    }
    return false;
  }

  /**
   * Adds a data source.
   * Tags non-derived sources with * and +.
   * Tags derived sources with +.
   */
  function addDataSource(dataCollection, data) {
    var id = data.id;
    if (isDerivedDataConfig(data)) {
      if (!obj.isDef(data.tags)) {
        data.tags = '+';
      }
      dataCollection[id] = { glDerive: data };
    } else {
      if (!obj.isDef(data.tags)) {
        data.tags = ['*', '+'];
      }
      dataCollection[id] = data;
    }
  }

  /**
   * @private
   * Derives data source by id.
   * Accepts the cached deps object.
   * Results in the derivation of any non-cached dependencies
   * of the data source.
   */
  function deriveDataById(id, data, deps, dataCollection, visited) {
    var d = data[id], sources;
    if(!dataCollection.isDerived(id)) {
      deps[id] = true;
      return;
    }
    visited = visited || [];
    if (deps[id]) {
      return;
    }
    if (array.contains(visited, id)) {
      deps[id] = true;
      // TODO: Make enum for errors.
      d.glDerivation = 'gl-error-circular-dependency';
    }
    visited.push(id);
    sources = [];
    array.getArray(d.glDerive.sources).forEach(function(s) {
      sources = sources.concat(s.split(','));
    });
    sources.forEach(function(id) {
      deriveDataById(id.trim(), data, deps, dataCollection, visited);
    });
    deps[id] = true;
    d.glDerivation = applyDerivation(dataCollection, d.glDerive);
  }

  function collection() {
    var dataCollection = {},
        globalPubsub = pubsub.getSingleton();

    return {

      /**
      * Event dispatcher.
      * @public
      */
      dispatch: d3.dispatch('error'),

      /**
       * Add a data source.
       * dispatch error event if id is not unique
       */
      add: function(data) {
        if (Array.isArray(data)) {
          data.forEach(this.add, this);
          return;
        }
        if (dataCollection[data.id]) {
          this.dispatch.error();
          return;
        }
        addDataSource(dataCollection, data);
      },

      /**
       * Adds a data source if it doesn't exist.
       * Replace a data source if it does.
       */
      upsert: function(data) {
        if (!dataCollection[data.id]) {
          this.add(data);
        }
        addDataSource(dataCollection, data);
      },

      isDerived: function(id) {
        var data = dataCollection[id];
        return obj.isDef(data) && obj.isDef(data.glDerive);
      },

      /**
       * Recalculate derived sources.
       */
      updateDerivations: function() {
        var deps = {};
        Object.keys(dataCollection).forEach(function(k) {
          deriveDataById(k, dataCollection, deps, this);
        }, this);
        return deps;
      },

      /**
       * Remove a data source by id.
       */
      remove: function(id) {
        var ids = array.getArray(id);
        ids.forEach(function(i) {
          delete dataCollection[i];
        });
      },

      /**
       * Extend a data-source in place.
       * If data source doesn't exist, it's added.
       */
      extend: function(data) {
        var id = data.id;
        if (dataCollection[id]) {
          obj.extend(dataCollection[id], data);
        } else {
          this.add(data);
        }
      },

      /**
       * Append data to a source by id.
       */
      append: function(id, dataToAppend) {
        var dataSource = this.get(id);
        if (dataSource) {
          if (Array.isArray(dataToAppend)) {
            array.append(dataSource.data, dataToAppend);
          } else {
            dataSource.data.push(dataToAppend);
          }
        }
      },

      /**
       * Returns the tag(s) of the datasource speciifed by its id.
       */
      getTags: function(id) {
        var tags;
        if (this.isDerived(id)) {
          tags = obj.get(dataCollection, [id, 'glDerive', 'tags']);
        } else {
          tags = obj.get(dataCollection, [id, 'tags']);
        }
        return array.getArray(tags);
      },

      /**
       * Sets the tag(s) of the datasource speciifed by its id.
       */
      setTags: function(id, tags) {
        tags = set.create(tags).toArray();
        if (this.isDerived(id)) {
          dataCollection[id].glDerive.tags = tags;
        }
        dataCollection[id].tags = tags;
      },


      /**
       * Adds tag(s) to a datasource by id.
       * If tag is already present, no operation is performed.
       */
      addTags: function(id, tags) {
        var tagSet = set.create(this.getTags(id));
        tagSet.add(tags);
        this.setTags(id, tagSet.toArray());
      },

      /**
       * Removes tag(s) from a datasource by id.
       * If tag isn't present, no operation is performed.
       */
      removeTags: function(id, tags) {
        var tagSet = set.create(this.getTags(id));
        tagSet.remove(tags);
        this.setTags(id, tagSet.toArray());
      },

     /**
       * Checks if tag(s) belong to a datasource by id.
       */
      hasTags: function(id, tags) {
        return array.getArray(tags).every(function(tag) {
          return array.contains(this.getTags(id), tag);
        }, this);
      },

      /**
       * Togggles the presence the of the given tags with the
       * datasource with the associated id.
       * In other words,
       * Adds a tag if it isn't present.
       * Removes a tag if it is present.
       * @param  {@Object} scope/rootid
       */
       //todo: functional approach for scoping
       //XXX: optimize update derivations
      toggleTags: function(id, tags, scope) {
        var tagSet, scopeFn;
        tagSet = set.create(this.getTags(id));
        scopeFn = getScopeFn(scope);
        tags = array.getArray(tags);
        tagSet.toggle(tags);
        this.setTags(id, tagSet.toArray());
        this.updateDerivations();
        globalPubsub.pub(scopeFn('data-toggle'), id);
      },

      /**
       * Get data source by id.
       */
      get: function(id) {
        if (obj.get(dataCollection, id)) {
          if (this.isDerived(id)) {
            return dataCollection[id].glDerivation ||
                   'gl-error-not-computed';
          }
          return dataCollection[id];
        }
        if (arguments.length === 0) {
          return Object.keys(dataCollection).map(function(k) {
            var data = dataCollection[k];
            return data.glDerivation || data;
          });
        }
        return null;
      },

      /**
       * Accepts the following string of comma-delimited:
       * ids
       * wildcards (* for all non-derived sources, + for all sources)
       */
      select: function(sources) {
        var dataSelection = selection.create(),
            dataList = [], ids = [];
        array.getArray(sources).forEach(function(s) {
          ids = ids.concat(s.split(','));
        });
        ids.forEach(function(id) {
          id = id.trim();
          if(dataCollection[id]) {
            dataList.push(this.get(id));
          } else {
            Object.keys(dataCollection).forEach(function(k) {
              if(this.hasTags(k, id)) {
                dataList.push(this.get(k));
              }
            }, this);
          }
        }, this);
        dataSelection.add(dataList);
        return dataSelection;
      },

      /**
       * Checks whether dataCollection is empty
       * @return {Boolean}
       */
      isEmpty: function(optSel) {
        if (optSel) {
          return this.select(optSel).length() === 0;
        }
        return Object.keys(dataCollection).length === 0;
      }
    };
  }

  return {

    /**
     * Creates a new collection.
     */
    create: function() {
      return collection();
    }
  };

});

/**
 * @fileOverview
 * Helper functions for computing the domain.
 */
define('data/domain',[
  'd3',
  'core/object'
], function (d3, obj) {
  

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

/**
 * @fileOverview
 *
 * A reusable X-Y graph.
 */
define('graphs/graph',[
  'core/object',
  'core/config',
  'core/array',
  'core/asset-loader',
  'core/component-manager',
  'core/string',
  'components/component',
  'layout/layoutmanager',
  'd3-ext/util',
  'mixins/mixins',
  'data/functions',
  'data/collection',
  'data/domain'
],
function(obj, config, array, assetLoader, componentManager, string, components,
  layoutManager, d3util, mixins, dataFns, collection, domain) {
  

  return function() {

    /**
     * Private variables.
     */
    var config_,
      defaults_,
      root_,
      defaultXaccessor_,
      defaultYaccessor_,
      dataCollection_,
      STATES,
      NO_COLORED_COMPONENTS,
      coloredComponentsCount,
      componentManager_,
      isRendered;

    /**
     * @enum
     * The possible states a graph can be in.
     */
    STATES = {
      NORMAL: 'normal',
      EMPTY: 'empty',
      LOADING: 'loading',
      ERROR: 'error',
      DESTROYED: 'destroyed'
    };

    /**
     * Components that do not require a default color
     * @type {Array}
     */
    NO_COLORED_COMPONENTS = ['axis', 'legend', 'label'];

    config_ = {};

    defaults_ = {
      layout: 'default',
      width: 700,
      height: 230,
      viewBoxHeight: 230,
      viewBoxWidth: 700,
      preserveAspectRatio: 'none',
      xScale: d3.time.scale.utc().domain([0, 0]),
      yScale: d3.scale.linear(),
      showLegend: true,
      xTicks: 7,
      yTicks: 3,
      emptyMessage: 'No data to display',
      loadingMessage: 'Loading...',
      errorMessage: 'Error loading graph data',
      state: 'normal',
      yDomainModifier: 1.2,
      colorPalette: d3.scale.category10().range(),
      xAxisUnit: null,
      yAxisUnit: null,
      primaryContainer: 'gl-main',
      domainIntervalUnit: null,
      id: string.random(),
      domainSources: null,
      domainConfig: null
    };

    /**
     * Default x accessor for data
     * @private
     * @param  {Object} d
     * @return {Object}
     */
    defaultXaccessor_ = function(d) {
      return d.x;
    };

    /**
     * Default x accessor for data
     * @private
     * @param  {Object} d
     * @return {Object}
     */
    defaultYaccessor_ = function(d) {
      return d.y;
    };

    /**
     * Gets the main container selection.
     * @private
     * @return {d3.selection}
     */
    function getPrimaryContainer() {
      return root_.selectAttr('gl-container-name', config_.primaryContainer);
    }

    /**
     * Calculates the main container width/height
     * @private
     * @return {Array} Array of numbers [width, height]
     */
    function getPrimaryContainerSize() {
      return getPrimaryContainer().size();
    }

    /**
     * Sets default color for on component if color not set
     * @private
     * @param {Object} component [description]
     */
    function setDefaultColor(component) {
      var colors, len;

      if (!array.contains(NO_COLORED_COMPONENTS, component.config().type)){
        colors = d3.functor(config_.colorPalette)();
        len = colors.length;
        if (component.hasOwnProperty('color')) {
          component.config().color = component.config().color ||
            colors[(coloredComponentsCount += 1) % len];
        }
      }
    }

    /**
     * Appends defs
     * @private
     * @param  {d3.selection} selection
     */
    function renderDefs(selection) {
      return selection.append('defs');
    }

    /**
     * Appends svg node to the selection
     * @private
     * @param  {d3.selection} selection
     */
    function renderSvg(selection) {
      root_ = selection.append('svg')
        .attr({
          'width': config_.width,
          'height': config_.height,
          'viewBox': [
            0,
            0,
            config_.viewBoxWidth,
            config_.viewBoxHeight].toString(),
          'preserveAspectRatio': config_.preserveAspectRatio
        });
      return root_;
    }

    /**
     * Sets up the panel(svg)
     * @private
     * @param  {d3.selection} selection
     */
    function renderPanel(selection) {
      root_ = renderSvg(selection);
      renderDefs(root_);
      layoutManager.setLayout(
        config_.layout,
        root_,
        config_.viewBoxWidth,
        config_.viewBoxHeight);
      root_.select('g').attr('gl-id', config_.id);
    }

    function getDomainConfig(sources) {
      return {
        x: {
          sources: sources,
          compute: 'interval',
          args: {
            unit: config_.domainIntervalUnit,
            period: config_.domainIntervalPeriod
          },
          modifier: {
            force: config_.forceX
          },
          'default': [0, 0]
        },
        y: {
          sources: sources,
          compute: 'extent',
          modifier: {
            force: config_.forceY,
            maxMultiplier: config_.yDomainModifier
          },
          'default': [0, 0]
        }
      };
    }

    /**
     * Updates the domain on the scales
     * @private
     */
    function updateScales() {
      var graphDomain,
          domainSources,
          domainConfig;

      domainSources = config_.domainSources || '*';
      domainConfig = getDomainConfig(domainSources);
      if (config_.domainConfig) {
        domainConfig = obj.extend(domainConfig, config_.domainConfig);
      }
      domain.addDomainDerivation(domainConfig, dataCollection_);

      dataCollection_.updateDerivations();
      graphDomain = dataCollection_.get('$domain');
      if (dataCollection_.select(domainSources).length() > 0) {
        config_.xScale.rangeRound([0, getPrimaryContainerSize()[0]])
          .domain(graphDomain.x);

        config_.yScale.rangeRound([getPrimaryContainerSize()[1], 0])
          .domain(graphDomain.y);
      }
    }

    /**
     * Formats the keys for the legend and calls update on it
     * @private
     */
    function updateLegend() {
      var legendKeys = [];
      componentManager_.get().forEach(function(c) {
        var cData = c.data ? c.data() : null;
        if (c.config('inLegend') && cData) {
          legendKeys.push({
            dataId: c.config('dataId'),
            color: c.config('color'),
            label: c.data().title || ''
          });
        }
      });
      componentManager_.first('gl-legend')
        .config({ keys: legendKeys })
        .update();
    }

    /**
     * Updates all the special components.
     */
    function updateComponents() {
      componentManager_.first('gl-xaxis')
        .config({
          scale: config_.xScale,
          ticks: config_.xTicks,
          unit: config_.xAxisUnit
        });
      componentManager_.first('gl-yaxis')
        .config({
          scale: config_.yScale,
          ticks: config_.yTicks,
          unit: config_.yAxisUnit,
          target: config_.primaryContainer
        });
      componentManager_.update();
      updateLegend();
    }

    /**
     * Inserts/Updates object in data array
     * @param  {object} data
     */
    function extendData(data) {
      //Set default x and y accessors.
      if(!data.dimensions) {
        data.dimensions = {};
      }
      if (!data.dimensions.x) {
        data.dimensions.x = defaultXaccessor_;
      }
      if (!data.dimensions.y) {
        data.dimensions.y = defaultYaccessor_;
      }
      dataCollection_.extend(data);
    }

    /**
     * Displays the empty message over the main container.
     * @private
     */
    function showEmptyOverlay() {
      var labelTexts,
          labels,
          layoutConfig;

      layoutConfig = {
        type: 'vertical', position: 'center', gap: 6
      };
      labelTexts = array.getArray(config_.emptyMessage);
      labels = labelTexts.map(function(text, idx) {
        var label = components.label().text(text);
        if (idx === 0) {
          label.config({
            color: '#666',
            fontSize: 18,
            fontWeight: 'bold'
          });
        } else {
          label.config({
            color: '#a9a9a9',
            fontSize: 13
          });
        }
        return label;
      });
      graph.component({
          type: 'overlay',
          cid: 'gl-empty-overlay',
          layoutConfig: layoutConfig,
          components: labels
        });
      componentManager_.render(root_, 'gl-empty-overlay');
    }

    /**
     * Displays the loading spinner and message over the main container.
     * @private
     */
    function showLoadingOverlay() {
      var label,
          spinner;

      spinner = components.asset().config({
        assetId: 'gl-asset-spinner'
      });
      label = components.label()
        .text(config_.loadingMessage)
        .config({
          color: '#666',
          fontSize: 13
        });
      graph.component({
          type: 'overlay',
          cid: 'gl-loading-overlay',
          components: [spinner, label]
        });
      componentManager_.render(root_, 'gl-loading-overlay');
    }

    /**
     * Displays the error icon and message over the main container.
     * @private
     */
    function showErrorOverlay() {
      var label,
          icon;

      icon = components.asset().config({
        assetId: 'gl-asset-icon-error'
      });
      label = components.label()
        .text(config_.errorMessage)
        .config({
          color: '#C40022',
          fontSize: 13
        });
      graph.component({
          type: 'overlay',
          cid: 'gl-error-overlay',
          components: [icon, label]
        });
      componentManager_.render(root_, 'gl-error-overlay');
    }

    /**
     * Determins if the domain is "empty" (both values are zero).
     * TODO: Move to data collection when ready.
     *
     * @private
     * @param {Array} domain A 2 element array.
     * @return {Boolean}
     */
    function domainIsEmpty(domain) {
      var d0, d1;

      d0 = domain[0];
      d1 = domain[1];
      if (d0 instanceof Date && d1 instanceof Date) {
        return d0.getTime() === 0 && d1.getTime() === 0;
      }
      return d0 === 0 && d1 === 0;
    }

    /**
     * Adds/removes overlays & hides/shows components based on state.
     * @private
     */
    function updateComponentVisibility() {
      componentManager_.destroy([
          'gl-empty-overlay',
          'gl-loading-overlay',
          'gl-error-overlay']);
      componentManager_.get().forEach(function(c) {
        var hiddenStates = c.config('hiddenStates'),
            dataId = c.config('dataId');
        if (array.contains(hiddenStates, config_.state) ||
              (dataId && dataCollection_.hasTags(dataId, 'inactive'))) {
          c.hide();
        } else {
          c.show();
        }
      });
      switch (config_.state) {
        case STATES.EMPTY:
          showEmptyOverlay();
          break;
        case STATES.LOADING:
          showLoadingOverlay();
          break;
        case STATES.ERROR:
          showErrorOverlay();
          break;
        case STATES.NORMAL:
          // Hide x-axis if theres no data.
          if (domainIsEmpty(config_.xScale.domain())) {
            componentManager_.first('gl-xaxis').hide();
            componentManager_.first('gl-yaxis').hide();
          }
          break;
      }
    }

    /**
     * Main function, sets defaults, scales and axes
     * @return {graphs.graph}
     */
    function graph() {
      obj.extend(config_, defaults_);
      dataCollection_ = collection.create();
      // TODO: move these specific components to graphBuilder.
      componentManager_ = componentManager.create([
        {
          cid: 'gl-xaxis',
          type: 'axis',
          axisType: 'x',
          orient: 'bottom',
          target: 'gl-xaxis',
          hiddenStates: ['empty', 'loading', 'error']
        },
        {
          cid: 'gl-yaxis',
          axisType: 'y',
          type: 'axis',
          orient: 'right',
          tickPadding: 5,
          hiddenStates: ['empty', 'loading', 'error']
        }
      ]);
      if (config_.showLegend) {
        componentManager_.add({
          cid: 'gl-legend',
          type: 'legend',
          target: 'gl-info'
        });
      }
      componentManager_
        .registerSharedObject('xScale', config_.xScale, true)
        .registerSharedObject('yScale', config_.yScale, true)
        .registerSharedObject('data', dataCollection_, true);
      coloredComponentsCount = 0;
      return graph;
    }

    obj.extend(
      graph,
      config.mixin(config_, 'id', 'width', 'height'),
      mixins.toggle);

    graph.STATES = STATES;

    /**
     * Event dispatcher.
     * @public
     */
    graph.dispatch = mixins.dispatch('state');

    /**
     * Configures the graph state and triggers overlays updates.
     * @public
     * @return {graph.STATES}
     */
    graph.state = function(newState) {
      var oldState = config_.state;

      if (!newState) {
        return oldState;
      }
      config_.state = newState;
      if (graph.isRendered()) {
        updateComponentVisibility();
      }
      graph.dispatch.state.call(this);
      return graph;
    };

    /**
     * Gets/Sets the data
     * @param  {Object|Array} data
     * @return {graphs.graph|Object}
     */
    graph.data = function(data) {
      if (data) {
        // Single string indicates id of data to return.
        if (typeof data === 'string') {
          return dataCollection_.get(data);
        }
        if (Array.isArray(data)) {
          var i, len = data.length;
          for (i = 0; i < len; i += 1) {
            extendData(data[i]);
          }
        } else {
          extendData(data);
        }
        componentManager_.applySharedObject('data');
        return graph;
      }

      return dataCollection_;
    };

    /**
     * Creates and adds a component to the graph based on the type
     * or returns the component based on the cid.
     * @param  {string|Object} componentConfig
     * @return {component|graphs.graph}
     */
    graph.component = function(componentConfig) {
      var components;
      // No args. Return component manager.
      if (!componentConfig) {
        return componentManager_;
      }
      // Single string indicates cid of component to return.
      if (typeof componentConfig === 'string') {
        components = componentManager_.get(componentConfig);
        if (components.length) {
          return components[0];
        }
      }

      // Add component(s).
      components = componentManager_.add(componentConfig);
      components.forEach(function(c) {
        if (!c.config('target')) {
          c.config('target', config_.primaryContainer);
        }
        setDefaultColor(c);

        // TODO: Remove this once extents/domain is calculated properly.
        if (graph.isRendered()) {
          c.render(root_);
        }
      });

      return graph;
    };

    /**
     * Updates the graph with new/updated data/config
     * @return {graphs.graph}
     */
    graph.update = function() {
      updateScales();
      updateComponents();
      if (graph.isRendered()) {
        updateComponentVisibility();
      }
      graph.dispatch.update.call(this);
      return graph;
    };

    /**
     * Initial panel setup and rendering of the components
     * Note: should be called only once.
     * @param  {d3.selection|Node|string} selector
     * @return {graphs.graph}
     */
    graph.render = function(selector) {
      var selection = d3util.select(selector);
      assetLoader.loadAll();
      renderPanel(selection);
      componentManager_.registerSharedObject('rootId', config_.id, true);
      componentManager_.applySharedObject('rootId', componentManager_.cids());
      graph.update();
      componentManager_.render(graph.root());
      // Update y-axis once more to ensure ticks are above everything else.
      componentManager_.update(['gl-yaxis']);
      // Force state update.
      updateComponentVisibility();
      isRendered = true;
      graph.dispatch.render.call(this);
      return graph;
    };

    /**
     * Has the graph been rendered or not.
     * @return {Boolean}
     */
    graph.isRendered = function() {
      return isRendered;
    };

    /**
     * Removes everything from the DOM, cleans up all references.
     * @public
     */
    graph.destroy = function() {
      config_.state = STATES.DESTROYED;
      componentManager_.destroy();
      if (root_) {
        root_.remove();
        root_ = null;
      }
      config_ = null;
      defaults_ = null;
      componentManager_ = null;
      graph.dispatch.destroy.call(this);
    };

     /**
     * Returns the root_
     * @return {d3.selection}
     */
    graph.root = function() {
      return root_;
    };

    return graph();
  };

});

define('core/format',[],
function() {
  

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

/**
 * @fileOverview
 * An object that constructs/configures graphs by encapsulating complexity
 * in order to simplify the end-user api when generating typical graphs.
 *
 * "internal" refers to data/components added by this build and not by the user.
 */
define('graphs/graph-builder',[
  'core/object',
  'core/array',
  'core/string',
  'core/format',
  'd3-ext/util',
  'graphs/graph',
  'events/pubsub'
],
function(obj, array, string, format, d3util, graph, pubsub) {
  

    var defaults,
      config,
      globalPubsub,
      internalDataConfig,
      INTERNAL_COMPONENTS_CONFIG,
      GRAPH_TYPES;

    defaults = {
      layout: 'default'
    };

    config = {};

    globalPubsub = pubsub.getSingleton();

    /**
     * The supported types of pre-configured graphs.
     */
    GRAPH_TYPES = ['line', 'area', 'stacked-area'];

    /**
     * Dataset configurations automatically applied to graphs.
     */
    function getInternalDataConfig(domainSources) {
      return [{
        id: 'gl-stats',
        sources: [domainSources, '$domain'],
        derivation: function(sources, domain) {
          var xDomain, points, pointValues, result;

          result = {
            min: 0,
            max: 0,
            avg: 0
          };
          sources = sources.filterByTags('inactive');
          if (sources.all().length) {
            xDomain = domain.get().x;
            points = sources.filter('x', xDomain).dim('y').concat();
            pointValues = points.get();
            if (pointValues && pointValues.length) {
              result.min = points.min().round().get();
              result.max = points.max().round().get();
              result.avg = points.avg().round().get();
            }
          }
          return result;
        }
      }];
    }

    /**
     * Component configurations automatically applied to graphs.
     *
     * TODO: Externalize this once a component manager is available.
     */
    INTERNAL_COMPONENTS_CONFIG = [
      {
        cid: 'gl-stats',
        type: 'label',
        dataId: 'gl-stats',
        position: 'center-left',
        target: 'gl-footer',
        hiddenStates: ['empty', 'loading', 'error']
      },
      {
        cid: 'gl-domain-label',
        type: 'label',
        dataId: '$domain',
        position: 'center-right',
        target: 'gl-footer',
        hiddenStates: ['empty',  'loading', 'error']
      }
    ];

    /**
     * Determines if a data set corresponding to the data id is an internal
     * data set or not.
     *
     * @private
     * @param {String} dataId
     * @return {Boolean}
     */
    function isInternalData(dataId) {
      var foundData;
      foundData = array.find(internalDataConfig, function(d) {
        return d.id === dataId;
      });
      return foundData || string.startsWith(dataId, '$') ? true : false;
    }

    /**
     * Checks if a component alread exists in the componets collection with the
     * same data id.
     *
     * @param {String} dataId
     * @param {graphs.graph} g
     * @return {Boolean}
     */
    function componentExists(dataId, g) {
      var components, foundComponent;
      components = g.component().get();
      foundComponent = array.find(components, function(c) {
        return c.config('dataId') === dataId;
      });
      return foundComponent ? true : false;
    }

    /**
     * Adds a new component of the specified type for every supplied data id
     * that is not an internal data source.
     *
     * @private
     * @param {Array|Object} dataSources
     * @param {String} componentType
     * @param {graphs.graph} g
     */
    function addComponentsForDataSources(dataSources, componentType,
          g, sources, isStacked) {
      var id;
      array.getArray(dataSources).forEach(function(dataSource) {
        id = dataSource.id;
        if (isStacked) {
          id += '-stack';
        }
        if (!isInternalData(dataSource.id) &&
            !componentExists(dataSource.id, g)) {
          // If no sources are specified, add all data ids
          // else add the specified ones.
          if(sources.length === 0 || array.contains(sources, dataSource.id)) {
            g.component({
              type: componentType,
              dataId: id,
              cid: id,
              color: dataSource.color || null
            });
          }
        }
      });
    }

    /**
     * Overrides the removeData() funciton on the graph.
     * Additionally removes any corresponding components when called.
     *
     * TODO: remove this in favor of data collection events
     *
     * @private
     * @param {graphs.graph} g
     */
    function overrideRemoveDataFn(g) {
      var dataCollection = g.data();
      obj.override(dataCollection, 'remove', function(supr, dataId) {
        var args = array.convertArgs(arguments, 1);
        g.component().remove(dataId);
        return supr.apply(g, args);
      });
    }

    /**
     * Overrides the add() function on the graph's data collection. Anytime
     * add() is called a new component of the specified type will be added too.
     *
     * TODO: remove this in favor of data collection events
     *
     * @private
     * @param {String} componentType
     * @param {graphs.graph} g
     */
    function overrideAddDataFn(componentType, g, sources, isStacked) {
      var dataCollection = g.data();
      isStacked = isStacked || false;
      obj.override(dataCollection, 'add', function(supr, data) {
        var args, retVal;
        args = array.convertArgs(arguments, 1);
        retVal = supr.apply(dataCollection, args);
        if (isStacked) {
          array.getArray(data).forEach(function(ds) {
            supr.apply(dataCollection, [{
              id: ds.id + '-stack',
              sources: 'stacks',
              derivation: function(sources) {
                return sources.get().filter(function(source) {
                  return source.id === ds.id + '-stack';
                })[0];
              }
            }]);
          });
        }
        addComponentsForDataSources(data, componentType, g, sources, isStacked);
        return retVal;
      });
    }

    /**
     * Adds all pre-configured internal data sources to the graph.
     *
     * @private
     * @param {graphs.graph} g
     */
    function addInternalData(g) {
      internalDataConfig.forEach(function(dataConfig) {
        g.data().add(dataConfig);
      });
    }

    /**
     * TODO: Add capability to derivation to create sources.
     */
    function addStackedData(g) {
      var dataSources = [{
        id: 'stacks',
        sources: '*',
        derivation: function(sources) {
          return sources.stack().all();
        }
      }];
      g.data().add(dataSources);
    }

    /**
     * Adds all pre-configured internal components to the graph.
     *
     * @private
     * @param {graphs.graph} g
     */
    function addInternalComponents(g) {
      INTERNAL_COMPONENTS_CONFIG.forEach(function(componentConfig) {
        g.component(componentConfig);
      });
      g.component('gl-stats').text(function() {
        var unit, values, d;
        values = {
          avg: 0,
          min: 0,
          max: 0
        };
        d = this.data();
        unit = this.config().unit || '';
        if (d) {
          values.avg = d.avg || 0;
          values.min = d.min || 0;
          values.max = d.max || 0;
        }
        return 'Avg: ' + values.avg + unit +
               '    Min: ' +  values.min + unit +
               '    Max: ' + values.max + unit;
      });
      g.component('gl-domain-label').text(function() {
        var domain = this.data();
        if (domain) {
          return format.timeDomainUTC(domain.x, 'UTC');
        }
        return '';
      });
    }

    /**
     * Updates config for stats label
     */
    function updateStatsLabel() {
      var graph, componentManager, statsLabel;
      /*jshint validthis:true */
      graph = this;
      componentManager = graph.component();
      statsLabel =  componentManager.first('gl-stats');
      if (statsLabel) {
        statsLabel.config({
          unit: graph.config().yAxisUnit
        });
        componentManager.update('gl-stats');
      }
    }

    /**
     * An object that constructs/configures graphs by encapsulating complexity
     *   in order to simplify the end-user api.
     *
     * @public
     * @return {graphs.graphBuilder}
     */
    function graphBuilder() {
      obj.extend(config, defaults);
      return graphBuilder;
    }

    /**
     * Gets the available valid types to build pre-configured graphs.
     *
     * @public
     * @return {Array}
     */
    graphBuilder.types = function() {
      return GRAPH_TYPES;
    };

    /**
     * Build and return a new graph of the specified type.
     *
     * @param {String} type A valid pre-configured graph type.
     * @param {Object?} options Options for the pre-configured graph type.
     * @param {(Array.<string>|string)?} options.sources Definite list of
     *   sources that have corresponding graph components.
     * @return {graphs.graph}
     */
    graphBuilder.create = function(type, options) {
      var g, layout, sources, domainSources, scopeFn;

      options = options || {};
      layout = options.layout || 'default';
      sources = array.getArray(options.sources);
      domainSources = sources.join(',') || '*';
      internalDataConfig = getInternalDataConfig(domainSources);

      g = graph()
        .config({
          forceY: [0],
          layout: layout,
          yAxisUnit: 'ms',
          domainSources: domainSources
        });

      g.dispatch.on('update', updateStatsLabel);
      g.dispatch.on('render', function() {
        // subscribe to toggle event and update stats
        scopeFn = pubsub.scope(g.config('id'));
        globalPubsub.sub(scopeFn('data-toggle'), updateStatsLabel.bind(g));
      });

      addInternalData(g);
      addInternalComponents(g);

      switch (type) {
        case 'line':
        case 'area':
          overrideRemoveDataFn(g);
          overrideAddDataFn(type, g, sources, false);
          break;
        case 'stacked-area':
          g.component().first('gl-legend').config({'hideOnClick': false});
          addStackedData(g);
          overrideRemoveDataFn(g);
          overrideAddDataFn('area', g, sources, true);
          break;
      }
      return g;
    };

    return graphBuilder();
});

/**
 * @fileOverview
 * d3 Selection group size helpers.
 */
define('d3-ext/size',['d3'], function(d3) {
  

  /**
   * Determines if the selection's node is a <g> node.
   * @param {d3.selection} selection
   * @return {Boolean}
   */
  function isGnode(selection) {
    return !selection.empty() && selection.node().tagName === 'g';
  }

  /**
   * Appends a layout rect if it doesn't exist, otherwise returns
   *   the existing one.
   * @param {d3.selection} selection
   * @return {d3.selection}
   */
  function lazyAddLayoutRect(selection) {
    var layoutRect;

    layoutRect = selection.select('.gl-layout');
    if (layoutRect.empty()) {
      layoutRect = selection.append('rect')
        .attr({
          'class': 'gl-layout',
          fill: 'none'
        });
    }
    return layoutRect;
  }

  /**
   * d3 selection width
   * Returns width attribute of a non-group element.
   * If element is a group,
   *   it returns the 'gl-width' attribute, if it's defined.
   *   else it returns the bounding box width.
   * @param {Number} w
   * @return {Number|d3.selection}
   */
  d3.selection.prototype.width = function(w) {
    var width, nonGnode;

    // Getting.
    if (!arguments.length) {
      width = this.attr('gl-width');
      if (width) {
        return parseFloat(width);
      }
      return this.node().getBBox().width;
    }
    // Setting.
    if (isGnode(this)) {
      this.attr({
        'gl-width': w
      });
      nonGnode = lazyAddLayoutRect(this);
    } else {
      nonGnode = this;
    }
    nonGnode.attr({
      width: w
    });
    return this;
  };

  /**
   * d3 selection height
   * Returns height attribute of a non-group element.
   * If element is a group,
   *   it returns the 'gl-height' attribute, if it's defined.
   *   else it returns the bounding box height.
   * @param {Number} h
   * @return {Number|d3.selection}
   */
  d3.selection.prototype.height = function(h) {
    var height, nonGnode;

    // Getting.
    if (!arguments.length) {
      height = this.attr('gl-height');
      if (height) {
        return parseFloat(height);
      }
      return this.node().getBBox().height;
    }
    // Setting.
    if (isGnode(this)) {
      this.attr({
        'gl-height': h
      });
      nonGnode = lazyAddLayoutRect(this);
    } else {
      nonGnode = this;
    }
    nonGnode.attr({
      height: h
    });
    return this;
  };

  /**
   * d3 selection size
   * If element is a group,
   *   it sets the gl-width and gl-height attributes.
   * else it returns width and height attribute of the element.
   *
   * @param {Number} width
   * @param {Number} height
   * @return {Array|d3.selection}
   */
  d3.selection.prototype.size = function(width, height) {
    // No args, return current width/height.
    if (!arguments.length) {
      return [
        this.width(),
        this.height()
      ];
    }
    // Has args, set width/height.
    return this.width(width).height(height);
  };

  return d3;
});

/**
 * @fileOverview
 * d3 Selection position helpers.
 */
define('d3-ext/position',[
  'd3',
  'core/function'
], function(d3, fn) {
  /*jshint validthis: true */
  

  function getPosition(pos, node, parent) {
    var x = 0, y = 0;
    switch(pos) {
      case 'center':
        x = (parent.width() - node.width())/2;
        y = (parent.height() - node.height())/2;
      break;
      case 'center-top':
        x = (parent.width() - node.width())/2;
        y = 0;
      break;
      case 'center-bottom':
        x = (parent.width() - node.width())/2;
        y = parent.height() - node.height();
      break;
      case 'center-left':
        y = (parent.height() - node.height())/2;
      break;
      case 'center-right':
        x = parent.width() - node.width();
        y = (parent.height() - node.height())/2;
      break;
      case 'top-left':
      break;
      case 'top-right':
        x = parent.width() - node.width();
      break;
      case 'bottom-left':
        y = parent.height() - node.height();
      break;
      case 'bottom-right':
        x = parent.width() - node.width();
        y = parent.height() - node.height();
      break;
    }
    return [x, y];
  }

  /**
   * Positions an element with respect to its parent.
   * Position may be: center, top-left, top-right, bottom-left etc
   * Also takes the position offsets for x and y axis.
   */
  function position(pos, offsetX, offsetY) {
    offsetX = offsetX || 0;
    offsetY = offsetY || 0;

    this.each(function() {
      var node = d3.select(this),
          parent = d3.select(this.parentNode),
          x, y, posXY;
      posXY = getPosition(pos, node, parent);
      x = posXY[0] + offsetX;
      y = posXY[1] + offsetY;
      if (this.tagName === 'g') {
        node.attr('transform', 'translate(' + [x, y] +')');
      } else {
        node.attr({ x: x, y: y });
      }
    });
    return this;
  }

  d3.selection.prototype.position = position;

  /**
   * Centers the selected element(s). Also takes offsets for
   * x and y axis.
   */
  d3.selection.prototype.center = fn.partial(position, 'center');

  return d3;
});

/**
 * @fileOverview
 * d3 selection layout helpers.
 */
define('d3-ext/layout',[
  'd3',
  'd3-ext/position'
], function(d3) {
  

  /**
   * Layout function that arranges its child elements, either
   * horizontally or vertically with a gap.
   */
  d3.selection.prototype.layout = function(settings) {
    settings = settings || {};
    var type = settings.type || 'horizontal',
        gap = settings.gap || 0,
        ignore = settings.ignore || 'gl-layout',
        position = settings.position;

    this.each(function() {
      var node, offset = 0;
      d3.selectAll(this.childNodes).each(function () {
        node = d3.select(this);
        if (node.classed(ignore)) {
          return;
        }
        if (type === 'horizontal') {
          node.position('center-left', offset, 0);
          offset += node.width() + gap;
        } else if (type === 'vertical') {
          node.position('center-top', 0, offset);
          offset += node.height() + gap;
        }
      });
    });
    if (position) {
      this.position(position);
    }
    return this;
  };

  return d3;
});

/**
 * @fileOverview
 * d3 Selection group border helpers.
 */
define('d3-ext/border',[
  'd3',
  'core/array'
], function(d3, array) {
  
  var DEFAULTS;

  DEFAULTS = {
    color: '#000',
    style: 'solid',
    width: [0, 0, 0, 0],
    dasharrayDotted: [1,1],
    dasharrayDashed: [5,5],
    lineBorderClassName: 'gl-line-border',
    layoutRectClassName: 'gl-layout'
  };

  /**
   * Computes the stroke-dasharray value
   * @see
   *    https://developer.mozilla.org/en-US/docs/SVG/Attribute/stroke-dasharray
   * @param  {d3.selection} node
   * @param  {Object} borderInfo  Contains
   *  {
   *    style: border style <'solid'|'dotted'|'dashed'>,
   *    color: border color <paint>,
   *    @see http://www.w3.org/TR/SVG/painting.html#SpecifyingPaint
   *    width: {Array} 4 element array corresponding to
   *      border width of each edge top, right, bottom and left
   *      Value : <percentage> | <length> | inherit | 0
   *      0 represents no border
   *  }
   */
  function getStrokeDashArray(node, borderInfo) {
    var stroke = [], t, r, b, l, height, width;

    if (borderInfo.style === 'solid') {
      t = !!borderInfo.width[0];
      r = !!borderInfo.width[1];
      b = !!borderInfo.width[2];
      l = !!borderInfo.width[3];
      height = node.height();
      width = node.width();

      if (t) {
        stroke.push(width);
      } else {
        stroke = stroke.concat([0, width]);
      }

      computeDashOrGap(stroke, r);
      stroke.push(height);

      computeDashOrGap(stroke, b);
      stroke.push(width);

      computeDashOrGap(stroke, l);
      stroke.push(height);

    } else {
      //TODO: accept dasharray
      stroke = (borderInfo.style === 'dotted') ?
        DEFAULTS.dasharrayDotted : DEFAULTS.dasharrayDashed;
    }
    return stroke;
  }

  /**
   * Computes if a gap needs to be added to the strokedasharray
   * @param  {Array}  stroke
   * @param  {Boolean} hasEdge
   */
  function computeDashOrGap(stroke, hasEdge) {
    var mod2 = stroke.length % 2;
    if (hasEdge && mod2 !== 0 || !hasEdge && mod2 === 0) {
      stroke.push(0);
    }
  }

  /**
   * Computes the class name for border
   * @param  {string} style  Style of the border <'solid'|'dashed'|'dotted'>
   * @param  {string} subClass Subclass to append class name
   * @return {string} class name for border
   */
  function getBorderClass(style, subClass) {
    return 'gl-' + style + '-border-' + subClass;
  }

  /**
   * Adds svg line element based on the coordinates array
   * @param  {d3.selection} node
   * @param  {Object} lineInfo
   *  contains
   *  {
   *    x1: x-axis coordinate of the start of the line,
   *    y1: y-axis coordinate of the start of the line,
   *    x2: x-axis coordinate of the end of the line,
   *    y2: y-axis coordinate of the end of the line,
   *    subClass: postfix for the class name on the line element,
   *    width: border width <percentage> | <length> | inherit,
   *    @see http://www.w3.org/TR/SVG/types.html#DataTypePercentage
   *    @see http://www.w3.org/TR/SVG/types.html#DataTypeLength
   *    color: border color <paint>
   *    @see http://www.w3.org/TR/SVG/painting.html#SpecifyingPaint,
   *    style: border style <'solid'|'dashed'|'dotted'>
   *  }
   */
  function addBorder(node, lineInfo) {
    var  className, dasharray, line;

    className = getBorderClass(lineInfo.style, lineInfo.subClass);
    dasharray = lineInfo.style !== 'solid' ?
      getStrokeDashArray(node, lineInfo) : '';
    line = node.select('.' + className);

    if (line.empty()) {
      line = node.append('line');
    }

    line.attr({
      x1: lineInfo.x1,
      y1: lineInfo.y1,
      x2: lineInfo.x2,
      y2: lineInfo.y2,
      'class': className + ' ' + DEFAULTS.lineBorderClassName,
      'stroke': lineInfo.color,
      'stroke-width': lineInfo.width,
      'stroke-dasharray': dasharray.toString()
    });
  }

  /**
   * Applies styled border to the node by
   * adding svg line elements.
   * @param  {d3.selection} node
   * @param  {Object} borderInfo Contains
   *  {
   *    style: border style <'solid'|'dotted'|'dashed'>,
   *    color: border color <paint>,
   *    @see http://www.w3.org/TR/SVG/painting.html#SpecifyingPaint
   *    width: [t, r, b, l] {Array} 4 element array corresponding to
   *      border width of each edge top, right, bottom and left
   *      Value : <percentage> | <length> | inherit | 0
   *      0 represents no border
   *  }
   */
  function applyBorder(node, borderInfo) {
    //TODO: append this to the object
    var width = 0, lineInfo;
    lineInfo = {
      color: borderInfo.color,
      style: borderInfo.style
    };

    if (!!borderInfo.width[0]) {
      width = borderInfo.width[0];
      lineInfo = {
        x1: 0,
        y1: width/2,
        x2: node.width(),
        y2: width/2,
        subClass: 'top',
        width: borderInfo.width[0],
        color: borderInfo.color,
        style: borderInfo.style
      };
      addBorder(node, lineInfo);
    }

    if (!!borderInfo.width[1]) {
      width = borderInfo.width[1];
      lineInfo = {
        x1: node.width() - width/2,
        y1: 0,
        x2: node.width() - width/2,
        y2: node.height(),
        subClass: 'right',
        width: borderInfo.width[1],
        color: borderInfo.color,
        style: borderInfo.style
      };
      addBorder(node, lineInfo);
    }

    if (!!borderInfo.width[2]) {
      width = borderInfo.width[2];
      lineInfo = {
        x1: 0,
        y1: node.height() - width/2,
        x2: node.width(),
        y2: node.height() - width/2,
        subClass: 'bottom',
        width: borderInfo.width[2],
        color: borderInfo.color,
        style: borderInfo.style
      };
      addBorder(node, lineInfo);
    }

    if (!!borderInfo.width[3]) {
      width = borderInfo.width[3];
      lineInfo = {
        x1: width/2,
        y1: 0,
        x2: width/2,
        y2: node.height(),
        subClass: 'left',
        width: borderInfo.width[3],
        color: borderInfo.color,
        style: borderInfo.style
      };
      addBorder(node, lineInfo);
    }
  }

  /**
   * Removes any existing borders
   * @param  {d3.selection} node
   */
  function removeExistingBorders(node) {
    node.selectAll('.' + DEFAULTS.lineBorderClassName)
      .remove();

    node.select('.' + DEFAULTS.layoutRectClassName)
      .attr('stroke-dasharray', null);
  }

  /**
   * d3 selection border
   * @param  {string} style Border style <'solid'|'dotted'|'dashed'>
   * @param  {color} color Border color <paint>,
   * @see http://www.w3.org/TR/SVG/painting.html#SpecifyingPaint
   * @param  {Array} width 4 element array where each element
   *  corresponding to border width of each edge top, right, bottom and left
   *  Value : <percentage> | <length> | inherit | 0
   *  0 represents no border
   */
  d3.selection.prototype.border = function border(style, color, width) {
    var rect, borderInfo;

    rect = this.select('.' + DEFAULTS.layoutRectClassName);

    if (!rect.empty()) {
      borderInfo = {
        style: style || DEFAULTS.style,
        color: color || DEFAULTS.color,
        width: array.getArray(width) || DEFAULTS.width
      };

      removeExistingBorders(this);
      applyBorder(this, borderInfo);

      this.attr({
        'gl-border-color': borderInfo.color,
        'gl-border-style': borderInfo.style,
        'gl-border-width': borderInfo.width.toString()
      });
    }

    return this;
  };

  return d3;
});


/**
 * @fileOverview
 * d3 Selection group backgroundColor helpers.
 */
define('d3-ext/background-color',['d3'], function(d3) {
  

  /**
   * d3 selection backgroundColor
   * Sets the fill attr for the node and
   *   sets the gl-background-color attribute.
   */
  d3.selection.prototype.backgroundColor = function(color) {
    var rect;

    if (this.node().tagName === 'g') {
      rect = this.select('.gl-layout');
      if (rect.empty()) {
        this.size(this.width(), this.height());
        rect = this.select('.gl-layout');
      }
      rect.attr('fill', color);
      this.attr('gl-background-color', color);
    }
    return this;
  };

  return d3;
});

/**
 * @fileOverview
 * d3 Selection clip path helper.
 */
define('d3-ext/clip',[
  'd3',
  'core/string'
],
function(d3, string) {
  

  /**
   * d3 selection clip
   *
   * Adds a clipPath for the <g> element in the selection.
   */
  d3.selection.prototype.clip = function() {
    var layoutRect, defs, clipPath, clipRect;

    if (this.node().tagName !== 'g') {
      return this;
    }

    layoutRect = this.select('.gl-layout');
    if (layoutRect.empty()) {
      this.size(this.width(), this.height());
      layoutRect = this.select('.gl-layout');
    }

    defs = this.select('defs');
    if (defs.empty()) {
      defs = this.append('defs');
    }

    clipPath = defs.select('clipPath');
    if (clipPath.empty()) {
      clipPath = defs.append('clipPath')
        .attr({
          'class': 'gl-clip-path',
          id: 'gl-clip-path-' + string.random()
        });
    }

    clipRect = clipPath.select('rect');
    if (clipRect.empty()) {
      clipRect = clipPath.append('rect');
    }
    clipRect.attr({
      width: this.width(),
      height: this.height()
    });

    this.attr({
      'gl-clip': 'true',
      'clip-path': 'url(#' + clipPath.attr('id') + ')'
    });
    return this;
  };

  return d3;
});

define('d3-ext/d3-ext',[
  'd3',
  'd3-ext/size',
  'd3-ext/layout',
  'd3-ext/position',
  'd3-ext/border',
  'd3-ext/background-color',
  'd3-ext/clip',
  'd3-ext/select-attr'
], function(d3) {
  
  return d3;
});

// d3-ext is extending d3. Do not remove the require.
define('core/core',[
  'graphs/graph',
  'graphs/graph-builder',
  'components/component',
  'data/collection',
  'core/asset-loader',
  'events/pubsub',

  'd3-ext/d3-ext'
],
function(graph, graphBuilder, component, collection, assets, pubsub) {
  

  var core = {
    version: '0.0.7',
    graphBuilder: graphBuilder,
    graph: graph,
    components: component,
    dataCollection: collection,
    assetLoader: assets,
    pubsub: pubsub,
    // Singleton pubsub instance global to everything.
    globalPubsub: pubsub.getSingleton()
  };

  return core;
});

define('glimpse', [
  'd3',
  'core/core'
],
function (d3, core) {
  

  var glimpse = core;
  glimpse.d3 = d3;

  return glimpse;
});
  // force synchronous load
  var glimpse = require('glimpse');

  // CommonJS support
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = glimpse;
  } else {
    global['glimpse'] = glimpse;
  }

}(this));
