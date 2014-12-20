'use strict';

module.exports = function(grunt) {

  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);

  // Time how long tasks take. Can help when optimizing build times
  require('time-grunt')(grunt);

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('bower.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
    // Task configuration.
    clean: {
      files: ['dist']
    },
    frame: {
      options: {
        frame: 'src/frame.js',
      },
      dist: {
        src: ['src/core.js',
              'src/traverse.js',
              'src/append.js',
              'src/emmet.js',
              'src/dot.js'],
        dest: 'dist/<%= pkg.name %>.js'
      },
      tiny: {
        src: ['src/core.js',
              'src/traverse.js',
              'src/append.js'],
        dest: 'dist/<%= pkg.name %>.tiny.js'
      },
      emmet: {
        options: {
          frame: 'src/plugin-frame.js',
        },
        src: ['src/emmet.js'],
        dest: 'dist/<%= pkg.name %>.emmet.js'
      },
      dot: {
        options: {
          frame: 'src/plugin-frame.js',
        },
        src: ['src/dot.js'],
        dest: 'dist/<%= pkg.name %>.dot.js'
      },
    },
    uglify: {
      options: {
        banner: '<%= banner %>',
        report: 'gzip'
      },
      dist: {
        src: ['dist/<%= pkg.name %>.js'],
        dest: 'dist/<%= pkg.name %>.min.js'
      },
      tiny: {
        src: ['dist/<%= pkg.name %>.tiny.js'],
        dest: 'dist/<%= pkg.name %>.tiny.min.js'
      },
      full: {
        src: ['dist/<%= pkg.name %>.js',
              'bower_components/domx-value/dist/domx-value.js',
              'bower_components/domx-repeat/dist/domx-repeat.js'],
        dest: 'dist/<%= pkg.name %>.full.min.js'
      }
    },
    compress: {
      options: {
        mode: 'gzip'
      },
      dist: {
        src: ['dist/<%= pkg.name %>.min.js'],
        dest: 'dist/<%= pkg.name %>.min.js.gz'
      },
      tiny: {
        src: ['dist/<%= pkg.name %>.tiny.min.js'],
        dest: 'dist/<%= pkg.name %>.tiny.min.js.gz'
      },
      full: {
        src: ['dist/<%= pkg.name %>.full.min.js'],
        dest: 'dist/<%= pkg.name %>.full.min.js.gz'
      },
    },
    qunit: {
      files: ['test/**/*.html']
    },
    jshint: {
      gruntfile: {
        options: {
          jshintrc: '.jshintrc'
        },
        src: 'Gruntfile.js'
      },
      src: {
        options: {
          jshintrc: 'src/.jshintrc'
        },
        src: ['src/**/*.js',
              '!src/*frame.js']
      },
      dist: {
        options: {
          jshintrc: 'src/.jshintrc-dist'
        },
        src: ['dist/*.js']
      },
      test: {
        options: {
          jshintrc: 'test/.jshintrc'
        },
        src: ['test/**/*.js']
      },
    },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      src: {
        files: '<%= jshint.src.src %>',
        tasks: ['jshint:src', 'qunit']
      },
      test: {
        files: '<%= jshint.test.src %>',
        tasks: ['jshint:test', 'qunit']
      },
    },
  });

  // load frame task
  grunt.loadTasks('tasks');

  // Default task.
  grunt.registerTask('default', ['clean', 'frame', 'jshint', 'uglify', 'compress', 'qunit']);

};
