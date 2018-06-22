module.exports = function(grunt) {

    //require("matchdep").filterDev("grunt-*").forEach(grunt.loadNpmTasks);
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-bower');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            all: ['Gruntfile.js', 'linga/static/js/*.js', 'tests/javascript/*.js']
        },
        bower: {
            dev: {
                dest: 'linga/static/vendor/',
                js_dest: 'linga/static/vendor/js/',
                css_dest: 'linga/static/vendor/css/',
                options: {
                    keepExpandedHierarchy: false,
                    packageSpecific: {
                        jquery: {
                            files: ['dist/jquery.min.js']
                        },
                        hammerjs: {
                            files: ['hammer.min.js']
                        },
                        bootstrap: {
                            files: [
                                'dist/css/bootstrap-grid.min.css',
                                'dist/css/bootstrap-reboot.min.css',
                                'dist/js/bootstrap.bundle.min.js',
                                'dist/js/bootstrap.min.js'
                            ]
                        },
                        bootswatch: {
                            files: ['dist/cyborg/bootstrap.min.css']
                        }
                    },
                    ignorePackages: [
                        'jasmine-core',
                        'jasmine-reporters'
                    ]
                }
            }
        }
    });

    grunt.registerTask('default', ['jshint']);
    grunt.registerTask('lint', ['jshint']);
    //grunt.registerTask('deploy', ['copy']);
    grunt.registerTask('deploy', ['bower']);
};
