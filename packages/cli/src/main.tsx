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

import { Application } from './application';
import { TreeCommand } from './commands/tree.command';

(async () => {
  const { waitUntilExit } = render(
    <Application name="jill">
      <TreeCommand />
    </Application>
  );

  await waitUntilExit();
})();
