import { inject, injectable, type interfaces as int } from 'inversify';
import yargs from 'yargs';

import { ContextService } from '@/src/commons/context.service';
import { Logger } from '@/src/commons/logger.service';
import { applyConfigOptions } from '@/src/config/config-options';
import { CURRENT } from '@/src/constants';
import { CorePlugin } from '@/src/core.plugin';
import { container, lazyInjectNamed } from '@/src/inversify.config';
import { COMMAND } from '@/src/modules/command';
import { getModule } from '@/src/modules/module';
import { PluginLoaderService } from '@/src/modules/plugin-loader.service';

// @ts-ignore: Outside of typescript's rootDir in build
import pkg from '../package.json';

// Application
@injectable()
export class JillApplication {
  // Attributes
  readonly container: int.Container;
  readonly parser: yargs.Argv;

  // Constructor
  constructor(
    @inject(ContextService)
    private readonly context: ContextService,
    @inject(PluginLoaderService)
    private readonly plugins: PluginLoaderService,
    @inject(Logger)
    private readonly logger: Logger,
  ) {
    // Create container
    this.container = container.createChild();

    // Create parser
    this.parser = yargs()
      .scriptName('jill')
      .completion('completion', 'Generate bash completion script')
      .help('help', 'Show help for a command')
      .version('version', 'Show version', pkg.version)
      .wrap(process.stdout.columns);

    applyConfigOptions(this.parser);
  }

  // Methods
  async run(argv: string | readonly string[]): Promise<void> {
    this.context.reset({ application: this });

    // Load plugins
    this.logger.child({ label: 'plugin' }).verbose('Loading plugin <core>');
    this.container.load(getModule(CorePlugin, true));

    await this.plugins.loadPlugins(this.container);

    // Parse command
    await this.parser
      .command(await this.container.getAllAsync(COMMAND))
      .demandCommand()
      .recommendCommands()
      .strict()
      .fail(false)
      .parse(argv);
  }
}

container.bind(JillApplication)
  .toSelf()
  .inTransientScope()
  .whenTargetIsDefault();

// Lazy injection
export function LazyCurrentApplication() {
  return lazyInjectNamed(JillApplication, CURRENT);
}

container.bind(JillApplication)
  .toDynamicValue(({ container }) => {
    const ctx = container.get(ContextService);
    const app = ctx.application;

    if (!app) {
      throw new Error('Cannot inject current application, it not yet defined');
    }

    return app;
  })
  .whenTargetNamed(CURRENT);
