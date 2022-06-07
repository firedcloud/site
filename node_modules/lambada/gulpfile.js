var gulp = require('gulp');
var jshint = require('gulp-jshint');
var jasmine = require('gulp-jasmine');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

gulp.task('lint', function () {
    return gulp.src('./*.js')
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('test', function () {
    return gulp.src('test.js')
        .pipe(jasmine());
});

gulp.task('uglify', function () {
    return gulp.src('lambada.js')
        .pipe(uglify())
        .pipe(rename('lambada.min.js'))
        .pipe(gulp.dest('.'));
});

gulp.task('default', ['lint', 'test']);
