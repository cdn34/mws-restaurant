const gulp = require('gulp');
const autoprefixer = require('gulp-autoprefixer');
const cssnano = require('gulp-cssnano');
// const uglify = require('gulp-uglify');
const uglifyes = require('uglify-es');
const composer = require('gulp-uglify/composer');
const uglify = composer(uglifyes, console);
const imagemin = require('gulp-imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');

gulp.task('styles', () => {
    gulp.src('client/css/**/*.css')
        .pipe(autoprefixer({
            browsers: ['last 2 versions']
        }))
        .pipe(cssnano())
        .pipe(gulp.dest('assets/css'));
});

gulp.task('scripts', () => {
    gulp.src('client/js/**/*.js')
        .pipe(uglify().on('error', (e) => console.log(e)))
        .pipe(gulp.dest('assets/js'));
});

gulp.task('images', function() {
    return gulp.src('client/img/**/*.*')
        .pipe(imagemin(
            imageminMozjpeg({ quality: 20 }),    
            // imagemin.jpegtran({progressive: true}),
            imagemin.optipng({optimizationLevel: 5})
        ))
        .pipe(gulp.dest('assets/img'));
});

gulp.task('html', () => {
    return gulp.src(['client/*.html', 'client/manifest.json', 'client/sw.js'])
    .pipe(gulp.dest('assets/'));
});

gulp.task('default', ['html', 'styles', 'images', 'scripts']);