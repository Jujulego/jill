import { Workspace } from '@jujulego/jill-core';
import chalk from 'chalk';
import path from 'path';

import { commandHandler } from '../wrapper';
import { logger } from '../logger';

// Types
export interface InfoArgs {
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

  // Get data
  const deps: Workspace[] = [];
  const devDeps: Workspace[] = [];

  for await (const dep of wks.dependencies()) {
    deps.push(dep);
  }

  for await (const dep of wks.devDependencies()) {
    devDeps.push(dep);
  }

  logger.stop();

  // Print data
  console.log(chalk`Workspace {bold ${wks.name}}:`);
  console.log(chalk`{bold Version:}   ${wks.manifest.version}`);
  console.log(chalk`{bold Directory:} ${path.relative(process.cwd(), wks.cwd)}`);

  if (deps.length > 0) {
    console.log();
    console.log(chalk`{bold Dependencies:}`);
    for (const dep of deps) {
      console.log(`- ${dep.name}`);
    }
  }

  if (devDeps.length > 0) {
    console.log();
    console.log(chalk`{bold Dev-Dependencies:}`);
    for (const dep of devDeps) {
      console.log(`- ${dep.name}`);
    }
  }

  process.exit(0);
});
