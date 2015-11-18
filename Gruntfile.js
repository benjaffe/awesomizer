module.exports = function(grunt) {

  require('time-grunt')(grunt);
  require('jit-grunt')(grunt);

  var fileMaps = { browserify: {} };
  var file, files = grunt.file.expand({cwd:'code/js'}, ['*.js', '{,**/}*.js']);
  for (var i = 0; i < files.length; i++) {
    file = files[i];
    fileMaps.browserify['build/unpacked-dev/js/' + file] = 'code/js/' + file;
    // fileMaps.browserify['build/unpacked-prod/js/' + file] = 'code/js/' + file;
  }

  //
  // config
  //

  grunt.initConfig({

    clean: ['build/unpacked-dev'/*, 'build/unpacked-prod'*/],

    mkdir: {
      unpacked: { options: { create: ['build/unpacked-dev'/*, 'build/unpacked-prod'*/] } },
      js: { options: { create: ['build/unpacked-dev/js'] } }
    },

    mochaTest: {
      options: { colors: true, reporter: 'spec' },
      files: ['code/**/*.spec.js']
    },

    copy: {
      main: { files: [ {
        expand: true,
        cwd: 'code/',
        src: ['**', '!**/*.js', '!**/*.md'],
        dest: 'build/unpacked-dev/'
      } ] }
    },

    browserify: {
      all : {
        files: fileMaps.browserify,
        options : {
          // keepAlive : true, // watchify will exit unless task is kept alive
          watch : true // use watchify for incremental builds!
          // browserifyOptions : {
          //   debug : true // source mapping
          // }
        }
      }
    },

    watch: {
      css: {
        files: ['code/**', '!**/*.js'],
        tasks: ['copy']
      },
      dev: {
        files: ['build/unpacked-dev/**'],
        tasks: ['chrome_extension_reload', 'beep']
      }
    },

    /**
      Executes "chrome-cli list tabs", grabs stdout, and finds open extension tabs ID's.
      Sets variable chromeExtensionTabId to the first extension tab ID
    */
    external_daemon: {
      getExtensionTabId: {
        options: {
          // verbose: true,
          startCheck: function(stdout, stderr) {
            if (!stdout) return false;

            // Find any open tab in Chrome that has the extensions page loaded, grab ID of tab
            var extensionTabMatches = stdout.match(/\:\d{1,5}\] Extensions/);

            if(extensionTabMatches){

              chromeExtensionTabId = extensionTabMatches[0].substr(1).split(']')[0];

              grunt.log.writeln("Refreshing Chrome Extension Tab #: " + chromeExtensionTabId);
              grunt.task.run(['exec:reloadChromeTab:'+chromeExtensionTabId]);
            } else {
              grunt.log.writeln("No Open Chrome Extension Tab -- Opening One!");
              grunt.task.run(['exec:reloadChromeTab']);
            }

            return true;
          }
        },
        cmd: "chrome-cli",
        args: ["list", "tabs"]
      }
    },

    /**
      Reloads tab in chrome with id of chromeExtensionTabId
      Called after correct tab number is found from chrome-cli binary.
    */
    exec: {
      reloadChromeTab: {
        cmd: function(index) {
          return index ? "chrome-cli reload -t " + index : "chrome-cli open chrome://extensions && chrome-cli reload";
        }
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-mkdir');
  // grunt.loadNpmTasks('grunt-contrib-jshint');
  // grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-watchify');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-exec');
  // grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-external-daemon');
  grunt.loadNpmTasks('grunt-beep');


  //
  // custom tasks
  //

  //
  // testing-related tasks
  //

  // grunt.registerTask('test', ['jshint', 'mochaTest']);
  // grunt.registerTask('test-cont', ['test', 'watch']);

  //
  // DEFAULT
  //

  grunt.registerTask('chrome_extension_reload', function() {
    grunt.task.run(['external_daemon:getExtensionTabId']);
  });


  grunt.registerTask('default', ['clean', 'mkdir:unpacked', 'copy:main',
    'mkdir:js', 'browserify', 'chrome_extension_reload']);

  grunt.registerTask('start', ['browserify', 'chrome_extension_reload', 'beep', 'watch']);
};
