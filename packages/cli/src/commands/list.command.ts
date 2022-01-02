import { AffectedFilter, Arguments, Builder, CliList, Filter, Pipeline, ProjectArgs, ProjectCommand } from '@jujulego/jill-common';
import { Workspace } from '@jujulego/jill-core';
import chalk from 'chalk';
import slugify from 'slugify';
import path from 'path';

// Types
export type Attribute = 'name' | 'version' | 'root' | 'slug';
export type Data = Partial<Record<Attribute, string>>;

type Extractor<T> = (wks: Workspace, json: boolean) => T;

export interface ListArgs extends ProjectArgs {
  private: boolean | undefined;
  'with-script': string[] | undefined;

  affected: string | undefined;
  'affected-rev-sort': string | undefined;
  'affected-rev-fallback': string;

  attrs: Attribute[];
  headers: boolean | undefined;
  long: boolean | undefined;
  json: boolean | undefined;
}

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
export class ListCommand extends ProjectCommand<ListArgs> {
  // Attributes
  readonly name = ['list', 'ls'];
  readonly description = 'List workspaces';

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

  protected define<U>(builder: Builder<U>): Builder<U & ListArgs> {
    return super.define(y => builder(y)
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
      })
    );
  }

  protected async run(args: Arguments<ListArgs>): Promise<number | void> {
    await super.run(args);

    // Setup pipeline
    const pipeline = new Pipeline();

    if (args.private !== undefined) {
      pipeline.add(Filter.privateWorkspace(args.private));
    }

    if (args['with-script'] !== undefined) {
      pipeline.add(Filter.scripts(args['with-script']));
    }

    if (args.affected !== undefined) {
      pipeline.add(new AffectedFilter(
        args.affected,
        args['affected-rev-fallback'],
        args['affected-rev-sort']
      ));
    }

    // Filter
    const workspaces: Workspace[] = [];

    for await (const wks of pipeline.filter(this.project.workspaces())) {
      workspaces.push(wks);
    }

    this.spinner.stop();

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

    const data = workspaces.map(wks => this.buildExtractor(attrs)(wks, args.json || false));

    // Print data
    if (args.json) {
      if (process.stdout.isTTY) { // Pretty print for ttys
        this.log(JSON.stringify(data, null, 2));
      } else {
        this.log(JSON.stringify(data));
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
        this.log(d);
      }
    }
  }
}
