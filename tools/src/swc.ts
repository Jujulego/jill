import { Options } from '@swc/core';

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const swc: (opts: Options) => NodeJS.ReadWriteStream = require('gulp-swc');
