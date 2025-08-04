import type { Order } from '../../utils/types.js';
import type { CommandModule } from 'yargs';

// Command
const command: CommandModule<unknown, ListArgs> = {
  command: 'list',
  aliases: ['ls'],
  describe: 'List project workspaces',
  builder: (parser) => parser
    .option('affected', {
      alias: 'a',
      type: 'string',
      coerce: (rev: string) => rev === '' ? 'master' : rev,
      group: 'Filters:',
      desc: 'Print only affected workspaces towards given git revision. If no revision is given, it will check towards master. Replaces %name by workspace name.',
    })
    .option('affected-rev-fallback', {
      type: 'string',
      default: 'master',
      group: 'Filters:',
      desc: 'Fallback revision, used if no revision matching the given format is found',
    })
    .option('affected-rev-sort', {
      type: 'string',
      group: 'Filters:',
      desc: 'Sort applied to git tag / git branch command',
    })
    .option('attr', {
      alias: ['attrs'],
      type: 'array',
      choices: ['name', 'version', 'root', 'slug'] as const,
      group: 'Format:',
      desc: 'Select printed attributes'
    })
    .option('headers', {
      type: 'boolean',
      group: 'Format:',
      desc: 'Prints columns headers'
    })
    .option('long', {
      alias: 'l',
      type: 'boolean',
      group: 'Format:',
      desc: 'Prints name, version and root of all workspaces',
    })
    .option('json', {
      type: 'boolean',
      group: 'Format:',
      desc: 'Prints data as a JSON array',
    })
    .option('order', {
      alias: 'o',
      type: 'string',
      choices: ['asc', 'desc'] as const,
      default: 'asc' as const,
      group: 'Sort:',
      desc: 'Sort order'
    })
    .option('private', {
      type: 'boolean',
      group: 'Filters:',
      describe: 'Print only private workspaces',
    })
    .option('sort-by', {
      alias: 's',
      type: 'array',
      choices: ['name', 'version', 'root', 'slug'] as const,
      group: 'Sort:',
      desc: 'Sort output by given attribute. By default sorts by name if printed'
    })
    .option('with-script', {
      type: 'array',
      string: true,
      group: 'Filters:',
      desc: 'Print only workspaces having the given script',
    }),
  handler(args) {
    console.log(args);
  }
};

export default command;

// Types
export type ListAttr = 'name' | 'version' | 'root' | 'slug';

interface ListArgs {
  readonly affected: string | undefined;
  readonly 'affected-rev-fallback': string;
  readonly 'affected-rev-sort': string | undefined;
  readonly attr: readonly ListAttr[] | undefined;
  readonly headers: boolean | undefined;
  readonly long: boolean | undefined;
  readonly json: boolean | undefined;
  readonly order: Order;
  readonly private: boolean | undefined;
  readonly 'sort-by': readonly ListAttr[] | undefined;
  readonly 'with-script': readonly string[] | undefined;
}
