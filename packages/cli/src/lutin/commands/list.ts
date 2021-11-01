import { TaskStatus } from '@jujulego/jill-core';
import chalk from 'chalk';

import { logger } from '../../logger';
import { LutinClient } from '../lutin-client';
import { CommandHandler } from '../../wrapper';
import { CliList } from '../../utils/cli-list';
import path from 'path';

// Constants
const COLORED_STATUS: Record<TaskStatus, string> = {
  blocked: chalk.yellow('blocked'),
  ready: chalk.blue('ready'),
  running: 'running',
  failed: chalk.red('failed'),
  done: chalk.green('done')
};

// Handle
export const listCommand: CommandHandler = async () => {
  logger.spin('Connecting to lutin');
  const client = new LutinClient();

  logger.spin('Requesting tasks');
  const tasks = await client.tasks();

  logger.stop();

  const list = new CliList();
  list.setHeaders(['identifier', 'status', 'cwd', 'command']);

  for (const task of tasks) {
    list.add([
      chalk.grey(task.id.substr(0, 8)),
      COLORED_STATUS[task.status],
      path.relative(process.cwd(), task.cwd) || '.',
      `${task.cmd} ${task.args.join(' ')}`
    ]);
  }

  for (const d of list.lines()) {
    console.log(d);
  }

  return 0;
};