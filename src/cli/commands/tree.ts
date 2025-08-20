import { startSpan } from '@sentry/node';
import type { CommandModule } from 'yargs';
import { instrumentLoad } from '../../utils/sentry.js';
import { loadWorkspace, withWorkspace, type WorkspaceArgs } from '../middlewares/workspace.js';

// Command
const command: CommandModule<unknown, TreeArgs> = {
  command: 'tree',
  describe: 'Print workspace dependency tree',
  builder: withWorkspace,
  async handler(args) {
    const workspace = await loadWorkspace(args);
    const { default: TreeInk } = await instrumentLoad('TreeInk', () => import('./tree.ink.jsx'));

    await TreeInk({ workspace });
  }
};

export default command;

// Types
export interface TreeArgs extends WorkspaceArgs {}
