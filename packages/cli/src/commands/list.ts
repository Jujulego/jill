import { Workspace } from '@jujulego/jill-core';
import chalk from 'chalk';
import path from 'path';

import { logger } from '../logger';
import { CliList } from '../utils/cli-list';
import { spawn } from '../utils/spawn';
import { CommandHandler } from '../wrapper';

// Types
export type Attribute = 'name' | 'version' | 'root';

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

// Utils
type Extractor<T> = (wks: Workspace, argv: ListArgs) => T;

const extractors: Record<Attribute, Extractor<string | undefined>> = {
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

async function formatRev(rev: string, wks: Workspace, argv: ListArgs): Promise<string> {
  const log = logger.child({ label: wks.name });

  // Format revision
  let result = rev;
  result = result.replace(/(?<!\\)((?:\\\\)*)%name/g, `$1${wks.name}`);
  result = result.replace(/\\(.)/g, '$1');

  // Ask git to complete it
  const sortArgs = argv['affected-rev-sort'] ? ['--sort', argv['affected-rev-sort']] : [];

  // Search in branches
  if (result.includes('*')) {
    let { stdout: branches } = await spawn('git', ['branch', '-l', ...sortArgs, result], { cwd: wks.cwd, logger: log });
    branches = branches.map(tag => tag.trim());

    if (branches.length > 0) {
      result = branches[branches.length - 1];
    }
  }

  // Search in tags
  if (result.includes('*')) {
    let { stdout: tags } = await spawn('git', ['tag', '-l', ...sortArgs, result], { cwd: wks.cwd, logger: log });
    tags = tags.map(tag => tag.trim());

    if (tags.length > 0) {
      result = tags[tags.length - 1];
    }
  }

  if (result !== rev) {
    log.verbose(`Resolved ${rev} into ${result}`);
  }

  if (result.includes('*')) {
    log.warn(`No revision found matching ${result}, using fallback ${argv['affected-rev-fallback']}`);

    return argv['affected-rev-fallback'];
  }

  return result;
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

    if (argv['with-script'] !== undefined) {
      const scripts = Object.keys(wks.manifest.scripts || {});
      if (!argv['with-script'].some(scr => scripts.includes(scr))) continue;
    }

    if (argv.affected !== undefined) {
      const rev = await formatRev(argv.affected, wks, argv);
      if (!await wks.isAffected(rev)) continue;
    }

    workspaces.push(wks);
  }

  logger.stop();

  // Build data
  const attrs = argv.attrs || (argv.long || argv.json ? ['name', 'version', 'root'] : ['name']);
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
