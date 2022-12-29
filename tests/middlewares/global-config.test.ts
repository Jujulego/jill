import os from 'node:os';
import yargs from 'yargs';

import { configOptions } from '@/src/middlewares';
import { container, SERVICES_CONFIG } from '@/src/services';
import { applyMiddlewares } from '@/src/utils';

// Setup
let parser: yargs.Argv;

beforeAll(() => {
  // Removes config bound in setup
  container.unbind(SERVICES_CONFIG);
});

beforeEach(async () => {
  container.snapshot();

  parser = await applyMiddlewares(yargs(), [configOptions]);
});

afterEach(() => {
  container.restore();
});

// Tests
describe('globalConfig', () => {
  it('should set GLOBAL_CONFIG with defaults', () => {
    parser.parse(''); // <= no args

    expect(container.isBound(SERVICES_CONFIG)).toBe(true);
    expect(container.get(SERVICES_CONFIG)).toEqual({
      jobs: os.cpus().length - 1,
      verbose: 0,
    });
  });

  it('should set GLOBAL_CONFIG with given options', () => {
    parser.parse('-v --jobs 5');

    expect(container.isBound(SERVICES_CONFIG)).toBe(true);
    expect(container.get(SERVICES_CONFIG)).toEqual({
      verbose: 1,
      jobs: 5
    });
  });
});
