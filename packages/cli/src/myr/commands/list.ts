import { TaskStatus } from '@jujulego/jill-core';
import { ITask } from '@jujulego/jill-myr';
import chalk from 'chalk';
import path from 'path';

import { logger } from '../../logger';
import { MyrClient } from '../myr-client';
import { CommandHandler } from '../../wrapper';
import { CliList } from '../../utils/cli-list';

// Types
export type Attribute = 'identifier' | 'status' | 'cwd' | 'command' | 'cmd' | 'args';
export type Data = Partial<Record<Attribute, string>>;

export interface ListArgs {
  // Filters
  all: boolean;

  // Formats
  attrs: Attribute[] | undefined;
  headers: boolean | undefined;
  long: boolean;
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

// Utils
type Extractor<T> = (tsk: ITask, argv: ListArgs) => T;

const extractors: Record<Attribute, Extractor<string | undefined>> = {
  identifier: tsk => chalk.grey(tsk.id),
  status: tsk => COLORED_STATUS[tsk.status],
  cwd: tsk => path.relative(process.cwd(), tsk.cwd) || '.',
  command: tsk => `${tsk.cmd} ${tsk.args.join(' ')}`,
  cmd: tsk => tsk.cmd,
  args: tsk => tsk.args.join(' ')
};

function buildExtractor(attrs: Attribute[]): Extractor<Data> {
  return (tsk, argv: ListArgs) => {
    const data: Data = {};

    for (const attr of attrs) {
      data[attr] = extractors[attr](tsk, argv);
    }

    return data;
  };
}

// Handle
export const listCommand: CommandHandler<ListArgs> = async (prj, argv) => {
  // Requesting tasks
  logger.spin('Connecting to myr');
  const client = new MyrClient(prj);

  logger.spin('Requesting tasks');
  const tasks = await client.tasks();

  logger.stop();

  // Build data
  let attrs = argv.attrs || DEFAULT_ATTRIBUTES;

  if (!argv.attrs && argv.long) {
    attrs = LONG_ATTRIBUTES;
  }

  const data = tasks
    .filter(tsk => argv.all || tsk.status === 'running')
    .map(tsk => buildExtractor(attrs)(tsk, argv));

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

  return 0;
};