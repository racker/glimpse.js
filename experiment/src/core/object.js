//goog.object.clone
//Changed to unsafe deep object clone for quick bug fix -- avoid this.
function gl_objClone(obj) {
  var type = gl_objTypeOf(obj);
  if (type == 'object' || type == 'array') {
    if (obj.clone) {
      return obj.clone();
    }
    var clone = type == 'array' ? [] : {};
    for (var key in obj) {
      clone[key] = gl_objClone(obj[key]);
    }
    return clone;
  }
  return obj;
};

//goog.typeof -- REMOVE THIS. IT IS NOT REQUIRED
function gl_objTypeOf(value) {
  var s = typeof value;
  if (s == 'object') {
    if (value) {
      if (value instanceof Array) {
        return 'array';
      } else if (value instanceof Object) {
        return s;
      }
      var className = Object.prototype.toString.call(
          /** @type {Object} */ (value));
      if (className == '[object Window]') {
        return 'object';
      }
      if ((className == '[object Array]' ||
           typeof value.length == 'number' &&
           typeof value.splice != 'undefined' &&
           typeof value.propertyIsEnumerable != 'undefined' &&
           !value.propertyIsEnumerable('splice')

          )) {
        return 'array';
      }
      if ((className == '[object Function]' ||
          typeof value.call != 'undefined' &&
          typeof value.propertyIsEnumerable != 'undefined' &&
          !value.propertyIsEnumerable('call'))) {
        return 'function';
      }
    } else {
      return 'null';
    }
  } else if (s == 'function' && typeof value.call == 'undefined') {
    return 'object';
  }
  return s;
};
