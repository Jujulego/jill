import { Logger } from '@jujulego/logger';
import chalk from 'chalk';
import { inject } from 'inversify';
import path from 'node:path';
import { compare, parse } from 'semver';
import slugify from 'slugify';
import { type ArgumentsCamelCase, type Argv } from 'yargs';

import { AffectedFilter } from '@/src/filters/affected.filter.ts';
import { Pipeline } from '@/src/filters/pipeline.ts';
import { PrivateFilter } from '@/src/filters/private.filter.ts';
import { ScriptsFilter } from '@/src/filters/scripts.filter.ts';
import { LazyCurrentProject, LoadProject } from '@/src/middlewares/load-project.ts';
import { Command } from '@/src/modules/command.ts';
import { InkCommand } from '@/src/modules/ink-command.tsx';
import { type Project } from '@/src/project/project.ts';
import { type Workspace } from '@/src/project/workspace.ts';
import List from '@/src/ui/list.tsx';
import { ExitException } from '@/src/utils/exit.ts';
import { printJson } from '@/src/utils/json.ts';

// Types
export type Attribute = 'name' | 'version' | 'root' | 'slug';
export type Data = Partial<Record<Attribute, string>>;
export type Order = 'asc' | 'desc';

type Extractor<T> = (wks: Workspace, json: boolean) => T;

export interface ListCommandArgs {
  // Filters
  private?: boolean;
  'with-script'?: string[];

  // Affected filter
  affected: string;
  'affected-rev-fallback': string;
  'affected-rev-sort'?: string;

  // Format
  attrs?: Attribute[];
  headers?: boolean;
  long?: boolean;
  json?: boolean;

  // Sort
  'sort-by'?: Attribute[];
  order: Order;
}

// Constants
const LONG_ATTRIBUTES: Attribute[] = ['name', 'version', 'root'];
const JSON_ATTRIBUTES: Attribute[] = ['name', 'version', 'slug', 'root'];
const DEFAULT_ATTRIBUTES: Attribute[] = ['name'];

const EXTRACTORS = {
  name: wks => wks.name,
  version: (wks, json) => wks.manifest.version || (json ? undefined : chalk.grey('unset')),
  root: wks => wks.cwd,
  slug: wks => slugify.default(wks.name)
} satisfies Record<Attribute, Extractor<string | undefined>>;

const COMPARATORS = {
  name: (a = '', b = '') => a.localeCompare(b),
  version: (a, b) => compare(parse(a) ?? '0.0.0', parse(b) ?? '0.0.0'),
  root: (a = '', b = '') => a.localeCompare(b),
  slug: (a = '', b = '') => a.localeCompare(b),
} satisfies Record<Attribute, (a: string | undefined, b: string | undefined) => number>;

// Utils
function buildExtractor(attrs: Attribute[]): Extractor<Data> {
  return (wks, json: boolean) => {
    const data: Data = {};

    for (const attr of attrs) {
      data[attr] = EXTRACTORS[attr](wks, json);
    }

    return data;
  };
}

// Command
@Command({
  command: 'list',
  aliases: ['ls'],
  describe: 'List workspace',
  middlewares: [
    LoadProject,
  ]
})
export class ListCommand extends InkCommand<ListCommandArgs> {
  // Lazy injections
  @LazyCurrentProject()
  readonly project: Project;

  // Constructor
  constructor(
    @inject(Logger)
    private readonly logger: Logger,
  ) {
    super();
  }

