import { Arguments, Builder, CliList, ProjectArgs, ProjectCommand } from '@jujulego/jill-common';
import { TaskStatus } from '@jujulego/jill-core';
import chalk from 'chalk';
import path from 'path';

import { MyrClient } from '../myr-client';
import { Task } from '../server';

// Types
export type Attribute = 'identifier' | 'status' | 'cwd' | 'command' | 'cmd' | 'args';
export type Data = Partial<Record<Attribute, string>>;

type Extractor<T> = (tsk: Task) => T;

export interface ListArgs extends ProjectArgs {
  all: boolean | undefined;

  attrs: Attribute[];
  headers: boolean | undefined;
  long: boolean | undefined;
  json: boolean | undefined;
}

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
export class ListCommand extends ProjectCommand<ListArgs> {
  // Attributes
  readonly name = ['list', 'ls'];
  readonly description = 'List myr tasks';

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

  protected define<U>(builder: Builder<U>): Builder<U & ListArgs> {
    return super.define(y => builder(y)
      .option('all', {
        alias: 'a',
        type: 'boolean',
        group: 'Filters:',
        desc: 'Show all tasks (by default list shows only running tasks)',
      })
      .option('attrs', {
        type: 'array',
        choices: ['identifier', 'status', 'cwd' ,'command', 'cmd', 'args'],
        default: [] as Attribute[],
        group: 'Format:',
        desc: 'Select printed attributes'
      })
      .option('headers', {
        type: 'boolean',
        group: 'Format:',
        desc: 'Prints columns headers'
      })
      .option('long', {
        alias: 'l',
        type: 'boolean',
        group: 'Format:',
        desc: 'Prints name, version and root of all workspaces',
      })
      .option('json', {
        type: 'boolean',
        group: 'Format:',
        desc: 'Prints data as a JSON array',
      })
    );
  }

  protected async run(args: Arguments<ListArgs>): Promise<void> {
    await super.run(args);

    // Spawn task
    this.spinner.start('Connecting to myr');
    const client = new MyrClient(this.project);

    this.spinner.start('Requesting tasks');
    const tasks = await client.tasks();

    this.spinner.stop();

    // Build data
    let attrs = args.attrs;

    if (args.attrs.length === 0) {
      if (args.long) {
        attrs = LONG_ATTRIBUTES;
      } else {
        attrs = DEFAULT_ATTRIBUTES;
      }
    }

    const data = tasks
      .filter(tsk => args.all || tsk.status === 'running')
      .map(tsk => this.buildExtractor(attrs)(tsk));

    // Print data
    const list = new CliList();

    if (args.headers ?? (attrs.length > 1)) {
      list.setHeaders(attrs);
    }

    for (const d of data) {
      list.add(attrs.map(attr => d[attr] || ''));
    }

    for (const d of list.lines()) {
      this.log(d);
    }
  }
}
