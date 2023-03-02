import { type ContainerModule, inject } from 'inversify';

import { CONFIG } from '@/src/config/config-loader.js';
import { type IConfig } from '@/src/config/types.js';
import { Logger } from '@/src/commons/logger.service.js';
import { container } from '@/src/inversify.config.js';
import { dynamicImport } from '@/src/utils/import.js';

import { getModule } from './module.js';
import { Service } from './service.js';

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
  private async _importPlugin(filepath: string): Promise<ContainerModule> {
    this._logger.verbose(`Loading plugin ${filepath}`);

    // Load plugin
    let plugin = await dynamicImport(filepath);

    while (plugin && typeof plugin === 'object' && 'default' in plugin) {
      plugin = plugin.default;
    }

    if (!plugin) {
      throw new Error(`Invalid plugin ${filepath}: no plugin class found`);
    }

    // Load module from plugin
    const module = getModule(plugin);

    if (!module) {
      throw new Error(`Invalid plugin ${filepath}: invalid plugin class`);
    }

    return module;
  }

  async loadPlugins(): Promise<void> {
    if (!this._config.plugins) return;

    for (const path of this._config.plugins) {
      const plugin = await this._importPlugin(path);
      container.load(plugin);
    }
  }
}
