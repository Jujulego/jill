import { Logger, withLabel } from '@jujulego/logger';
import { type ContainerModule, inject, type interfaces as int } from 'inversify';

import { CONFIG } from '@/src/config/config-loader.ts';
import { type IConfig } from '@/src/config/types.ts';
import { container } from '@/src/inversify.config.ts';
import { dynamicImport } from '@/src/utils/import.ts';

import { getModule } from './module.ts';
import { Service } from './service.ts';

// Class
@Service()
export class PluginLoaderService {
  // Attributes
  private readonly _logger: Logger;

  // Constructor
  constructor(
    @inject(CONFIG)
    private readonly _config: IConfig,
    @inject(Logger)
    logger: Logger,
  ) {
    this._logger = logger.child(withLabel('plugin'));
  }

  // Methods
  private async _importPlugin(filepath: string): Promise<ContainerModule> {
    this._logger.verbose`Loading plugin ${filepath}`;

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

  async loadPlugins(ctn: int.Container = container): Promise<void> {
    if (!this._config.plugins) return;

    for (const path of this._config.plugins) {
      const plugin = await this._importPlugin(path);
      ctn.load(plugin);
    }
  }
}
