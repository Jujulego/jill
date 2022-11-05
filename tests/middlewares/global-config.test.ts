import os from 'node:os';
import yargs from 'yargs';

import { globalConfig } from '../../src/middlewares';
import { container, GLOBAL_CONFIG } from '../../src/services';
import { applyMiddlewares } from '../../src/utils';

// Setup
let parser: yargs.Argv;

beforeAll(() => {
  // Removes config bound in setup
  container.unbind(GLOBAL_CONFIG);
});

beforeEach(() => {
  container.snapshot();

  parser = applyMiddlewares(yargs(), [globalConfig]);
});

afterEach(() => {
  container.restore();
});

// Tests
describe('globalConfig', () => {
  it('should set GLOBAL_CONFIG with defaults', () => {
    parser.parse(''); // <= no args

    expect(container.isBound(GLOBAL_CONFIG)).toBe(true);
    expect(container.get(GLOBAL_CONFIG)).toEqual({
      jobs: os.cpus().length - 1,
      verbose: 0,
    });
  });

  it('should set GLOBAL_CONFIG with given options', () => {
    parser.parse('-v --jobs 5');

    expect(container.isBound(GLOBAL_CONFIG)).toBe(true);
    expect(container.get(GLOBAL_CONFIG)).toEqual({
      verbose: 1,
      jobs: 5
    });
  });
});
