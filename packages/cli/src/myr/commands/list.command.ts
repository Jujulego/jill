import { TaskStatus } from '@jujulego/jill-core';
import { Task } from '@jujulego/jill-myr';
import chalk from 'chalk';
import path from 'path';

import { ProjectCommand } from '../../commands/project.command';
import { MyrClient } from '../myr-client';
import { CliList } from '../../utils/cli-list';

// Types
export type Attribute = 'identifier' | 'status' | 'cwd' | 'command' | 'cmd' | 'args';
export type Data = Partial<Record<Attribute, string>>;

type Extractor<T> = (tsk: Task) => T;

// Constants
const COLORED_STATUS: Record<TaskStatus, string> = {
  blocked: chalk.yellow('blocked'),
  ready: chalk.blue('ready'),
  running: 'running',
  failed: chalk.red('failed'),
  done: chalk.green('done')
};

const LONG_ATTRIBUTES: Attribute[] = ['identifier', 'status', 'cwd', 'command'];
const DEFAULT_ATTRIBUTES: Attribute[] = ['identifier', 'command'];

const EXTRACTORS: Record<Attribute, Extractor<string | undefined>> = {
  identifier: tsk => chalk.grey(tsk.id),
  status: tsk => COLORED_STATUS[tsk.status],
  cwd: tsk => path.relative(process.cwd(), tsk.cwd) || '.',
  command: tsk => `${tsk.cmd} ${tsk.args.join(' ')}`,
  cmd: tsk => tsk.cmd,
  args: tsk => tsk.args.join(' ')
};

// Command
export class ListCommand extends ProjectCommand {
  // Methods
  private buildExtractor(attrs: Attribute[]): Extractor<Data> {
    return (tsk) => {
      const data: Data = {};

      for (const attr of attrs) {
        data[attr] = EXTRACTORS[attr](tsk);
      }

      return data;
    };
  }

  protected async run(): Promise<number | void> {
    // Define command
    const argv = await this.define(['list', 'ls'], 'List myr tasks', y => y
      .options({
        all: {
          alias: 'a',
          type: 'boolean',
          group: 'Filters:',
          desc: 'Show all tasks (by default list shows only running tasks)',
        },
        attrs: {
          type: 'array',
          choices: ['identifier', 'status', 'cwd' ,'command', 'cmd', 'args'],
          group: 'Format:',
          desc: 'Select printed attributes'
        },
        headers: {
          type: 'boolean',
          group: 'Format:',
          desc: 'Prints columns headers'
        },
        long: {
          alias: 'l',
          type: 'boolean',
          conflicts: 'attrs',
          group: 'Format:',
          desc: 'Prints more data on each tasks',
        },
      })
    );

    // Spawn task
    this.spinner.start('Connecting to myr');
    const client = new MyrClient(this.project);

    this.spinner.start('Requesting tasks');
    const tasks = await client.tasks();

    this.spinner.stop();

    // Build data
    let attrs = argv.attrs as Attribute[] || DEFAULT_ATTRIBUTES;

    if (!argv.attrs && argv.long) {
      attrs = LONG_ATTRIBUTES;
    }

    const data = tasks
      .filter(tsk => argv.all || tsk.status === 'running')
      .map(tsk => this.buildExtractor(attrs)(tsk));

    // Print data
    const list = new CliList();

    if (argv.headers ?? (attrs.length > 1)) {
      list.setHeaders(attrs);
    }

    for (const d of data) {
      list.add(attrs.map(attr => d[attr] || ''));
    }

    for (const d of list.lines()) {
      console.log(d);
    }
  }
}