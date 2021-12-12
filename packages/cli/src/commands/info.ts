import chalk from 'chalk';
import path from 'path';

import { logger } from '../logger';
import { printDepsTree } from '../utils/deps-tree';
import { CommandHandler } from '../wrapper';

// Types
export interface InfoArgs {
  workspace: string | undefined;
}

// Handler
export const infoCommand: CommandHandler<InfoArgs> = async (prj, argv) => {
  // Get workspace
  logger.spin(`Loading "${argv.workspace || '.'}" workspace`);
  const wks = await (argv.workspace ? prj.workspace(argv.workspace) : prj.currentWorkspace());

  if (!wks) {
    logger.fail(`Workspace "${argv.workspace || '.'}" not found`);
    return 1;
  }

  logger.stop();

  // Print data
  console.log(chalk`Workspace {bold ${wks.name}}:`);
  console.log(chalk`{bold Version:}   ${wks.manifest.version || chalk.grey('unset')}`);
  console.log(chalk`{bold Directory:} ${path.relative(process.cwd(), wks.cwd) || '.'}`);
  console.log('');
  await printDepsTree(wks);

  return 0;
};