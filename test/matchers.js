beforeEach(function() {
  /*jshint validthis: true */
  'use strict';

  function isObject(val) {
    var type = typeof val;
    return (type === 'object' && val !== null) || type === 'function';
  }

  function toHaveAttr (attrName, attrValue) {
    var actualAttrValue, msg;
    actualAttrValue = this.actual.getAttribute(attrName);
    msg = jasmine.pp(attrName) + ' and value ' + jasmine.pp(attrValue) +
          ' instead of ' + jasmine.pp(actualAttrValue);
    this.message = function () {
      return [
        'Expected node to have attribute name ' + msg,
        'Expected node to not have attribute name ' + msg
      ];
    };
    return actualAttrValue === attrValue.toString();
  }

  function compare(node1, node2) {
    var retValue = 0;
    retValue = node1.name.toLowerCase() < node2.name.toLowerCase() ? -1 : 1;
    return retValue;
  }

  function serializeXML (node, output) {
    var nodeType = node.nodeType, attrMap, attrMapArr = [],
      i, len, childNodes;
    if (nodeType === 3) { // TEXT nodes.
      // Replace special XML characters with their entities.
      output.push(node.textContent.replace(/&/, '&amp;')
            .replace(/</, '&lt;').replace('>', '&gt;'));
    } else if (nodeType === 1) { // ELEMENT nodes.
      // Serialize Element nodes.
      output.push('<', node.tagName);
      if (node.hasAttributes()) {
        attrMap = node.attributes;
        for (i = 0, len = attrMap.length; i < len; i += 1) {
          attrMapArr.push(attrMap.item(i));
        }
        //Order the namedNodeMap so that is doesnt break in
        //different browsers
        attrMapArr.sort(compare);
        attrMapArr.forEach(function(attrNode) {
          output.push(' ', attrNode.name, '="', attrNode.value, '"');
        });
      }
      if (node.hasChildNodes()) {
        output.push('>');
        childNodes = node.childNodes;
        for (i = 0, len = childNodes.length; i < len; i += 1) {
          serializeXML(childNodes.item(i), output);
        }
        output.push('</', node.tagName, '>');
      } else {
        output.push('/>');
      }
    } else if (nodeType === 8) {
      // TODO(codedread): Replace special characters with XML entities?
      output.push('<!--', node.nodeValue, '-->');
    } else {
      // TODO: Handle CDATA nodes.
      // TODO: Handle ENTITY nodes.
      // TODO: Handle DOCUMENT nodes.
      throw 'Error serializing XML. Unhandled node of type: ' + nodeType;
    }
  }

  this.addMatchers({

    toBeArray: function() {
      return {}.toString.call(this.actual) === '[object Array]';
    },

    toBeNumber: function() {
      return typeof this.actual === 'number';
    },

    toBeOfType: function(type) {
      return typeof this.actual === type;
    },

    toHaveProperties: function() {
      var actual = this.actual,
        len = arguments.length,
        i;
      this.message = function () {
        return [
          'Expected ' + jasmine.pp(arguments) + ' to be subset of ' +
              jasmine.pp(this.actual.classList),
          'Expected ' + jasmine.pp(arguments) + ' not to be a subset of ' +
              jasmine.pp(this.actual.classList)
        ];
      };
      for (i = 0; i < len; i += 1) {
        if (actual[arguments[i]] === undefined) {
          return false;
        }
      }
      return true;
    },

    toHaveClasses: function() {
      var actual = this.actual,
        len = arguments.length,
        classes,
        i;

      classes = Array.prototype.slice.call(
        (actual.getAttribute('class') || '').split(' '));
      for (i = 0; i < len; i += 1) {
        if (classes.indexOf(arguments[i]) === -1) {
          return false;
        }
      }
      return true;
    },

    toHaveAttr: function () {
      var k = arguments[0], key;
      if (arguments.length === 2) {
        return toHaveAttr.call(this, k,  arguments[1]);
      }
      if (isObject(k)) {
        for (key in k) {
          if (!toHaveAttr.call(this, key, k[key])) {
            return false;
          }
        }
      } else {
        return this.actual.hasAttribute(k);
      }
      return true;
    },

    toHaveTranslate: function (x, y) {
      var actual = d3.select(this.actual), translate;
      translate = d3.transform(actual.attr('transform')).translate;
      this.message = function () {
        return [
          'Expected node to have translate of: ' + jasmine.pp([x, y]) +
          ' but was: ' + jasmine.pp(translate),
          'Expected node not to have translate of: ' + jasmine.pp([x, y]) +
          ' but was: ' + jasmine.pp(arguments)
        ];
      };
      return x === translate[0] && y === translate[1];
    },

    toHaveXY: function (x, y) {
      var actual = d3.select(this.actual),
          ax = parseInt(actual.attr('x'), 10),
          ay = parseInt(actual.attr('y'), 10);
      this.message = function () {
        return [
          'Expected node to have x, y co-ordinates of: ' + jasmine.pp([x, y]) +
          ' but was: ' + jasmine.pp([ax, ay]),
          'Expected node not to have translate of: ' + jasmine.pp([x, y]) +
          ' but was: ' + jasmine.pp([ax, ay])
        ];
      };
      return x ===  ax && y === ay;
    },

    toBeDefinedAndNotNull: function () {
      var actual = this.actual;

      this.message = function () {
        return 'Expected ' + actual + ' to be defined and not null';
      };

      return actual !== null;
    },

    toHaveBeenCalledOnce: function () {
      this.message = function () {
        return [
          'Expected function ' + jasmine.pp(this.actual) +
            ' to have been called exactly once, but was called ' +
            this.actual.callCount + ' times',
          'Expected function ' + jasmine.pp(this.actual) +
            ' not to have been called exactly once'
        ];
      };

      return this.actual.callCount === 1;
    },

    toBeSelectionLength: function(expectedLength) {
      var actualLength = this.actual[0].length;
      this.message = function () {
        return [
          'Expected selection length to be: ' + expectedLength +
          ' but was: ' + actualLength,
          'Expected selection length not to be: ' + expectedLength +
          ' but was: ' + actualLength
        ];
      };

      return actualLength === expectedLength;
    },

    toBeEmptySelection: function() {
      var actual= this.actual,
        len = actual[0].length;
      this.message = function () {
        return [
          'Expected selection to be empty but was ' + len,
          'Expected selection not to be empty'
        ];
      };

      return len === 0;
    },

    toHaveStyle: function (property, expectedValue) {
      var actualValue = d3.select(this.actual).style(property);
      this.message = function () {
        return [
          'Expected element to have style: ' +
          property + '=' + expectedValue +
          ' but was: ' + actualValue,
          'Expected element not to have style: ' +
          property + '=' + expectedValue +
          ' but was: ' + actualValue
        ];
      };
      return actualValue === expectedValue;
    },

    toHaveXML: function (xmlString) {
      var output = [], serializedXML;
      serializeXML(this.actual, output);
      serializedXML = output.join('');
      this.message = function () {
        return ['Expected ' + jasmine.pp(serializedXML) + ' to be ' + xmlString,
          'Expected ' + jasmine.pp(serializedXML) + 'not to be ' + xmlString];
      };
      return serializedXML  ===  xmlString;
    },

    toHaveClickHandler: function() {
      var ele = this.actual;
      this.message = function () {
        return ['Expected' + jasmine.pp(ele) + 'to have a d3 click handler.',
         'Expected' + jasmine.pp(ele) + 'not to have a d3 click handler.'];
      };
      return ele.__onclick !== undefined;
    }

  });
});
