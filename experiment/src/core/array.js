gl_arrGetById = function(arr, id, index) {
  var i;
  for (i = 0; i < arr.length; i++) {
    if (arr[i] && arr[i].id === id) {
      if (index) return i;
      return arr[i];
    }
  }
  return null;
};

//goog.array.removeAt
gl_arrRemoveAt = function(arr, i) {
  return Array.prototype.splice.call(arr, i, 1).length == 1;
};
