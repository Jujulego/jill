import { qjson } from '@jujulego/quick-tag';
import { asyncScope$, inject$ } from '@kyrielle/injector';
import { withLabel } from '@kyrielle/logger';
import Ajv from 'ajv';
import { type Observable, type Ref, var$ } from 'kyrielle';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { CWD, LOGGER } from '../tokens.js';
import { ConfigExplorer } from './config-explorer.js';
import schema from './schema.json' with { type: 'json' };
import type { Config } from './types';

/**
 * Loads and make configuration accessible
 */
export class ConfigService {
  // Attributes
  private _filepath?: string;

  private readonly _config = var$<Config>();
  private readonly _logger = inject$(LOGGER).child(withLabel('config'));
  private readonly _explorer = inject$(ConfigExplorer);

  // Constructor
  constructor(state: ConfigState = {}) {
    if (state.filepath) {
      this._filepath = state.filepath;
    }

    if (state.config) {
      this._config.mutate(state.config);
    }
  }

  // Methods
  private _validateConfig(config: unknown): Config {
    // Validate config
    const ajv = new Ajv({
      allErrors: true,
      useDefaults: true,
      logger: this._logger.child(withLabel('ajv')),
      strict: process.env.NODE_ENV === 'development' ? 'log' : true,
    });

    const validator = ajv.compile<Config>(schema);

    if (!validator(config)) {
      const errors = ajv.errorsText(validator.errors, { separator: '\n- ', dataVar: 'config' });

      this._logger.error(`errors in config file:\n- ${errors}`);
      throw new Error('Error in config file');
    }

    // Correct jobs value
    if (config.jobs <= 0) {
      Object.assign(config, { jobs: Math.max(os.availableParallelism() - 1, 1) });
    }

    this._logger.debug`loaded config:\n${qjson(config, { pretty: true })}`;

    return config;
  }

  async searchConfig(): Promise<void> {
    const loaded = await this._explorer.search(inject$(CWD, asyncScope$()));

    if (loaded) {
      this._logger.verbose`loaded file ${loaded.filepath}`;
      this._filepath = loaded.filepath;
    }

    const config = this._validateConfig(loaded?.config ?? {});
    this._config.mutate(config);
  }

  async loadConfig(filepath: string): Promise<void> {
    const loaded = await this._explorer.load(filepath);

    if (loaded) {
      this._logger.verbose`loaded file ${loaded.filepath}`;
      this._filepath = loaded.filepath;
    }

    const config = this._validateConfig(loaded?.config ?? {});
    this._config.mutate(config);
  }

  // Attributes
  get baseDir(): string {
    return this._filepath ? path.dirname(this._filepath) : inject$(CWD, asyncScope$());
  }

  get config$(): Ref<Config | undefined> & Observable<Config> {
    return this._config;
  }

  get config(): Config | undefined {
    return this._config.defer();
  }

  get state(): ConfigState {
    return {
      filepath: this._filepath,
      config: this.config
    };
  }
}

// Types
export interface ConfigState {
  readonly filepath?: string | undefined;
  readonly config?: Config | undefined;
}
