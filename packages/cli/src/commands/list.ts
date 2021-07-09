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
  json: boolean;
  long: boolean;
}

// Command
export const command = 'list';
export const aliases = ['ls'];
export const describe = 'List workspaces';

export const builder: CommandBuilder = {
  affected: {
    alias: 'a',
    type: 'string',
    group: 'Filters:'
  },
  private: {
    type: 'boolean',
    group: 'Filters:'
  },
  long: {
    alias: 'l',
    type: 'boolean',
    default: false,
    group: 'Format:'
  },
  json: {
    type: 'boolean',
    default: false,
    group: 'Format:'
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
      if (!await wks.isAffected(argv.affected || 'master')) continue;
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
