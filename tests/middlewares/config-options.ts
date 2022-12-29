import os from 'node:os';
import yargs from 'yargs';

import { configOptions } from '@/src/middlewares';
import { CONFIG, container, SERVICES_CONFIG } from '@/src/services';
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
  it('should set SERVICES_CONFIG with defaults', () => {
    parser.parse(''); // <= no args

    expect(container.isBound(SERVICES_CONFIG)).toBe(true);
    expect(container.get(SERVICES_CONFIG)).toEqual({
      jobs: os.cpus().length - 1,
      verbose: 0,
    });
  });

  it('should set SERVICES_CONFIG with loaded configuration', async () => {
    container.rebind(CONFIG).toConstantValue({ verbose: 2, jobs: 8 });

    parser = await applyMiddlewares(yargs(), [configOptions]);
    parser.parse(''); // <= no args

    expect(container.isBound(SERVICES_CONFIG)).toBe(true);
    expect(container.get(SERVICES_CONFIG)).toEqual({
      jobs: 8,
      verbose: 2,
    });
  });

  it('should set SERVICES_CONFIG with given options', () => {
    parser.parse('-v --jobs 5');

    expect(container.isBound(SERVICES_CONFIG)).toBe(true);
    expect(container.get(SERVICES_CONFIG)).toEqual({
      verbose: 1,
      jobs: 5
    });
  });
});
