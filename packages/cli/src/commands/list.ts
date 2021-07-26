import { Workspace } from '@jujulego/jill-core';
import { CommandBuilder } from 'yargs';
import chalk from 'chalk';
import path from 'path';

import { logger } from '../logger';
import { CliList } from '../utils/cli-list';
import { commandHandler } from '../wrapper';

// Types
export type Attribute = 'name' | 'version' | 'root';

export type Data = Partial<Record<Attribute, string>>;

export interface ListArgs {
  // Filters
  affected?: string;
  private?: boolean;

  // Formats
  attrs?: Attribute[];
  headers?: boolean;
  long: boolean;
  json: boolean;
}

// Command
export const command = 'list';
export const aliases = ['ls'];
export const describe = 'List workspaces';

export const builder: CommandBuilder = {
  affected: {
    alias: 'a',
    type: 'string',
    coerce: (rev: string) => rev === '' ? 'master' : rev,
    group: 'Filters:',
    desc: 'Print only affected workspaces towards given git revision. If no revision is given test against master',
  },
  private: {
    type: 'boolean',
    group: 'Filters:',
    desc: 'Print only private workspaces',
  },
  attrs: {
    type: 'array',
    choices: ['name', 'version', 'root'],
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
};

// Utils
type Extractor<T> = (wks: Workspace) => T;

const extractors: Record<Attribute, Extractor<string>> = {
  name: wks => wks.name,
  version: wks => wks.manifest.version || chalk.grey('unset'),
  root: wks => wks.cwd
};

function buildExtractor(attrs: Attribute[]): Extractor<Data> {
  return (wks) => {
    const data: Data = {};

    for (const attr of attrs) {
      data[attr] = extractors[attr](wks);
    }

    return data;
  };
}

// Handler
export const handler = commandHandler<ListArgs>(async (prj, argv) => {
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

    workspaces.push(wks);
  }

  logger.stop();

  // Build data
  const attrs = argv.attrs || (argv.long || argv.json ? ['name', 'version', 'root'] : ['name']);
  const data = workspaces.map(buildExtractor(attrs));

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

  process.exit(0);
});
