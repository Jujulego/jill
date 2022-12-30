import { inject, injectable } from 'inversify';
import { type Argv } from 'yargs';

import { assertPlugin, type Plugin } from '../utils';

import { type Config, CONFIG } from './config.service';
import { container } from './inversify.config';
import { Logger } from './logger.service';

// Class
@injectable()
export class PluginLoaderService {
  // Attributes
  private readonly _logger: Logger;

  // Constructor
  constructor(
    @inject(CONFIG) private readonly _config: Config,
    @inject(Logger) logger: Logger,
  ) {
    this._logger = logger.child({ label: 'plugin' });
  }

  // Methods
  private async _importPlugin(path: string): Promise<Plugin> {
    this._logger.verbose(`Loading plugin ${path}`);
    const { default: module } = await import(/* webpackIgnore: true */ process.platform === 'win32' ? `file://${path}` : path);
    assertPlugin(module, path);

    return module;
  }

  async loadPlugins(parser: Argv): Promise<void> {
    if (!this._config.plugins) return;

    for (const path of this._config.plugins) {
      const plugin = await this._importPlugin(path);
      await plugin.builder(parser);
    }
  }
}

container.bind(PluginLoaderService).toSelf().inSingletonScope();
