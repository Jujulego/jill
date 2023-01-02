import os from 'node:os';
import yargs from 'yargs';

import { configOptions } from '@/src/middlewares/config-options';
import { CONFIG } from '@/src/services/config/loader';
import { container, SERVICES_CONFIG } from '@/src/services/inversify.config';
import { Logger } from '@/src/services/logger.service';
import { applyMiddlewares } from '@/src/utils/yargs';

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
    });
  });

  it('should set SERVICES_CONFIG with loaded configuration', async () => {
    container.rebind(CONFIG).toConstantValue({ jobs: 8 });

    parser = await applyMiddlewares(yargs(), [configOptions]);
    parser.parse(''); // <= no args

    expect(container.isBound(SERVICES_CONFIG)).toBe(true);
    expect(container.get(SERVICES_CONFIG)).toEqual({
      jobs: 8,
    });
  });

  it('should set SERVICES_CONFIG with given options', () => {
    parser.parse('--jobs 5');

    expect(container.isBound(SERVICES_CONFIG)).toBe(true);
    expect(container.get(SERVICES_CONFIG)).toEqual({
      jobs: 5
    });
  });

  it('should set logger level to verbose', () => {
    parser.parse('-v');

    expect(container.isBound(SERVICES_CONFIG)).toBe(true);
    expect(container.get(Logger).level).toBe('verbose');
  });

  it('should set logger level to debug', () => {
    parser.parse('-vv');

    expect(container.isBound(SERVICES_CONFIG)).toBe(true);
    expect(container.get(Logger).level).toBe('debug');
  });
});
