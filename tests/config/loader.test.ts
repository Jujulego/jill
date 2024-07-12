import { Logger, LogLevel } from '@jujulego/logger';
import { ValidateFunction } from 'ajv';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import path from 'node:path';

import '@/src/commons/logger.service.js';
import { configLoader } from '@/src/config/config-loader.js';
import { type IConfig, type IConfigExplorer } from '@/src/config/types.js';
import { CONFIG_EXPLORER, CONFIG_VALIDATOR } from '@/src/config/utils.js';
import { container } from '@/src/inversify.config.js';
import { ExitException } from '@/src/utils/exit.js';
import { LogGateway } from '@/src/commons/logger/log.gateway.js';

// Setup
let logger: Logger;
let logGateway: LogGateway;

beforeEach(() => {
  container.snapshot();

  logger = container.get(Logger);
  logGateway = container.get(LogGateway);
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
    } as unknown as IConfigExplorer;
    const validator = vi.fn().mockReturnValue(true) as unknown as ValidateFunction<IConfig>;

    container.rebind(CONFIG_EXPLORER).toConstantValue(explorer);
    container.rebind(CONFIG_VALIDATOR).toConstantValue(validator);
    
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
    } as unknown as IConfigExplorer;

    const validator = vi.fn().mockReturnValue(true) as unknown as ValidateFunction<IConfig>;

    container.rebind(CONFIG_EXPLORER).toConstantValue(explorer);
    container.rebind(CONFIG_VALIDATOR).toConstantValue(validator);

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
    } as unknown as IConfigExplorer;

    const validator = vi.fn().mockReturnValue(true) as unknown as ValidateFunction<IConfig>;

    container.rebind(CONFIG_EXPLORER).toConstantValue(explorer);
    container.rebind(CONFIG_VALIDATOR).toConstantValue(validator);

    // Load config
    await expect(configLoader())
      .resolves.toBe(config);

    expect(logGateway.level).toBe(LogLevel.verbose);
  });

  it('should log error and exit', async () => {
    // Mock explorer
    const explorer = {
      search: vi.fn().mockResolvedValue({
        config: {},
        filepath: '/test/.jillrc.yml',
      }),
    } as unknown as IConfigExplorer;

    const validator = vi.fn().mockReturnValue(false) as unknown as ValidateFunction<IConfig>;
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

    container.rebind(CONFIG_EXPLORER).toConstantValue(explorer);
    container.rebind(CONFIG_VALIDATOR).toConstantValue(validator);

    // Spy logs
    const spy = vi.fn();
    logger.subscribe(spy);

    // Load config
    await expect(configLoader())
      .rejects.toEqual(new ExitException(1));

    expect(spy).toHaveBeenCalledWith({
      timestamp: expect.any(String),
      level: LogLevel.error,
      label: 'config',
      message: 'Errors in config file:\n- config/toto must be real',
    });
  });
});
