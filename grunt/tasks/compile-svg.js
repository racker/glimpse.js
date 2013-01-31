/**
 * @fileOverview
 * A custom grunt task for compiling together numerous svg assets into a single
 * file.
 * Removes <?xml?> headers and DOCTYPE.
 * Also optionally removes any tags/attributes added to the ignore list
 * specified in the options. 
 */
var fs = require('fs'),
    sax = require('sax');

module.exports = function(grunt) {
  'use strict';

  grunt.registerMultiTask('compile-svg',
    'Concats multiple svg assets into a single file', function() {

    var done = this.async(),
      options = this.options({
        separator: '',
        ignoreTags: [],
        ignoreAttrs: []
      });

    options.ignoreTags = options.ignoreTags.map(function(tagName) {
      return tagName.toLowerCase();
    });

    options.ignoreAttrs = options.ignoreAttrs.map(function(attrName) {
      return attrName.toLowerCase();
    });

    function createSpace(indent) {
      var str = '';
      while (indent) {
        str += ' ';
        indent -= 1;
      }
      return str;
    }

    function wrapStart(stream) {
      var svgStart = '<svg id="' + options.id + '" ' +
        'version="1.1" ' +
        'xmlns="http://www.w3.org/2000/svg" ' +
        'xmlns:xlink="http://www.w3.org/1999/xlink">\' +\n' +
        '\'  <defs>\' +\n';
      stream.write(
        'define(function() {\n' +
        '  \'use strict\';\n\n' + 
        '  var assets = \'' + svgStart
      );
    }

    function wrapEnd(stream) {
      var svgEnd = '\'  </defs>\'+\n\'</svg>\' +\n';
      stream.write(
        svgEnd +
        '\'\';\n' +
        '  return assets;\n' + 
        '});'
      );
    }

    // Iterate thru each named task.
    this.files.forEach(function(f) {

      var fileCount = f.src.length,
        fileReadCount = 0,
        writeStream = fs.createWriteStream(f.dest, { flags: 'a' });

      function ignoreTag(tagName) {
        return options.ignoreTags.indexOf(tagName) !== -1;
      }

      function ignoreAttr(tagName, attrName) {
        return options.ignoreAttrs.indexOf(tagName + ':' + attrName) !== -1;
      }

      function processFile(filePath) {
        // Read in an SVG file.
        var readStream = fs.createReadStream(filePath),
            saxStream = sax.createStream(false,
              { normalize: true, lowercase: true }),
            indent = 2;

        saxStream.on('error', function(e) {
          grunt.log.error('Error parsing SVG file.');
        });

        saxStream.on('end', function(e) {
          fileReadCount += 1;
          if (fileCount === fileReadCount) {
            wrapEnd(writeStream);
            writeStream.destroySoon();
          }
        });

        // Write out open tags and attrs if not ignored.
        saxStream.on('opentag', function(node) {
          var attr;
          if (ignoreTag(node.name)) {
            return;
          }
          writeStream.write('\'' + createSpace(indent));
          writeStream.write('<' + node.name);
          // TODO: escape special chars
          Object.keys(node.attributes).forEach(function(attr) {
            if (!ignoreAttr(node.name, attr)) {
              writeStream.write(' ' + attr + '="' +
                node.attributes[attr] + '"');
            }
          });
          writeStream.write('>\' +\n');
          indent += 2;
        });

        // Write out close tag if not ignored.
        saxStream.on('closetag', function(tagName) {
          if (ignoreTag(tagName)) {
            return;
          }
          indent -= 2;
          writeStream.write('\'' + createSpace(indent));
          writeStream.write('</' + tagName + '>\' +\n');
          if (tagName === 'svg' && options.separator) {
            writeStream.write(options.separator);
          }
        });

        // Pipe all the SVG file contents to the SAX stream.
        readStream.pipe(saxStream);
      }

      writeStream.on('close', function() {
        // Print a success message.
        grunt.log.ok('File "' + f.dest + '" created.');
        done();
      });

      wrapStart(writeStream);
      f.src.forEach(processFile);
    });

  });

};
