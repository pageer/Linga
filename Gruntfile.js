module.exports = function(grunt) {

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-pylint');
    grunt.loadNpmTasks('grunt-bower');
    grunt.loadNpmTasks('grunt-nose');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            all: ['Gruntfile.js', 'linga/static/js/*.js', 'tests/javascript/*.js']
        },
        pylint: {
            src_package: {
                src: 'linga'
            },
            tests: {
                src: 'tests/python',
                options: {
                    disable: 'missing-docstring'
                }
            }
        },
        nose: {
            main: {
                src: 'tests/python/'
            }
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

    grunt.registerTask('lint', ['jshint', 'pylint']);
    grunt.registerTask('test', ['nose']);
    grunt.registerTask('validate', ['jshint', 'pylint', 'nose']);
    grunt.registerTask('deploy', ['bower']);
    grunt.registerTask('default', ['jshint', 'pylint', 'nose', 'bower']);
};
