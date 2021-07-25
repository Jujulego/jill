import { Workspace } from '@jujulego/jill-core';
import { CommandBuilder } from 'yargs';
import path from 'path';

import { logger } from '../logger';
import { CliList } from '../utils/cli-list';
import { commandHandler } from '../wrapper';

// Types
export interface ListArgs {
  // Filters
  affected?: string;
  private?: boolean;

  // Formats
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
    coerce: (rev: string) => rev || 'master',
    group: 'Filters:',
    desc: 'Print only affected workspaces towards given git revision. If no revision is given test against master',
  },
  private: {
    type: 'boolean',
    group: 'Filters:',
    desc: 'Print only private workspaces',
  },
  headers: {
    type: 'boolean',
    group: 'Format:',
    desc: 'Prints columns headers (defaults to true if long is set)'
  },
  long: {
    alias: 'l',
    type: 'boolean',
    default: false,
    group: 'Format:',
    desc: 'Prints more data on workspaces',
  },
  json: {
    type: 'boolean',
    default: false,
    group: 'Format:',
    desc: 'Prints data as a JSON array',
  }
};

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

  // Print data
  if (argv.json) {
    console.log(JSON.stringify(
      workspaces.map(wks => ({
        name: wks.name,
        version: wks.manifest.version || '',
        root: wks.cwd
      })),
      null, 2
    ));
  } else {
    const list = new CliList();

    if (argv.headers ?? argv.long) {
      if (argv.long) {
        list.setHeaders('Name', 'Version', 'Root');
      } else {
        list.setHeaders('Name');
      }
    }

    for (const wks of workspaces) {
      if (argv.long) {
        list.add([wks.name, wks.manifest.version || '', path.relative(process.cwd(), wks.cwd) || '.']);
      } else {
        list.add([wks.name]);
      }
    }

    for (const d of list.lines()) {
      console.log(d);
    }
  }

  process.exit(0);
});
