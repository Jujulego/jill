import { inject$ } from '@kyrielle/injector';
import chalk from 'chalk';
import { collect$, map$, pipe$, waitFor$ } from 'kyrielle';
import slugify from 'slugify';
import type { ArgumentsCamelCase, CommandModule } from 'yargs';
import { ProjectsRepository } from '../../projects/projects.repository.js';
import type { Workspace } from '../../projects/workspace.js';
import { printJson } from '../../utils/json.js';
import type { Order } from '../../utils/types.js';
import { loadProject, type LoadProjectArgs } from '../middlewares/load-project.middleware.js';

// Command
const command: CommandModule<unknown, ListArgs> = {
  command: 'list',
  aliases: ['ls'],
  describe: 'List project workspaces',
  builder: (parser) => loadProject(parser)
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
      alias: 'attrs',
      type: 'array',
      choices: ['name', 'version', 'root', 'slug'] as const,
      group: 'Format:',
      required: true,
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
      default: false,
      desc: 'Prints name, version and root of all workspaces',
    })
    .option('json', {
      type: 'boolean',
      group: 'Format:',
      default: false,
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
      default: [],
      desc: 'Sort output by given attribute. By default sorts by name if printed'
    })
    .option('with-script', {
      type: 'array',
      string: true,
      group: 'Filters:',
      desc: 'Print only workspaces having the given script',
    })
    .middleware((argv) => {
      // Compute attributes
      if (!argv.attr?.length) {
        if (argv.json) {
          argv.attrs = argv.attr = ['name', 'version', 'slug', 'root'];
        } else if (argv.long) {
          argv.attrs = argv.attr = ['name', 'version', 'root'];
        } else {
          argv.attrs = argv.attr = ['name'];
        }
      }
    }, true)
    .check((argv) => {
      if (argv.attr.length > 0 && argv['sort-by']?.length) {
        const miss = argv['sort-by'].filter((attr) => !argv.attr.includes(attr));

        if (miss.length > 0) {
          throw new Error(`Cannot sort by non printed attributes. Missing ${miss.join(', ')}.`);
        }
      }

      if (!argv['sort-by']?.length && argv.attr.length > 0) {
        argv['sort-by'] = argv.sortBy = argv.s = [argv.attr[0]!];
      }

      return true;
    }),
  async handler(args) {
    // Load project
    const repository = inject$(ProjectsRepository);
    const project = repository.getProject(args.project, {
      packageManager: args.packageManager
    });

    // Load workspaces
    const workspaces = await waitFor$(pipe$(
      project.workspaces(),
      map$(buildExtractor(args)),
      collect$(),
    ));

    printJson(workspaces);
  }
};

export default command;

// Types
export type ListAttr = 'name' | 'version' | 'root' | 'slug';

interface ListArgs extends LoadProjectArgs {
  readonly affected: string | undefined;
  readonly 'affected-rev-fallback': string;
  readonly 'affected-rev-sort': string | undefined;
  readonly attr: readonly ListAttr[];
  readonly headers: boolean | undefined;
  readonly long: boolean;
  readonly json: boolean;
  readonly order: Order;
  readonly private: boolean | undefined;
  readonly 'sort-by': readonly ListAttr[] | undefined;
  readonly 'with-script': readonly string[] | undefined;
}

// Utils
type Extractor<T> = (wks: Workspace, json: boolean) => T;
type ExtractedData = Record<ListAttr, string | undefined>;

const EXTRACTORS = {
  name: (wks) => wks.name,
  version: (wks, json) => wks.manifest.version || (json ? undefined : chalk.grey('unset')),
  root: (wks) => wks.root,
  slug: (wks) => slugify(wks.name)
} satisfies Record<ListAttr, Extractor<string | undefined>>;

function buildExtractor(args: ArgumentsCamelCase<ListArgs>) {
  return (wks: Workspace): Readonly<ExtractedData> => {
    const data = {} as ExtractedData;

    for (const attr of args.attr) {
      data[attr] = EXTRACTORS[attr](wks, args.json);
    }

    return data;
  };
}