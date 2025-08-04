import { ConfigExplorer } from '@/src/config/config-explorer.js';
import { ConfigService } from '@/src/config/config.service.js';
import schema from '@/src/config/schema.json' with { type: 'json' };
import { globalScope$, inject$ } from '@kyrielle/injector';
import { type Logger, logger$ } from '@kyrielle/logger';
import Ajv, { type ValidateFunction } from 'ajv';
import { type PublicExplorer } from 'cosmiconfig';
import os from 'node:os';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mocks
vi.mock('ajv');

// Setup
let logger: Logger;
let configExplorer: PublicExplorer;
let configService: ConfigService;

beforeEach(() => {
  logger = logger$();
  configService = new ConfigService(logger);
  configExplorer = inject$(ConfigExplorer);

  vi.mocked(Ajv.prototype.compile)
    .mockReturnValue((() => true) as unknown as ValidateFunction);
});

afterEach(() => {
  globalScope$().clear();
});

// Test
describe('ConfigService.searchConfig', () => {
  beforeEach(() => {
    vi.spyOn(configExplorer, 'search').mockResolvedValue({
      filepath: '/test/.jillrc.yml',
      config: {
        hook: true,
      },
    });
  });

  it('should search for config using explorer', async () => {
    const result = {
      hook: true,
      jobs: os.cpus().length - 1,
    };

    await expect(configService.searchConfig()).resolves.toStrictEqual(result);

    expect(configService.config).toStrictEqual(result);
    expect(configService.state).toStrictEqual({
      filepath: '/test/.jillrc.yml',
      config: result,
    });

    expect(configExplorer.search).toHaveBeenCalled();
    expect(Ajv.prototype.compile).toHaveBeenCalledWith(schema);
  });

  it('should throw error if no config was loaded', async () => {
    vi.mocked(configExplorer.search).mockResolvedValue(null);

    await expect(configService.searchConfig()).rejects.toEqual(new Error('No config file found'));
  });

  it('should throw error if config is invalid', async () => {
    const validator = Object.assign(() => false, {
      errors: [],
    }) as unknown as ValidateFunction;

    vi.mocked(Ajv.prototype.compile)
      .mockReturnValue(validator);

    await expect(configService.searchConfig()).rejects.toEqual(new Error('Error in config file'));
  });
});

describe('ConfigService.loadConfig', () => {
  beforeEach(() => {
    vi.spyOn(configExplorer, 'load').mockResolvedValue({
      filepath: '/test/.jillrc.yml',
      config: {
        hook: true,
      },
    });
  });

  it('should load given config file', async () => {
    const result = {
      hook: true,
      jobs: os.cpus().length - 1,
    };

    await expect(configService.loadConfig('/test/.jillrc.yml')).resolves.toStrictEqual(result);

    expect(configService.config).toStrictEqual(result);
    expect(configService.state).toStrictEqual({
      filepath: '/test/.jillrc.yml',
      config: result,
    });

    expect(configExplorer.load).toHaveBeenCalledWith('/test/.jillrc.yml');
    expect(Ajv.prototype.compile).toHaveBeenCalledWith(schema);
  });

  it('should throw error if config file was not loaded', async () => {
    vi.mocked(configExplorer.load).mockResolvedValue(null);

    await expect(configService.loadConfig('/test/.jillrc.yml'))
      .rejects.toEqual(new Error('Config file not found'));
  });

  it('should throw error if config is invalid', async () => {
    const validator = Object.assign(() => false, {
      errors: [],
    }) as unknown as ValidateFunction;

    vi.mocked(Ajv.prototype.compile)
      .mockReturnValue(validator);

    await expect(configService.loadConfig('/test/.jillrc.yml'))
      .rejects.toEqual(new Error('Error in config file'));
  });
});
