import { type Task } from '@jujulego/tasks';
import { inject, injectable, type interfaces as int } from 'inversify';
import yargs from 'yargs';

import { ContextService } from '@/src/commons/context.service';
import { Logger } from '@/src/commons/logger.service';
import { applyConfigOptions } from '@/src/config/config-options';
import { CURRENT } from '@/src/constants';
import { CorePlugin } from '@/src/core.plugin';
import { container, lazyInjectNamed } from '@/src/inversify.config';
import { buildCommandModule, COMMAND, COMMAND_MODULE } from '@/src/modules/command';
import { getModule } from '@/src/modules/module';
import { PluginLoaderService } from '@/src/modules/plugin-loader.service';

// @ts-ignore: Outside of typescript's rootDir in build
import pkg from '../package.json';
import { TaskCommand } from '@/src/modules/task-command';
import { JillTask } from '@/src/tasks/jill-task';

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
  }

  // Methods
  private _prepareParser(commands: yargs.CommandModule[]): yargs.Argv {
    applyConfigOptions(this.parser);

    return this.parser
      .command(commands)
      .demandCommand()
      .recommendCommands()
      .strict()
      .fail(false);
  }

  async run(argv: string | readonly string[]): Promise<void> {
    this.context.reset({ application: this });

    // Load plugins
    this.logger.child({ label: 'plugin' }).verbose('Loading plugin <core>');
    this.container.load(getModule(CorePlugin, true));

    await this.plugins.loadPlugins(this.container);

    // Parse command
    const commands = await this.container.getAllAsync(COMMAND_MODULE);

    await this._prepareParser(commands).parse(argv);
  }

  async getTasks(argv: string[]): Promise<Task[]> {
    // Load plugins
    this.logger.child({ label: 'plugin' }).verbose('Loading plugin <core>');
    this.container.load(getModule(CorePlugin, true));

    await this.plugins.loadPlugins(this.container);

    // Prepare commands
    const commands = await this.container.getAllAsync(COMMAND);

    return new Promise<Task[]>((resolve, reject) => {
      const modules: yargs.CommandModule[] = [];

      for (const [cmd, opts] of commands) {
        const mod = buildCommandModule(cmd, opts);

        mod.handler = async (args) => {
          if (cmd instanceof TaskCommand) {
            const tasks: Task[] = [];

            for await (const tsk of cmd.prepare(args)) {
              tasks.push(tsk);
            }

            resolve(tasks);
          } else {
            resolve([new JillTask(`jill ${argv.join(' ')}`, cmd, args)]);
          }
        };

        modules.push(mod);
      }

      // Parse command
      this._prepareParser(modules)
        .parseAsync(argv)
        .catch(reject);
    });
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
