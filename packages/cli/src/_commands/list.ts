import { Workspace } from '@jujulego/jill-core';
import { Flags } from '@oclif/core';
import { OptionFlag } from '@oclif/core/lib/interfaces';
import path from 'path';
import chalk from 'chalk';
import slugify from 'slugify';

import ProjectCommand from '../bases/project.command';
import { AffectedFilter, Filter } from '../filters';
import { logger } from '../logger';
import { Pipeline } from '../pipeline';
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
export default class ListCommand extends ProjectCommand {
  // Attributes
  static aliases = ['ls'];
  static description = 'List workspaces';
  static flags = {
    ...ProjectCommand.flags,
    private: Flags.boolean({
      helpGroup: 'filters',
      description: 'Print only private workspaces'
    }),
    'with-script': Flags.string({
      multiple: true,
      helpGroup: 'filters',
      description: 'Print only workspaces having the given script',
    }),
    affected: Flags.string({
      char: 'a',
      helpGroup: 'affected',
      description: 'Print only affected workspaces towards given git revision.\n' +
        'Replaces %name by workspace name.',
    }),
    ['affected-rev-sort']: Flags.string({
      dependsOn: ['affected'],
      helpGroup: 'affected',
      description: 'Sort applied to git tag / git branch command',
    }),
    ['affected-rev-fallback']: Flags.string({
      name: 'affected-rev-fallback',
      dependsOn: ['affected'],
      helpGroup: 'affected',
      description: 'Fallback revision, used if no revision matching the given format is found',
    }),
    attr: Flags.enum({
      multiple: true,
      options: ['name', 'version', 'root', 'slug'],
      helpGroup: 'format',
      description: 'Select printed attributes'
    }) as unknown as OptionFlag<Attribute[]>,
    headers: Flags.boolean({
      helpGroup: 'format',
      description: 'Prints columns headers'
    }),
    long: Flags.boolean({
      char: 'l',
      exclusive: ['attr'],
      helpGroup: 'format',
      description: 'Prints name, version and root of all workspaces',
    }),
    json: Flags.boolean({
      exclusive: ['list', 'headers'],
      helpGroup: 'format',
      description: 'Prints data as a JSON array',
    })
  };
  static args = [];

  // Methods
  buildExtractor(attrs: Attribute[]): Extractor<Data> {
    return (wks, json: boolean) => {
      const data: Data = {};

      for (const attr of attrs) {
        data[attr] = EXTRACTORS[attr](wks, json);
      }

      return data;
    };
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(ListCommand);

    logger.spin('Loading project');

    // Setup pipeline
    const pipeline = new Pipeline();

    if (flags.private !== undefined) {
      pipeline.add(Filter.privateWorkspace(flags.private));
    }

    if (flags['with-script'] !== undefined) {
      pipeline.add(Filter.scripts(flags['with-script']));
    }

    if (flags.affected !== undefined) {
      pipeline.add(new AffectedFilter(
        flags.affected,
        flags['affected-rev-fallback'] || 'master',
        flags['affected-rev-sort']
      ));
    }

    // Filter
    const workspaces: Workspace[] = [];

    for await (const wks of pipeline.filter(this.project.workspaces())) {
      workspaces.push(wks);
    }

    logger.stop();

    // Build data
    let attrs = flags.attr || DEFAULT_ATTRIBUTES;

    if (!flags.attr) {
      if (flags.long) {
        attrs = LONG_ATTRIBUTES;
      } else if (flags.json) {
        attrs = JSON_ATTRIBUTES;
      }
    }

    const data = workspaces.map(wks => this.buildExtractor(attrs)(wks, flags.json));

    // Print data
    if (flags.json) {
      if (process.stdout.isTTY) { // Pretty print for ttys
        console.log(JSON.stringify(data, null, 2));
      } else {
        console.log(JSON.stringify(data));
      }
    } else {
      const list = new CliList();

      if (flags.headers ?? (attrs.length > 1)) {
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
