import del from 'del';
import gulp from 'gulp';
import { babel, dest, dts, flow, src, ts } from 'jill-tools';

// Config
const paths = {
  src: ['src/**/*.ts', 'src/**/*.tsx'],
  tsconfig: 'tsconfig.json',
  deps: [
    '../../.pnp.*',
    '../common/dist/types/**',
    '../core/dist/types/**',
    '../myr/dist/types/**',
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

gulp.task('build', gulp.series(
  'clean',
  gulp.parallel('build:cjs', 'build:types')
));

gulp.task('watch', () => gulp.watch([...paths.src, ...paths.deps], { ignoreInitial: false },
  gulp.parallel('build:cjs', 'build:types')
));
