import chalk from 'chalk';
import { asyncIterator$, collect$, map$, pipe$, type SimpleAsyncIterator, waitFor$ } from 'kyrielle';
import path from 'node:path';
import { compare, parse } from 'semver';
import slugify from 'slugify';
import type { ArgumentsCamelCase, CommandModule } from 'yargs';
import { hasSomeScript$ } from '../projects/filters/has-scripts.js';
import { isAffected$ } from '../projects/filters/is-affected.js';
import { isPrivate$ } from '../projects/filters/is-private.js';
import { ClientError } from '../errors.js';
import { loadProject, type ProjectArgs, withProject } from '../middlewares/with-project.js';
import type { Workspace } from '../projects/workspace.js';
import { printJson } from '../utils/json.js';
import { pipeline$ } from '../utils/pipeline$.js';
import { traceImport } from '../utils/sentry.js';
import type { Order } from '../utils/types.js';

// Command
const command: CommandModule<unknown, ListArgs> = {
  command: 'list',
  aliases: ['ls'],
  describe: 'List project workspaces',
  builder: (parser) => withProject(parser)
    .option('affected', {
      alias: 'a',
      type: 'string',
      coerce: (rev: string) => rev === '' ? 'master' : rev,
      group: 'Filters:',
      desc: `Print only affected workspaces towards given git revision. If no revision is given, it will check towards master. Replaces ${chalk.bold('%name')} by workspace name.`,
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
    .option('attribute', {
      alias: ['attr', 'attrs'],
      type: 'array',
      choices: ['name', 'version', 'root', 'slug'] as const,
      group: 'Format:',
      default: [] as ListAttr[],
      description: 'Select printed attributes',
      defaultDescription: '"name" only'
    })
    .option('headers', {
      type: 'boolean',
      group: 'Format:',
      default: false,
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
      description: 'Sort output by given attribute',
      defaultDescription: 'first attribute'
    })
    .option('sort-order', {
      alias: ['o', 'order'],
      type: 'string',
      choices: ['asc', 'desc'] as const,
      default: 'asc' as const,
      group: 'Sort:',
      desc: 'Sort order'
    })
    .option('with-script', {
      type: 'array',
      string: true,
      group: 'Filters:',
      desc: 'Print only workspaces having the given script',
    })
    .middleware((argv) => {
      // Compute attributes
      if (!argv.attribute.length) {
        if (argv.json) {
          argv.attrs = argv.attr = argv.attribute = ['name', 'version', 'slug', 'root'];
        } else if (argv.long) {
          argv.attrs = argv.attr = argv.attribute = ['name', 'version', 'root'];
        } else if (argv.sortBy?.length) {
          argv.attrs = argv.attr = argv.attribute = argv.sortBy;
        } else {
          argv.attrs = argv.attr = argv.attribute = ['name'];
        }
      }
    }, true)
    .check((argv) => {
      if (argv.attribute.length > 0 && argv['sort-by']?.length) {
        const miss = argv['sort-by'].filter((attr) => !argv.attribute.includes(attr));

        if (miss.length > 0) {
          throw new ClientError(`Cannot sort by non printed attributes. Missing ${miss.join(', ')}.`);
        }
      }

      if (!argv['sort-by']?.length && argv.attribute.length > 0) {
        argv['sort-by'] = argv.sortBy = argv.s = [argv.attribute[0]];
      }

      return true;
    }),
  async handler(args) {
    // Prepare filters
    let filters = pipeline$<SimpleAsyncIterator<Workspace>>();

    if (args.private !== undefined) {
      filters = filters.add(isPrivate$(args.private));
    }

    if (args.withScript) {
      filters = filters.add(hasSomeScript$(args.withScript));
    }

    if (args.affected !== undefined) {
      filters = filters.add(isAffected$({
        format: args.affected,
        fallback: args.affectedRevFallback,
        sort: args.affectedRevSort,
      }));
    }

    // Load workspaces
    const project = loadProject(args);
    const workspaces = await waitFor$(pipe$(
      asyncIterator$(project.workspaces()),
      filters.build(),
      map$(buildExtractor(args)),
      collect$(),
    ));

    if (args.sortBy.length > 0) {
      workspaces.sort(buildComparator(args));
    }

    if (args.json) {
      printJson(workspaces);
    } else if (workspaces.length > 0) {
      for (const data of workspaces) {
        if (data.root) {
          data.root = path.relative(process.cwd(), data.root) || '.';
        }
      }

      const { default: ListInk } = await traceImport('ListInk', () => import('./list.ink.jsx'));
      await ListInk({ attributes: args.attribute, headers: args.headers, workspaces });
    }
  }
};

export default command;

// Types
export type ListAttr = 'name' | 'version' | 'root' | 'slug';

export interface ListArgs extends ProjectArgs {
  readonly affected: string | undefined;
  readonly 'affected-rev-fallback': string;
  readonly 'affected-rev-sort': string | undefined;
  readonly attribute: readonly ListAttr[];
  readonly headers: boolean;
  readonly long: boolean;
  readonly json: boolean;
  readonly private: boolean | undefined;
  readonly 'sort-by': readonly ListAttr[];
  readonly 'sort-order': Order;
  readonly 'with-script': readonly string[] | undefined;
}

// Utils
type Comparator<T> = (a: T, b: T) => number;
type Extractor<T> = (wks: Workspace, json: boolean) => T;
export type ExtractedData = Record<ListAttr, string | undefined>;

const EXTRACTORS = {
  name: (wks) => wks.name,
  version: (wks, json) => wks.manifest.version || (json ? undefined : chalk.grey('unset')),
  root: (wks) => wks.root,
  slug: (wks) => slugify(wks.name)
} satisfies Record<ListAttr, Extractor<string | undefined>>;

const COMPARATORS = {
  name: (a = '', b = '') => a.localeCompare(b),
  version: (a, b) => compare(parse(a) ?? '0.0.0', parse(b) ?? '0.0.0'),
  root: (a = '', b = '') => a.localeCompare(b),
  slug: (a = '', b = '') => a.localeCompare(b),
} satisfies Record<ListAttr, Comparator<string | undefined>>;

function buildExtractor(args: ArgumentsCamelCase<ListArgs>) {
  return (wks: Workspace): ExtractedData => {
    const data = {} as ExtractedData;

    for (const attr of args.attribute) {
      data[attr] = EXTRACTORS[attr](wks, args.json);
    }

    return data;
  };
}

function buildComparator(args: ArgumentsCamelCase<ListArgs>): Comparator<ExtractedData> {
  const factor = args.sortOrder === 'asc' ? 1 : -1;

  return (a, b) => {
    for (const attr of args.sortBy) {
      const diff = COMPARATORS[attr](a[attr], b[attr]);

      if (diff !== 0) {
        return diff * factor;
      }
    }

    return 0;
  };
}
