import { Workspace } from '@jujulego/jill-core';
import chalk from 'chalk';
import slugify from 'slugify';
import path from 'path';

import { ProjectCommand } from './project.command';
import { Pipeline } from '../pipeline';
import { AffectedFilter, Filter } from '../filters';
import { CliList } from '../utils/cli-list';

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

// Command
export class ListCommand extends ProjectCommand {
  // Methods
  private buildExtractor(attrs: Attribute[]): Extractor<Data> {
    return (wks, json: boolean) => {
      const data: Data = {};

      for (const attr of attrs) {
        data[attr] = EXTRACTORS[attr](wks, json);
      }

      return data;
    };
  }

  async run(): Promise<number | void> {
    // Define command
    const argv = await this.define(['list', 'ls'], 'List workspaces', y => y
      .options({
        private: {
          type: 'boolean',
          group: 'Filters:',
          desc: 'Print only private workspaces',
        },
        'with-script': {
          type: 'array',
          string: true,
          group: 'Filters:',
          desc: 'Print only workspaces having the given script',
        },
        affected: {
          alias: 'a',
          type: 'string',
          coerce: (rev: string) => rev === '' ? 'master' : rev,
          group: 'Affected:',
          desc: 'Print only affected workspaces towards given git revision. If no revision is given, it will check towards master.\n' +
            'Replaces %name by workspace name.',
        },
        'affected-rev-sort': {
          type: 'string',
          group: 'Affected:',
          desc: 'Sort applied to git tag / git branch command',
        },
        'affected-rev-fallback': {
          type: 'string',
          default: 'master',
          group: 'Affected:',
          desc: 'Fallback revision, used if no revision matching the given format is found',
        },
        attrs: {
          type: 'array',
          choices: ['name', 'version', 'root', 'slug'],
          group: 'Format:',
          desc: 'Select printed attributes'
        },
        headers: {
          type: 'boolean',
          group: 'Format:',
          desc: 'Prints columns headers'
        },
        long: {
          alias: 'l',
          type: 'boolean',
          conflicts: 'attrs',
          group: 'Format:',
          desc: 'Prints name, version and root of all workspaces',
        },
        json: {
          type: 'boolean',
          group: 'Format:',
          desc: 'Prints data as a JSON array',
        }
      })
    );

    // Setup pipeline
    const pipeline = new Pipeline();

    if (argv.private !== undefined) {
      pipeline.add(Filter.privateWorkspace(argv.private));
    }

    if (argv['with-script'] !== undefined) {
      pipeline.add(Filter.scripts(argv['with-script']));
    }

    if (argv.affected !== undefined) {
      pipeline.add(new AffectedFilter(
        argv.affected,
        argv['affected-rev-fallback'],
        argv['affected-rev-sort']
      ));
    }

    // Filter
    const workspaces: Workspace[] = [];

    for await (const wks of pipeline.filter(this.project.workspaces())) {
      workspaces.push(wks);
    }

    this.spinner.stop();

    // Build data
    let attrs = argv.attrs as Attribute[] || DEFAULT_ATTRIBUTES;

    if (!argv.attrs) {
      if (argv.long) {
        attrs = LONG_ATTRIBUTES;
      } else if (argv.json) {
        attrs = JSON_ATTRIBUTES;
      }
    }

    const data = workspaces.map(wks => this.buildExtractor(attrs)(wks, argv.json || false));

    // Print data
    if (argv.json) {
      if (process.stdout.isTTY) { // Pretty print for ttys
        console.log(JSON.stringify(data, null, 2));
      } else {
        console.log(JSON.stringify(data));
      }
    } else {
      const list = new CliList();

      if (argv.headers ?? (attrs.length > 1)) {
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
}