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
    concat: {
      options: {
        banner: '<%= banner %>',
        process: true,
        stripBanners: true
      },
      core: {
        src: ['src/core.js'],
        dest: 'dist/<%= pkg.name %>.core.js'
      },
      alter: {
        src: ['src/alter.js'],
        dest: 'dist/<%= pkg.name %>.alter.js'
      },
      emmet: {
        src: 'src/emmet.js',
        dest: 'dist/<%= pkg.name %>.emmet.js'
      },
      base: {
        src: ['src/core.js',
              'src/alter.js',
              'src/event.js'],
        dest: 'dist/<%= pkg.name %>.base.js'
      },
      dist: {
        src: ['src/core.js',
              'src/alter.js',
              'src/emmet.js'],
        dest: 'dist/<%= pkg.name %>.js'
      },
      event: {
        src: ['src/event.js'],
        dest: 'dist/<%= pkg.name %>.event.js'
      },
      stringify: {
        src: ['src/stringify.js'],
        dest: 'dist/<%= pkg.name %>.stringify.js'
      }
    },
    uglify: {
      options: {
        banner: '<%= banner %>',
        report: 'gzip'
      },
      core: {
        src: ['dist/<%= pkg.name %>.core.js'],
        dest: 'dist/<%= pkg.name %>.core.min.js'
      },
      base: {
        src: 'dist/<%= pkg.name %>.base.js',
        dest: 'dist/<%= pkg.name %>.base.min.js'
      },
      dist: {
        src: ['dist/<%= pkg.name %>.js'],
        dest: 'dist/<%= pkg.name %>.min.js'
      },
      event: {
        src: ['dist/<%= pkg.name %>.event.js'],
        dest: 'dist/<%= pkg.name %>.event.min.js'
      }
    },
    compress: {
      options: {
        mode: 'gzip'
      },
      core: {
        src: ['dist/<%= pkg.name %>.core.min.js'],
        dest: ['dist/<%= pkg.name %>.core.min.js']
      },
      base: {
        src: ['dist/<%= pkg.name %>.base.min.js'],
        dest: 'dist/<%= pkg.name %>.base.min.js'
      },
      dist: {
        src: ['dist/<%= pkg.name %>.min.js'],
        dest: 'dist/<%= pkg.name %>.min.js'
      },
      event: {
        src: ['dist/<%= pkg.name %>.event.min.js'],
        dest: 'dist/<%= pkg.name %>.event.min.js'
      }
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
        src: ['src/**/*.js']
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
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-compress');

  // Default task.
  grunt.registerTask('default', ['jshint', 'clean', 'concat', 'uglify', 'compress', 'qunit']);

};
