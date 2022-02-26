import { render } from 'ink';
import { ReactElement } from 'react';
import { Arguments } from 'yargs';

import { ApplicationArgs } from './application';
import { Command } from './command';

// Command
export abstract class InkCommand<A extends ApplicationArgs = ApplicationArgs> extends Command<A> {
  // Methods
  protected abstract render(args: Arguments<A>): ReactElement;

  protected async run(args: Arguments<A>): Promise<void> {
    const { waitUntilExit } = render(this.render(args), {
      patchConsole: true,
    });

    await waitUntilExit();
  }
}
