/*global module:false*/
/**
 * @fileOverview
 * A custom grunt task for bumping the version number in core.js
 */

module.exports = function(grunt) {
  'use strict';

  grunt.registerTask('bumpup-core',
    'Bumps the version of glimpse in core.js', function() {

    var options, verRegEx, currCore, newCore;

    options = this.options({});

    verRegEx = /version: '(?:(\d+)\.)?(?:(\d+)\.)?(\*|\d+)'/;
    currCore = grunt.file.read(options.file);
    newCore = currCore.replace(
      verRegEx,
      'version: \'' + grunt.config('pkg.version') + '\'');

    grunt.log.writeln('Currently running the "bumpup-core" task.');
    grunt.file.write(options.file, newCore);
  });

};
