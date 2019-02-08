const gulp = require('gulp');
const ts = require('gulp-typescript');
const mocha = require('gulp-mocha');
const gutil = require('gulp-util');
//const tester = require('gulp-shell');
const JSON_FILES = ['src/*.json', 'src/**/*.json'];

// pull in the project TypeScript config
const tsProject = ts.createProject('tsconfig.json');

gulp.task('scripts', () => {
  const tsResult = tsProject.src()
  .pipe(tsProject());
  return tsResult.js.pipe(gulp.dest('dist'));
});

gulp.task('watchEvent', ['scripts'], () => {
  gulp.watch(['src/Event.ts', 'src/Tests/test.ts'], ['scripts', 'mocha_event']);
});

gulp.task('assets', function() {
  return gulp.src(JSON_FILES)
  .pipe(gulp.dest('dist'));
});

gulp.task('mocha_event', ['scripts'], function() {
  return gulp.src(['./dist/Tests/test.js'], { read: false })
      .pipe(mocha({ reporter: 'list' }))
      .on('error', gutil.log);
});


gulp.task('watchActionHandler', ['scripts'], () => {
  gulp.watch(['./src/ActionHandler.ts'], ['scripts']);
})

gulp.task('checkEvent',['watchEvent', 'mocha_event']);

gulp.task('checkProj', ['checkEvent', 'watchActionHandler']);

gulp.task('default', ['checkProj', 'assets']);