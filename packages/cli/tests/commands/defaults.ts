import { Arguments } from 'yargs';

import { CommonArgs } from '../../src/wrapper';

// Defaults
export const defaultOptions: Arguments<CommonArgs> = {
  project: '.',
  verbose: 0,
  '$0': 'jill',
  _: [],
  '--': []
};
