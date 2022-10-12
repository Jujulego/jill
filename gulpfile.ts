import { flow } from '@jujulego/flow';
import { Options } from '@swc/core';
import del from 'del';
import gulp from 'gulp';
import sourcemaps from 'gulp-sourcemaps';
import typescript from 'gulp-typescript';

// Config
const options = {
  src: 'src/**/*.ts',
  output: 'dist',
  tsconfig: 'tsconfig.json',
  deps: [
    '../../.pnp.*',
  ]
};

// Utils
// eslint-disable-next-line @typescript-eslint/no-var-requires
export const swc: (opts: Options) => NodeJS.ReadWriteStream = require('gulp-swc');

// Tasks
gulp.task('clean', () => del(options.output));

gulp.task('build:cjs', () => flow(
  gulp.src(options.src, { since: gulp.lastRun('build:cjs') }),
  sourcemaps.init(),
  swc({ module: { type: 'commonjs' } }),
  sourcemaps.write('.'),
  gulp.dest(options.output),
));

gulp.task('build:types', () => flow(
  gulp.src(options.src, { since: gulp.lastRun('build:types') }),
  sourcemaps.init(),
  typescript.createProject(options.tsconfig, {
    isolatedModules: false,
    emitDeclarationOnly: true
  })(),
  sourcemaps.write('.'),
  gulp.dest(options.output),
));

gulp.task('build', gulp.series(
  'clean',
  gulp.parallel('build:cjs', 'build:types'),
));

gulp.task('watch', () => gulp.watch([options.src, ...options.deps], { ignoreInitial: false },
  gulp.parallel('build:cjs', 'build:types'),
));
