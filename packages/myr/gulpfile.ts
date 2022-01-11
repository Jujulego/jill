import del from 'del';
import gulp from 'gulp';
import { babel, dest, dts, flow, src, ts } from 'jill-tools';

// Config
const paths = {
  src: 'src/**/*.ts',
  tsconfig: 'tsconfig.json',
  deps: [
    '../../.pnp.*',
    '../common/dist/**',
    '../core/dist/**',
  ]
};

// Tasks
gulp.task('clean', () => del('dist'));

gulp.task('build:cjs', () => flow(
  src(paths.src, { since: gulp.lastRun('build:cjs') }),
  ts(paths.tsconfig),
  babel(),
  dest('dist'),
));

gulp.task('build:types', () => flow(
  src(paths.src, { since: gulp.lastRun('build:types') }),
  dts(paths.tsconfig),
  dest('dist'),
));

gulp.task('build', gulp.parallel('build:cjs', 'build:types'));

gulp.task('watch', () => gulp.watch([paths.src, ...paths.deps], { ignoreInitial: false },
  gulp.parallel('build:cjs', 'build:types')
));
