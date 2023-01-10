import { ContainerModule, id, type interfaces as int } from 'inversify';

import { type Class, type Type } from '@/src/types';

import { type ICommand } from './command';
import { getRegistry, setModule } from './module';

// Types
export interface IPluginOpts {
  readonly name?: string;
  readonly commands: Type<ICommand>[];
}

export class PluginModule extends ContainerModule implements IPluginOpts {
  // Attributes
  readonly id = id();

  // Constructor
  constructor(
    readonly name: string,
    readonly commands: Type<ICommand>[],
  ) {
    super((...args: Parameters<int.ContainerModuleCallBack>) => {
      for (const command of this.commands) {
        const registry = getRegistry(command);
        registry(...args);
      }
    });
  }
}

// Decorator
export function Plugin(opts: IPluginOpts) {
  return (target: Class) => {
    const name = opts.name ?? target.name;
    const module = new PluginModule(name, opts.commands);

    setModule(target, module);
  };
}
