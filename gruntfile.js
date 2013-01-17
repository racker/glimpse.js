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
  grunt.loadTasks('grunt/tasks');

  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',

    /**
     * Cleans out the "build" directory.
     */
    clean: {
      build: ['build/']
    },

    /**
     * Compilation configuration.
     * In v0.4 consider replacing with:
     *    https://github.com/gruntjs/grunt-contrib-requirejs
     */
    requirejs: {
      /**
       * Config for the static build which generates a single static JS file.
       * This uses Almond.js as a shim for fake module loading.
       */
      staticBuild: {
        options: {
          almond: true,
          baseUrl: 'src',
          include: ['glimpse'],
          out: 'build/glimpse.js',
          wrap: {
            startFile: 'src/wrap.start',
            endFile: 'src/wrap.end'
          },
          generateSourceMaps: true,
          optimize: 'uglify2',
          preserveLicenseComments: false,
          skipModuleInsertion: false,
          optimizeAllPluginResources: true,
          findNestedDependencies: true,
          paths: {
            'd3': '../lib/d3'
          },
          // Shim modules that don't natively support AMD.
          shim: {
            'd3': {
              exports: 'd3'
            }
          }
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
          paths: {
            'd3': '../lib/d3'
          },
          // Shim modules that don't natively support AMD.
          shim: {
            'd3': {
              exports: 'd3'
            }
          }
        }
      }
    },

    /**
     * Run the unit tests from the command line.
     */
    exec: {
      testWatch: {
        command: 'testacular start',
        stdout: true
      },
      test: {
        command: 'testacular run',
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
        files: ['Gruntfile.js', 'test/unit/**/*.js'],
        tasks: ['jshint']
      }
    },

    jshint: {
      // Defaults
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        strict: true,
        es5: true,
        trailing: true,
        maxlen: 80,
        browser: true,
        globals: {
          define: true,
          require: true,
          d3: true
        }
      },
      uses_defaults: ['src/**/*.js'],
      with_overrides: {
        options: {
          expr: true,
          globals: {
            jasmine: true,
            describe: true,
            it: true,
            expect: true,
            spyOn: true,
            beforeEach: true,
            afterEach: true,
            define: true,
            require: true,
            d3: true
          }
        },
        files: {
          src: ['Gruntfile.js', 'test/unit/**/*.js']
        }
      }
    }
  });

  grunt.registerTask('testwatch', 'exec:testWatch');
  grunt.registerTask('test', 'exec:test');
  grunt.registerTask('compile-static',
    ['clean:build', 'requirejs:staticBuild']);
  grunt.registerTask('compile', ['clean:build', 'requirejs:amdBuild']);
  grunt.registerTask('release', ['jshint', 'test', 'compile']);
  grunt.registerTask('default', ['jshint', 'compile']);
};
