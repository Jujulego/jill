import { Project } from '@jujulego/jill-core';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs';

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
  const project = new Project(argv.project);

  for await (const wks of project.workspaces()) {
    console.log(wks.name);
  }
})();
