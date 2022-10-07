import { dest, dts, flow, src, swc } from 'jill-tools';
import del from 'del';
import gulp from 'gulp';
import path from 'path';

// Config
const options = {
  src: 'src/**/*.ts',
  output: 'dist',
  tsconfig: 'tsconfig.json',
  deps: [
    '../../.pnp.*',
    '../common/dist/types/**',
    '../core/dist/types/**',
    '../myr/dist/types/**',
  ]
};

// Tasks
gulp.task('clean', () => del(options.output));

gulp.task('build:cjs', () => flow(
  src(options.src, { since: gulp.lastRun('build:cjs') }),
  swc({ module: { type: 'commonjs' } }),
  dest(options.output)
));

gulp.task('build:types', () => flow(
  src(options.src, { since: gulp.lastRun('build:types') }),
  dts(options.tsconfig),
  dest(options.output)
));

gulp.task('build', gulp.series(
  'clean',
  gulp.parallel('build:cjs', 'build:types'),
));

gulp.task('watch', () => gulp.watch([options.src, ...options.deps], { ignoreInitial: false },
  gulp.parallel('build:cjs', 'build:types'),
));
