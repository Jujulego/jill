import { vi } from 'vitest';
import path from 'node:path';

import { configLoader } from '@/src/config/config-loader';
import { type IConfig } from '@/src/config/types';
import { CONFIG_EXPLORER, CONFIG_VALIDATOR } from '@/src/config/utils';
import { container } from '@/src/inversify.config';
import { Logger } from '@/src/commons/logger.service';
import { ExitException } from '@/src/utils/exit';

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
    const config: IConfig = {};
    const explorer = {
      search: vi.fn().mockResolvedValue({
        config,
        filepath: '/test/.jillrc.yml',
      }),
    };
    const validator = vi.fn().mockReturnValue(true);

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
    const config: IConfig = {
      plugins: ['plugin.js']
    };

    const explorer = {
      search: vi.fn().mockResolvedValue({
        config,
        filepath: '/test/.jillrc.yml',
      }),
    };

    const validator = vi.fn().mockReturnValue(true);

    container.rebind(CONFIG_EXPLORER).toConstantValue(explorer as any);
    container.rebind(CONFIG_VALIDATOR).toConstantValue(validator as any);

    // Load config
    await expect(configLoader())
      .resolves.toMatchObject({
        plugins: [path.resolve('/test/plugin.js')]
      });
  });

  it('should update logger level', async () => {
    // Mock explorer
    const config: IConfig = {
      verbose: 'verbose',
    };

    const explorer = {
      search: vi.fn().mockResolvedValue({
        config,
        filepath: '/test/.jillrc.yml',
      }),
    };

    const validator = vi.fn().mockReturnValue(true);

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
      search: vi.fn().mockResolvedValue({
        config: {},
        filepath: '/test/.jillrc.yml',
      }),
    };

    const validator = vi.fn().mockReturnValue(false);
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

    vi.spyOn(logger.winston, 'error').mockImplementation();

    // Load config
    await expect(configLoader())
      .rejects.toEqual(new ExitException(1));

    expect(logger.winston.error).toHaveBeenCalledWith(
      'Errors in config file:\n' +
      '- config/toto must be real',
      undefined
    );
  });
});
