/*global module:false*/
module.exports = function(grunt) {

  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);

  // Time how long tasks take. Can help when optimizing build times
  require('time-grunt')(grunt);

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),

    // Task configuration.
    clean: {
      dependencies: {
        src: ["bower_components",
              "node_modules"]
      },
      maps: {
        src: ["script/*.map",
              "style/*.map"]
      },
      temp: {
        src: ['temp']
      },
      artifacts: {
        src: ["<%= uglify.js.dest %>",
              "<%= csswring.css.dest %>",
              "index.html",
              "404.html",
              "iframe.html"]
      }
    },
    copy: {
      dist: {
        src: 'bower_components/domx/dist/domx.min.js.gz',
        dest: 'domx.min.js.gz'
      }
    },
    bower_concat: {
      js: {
        dest: 'temp/bower.js',
        exclude: [
          'normalize-css',
          'pocketgrid'
        ]
      }
    },
    concat_sourcemap: {
      options: {
        sourceRoot: '../'
      },
      js: {
        src: ['temp/bower.js',
              'script/Sintax.js',
              'script/demo.js',
              'script/index.js',
              /*, 'bower_components/eventi/dist/eventi.debug.min.js'*/],
        dest: 'script/<%= pkg.name %>.js'
      },
      css: {
        src: [
          'bower_components/normalize-css/normalize.css',
          'bower_components/pocketgrid/pocketgrid.css',
          'style/*.css'
        ],
        dest: 'style/<%= pkg.name %>.css'
      }
    },
    autoprefixer: {
      options: {
        map: true
      },
      css: {
        src: "<%= concat_sourcemap.css.dest %>",
        dest: "<%= concat_sourcemap.css.dest %>"
      },
    },
    uglify: {
      options: {
        sourceMap: true,
        sourceMapIn: '<%= concat_sourcemap.js.dest %>.map'
      },
      js: {
        src: '<%= concat_sourcemap.js.dest %>',
        dest: '<%= concat_sourcemap.js.dest %>'
      }
    },
    csswring: {
      options: {
        map: true
      },
      css: {
        src: '<%= autoprefixer.css.dest %>',
        dest: '<%= autoprefixer.css.dest %>'
      }
    },
    bake: {
      html: {
        files: {
          "index.html": "html/index.html",
          "404.html": "html/404.html"
        }
      }
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        unused: true,
        boss: true,
        eqnull: true,
        browser: true,
        globals: {}
      }
    },
    watch: {
      js: {
        files: ['script/demo.js',
                'script/Sintax.js',
                'script/index.js',
                'style/style.css',
                'html/*.ht*',
                'bower.json'],
        tasks: ['build']
      }
    }
  });

  // Default task.
  grunt.registerTask('build', ['clean:artifacts', 'bake', 'jshint', 'bower_concat', 'copy', 'concat_sourcemap', 'autoprefixer', 'clean:temp']);
  grunt.registerTask('minify', ['uglify', 'csswring']);
  grunt.registerTask('default', ['build', 'minify']);

};
