import { logger, Project, TaskManager } from '@jujulego/jill-core';
import { format, transports } from 'winston';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs';

// Setup logger
logger.level = 'debug';
logger.add(new transports.Console({
  format: format.combine(
    format.colorize({ message: true, colors: { debug: 'grey', verbose: 'blue', info: 'white', error: 'red' } }),
    format.printf(({ label, message }) => [label && `[${label}]`, message].filter(p => p).join(' ')),
  )
}));

// Bootstrap
(async () => {
  // Options
  const argv = await yargs(hideBin(process.argv))
    .option('project', {
      alias: 'p',
      type: 'string',
      description: 'Project root directory',
      default: '.'
    })
    .argv;

  // Run !
  const prj = new Project(argv.project);
  const wks = await prj.workspace('@jujulego/jill');

  if (wks) {
    const manager = new TaskManager();
    manager.add(await wks.build());

    manager.start();
  }
})();
