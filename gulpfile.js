
'use strict';
var path = require('path');
var gulp = require('gulp')
var webpack = require('webpack')

var gutil = require('gulp-util')

var webpackConf = require('./webpack.config')
var config = require('./config.json')

var src = path.resolve(process.cwd(), config.devPath);
var assets = path.resolve(process.cwd(), config.buildPath);

// js check
gulp.task('hint', () => {
    var jshint = require('gulp-jshint')
    var stylish = require('jshint-stylish')

    return gulp.src([
            '!' + src + '/javascripts/lib/**/*.js',
            src + '/javascripts/**/*.js'
        ])
        .pipe(jshint())
        .pipe(jshint.reporter(stylish));
})

// clean assets
gulp.task('clean', ['hint'], () => {
    var clean = require('gulp-clean')

    return gulp.src(assets, {read: true}).pipe(clean())
})

// run webpack pack
gulp.task('pack', ['clean'], (done) => {
    webpack(webpackConf, (err, stats) => {
        if(err) throw new gutil.PluginError('webpack', err)
        gutil.log('[webpack]', stats.toString({colors: true}))
        done()
    })
})

// html process
gulp.task('default', ['pack'])
/*gulp.task('default', ['pack'], () => {
    let replace = require('gulp-replace')
    let htmlmin = require('gulp-htmlmin')

    return gulp
        .src(assets + '/*.html')
        // @see https://github.com/kangax/html-minifier
        .pipe(htmlmin({
            collapseWhitespace: true,
            removeComments: true
        }))
        .pipe(gulp.dest(assets))
})*/

// deploy assets to remote server
gulp.task('deploy', () => {
    var sftp = require('gulp-sftp')
    return gulp.src(assets + '/**')
        .pipe(sftp(config.online?config.onServer.sftp:config.testServer.sftp))
})

