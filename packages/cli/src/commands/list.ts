import { Workspace } from '@jujulego/jill-core';
import chalk from 'chalk';
import path from 'path';
import slugify from 'slugify';

import { AffectedFilter, Filter } from '../filters';
import { logger } from '../logger';
import { Pipeline } from '../pipeline';
import { CliList } from '../utils/cli-list';
import { CommandHandler } from '../wrapper';

// Types
export type Attribute = 'name' | 'version' | 'root' | 'slug';
export type Data = Partial<Record<Attribute, string>>;

export interface ListArgs {
  // Filters
  private: boolean | undefined;
  'with-script': string[] | undefined;

  // Affected
  affected: string | undefined;
  'affected-rev-fallback': string;
  'affected-rev-sort': string | undefined;

  // Formats
  attrs: Attribute[] | undefined;
  headers: boolean | undefined;
  long: boolean;
  json: boolean;
}

// Constants
const LONG_ATTRIBUTES: Attribute[] = ['name', 'version', 'root'];
const JSON_ATTRIBUTES: Attribute[] = ['name', 'version', 'slug', 'root'];
const DEFAULT_ATTRIBUTES: Attribute[] = ['name'];

// Utils
type Extractor<T> = (wks: Workspace, argv: ListArgs) => T;

const extractors: Record<Attribute, Extractor<string | undefined>> = {
  name: wks => wks.name,
  version: (wks, argv) => wks.manifest.version || (argv.json ? undefined : chalk.grey('unset')),
  root: wks => wks.cwd,
  slug: wks => slugify(wks.name)
};

function buildExtractor(attrs: Attribute[]): Extractor<Data> {
  return (wks, argv: ListArgs) => {
    const data: Data = {};

    for (const attr of attrs) {
      data[attr] = extractors[attr](wks, argv);
    }

    return data;
  };
}

// Handler
export const listCommand: CommandHandler<ListArgs> = async (prj, argv) => {
  logger.spin('Loading project');

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

  for await (const wks of pipeline.filter(prj.workspaces())) {
    workspaces.push(wks);
  }

  logger.stop();

  // Build data
  let attrs = argv.attrs || DEFAULT_ATTRIBUTES;

  if (!argv.attrs) {
    if (argv.long) {
      attrs = LONG_ATTRIBUTES;
    } else if (argv.json) {
      attrs = JSON_ATTRIBUTES;
    }
  }

  const data = workspaces.map(wks => buildExtractor(attrs)(wks, argv));

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

  return 0;
};
