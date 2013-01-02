// From goog.string.subs
function gl_strSubs(str, var_args) {
  for (var i = 1; i < arguments.length; i++) {
    var replacement = String(arguments[i]).replace(/\$/g, '$$$$');
    str = str.replace(/\%s/, replacement);
  }
  return str;
};

// From goog.getMsg
gl_strTemplate = function(str, opt_values) {
  var values = opt_values || {};
  for (var key in values) {
    var value = ('' + values[key]).replace(/\$/g, '$$$$');
    str = str.replace(new RegExp('\\{\\$' + key + '\\}', 'gi'), value);
  }
  return str;
};

// From goog.string.getRandomString
gl_randomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) +
         Math.abs(Math.floor(Math.random() * x) ^ new Date().getTime()).toString(36);
};
