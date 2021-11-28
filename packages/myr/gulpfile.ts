import del from 'del';
import gulp from 'gulp';
import babel from 'gulp-babel';
import sourcemaps from 'gulp-sourcemaps';
import typescript from 'gulp-typescript';

// Config
const paths = {
  src: 'src/**/*.ts',
  deps: [
    '../../.pnp.*',
    '../core/dist/**',
  ]
};

const cts = typescript.createProject('tsconfig.json');

const dts = typescript.createProject('tsconfig.json', {
  isolatedModules: false,
  emitDeclarationOnly: true
});

// Tasks
gulp.task('clean', () => del('dist'));

gulp.task('build:cjs', () => gulp.src(paths.src, { since: gulp.lastRun('build:cjs') })
  .pipe(sourcemaps.init())
  .pipe(cts()).js
  .pipe(babel())
  .pipe(sourcemaps.write())
  .pipe(gulp.dest('dist'))
);

gulp.task('build:types', () => gulp.src(paths.src, { since: gulp.lastRun('build:types') })
  .pipe(sourcemaps.init())
  .pipe(dts()).dts
  .pipe(sourcemaps.write())
  .pipe(gulp.dest('dist'))
);

gulp.task('build', gulp.parallel('build:cjs', 'build:types'));

gulp.task('watch', () => gulp.watch([paths.src, ...paths.deps], { ignoreInitial: false },
  gulp.parallel('build:cjs', 'build:types')
));