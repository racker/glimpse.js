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
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadTasks('grunt/tasks/');
  grunt.loadNpmTasks('grunt-conventional-changelog');
  grunt.loadNpmTasks('grunt-bumpup');
  grunt.loadNpmTasks('grunt-tagrelease');

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    /**
     * Cleans out the "build" directory.
     */
    clean: {
      build: ['build/*'],
      assets: ['src/assets/assets.js'],
      docs: ['docs/'],
    },

    /**
     * Copy built files into root.
     */
    copy: {
      release: {
        files: [
          { src: 'build/glimpse.js', dest: './glimpse.min.js' },
          { src: 'build/glimpse.js.src', dest: './glimpse.js' }
        ]
      }
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
            startFile: ['src/wrap.start', 'components/almond/almond.js'],
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
        command: 'karma start test/karma.conf.js ' +
                 '--browsers="Chrome" ' +
                 '--singleRun=false',
        stdout: true
      },
      test: {
        command: 'karma start test/karma.conf.js ' +
                 '--browsers="Chrome" ' +
                 '--singleRun=true',
        stdout: true
      },
      testFirefox: {
        command: 'karma start test/karma.conf.js ' +
                 '--browsers="Firefox" ' +
                 '--singleRun=true',
        stdout: true
      },
      testSafari: {
        command: 'karma start test/karma.conf.js ' +
                 '--browsers="Safari" ' +
                 '--singleRun=true',
        stdout: true
      },
      testHeadless: {
        command: 'karma start test/karma.conf.js ' +
                 '--browsers="PhantomJS" ' +
                 '--singleRun=true',
        stdout: true
      },
      testTravis: {
        command: 'karma start test/karma.conf.js ' +
                 '--browsers="Firefox" ' +
                 '--singleRun=true',
        stdout: true
      },
      testWindows: {
        command: 'karma start test/karma.conf.js ' +
                 '--browsers="IE" ' +
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

    'bumpup-core': {
      options: {
        file: 'src/core/core.js'
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
          src: ['test/*.js', 'test/unit/**/*.js', '!test/karma.conf.js']
        }
      }
    },

    concat: {
      docs: {
        src: ['docs/**/*.md'],
        dest: '../glimpse.js.wiki/api-reference.md',
        options: {
          separator: '\n\n* * *  \n\n'
        }
      }
    },
    /*
      Bumps the version, date and other properties in
      specified json files.
     */
    bumpup: {
        files: ['package.json', 'bower.json']
    },
    /*
      Generates a complete changelog
     */
    changelog: {
      options: {
        dest: 'changelog.full.md',
        templateFile: 'changelog.tpl.md'
      }
    },
    /*
      Commit the changes and tag the last commit with
      a version from provided JSON file.
      If there is nothing to commit, the task will tag the current last commit.
     */
    tagrelease: 'package.json'

  });

  grunt.registerTask('test', 'exec:test');
  grunt.registerTask('testwatch', 'exec:testWatch');
  grunt.registerTask('testheadless', 'exec:testHeadless');
  grunt.registerTask('testwin', 'exec:testWindows');
  grunt.registerTask('assets', ['clean:assets', 'compile-svg:assets']);
  grunt.registerTask('docs',
    ['clean:docs', 'concat:docs', 'clean:docs']);
  grunt.registerTask('compile-static', [
    'assets',
    'clean:build',
    'requirejs:staticBuild']);
  grunt.registerTask('compile-amd', [
    'assets',
    'clean:build',
    'requirejs:amdBuild']);
  grunt.registerTask('compile', 'compile-static');
  // Task for updating the pkg config property.
  grunt.registerTask('updatepkg', function () {
    grunt.config.set('pkg', grunt.file.readJSON('bower.json'));
  });
  grunt.registerTask('release', function(type) {
    type = type ? type : 'patch';
    grunt.task.run('jshint');
    grunt.task.run('assets');
    grunt.task.run('exec:test');
    grunt.task.run('exec:testFirefox');
    grunt.task.run('exec:testSafari');
    grunt.task.run('bumpup:' + type);
    grunt.task.run('updatepkg');
    grunt.task.run('bumpup-core');
    grunt.task.run('compile');
    grunt.task.run('copy:release');
  });
  grunt.registerTask('tagrelease', 'tagrelease');
  grunt.registerTask('changelog', 'changelog');
  grunt.registerTask('travis', ['jshint', 'assets', 'exec:testTravis']);
  grunt.registerTask('default', ['jshint', 'assets', 'exec:test']);
};
