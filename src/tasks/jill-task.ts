import { Task, type TaskOptions } from '@jujulego/tasks';
import { type ArgumentsCamelCase } from 'yargs';

import { type ICommand } from '@/src/modules/command';

// Class
export class JillTask extends Task {
  // Constructor
  constructor(
    readonly name: string,
    readonly command: ICommand,
    readonly args: ArgumentsCamelCase<unknown>,
    opts: TaskOptions = {}
  ) {
    super({}, opts);
  }

  // Methods
  protected async _start() {
    this.command.handler(this.args);
  }

  async _stop() {
    return;
  }
}
