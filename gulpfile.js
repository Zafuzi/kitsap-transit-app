var gulp = require('gulp');
var serve = require('gulp-serve');
var copy = require('gulp-copy');
var jszip = require('jszip');

var jsFiles = {
  vendor: [
    './node_modules/jquery/dist/jquery.min.js',
    './node_modules/jszip/dist/jszip.min.js',
    './node_modules/idb/lib/idb.js'
  ]
};

var styleFiles = {
  vendor: [
    './node_modules/wingcss/dist/wing.min.css'
  ]
};

gulp.task('copy-js', function(){
  return gulp.src(jsFiles.vendor)
  .pipe(copy('./public/js/vendor', {prefix: 3}));
});

gulp.task('copy-css', function(){
  return gulp.src(styleFiles.vendor)
  .pipe(copy('./public/css/vendor', {prefix: 3}));
});

gulp.task('serve', serve('public'));
gulp.task('serve-build', serve(['public', 'build']));
gulp.task('serve-prod', serve({
  root: ['public', 'build'],
  port: 80,
  middleware: function(req, res) {
    // custom optional middleware
  }
}));

gulp.task('default', ['copy-js', 'copy-css', 'serve']);
