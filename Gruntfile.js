'use strict';

module.exports = function(grunt) {

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
              'src/xvalue.js',
              'src/repeat.js',
              'src/emmet.js',
              'src/dot.js'],
        dest: 'dist/<%= pkg.name %>.js'
      },
      base: {
        src: ['src/core.js',
              'src/traverse.js',
              'src/append.js'],
        dest: 'dist/<%= pkg.name %>.base.js'
      },
      emmet: {
        options: {
          frame: 'src/plugin-frame.js',
        },
        src: ['src/emmet.js'],
        dest: 'dist/<%= pkg.name %>.emmet.js'
      },
      values: {
        options: {
          frame: 'src/plugin-frame.js',
        },
        src: ['src/xvalue.js'],
        dest: 'dist/<%= pkg.name %>.xvalue.js'
      },
      repeat: {
        options: {
          frame: 'src/plugin-frame.js',
        },
        src: ['src/repeat.js'],
        dest: 'dist/<%= pkg.name %>.repeat.js'
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
      base: {
        src: ['dist/<%= pkg.name %>.base.js'],
        dest: 'dist/<%= pkg.name %>.base.min.js'
      },
    },
    compress: {
      options: {
        mode: 'gzip'
      },
      dist: {
        src: ['dist/<%= pkg.name %>.min.js'],
        dest: 'dist/<%= pkg.name %>.min.js'
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

  // These plugins provide necessary tasks.
  grunt.loadTasks('tasks');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-compress');

  // Default task.
  grunt.registerTask('default', ['clean', 'frame', 'jshint', 'uglify', 'compress', 'qunit']);

};
