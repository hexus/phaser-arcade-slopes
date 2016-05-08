var gulp   = require('gulp'),
	util   = require('gulp-util'),
	concat = require('gulp-concat'),
	rename = require('gulp-rename'),
	uglify = require('gulp-uglify');

// Build by default
gulp.task('default', ['build']);

// The build task
gulp.task('build', function () {
	gulp.src(['src/**/*.js', 'vendor/sat-js/SAT.js'])
		.pipe(concat('phaser-arcade-slopes.js'))
		.pipe(gulp.dest('dist'))
		.pipe(rename({suffix: '.min'}))
		.pipe(uglify())
		.pipe(gulp.dest('dist'));
});

// The watch task
gulp.task('watch', function () {
	gulp.watch('src/**/*.js', ['build']);
});
