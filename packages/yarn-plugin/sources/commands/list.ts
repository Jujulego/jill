import { Attribute, listCommand } from '@jujulego/jill';
import { Command, Usage } from 'clipanion';

import { JillCommand } from './base';

// Command
export class ListCommand extends JillCommand {
  // Attributes
  @Command.String('-a,--affected', { tolerateBoolean: true, description: 'Print only affected workspaces towards given git revision. If no revision is given test against master' })
  affected?: string;

  @Command.Boolean('--private', { description: 'Print only private workspaces' })
  private?: boolean;

  @Command.Array('--with-script', { description: 'Print only workspaces having the given script' })
  withScript?: string[];

  @Command.Array('--attrs', { description: 'Select printed attributes' })
  attrs?: Attribute[];

  @Command.Boolean('--headers', { description: 'Prints columns headers' })
  headers?: boolean;

  @Command.Boolean('-l,--long', { description: 'Prints name, version and root of all workspaces' })
  long = false;

  @Command.Boolean('--json', { description: 'Prints data as a JSON array' })
  json = false;

  // Statics
  static usage: Usage = {
    description: 'Run script on selected workspaces'
  };

  // Methods
  @Command.Path('jill', 'list')
  async execute(): Promise<void> {
    const prj = await this.jillPrj();

    await listCommand(prj, {
      affected: this.affected === '' ? 'master' : this.affected,
      private: this.private,
      'with-script': this.withScript,
      attrs: this.attrs,
      headers: this.headers,
      long: this.long,
      json: this.json,
    });
  }
}