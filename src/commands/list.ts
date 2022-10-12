import chalk from 'chalk';
import path from 'node:path';
import slugify from 'slugify';

import { AffectedFilter, Pipeline, PrivateFilter, ScriptsFilter } from '../filters';
import { currentProject } from '../middlewares';
import { Project, Workspace } from '../project';
import { container, CURRENT_PROJECT } from '../services';
import { defineCommand } from '../utils';
import { CliList } from '../ui';

// Types
export type Attribute = 'name' | 'version' | 'root' | 'slug';
export type Data = Partial<Record<Attribute, string>>;

type Extractor<T> = (wks: Workspace, json: boolean) => T;

// Constants
const LONG_ATTRIBUTES: Attribute[] = ['name', 'version', 'root'];
const JSON_ATTRIBUTES: Attribute[] = ['name', 'version', 'slug', 'root'];
const DEFAULT_ATTRIBUTES: Attribute[] = ['name'];

const EXTRACTORS: Record<Attribute, Extractor<string | undefined>> = {
  name: wks => wks.name,
  version: (wks, json) => wks.manifest.version || (json ? undefined : chalk.grey('unset')),
  root: wks => wks.cwd,
  slug: wks => slugify(wks.name)
};

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
export default defineCommand({
  command: ['list', 'ls'],
  describe: 'List workspaces',
  builder: (yargs) => currentProject(yargs)
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

    // Affected filter
    .option('affected', {
      alias: 'a',
      type: 'string',
      coerce: (rev: string) => rev === '' ? 'master' : rev,
      group: 'Affected:',
      desc: 'Print only affected workspaces towards given git revision. If no revision is given, it will check towards master.\n' +
        'Replaces %name by workspace name.',
    })
    .option('affected-rev-sort', {
      type: 'string',
      group: 'Affected:',
      desc: 'Sort applied to git tag / git branch command',
    })
    .option('affected-rev-fallback', {
      type: 'string',
      default: 'master',
      group: 'Affected:',
      desc: 'Fallback revision, used if no revision matching the given format is found',
    })
    .option('attrs', {
      type: 'array',
      choices: ['name', 'version', 'root', 'slug'],
      default: [] as Attribute[],
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
    }),
  async handler(args) {
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
    const project = container.get<Project>(CURRENT_PROJECT);
    const workspaces: Workspace[] = [];

    for await (const wks of pipeline.filter(project.workspaces())) {
      workspaces.push(wks);
    }

    // Build data
    let attrs = args.attrs;

    if (args.attrs.length === 0) {
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
        console.log(JSON.stringify(data));
      }
    } else {
      const list = new CliList();

      if (args.headers ?? (attrs.length > 1)) {
        list.setHeaders(attrs);
      }

      for (const d of data) {
        if (d.root) {
          d.root = path.relative(process.cwd(), d.root) || '.';
        }

        list.add(attrs.map(attr => d[attr] || ''));
      }

      for (const d of list.lines()) {
        console.log(d);
      }
    }
  }
});
