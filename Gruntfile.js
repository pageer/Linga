module.exports = function(grunt) {

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-pylint');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-nose');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            all: ['Gruntfile.js', 'linga/static/js/*.js', 'tests/javascript/*.js']
        },
        pylint: {
            src_package: {
                src: 'linga',
                options: {
                    externalPylint: true,
                    disable: 'missing-docstring',
                    force: true
                } }, tests: { src: 'tests/python',
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
        copy: {
            main: {
                files: [{
                    expand: true,
                    src: 'node_modules/jquery/dist/jquery.min.js',
                    dest: 'linga/static/vendor/js/',
                    flatten: true,
                    filter: 'isFile'
                }, {
                    expand: true,
                    src: 'node_modules/knockout/build/output/knockout-latest.js',
                    dest: 'linga/static/vendor/js/',
                    flatten: true,
                    filter: 'isFile'
                }, {
                    expand: true,
                    src: 'node_modules/hammerjs/hammer.min.js',
                    dest: 'linga/static/vendor/js/',
                    flatten: true,
                    filter: 'isFile'
                }, {
                    expand: true,
                    src: 'node_modules/bootstrap/dist/js/*.min.js',
                    dest: 'linga/static/vendor/js/',
                    flatten: true,
                    filter: 'isFile'
                }, {
                    expand: true,
                    src: 'node_modules/bootstrap/dist/css/*.min.css',
                    dest: 'linga/static/vendor/css/',
                    flatten: true,
                    filter: 'isFile'
                }, {
                    expand: true,
                    src: 'node_modules/bootswatch/dist/cyborg/bootstrap.min.css',
                    dest: 'linga/static/vendor/css/cyborg/',
                    flatten: true,
                    filter: 'isFile'
                }]
            }
        }
    });

    grunt.registerTask('lint', ['jshint', 'pylint']);
    grunt.registerTask('test', ['nose']);
    grunt.registerTask('validate', ['jshint', 'pylint', 'nose']);
    grunt.registerTask('deploy', ['copy']);
    grunt.registerTask('default', ['jshint', 'pylint', 'nose', 'copy']);
};
