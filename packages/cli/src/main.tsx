// import { Application } from '@jujulego/jill-common';
//
// import { corePlugin } from './core.plugin';
//
// // Class
// class JillApp extends Application {
//   // Attributes
//   readonly name = 'jill';
//   readonly corePlugin = corePlugin;
// }
//
// // Bootstrap
// (async () => {
//   const app = new JillApp();
//   await app.parse();
// })();

import { render } from 'ink';
import { StrictMode } from 'react';

import { Application } from './application';
import { ListCommand } from './commands/list.command';
import { RunCommand } from './commands/run.command';
import { TreeCommand } from './commands/tree.command';
import { StaticLogs } from './components/StaticLogs';

// Bootstrap
(async () => {
  const { waitUntilExit } = render(
    <StrictMode>
      <StaticLogs />
      <Application name="jill" commands={[
        ListCommand,
        RunCommand,
        TreeCommand
      ]} />
    </StrictMode>
  );

  await waitUntilExit();
})();
