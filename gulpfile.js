var gulp = require('gulp'),
	serve = require('gulp-serve'),
	copy = require('gulp-copy'),
	cors = require('cors'),
	watch = require('gulp-watch'),
	restbus = require('restbus').listen();

var jsFiles = {
	vendor: [
		'./node_modules/jquery/dist/jquery.min.js',
		'./node_modules/jszip/dist/jszip.min.js',
		'./node_modules/idb/lib/idb.js',
		'./node_modules/alasql/dist/alasql.min.js',
		'./node_modules/awesomplete/awesomplete.min.js'
	]
};

var styleFiles = {
	vendor: [
		'./node_modules/wingcss/dist/wing.min.css',
		'./node_modules/awesomplete/awesomplete.css'
	]
};

gulp.task('copy-js', function() {
	return gulp.src(jsFiles.vendor)
		.pipe(copy('./src/js/vendor', {
			prefix: 3
		}));
});

gulp.task('copy-css', function() {
	return gulp.src(styleFiles.vendor)
		.pipe(copy('./src/css/vendor', {
			prefix: 3
		}));
});

gulp.task('watch-css', function() {
	return watch('src/css/**/*.css', {
			ignoreInitial: false
		})
		.pipe(gulp.dest('public/css'));
});
gulp.task('watch-DATA', function() {
	return watch('src/DATA/**/*', {
			ignoreInitial: false
		})
		.pipe(gulp.dest('public/DATA'));
});
gulp.task('watch-js', function() {
	return watch('src/js/**/*.js', {
			ignoreInitial: false
		})
		.pipe(gulp.dest('public/js'));
});
gulp.task('watch-service-worker', function() {
	return watch('src/sw.js', {
			ignoreInitial: false
		})
		.pipe(gulp.dest('public/'));
});
gulp.task('watch-html', function() {
	return watch('src/index.html', {
			ignoreInitial: false
		})
		.pipe(gulp.dest('public/'));
});

gulp.task('rest', function() {
	http.createServer(app).listen('3030', function() {
		console.log('app is now listening on port 3030');
		restbus.listen(function() {
			console.log('restbus is now listening on port 3535');
		});
	});
});

gulp.task('serve', serve('public'));

gulp.task('default', [
	'copy-js', 'copy-css', 'watch-css', 'watch-js',
	'watch-service-worker', 'watch-DATA', 'watch-html',
	'serve'
]);
