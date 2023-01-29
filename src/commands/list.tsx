import chalk from 'chalk';
import path from 'node:path';
import slugify from 'slugify';
import { type ArgumentsCamelCase, type Argv } from 'yargs';

import { Command } from '@/src/modules/command';
import { InkCommand } from '@/src/modules/ink-command';
import { AffectedFilter } from '@/src/filters/affected.filter';
import { Pipeline } from '@/src/filters/pipeline';
import { PrivateFilter } from '@/src/filters/private.filter';
import { ScriptsFilter } from '@/src/filters/scripts.filter';
import { LoadProject } from '@/src/middlewares/load-project';
import { LazyCurrentProject, type Project } from '@/src/project/project';
import { type Workspace } from '@/src/project/workspace';
import List from '@/src/ui/list';

// Types
export type Attribute = 'name' | 'version' | 'root' | 'slug';
export type Data = Partial<Record<Attribute, string>>;

type Extractor<T> = (wks: Workspace, json: boolean) => T;

export interface IListCommandArgs {
  // Filters
  private?: boolean;
  'with-script'?: string[];

  // Affected filter
  affected: string;
  'affected-rev-fallback': string;
  'affected-rev-sort'?: string;

  // Format
  attrs: Attribute[];
  headers?: boolean;
  long?: boolean;
  json?: boolean;
}

// Constants
const LONG_ATTRIBUTES: Attribute[] = ['name', 'version', 'root'];
const JSON_ATTRIBUTES: Attribute[] = ['name', 'version', 'slug', 'root'];
const DEFAULT_ATTRIBUTES: Attribute[] = ['name'];

const EXTRACTORS = {
  name: wks => wks.name,
  version: (wks, json) => wks.manifest.version || (json ? undefined : chalk.grey('unset')),
  root: wks => wks.cwd,
  slug: wks => slugify(wks.name)
} satisfies Record<Attribute, Extractor<string | undefined>>;

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
export class ListCommand extends InkCommand<IListCommandArgs> {
  // Lazy injections
  @LazyCurrentProject()
  readonly project: Project;

  // Methods
  builder(parser: Argv): Argv<IListCommandArgs> {
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
        default: [],
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
      });
  }

  async *render(args: ArgumentsCamelCase<IListCommandArgs>) {
    // Setup pipeline
    const pipeline = new Pipeline();

    if (args.private !== undefined) {
      pipeline.add(new PrivateFilter(args.private));
    }

    if (args.withScript) {
      pipeline.add(new ScriptsFilter(args.withScript));
    }

    if (args.affected !== undefined) {
      pipeline.add(new AffectedFilter(
        args.affected,
        args.affectedRevFallback,
        args.affectedRevSort
      ));
    }

    // Load workspaces
    const workspaces: Workspace[] = [];

    for await (const wks of pipeline.filter(this.project.workspaces())) {
      workspaces.push(wks);
    }

    // Build data
    let attrs = args.attrs;

    if (attrs.length === 0) {
      if (args.long) {
        attrs = LONG_ATTRIBUTES;
      } else if (args.json) {
        attrs = JSON_ATTRIBUTES;
      } else {
        attrs = DEFAULT_ATTRIBUTES;
      }
    }

    const data = workspaces.map(wks => buildExtractor(attrs)(wks, args.json || false));

    // Print list
    if (args.json) {
      if (process.stdout.isTTY) { // Pretty print for ttys
        console.log(JSON.stringify(data, null, 2));
      } else {
        process.stdout.write(JSON.stringify(data));
      }
    } else {
      for (const d of data) {
        if (d.root) {
          d.root = path.relative(process.cwd(), d.root) || '.';
        }
      }

      yield <List items={data} headers={args.headers ?? (attrs.length > 1)} />;
    }
  }
}
