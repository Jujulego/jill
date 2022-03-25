import { render } from 'ink';
import { StrictMode } from 'react';

import { Application } from './application';
import { EachCommand } from './commands/each.command';
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
        EachCommand,
        ListCommand,
        RunCommand,
        TreeCommand
      ]} />
    </StrictMode>
  );

  await waitUntilExit();
})();
