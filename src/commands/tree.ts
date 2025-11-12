import type { CommandModule } from 'yargs';
import { traceImport } from '../utils/sentry.js';
import { loadWorkspace, withWorkspace, type WorkspaceArgs } from '../middlewares/workspace.js';

// Command
const command: CommandModule<unknown, TreeArgs> = {
  command: 'tree',
  describe: 'Print workspace dependency tree',
  builder: withWorkspace,
  async handler(args) {
    const workspace = await loadWorkspace(args);
    const { default: TreeInk } = await traceImport('TreeInk', () => import('./tree.ink.jsx'));

    await TreeInk({ workspace });
  }
};

export default command;

// Types
export interface TreeArgs extends WorkspaceArgs {}
