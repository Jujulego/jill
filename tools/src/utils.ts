import { steps } from '@jujulego/flow';
import gulp from 'gulp';
import sourcemaps from 'gulp-sourcemaps';

export function src(...params: Parameters<typeof gulp.src>) {
  return steps(
    gulp.src(...params),
    sourcemaps.init()
  );
}

export function dest(path: string) {
  return steps(
    sourcemaps.write('.'),
    gulp.dest(path),
  );
}
