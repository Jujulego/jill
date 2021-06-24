import path from 'path';

import { commandHandler, CommonArgs } from '../wrapper';
import { logger } from '../logger';
import chalk from 'chalk';
import * as process from 'process';

// Types
export interface InfoArgs extends CommonArgs {
  workspace: string;
}

// Command
export const command = 'info <workspace>';
export const aliases = [];
export const describe = 'Print workspace data';

export const handler = commandHandler<InfoArgs>(async (prj, argv) => {
  // Get workspace
  logger.spin('Loading project');
  const wks = await prj.workspace(argv.workspace);

  if (!wks) {
    logger.fail(`Workspace ${argv.workspace} not found`);
    process.exit(1);

    return;
  }
  logger.stop();

  // Print data
  console.log(chalk`{bold Name:}      ${wks.name}`);
  console.log(chalk`{bold Version:}   ${wks.manifest.version}`);
  console.log(chalk`{bold Directory:} ${path.relative(process.cwd(), wks.cwd)}`);

  console.log();
  console.log(chalk`{bold Dependencies:}`);
  for await (const dep of wks.dependencies()) {
    console.log(`- ${dep.name}`);
  }

  console.log();
  console.log(chalk`{bold Dev Dependencies:}`);
  for await (const dep of wks.devDependencies()) {
    console.log(`- ${dep.name}`);
  }

  process.exit(0);
});
