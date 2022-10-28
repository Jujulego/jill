import yargs from 'yargs';

import { container, GLOBAL_CONFIG, globalConfig } from '../../src';
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
