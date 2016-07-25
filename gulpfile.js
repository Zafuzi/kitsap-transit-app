var gulp = require('gulp'),
  serve = require('gulp-serve'),
  copy = require('gulp-copy'),
  watch = require('gulp-watch'),
  concat = require('gulp-concat'),
  minify = require('gulp-minify');

var jsFiles = {
  vendor: [
    './node_modules/jquery/dist/jquery.min.js',
    './node_modules/idb/lib/idb.js',
    './node_modules/jszip/dist/jszip.min.js',
    './node_modules/papaparse/papaparse.min.js',
    './node_modules/taffydb/taffy-min.js',
  ],
  app: [
    './src/js/indexController.js',
    './src/js/fonts.js',
    './src/js/GTFS_Controller.js',
    './src/js/DatabaseController.js',
    './src/js/App.js'
  ]
};

var styleFiles = {
  vendor: [
    './node_modules/wingcss/dist/wing.min.css',
    './node_modules/awesomplete/awesomplete.css'
  ],
  app: [
    './src/css/styles.css'
  ]
};

gulp.task('copy-vendor-js', function() {
  return gulp.src(jsFiles.vendor)
    .pipe(copy('./src/js/vendor', {
      prefix: 3
    }));
});

gulp.task('copy-vendor-css', function() {
  return gulp.src(styleFiles.vendor)
    .pipe(copy('./src/css/vendor', {
      prefix: 3
    }));
});

gulp.task('copy-css', () => {
  return gulp.src('./src/css/**/*.css')
    .pipe(watch('./src/css/**/*.css'))
    .pipe(gulp.dest('public/css'));
});
gulp.task('copy-js', () => {
  return gulp.src(jsFiles.app)
    .pipe(concat('app.js'))
    .pipe(gulp.dest('public/js'));
});
gulp.task('copy-service-worker', () => {
  return gulp.src('src/sw.js')
    .pipe(watch('src/sw.js'))
    .pipe(gulp.dest('public/'));
});
gulp.task('copy-index', () => {
  return gulp.src('src/index.html')
    .pipe(watch('src/index.html'))
    .pipe(gulp.dest('public/'));
});
gulp.task('copy-DATA', () => {
  return gulp.src('src/DATA/**/*')
    .pipe(watch('src/DATA/**/*'))
    .pipe(gulp.dest('public/DATA'));
});
// gulp.task('copy-workers', () => {
//   return gulp.src('src/js/task.js')
//     .pipe(watch('src/js/task.js'))
//     .pipe(gulp.dest('public/js/'));
// });

gulp.task('watch-js', function() {
  return watch(jsFiles.app, () => {
    gulp.src(jsFiles.app)
      .pipe(concat('app.js'))
      .pipe(gulp.dest('public/js'));
  });
});

gulp.task('con-vendor-js', function() {
  return gulp.src('src/js/vendor/*.js')
    .pipe(concat('vendor.js'))
    .pipe(minify({
      ext: {
        src: '.js',
        min: '.min.js'
      }
    }))
    .pipe(gulp.dest('./public/js/vendor'));
});

gulp.task('con-js', function() {
  return gulp.src(jsFiles.app)
    .pipe(concat('app.js'))
    .pipe(gulp.dest('public/js'));
});

gulp.task('serve', serve('public'));

gulp.task('build', [
  'copy-vendor-js', 'con-vendor-js', 'copy-js', 'copy-vendor-css',
  'copy-css', 'copy-service-worker', 'copy-DATA', 'copy-index', 'con-js', 'prod'
]);
gulp.task('prod', [
  'watch-js', 'serve'
]);
gulp.task('default', ['prod']);
