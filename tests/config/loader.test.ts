import path from 'node:path';

import { configLoader } from '@/src/config/loader';
import { CONFIG_EXPLORER } from '@/src/config/explorer';
import { Config } from '@/src/config/types';
import { CONFIG_VALIDATOR } from '@/src/config/validator';
import { container } from '@/src/inversify.config';
import { Logger } from '@/src/logger.service';

// Setup
let logger: Logger;

beforeEach(() => {
  container.snapshot();

  logger = container.get(Logger);
});

afterEach(() => {
  container.restore();
});

// Tests
describe('configLoader', () => {
  it('should validate loaded config', async () => {
    // Mock explorer
    const config: Config = {};
    const explorer = {
      search: jest.fn().mockResolvedValue({
        config,
        filepath: '/test/.jillrc.yml',
      }),
    };
    const validator = jest.fn().mockReturnValue(true);

    container.rebind(CONFIG_EXPLORER).toConstantValue(explorer as any);
    container.rebind(CONFIG_VALIDATOR).toConstantValue(validator as any);
    
    // Load config
    await expect(configLoader())
      .resolves.toBe(config);

    expect(explorer.search).toHaveBeenCalled();
    expect(validator).toHaveBeenCalledWith(config);
  });

  it('should compute path based on config file', async () => {
    // Mock explorer
    const config: Config = {
      plugins: ['plugin.js']
    };

    const explorer = {
      search: jest.fn().mockResolvedValue({
        config,
        filepath: '/test/.jillrc.yml',
      }),
    };

    const validator = jest.fn().mockReturnValue(true);

    container.rebind(CONFIG_EXPLORER).toConstantValue(explorer as any);
    container.rebind(CONFIG_VALIDATOR).toConstantValue(validator as any);

    // Load config
    await expect(configLoader())
      .resolves.toEqual({
        plugins: [path.resolve('/test/plugin.js')]
      });
  });

  it('should update logger level', async () => {
    // Mock explorer
    const config: Config = {
      verbose: 'verbose',
    };

    const explorer = {
      search: jest.fn().mockResolvedValue({
        config,
        filepath: '/test/.jillrc.yml',
      }),
    };

    const validator = jest.fn().mockReturnValue(true);

    container.rebind(CONFIG_EXPLORER).toConstantValue(explorer as any);
    container.rebind(CONFIG_VALIDATOR).toConstantValue(validator as any);

    // Load config
    await expect(configLoader())
      .resolves.toBe(config);

    expect(logger.level).toBe('verbose');
  });

  it('should log error and exit', async () => {
    // Mock explorer
    const explorer = {
      search: jest.fn().mockResolvedValue({
        config: {},
        filepath: '/test/.jillrc.yml',
      }),
    };

    const validator = jest.fn().mockReturnValue(false);
    Object.assign(validator, {
      errors: [
        {
          instancePath: '/toto',
          schemaPath: '#/properties/toto/type',
          keyword: 'type',
          params: {
            type: 'number',
          },
          message: 'must be real'
        }
      ]
    });

    container.rebind(CONFIG_EXPLORER).toConstantValue(explorer as any);
    container.rebind(CONFIG_VALIDATOR).toConstantValue(validator as any);

    jest.spyOn(logger, 'error').mockImplementation();
    jest.spyOn(process, 'exit').mockImplementation();

    // Load config
    await expect(configLoader())
      .resolves.toEqual({});

    expect(logger.error).toHaveBeenCalledWith(
      'Errors in config file:\n' +
      '- config/toto must be real'
    );
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
