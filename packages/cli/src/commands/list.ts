import { Workspace } from '@jujulego/jill-core';
import chalk from 'chalk';
import path from 'path';

import { logger } from '../logger';
import { CliList } from '../utils/cli-list';
import { CommandHandler } from '../wrapper';

// Types
export type Attribute = 'name' | 'version' | 'root';

export type Data = Partial<Record<Attribute, string>>;

export interface ListArgs {
  // Filters
  affected: string | undefined;
  private: boolean | undefined;
  'with-script': string | undefined;

  // Formats
  attrs: Attribute[] | undefined;
  headers: boolean | undefined;
  long: boolean;
  json: boolean;
}

// Utils
type Extractor<T> = (wks: Workspace, argv: ListArgs) => T;

const extractors: Record<Attribute, Extractor<string>> = {
  name: wks => wks.name,
  version: (wks, argv) => wks.manifest.version || (argv.json ? undefined : chalk.grey('unset')),
  root: wks => wks.cwd
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
  // Get data
  logger.spin('Loading project');
  const workspaces: Workspace[] = [];

  for await (const wks of prj.workspaces()) {
    // Filter
    if (argv.private !== undefined) {
      if ((wks.manifest.private ?? false) !== argv.private) continue;
    }

    if (argv.affected !== undefined) {
      if (!await wks.isAffected(argv.affected)) continue;
    }

    if (argv['with-script'] !== undefined) {
      if (!(argv['with-script'] in (wks.manifest.scripts || {}))) continue;
    }

    workspaces.push(wks);
  }

  logger.stop();

  // Build data
  const attrs = argv.attrs || (argv.long || argv.json ? ['name', 'version', 'root'] : ['name']);
  const data = workspaces.map(wks => buildExtractor(attrs)(wks, argv));

  // Print data
  if (argv.json) {
    console.log(JSON.stringify(data, null, 2));
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
