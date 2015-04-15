var gulp = require('gulp'),
	compass = require('gulp-compass'),
	jshint = require('gulp-jshint'),
	stylish = require('jshint-stylish'),
	uglify = require('gulp-uglify'),
	util = require('gulp-util'),
	concat = require('gulp-concat'),
	minifyCSS = require('gulp-minify-css'),
	rename = require('gulp-rename');

var SRC_DIR = 'src/',
	JS_DIR = SRC_DIR + 'js/',
	SASS_DIR = SRC_DIR + 'sass/',
	DIST_DIR = 'dist/';

gulp.task('compass', function()
{
	gulp.src(SASS_DIR + '**/*.scss')
		.pipe(compass(
		{
			config_file: 'config.rb',
			css: DIST_DIR,
			sass: SASS_DIR
		}))
		.on('error', function(error)
		{
			console.log(error);

			this.emit('end');
		})
		.pipe(gulp.dest(DIST_DIR));
});

gulp.task('minify-css', function()
{
	return gulp.src(DIST_DIR + 'pxlcore.css')
		.pipe(minifyCSS())
		.pipe(rename(
		{
            extname: '.min.css'
        }))
		.pipe(gulp.dest(DIST_DIR))
});

gulp.task('lint', function()
{
	return gulp.src(JS_DIR + '/**/*.js')
		.pipe(jshint())
		.pipe(jshint.reporter(stylish));
});

gulp.task('concat', function()
{
	return gulp.src(
		[
			JS_DIR + 'notification.js',
			JS_DIR + 'dialog.js',
			JS_DIR + 'ajax.js',
			JS_DIR + 'ui.js',
			JS_DIR + 'pxlcore.js'
		])
		.pipe(concat('pxlcore.js'))
		.pipe(gulp.dest(DIST_DIR));
});

gulp.task('uglify', function()
{
	return gulp.src(DIST_DIR + 'pxlcore.js')
		.pipe(uglify().on('error', util.log))
		.pipe(rename(
		{
            extname: '.min.js'
        }))
		.pipe(gulp.dest(DIST_DIR));
});

gulp.task('watch', function()
{
	gulp.watch(SASS_DIR + '**/*.scss', ['compass', 'minify-css']);
	gulp.watch(JS_DIR + '**/*.js', ['lint', 'concat', 'uglify']);
});

gulp.task('default', ['compass', 'minify-css', 'lint', 'concat', 'uglify', 'watch']);