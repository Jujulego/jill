const del = require('del');
const gulp = require('gulp');
const babel = require('gulp-babel');
const ts = require('gulp-typescript');

// Config
const paths = {
  src: 'src/**/*.ts',
  deps: [
    '../../.pnp.*',
  ]
};

const tsProject = ts.createProject('tsconfig.json', {
  isolatedModules: false,
  emitDeclarationOnly: true
});

// Tasks
gulp.task('clean', () => del('dist'));

gulp.task('build:cjs', () => gulp.src(paths.src)
  .pipe(babel({ envName: 'cjs' }))
  .pipe(gulp.dest('dist/cjs'))
);

gulp.task('build:esm', () => gulp.src(paths.src)
  .pipe(babel({ envName: 'esm' }))
  .pipe(gulp.dest('dist/esm'))
);

gulp.task('build:types', () => gulp.src(paths.src)
  .pipe(tsProject())
  .pipe(gulp.dest('dist/types'))
);

gulp.task('build', gulp.parallel('build:cjs', 'build:esm', 'build:types'));

gulp.task('watch', () => gulp.watch([paths.src, ...paths.deps], { ignoreInitial: false },
  gulp.parallel('build:cjs', 'build:esm', 'build:types')
));