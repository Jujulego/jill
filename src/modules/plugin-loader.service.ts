import { type ContainerModule, inject } from 'inversify';

import { CONFIG } from '@/src/config/config-loader';
import { type IConfig } from '@/src/config/types';
import { Logger } from '@/src/commons/logger.service';
import { container } from '@/src/inversify.config';
import { dynamicImport } from '@/src/utils/import';

import { getModule } from './module';
import { Service } from './service';

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

    let plugin = await dynamicImport(filepath);
    while ('default' in plugin) {
      plugin = plugin.default;
    }

    const module = getModule(plugin);

    if (!module) {
      throw new Error(`Invalid plugin ${filepath}`);
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