  // Methods
  builder(parser: Argv): Argv<ListCommandArgs> {
    return parser
      // Filters
      .option('private', {
        type: 'boolean',
        group: 'Filters:',
        desc: 'Print only private workspaces',
      })
      .option('with-script', {
        type: 'array',
        string: true,
        group: 'Filters:',
        desc: 'Print only workspaces having the given script',
      })
      .option('affected', {
        alias: 'a',
        type: 'string',
        coerce: (rev) => rev === '' ? 'master' : rev,
        group: 'Filters:',
        desc: 'Print only affected workspaces towards given git revision. If no revision is given, it will check towards master. Replaces %name by workspace name.',
      })
      .option('affected-rev-sort', {
        type: 'string',
        group: 'Filters:',
        desc: 'Sort applied to git tag / git branch command',
      })
      .option('affected-rev-fallback', {
        type: 'string',
        default: 'master',
        group: 'Filters:',
        desc: 'Fallback revision, used if no revision matching the given format is found',
      })

      // Format
      .option('attrs', {
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

      // Sort
      .option('sort-by', {
        alias: 's',
        type: 'array',
        choices: ['name', 'version', 'root', 'slug'] as const,
        group: 'Sort:',
        desc: 'Sort output by given attribute. By default sorts by name if printed'
      })
      .option('order', {
        alias: 'o',
        type: 'string',
        choices: ['asc', 'desc'] as const,
        default: 'asc' as const,
        group: 'Sort:',
        desc: 'Sort order'
      });
  }

  async *render(args: ArgumentsCamelCase<ListCommandArgs>) {
    const { attrs, sortBy } = this._applyDefaults(args);

    // Load workspaces
    const pipeline = this._preparePipeline(args);
    const workspaces: Workspace[] = [];

    for await (const wks of pipeline.filter(this.project.workspaces())) {
      workspaces.push(wks);
    }

    // Build data
    const data = workspaces.map(wks => buildExtractor(attrs)(wks, args.json || false));

    if (sortBy.length > 0) {
      data.sort(this._dataComparator(sortBy, args.order));
    }

    // Print list
    if (args.json) {
      printJson(data);
    } else {
      for (const d of data) {
        if (d.root) {
          d.root = path.relative(process.cwd(), d.root) || '.';
        }
      }

      yield <List items={data} headers={args.headers ?? (attrs.length > 1)} />;
    }
  }

  private _applyDefaults(argv: ArgumentsCamelCase<ListCommandArgs>): { attrs: Attribute[], sortBy: Attribute[] } {
    // Compute attributes
    let attrs = argv.attrs ?? [];

    if (attrs.length === 0) {
      if (argv.long) {
        attrs = LONG_ATTRIBUTES;
      } else if (argv.json) {
        attrs = JSON_ATTRIBUTES;
      } else {
        attrs = argv.sortBy ?? DEFAULT_ATTRIBUTES;
      }
    }

    // Check sorted attributes
    let sortBy = argv.sortBy ?? [];

    if (attrs.length > 0 && sortBy.length > 0) {
      const miss = sortBy.filter((attr) => !attrs.includes(attr));

      if (miss.length > 0) {
        this.logger.error(`Cannot sort by non printed attributes. Missing ${miss.join(', ')}.`);
        throw new ExitException(1);
      }
    }

    if (sortBy.length === 0 && attrs.includes('name')) {
      sortBy = ['name'];
    }

    return { attrs, sortBy };
  }

  private _preparePipeline(argv: ArgumentsCamelCase<ListCommandArgs>): Pipeline {
    const pipeline = new Pipeline();

    if (argv.private !== undefined) {
      pipeline.add(new PrivateFilter(argv.private));
    }

    if (argv.withScript) {
      pipeline.add(new ScriptsFilter(argv.withScript));
    }

    if (argv.affected !== undefined) {
      pipeline.add(new AffectedFilter(
        argv.affected,
        argv.affectedRevFallback,
        argv.affectedRevSort
      ));
    }

    return pipeline;
  }

  private _dataComparator(sortBy: Attribute[], order: Order) {
    const factor = order === 'asc' ? 1 : -1;

    return (a: Data, b: Data) => {
      for (const attr of sortBy) {
        const diff = COMPARATORS[attr](a[attr], b[attr]);

        if (diff !== 0) {
          return factor * diff;
        }
      }

      return 0;
    };
  }
}
