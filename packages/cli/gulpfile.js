const del = require('del');
const gulp = require('gulp');
const babel = require('gulp-babel');
const ts = require('gulp-typescript');

// Config
const paths = {
  src: 'src/**/*.ts',
};

const tsProject = ts.createProject('tsconfig.json', {
  isolatedModules: false,
  emitDeclarationOnly: true
});

// Tasks
gulp.task('clean', () => del('dist'));

gulp.task('build:cjs', () => gulp.src(paths.src)
  .pipe(babel())
  .pipe(gulp.dest('dist'))
);

gulp.task('build:types', () => gulp.src(paths.src)
  .pipe(tsProject()).dts
  .pipe(gulp.dest('dist'))
);

gulp.task('build', gulp.series(
  'clean',
  gulp.parallel('build:cjs', 'build:types'),
));

gulp.task('watch', () => gulp.watch(paths.src, { ignoreInitial: false },
  gulp.parallel('build:cjs', 'build:types')
));