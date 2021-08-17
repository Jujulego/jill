import cp from 'child_process';
import path from 'path';
import rimraf from 'rimraf';

import { REPORTS_DIR, ROOT } from './utils';

const C8_ARGS = [
  'report',
  '--reporter', 'lcov',
  '--reporter', 'text',
  '--reports-dir', REPORTS_DIR,
  '--include', '**/packages/**',
  '--relative', ROOT
];

module.exports = async function () {
  await new Promise<void>((resolve, reject) => {
    const proc = cp.spawn('c8', C8_ARGS, {
      cwd: ROOT,
      shell: true,
      stdio: 'inherit'
    });

    proc.on('close', (code) => {
      if (code) {
        reject(`c8 failed with code ${code}`);
      } else {
        resolve();
      }
    });
  });

  await new Promise<void>((resolve, reject) => {
    rimraf(path.join(REPORTS_DIR, 'tmp'), (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};