const del = require('del');
const gulp = require('gulp');
const babel = require('gulp-babel');
const typescript = require('gulp-typescript');

// Config
const paths = {
  src: 'src/**/*.ts',
  deps: [
    '../../.pnp.*',
    '../core/dist/**',
  ]
};

const ts = typescript.createProject('tsconfig.json');

const dts = typescript.createProject('tsconfig.json', {
  isolatedModules: false,
  emitDeclarationOnly: true
});

// Tasks
gulp.task('clean', () => del('dist'));

gulp.task('build:cjs', () => gulp.src(paths.src)
  .pipe(ts())
  .pipe(babel())
  .pipe(gulp.dest('dist'))
);

gulp.task('build:types', () => gulp.src(paths.src)
  .pipe(dts()).dts
  .pipe(gulp.dest('dist'))
);

gulp.task('build', gulp.parallel('build:cjs', 'build:types'));

gulp.task('watch', () => gulp.watch([paths.src, ...paths.deps], { ignoreInitial: false },
  gulp.parallel('build:cjs', 'build:types')
));