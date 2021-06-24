import { hideBin } from 'yargs/helpers';
import yargs from 'yargs';

// Bootstrap
(async () => {
  // Options
  await yargs(hideBin(process.argv))
    .scriptName('jill')
    .option('project', {
      alias: 'p',
      type: 'string',
      description: 'Project root directory',
      default: '.'
    })
    .option('verbose', {
      alias: 'v',
      type: 'count',
      description: 'Set verbosity level (1 for verbose, 2 for debug)',
    })
    .command(require('./commands/info')) // eslint-disable-line @typescript-eslint/no-var-requires
    .demandCommand(1)
    .help()
    .parse();

  // // Setup
  // if (argv.verbose === 1) {
  //   logger.level = 'verbose';
  // } else if (argv.verbose >= 2) {
  //   logger.level = 'debug';
  // }
  //
  // // Run !
  // const prj = new Project(argv.project);
  // const wks = await prj.workspace('mock-test-a');
  //
  // if (wks) {
  //   const manager = new TaskManager();
  //   manager.add(await wks.build());
  //
  //   const running = new Set<Task>();
  //   manager.on('started', (task) => {
  //     running.add(task);
  //
  //     if (running.size > 1) {
  //       logger.spin(`Building ${running.size} packages ...`);
  //     } else {
  //       logger.spin(`Building ${task.workspace?.name || task.cwd} ...`);
  //     }
  //   });
  //
  //   manager.on('completed', (task) => {
  //     running.delete(task);
  //
  //     if (task.status === 'failed') {
  //       logger.fail(`Failed to build ${task.workspace?.name || task.cwd}`);
  //     } else {
  //       logger.succeed(`${task.workspace?.name || task.cwd} built`);
  //     }
  //
  //     if (running.size > 1) {
  //       logger.spin(`Building ${running.size} packages ...`);
  //     } else if (running.size > 0) {
  //       logger.spin(`Building ${task.workspace?.name || task.cwd} ...`);
  //     }
  //   });
  //
  //   manager.start();
  // }
})();
