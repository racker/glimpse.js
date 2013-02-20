/*global module:false*/

module.exports = function(grunt) {
  'use strict';

  /**
   * Load external grunt helpers & tasks.
   */
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadTasks('grunt/tasks/');

  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',

    /**
     * Cleans out the "build" directory.
     */
    clean: {
      build: ['build/*'],
      assets: ['src/assets/assets.js']
    },

    /**
     * RequireJS compilation configuration.
     */
    requirejs: {
      /**
       * Config for the static build which generates a single static JS file.
       * This uses Almond.js as a shim for fake module loading.
       */
      staticBuild: {
        options: {
          baseUrl: 'src',
          include: ['glimpse'],
          out: 'build/glimpse.js',
          wrap: {
            startFile: ['src/wrap.start', 'lib/almond.js'],
            endFile: 'src/wrap.end'
          },
          generateSourceMaps: true,
          optimize: 'uglify2',
          preserveLicenseComments: false,
          skipModuleInsertion: false,
          optimizeAllPluginResources: true,
          findNestedDependencies: true,
          mainConfigFile: 'requirejs.conf.js'
        }
      },
      /**
       * Config for the default multi-file AMD build.
       */
      amdBuild: {
        options: {
          // source code root
          appDir: 'src',
          // relative path to appDir for module resolution
          baseUrl: '.',
          // output directory for optimizations etc
          dir: 'build',
          modules: [{ name: 'glimpse' }],
          preserveLicenseComments: false,
          optimizeAllPluginResources: true,
          findNestedDependencies: true,
          optimize: 'uglify2',
          mainConfigFile: 'requirejs.conf.js'
        }
      }
    },

    /**
     * Run the unit tests from the command line.
     */
    exec: {
      testWatch: {
        command: 'testacular start test/testacular.conf.js',
        stdout: true
      },
      test: {
        command: 'testacular start test/testacular.conf.js ' +
                 '--browsers="Chrome,Firefox,PhantomJS,Safari" ' +
                 '--singleRun=true',
        stdout: true
      },
      testPhantomOnly: {
        command: 'testacular start test/testacular.conf.js ' +
                 '--browsers="PhantomJS" ' +
                 '--singleRun=true',
        stdout: true
      }
    },

    // TODO: replace sources with refs to jshint config
    watch: {
      src: {
        files: 'src/**/*.js',
        tasks: ['jshint']
      },
      test: {
        files: ['gruntfile.js', 'test/unit/**/*.js'],
        tasks: ['jshint']
      }
    },

    'compile-svg': {
      assets: {
        src: ['src/assets/*.svg'],
        dest: 'src/assets/assets.js',
        options: {
          ignoreTags: [],
          ignoreAttrs: ['svg:version', 'svg:xmlns', 'svg:xmlns:xlink'],
          id: 'gl-assets'
        }
      }
    },

    jshint: {
      // Defaults
      options: {
        jshintrc: '.jshintrc'
      },
      glimpse: ['src/**/*.js', '!src/assets/assets.js'],
      // gruntfile.js
      grunt: {
        options: { node: true },
        files: { src: ['gruntfile.js', 'grunt/tasks/*.js'] }
      },
      // Unit test related.
      tests: {
        options: {
          jshintrc: 'test/.jshintrc'
        },
        files: {
          src: ['test/*.js', 'test/unit/**/*.js', '!test/testacular.conf.js']
        }
      }
    }
  });

  grunt.registerTask('test', 'exec:test');
  grunt.registerTask('testwatch', 'exec:testWatch');
  grunt.registerTask('assets', ['clean:assets', 'compile-svg:assets']);
  grunt.registerTask('compile-static', [
    'assets',
    'clean:build',
    'requirejs:staticBuild']);
  grunt.registerTask('compile-amd', [
    'assets',
    'clean:build',
    'requirejs:amdBuild']);
  grunt.registerTask('compile', 'compile-static');
  grunt.registerTask('release', ['jshint', 'assets', 'test', 'compile']);
  grunt.registerTask('default', ['jshint', 'assets', 'exec:testPhantomOnly']);
};
