var gulp    = require('gulp'),
	util    = require('gulp-util'),
	banner  = require('gulp-banner'),
	concat  = require('gulp-concat'),
	rename  = require('gulp-rename'),
	uglify  = require('gulp-uglify');
	pack    = require('./package.json');

var comment = ['/**',
		' * Phaser Arcade Slopes v<%= package.version %>',
		' *',
		' * <%= package.description %>',
		' *',
		' * <%= package.homepage %>',
		' * Copyright 2016-2017 <%= package.author %>',
		' * Released under the <%= package.license %> license',
		' */',
		''
	].join('\n');

gulp.task('default', ['build']);

gulp.task('build', function () {
	return gulp.src(['src/**/*.js', 'node_modules/sat/SAT.js'])
		.pipe(concat('phaser-arcade-slopes.js'))
		.pipe(gulp.dest('dist'))
		.pipe(rename({suffix: '.min'}))
		.pipe(uglify())
		.pipe(banner(comment, {
			package: pack
		}))
		.pipe(gulp.dest('dist'));
});

gulp.task('watch', function () {
	gulp.watch('src/**/*.js', ['build']);
});
