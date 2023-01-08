import { inject } from 'inversify';
import { type Argv } from 'yargs';

import { CONFIG } from '@/src/config/config-loader';
import { type IConfig } from '@/src/config/types';
import { Logger } from '@/src/commons/logger.service';
import { dynamicImport } from '@/src/utils/import';

import { type Plugin } from './types';
import { assertPlugin } from './utils';
import { Service } from '@/src/modules/service';

// Class
@Service()
export class PluginLoaderService {
  // Attributes
  private readonly _logger: Logger;

  // Constructor
  constructor(
    @inject(CONFIG) private readonly _config: IConfig,
    @inject(Logger) logger: Logger,
  ) {
    this._logger = logger.child({ label: 'plugin' });
  }

  // Methods
  private async _importPlugin(filepath: string): Promise<Plugin> {
    this._logger.verbose(`Loading plugin ${filepath}`);

    let plugin = await dynamicImport(filepath);
    while ('default' in plugin) {
      plugin = plugin.default;
    }

    assertPlugin(plugin, filepath);

    return plugin;
  }

  async loadPlugins(parser: Argv): Promise<void> {
    if (!this._config.plugins) return;

    for (const path of this._config.plugins) {
      const plugin = await this._importPlugin(path);
      await plugin.builder(parser);
    }
  }
}
