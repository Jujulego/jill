import rimraf from 'rimraf';

import { REPORTS_DIR } from './utils';

module.exports = async function () {
  await new Promise<void>((resolve, reject) => {
    rimraf(REPORTS_DIR, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};