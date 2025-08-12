import { inject$ } from '@kyrielle/injector';
import { withLabel } from '@kyrielle/logger';
import { asyncIterator$, type PipeStep, type SimpleAsyncIterator } from 'kyrielle';
import { GitService } from '../commons/git.service.js';
import { type Workspace as LegacyWorkspace } from '../project/workspace.js';
import { type Workspace } from '../projects/workspace.js';
import { LOGGER } from '../tokens.js';
import { type PipelineFilter } from './pipeline.js';

// Class
/** @deprecated */
export class AffectedFilter implements PipelineFilter {
  // Properties
  private readonly _logger = inject$(LOGGER);
  private readonly _git = inject$(GitService);

  // Constructor
  constructor(
    readonly format: string,
    readonly fallback: string,
    readonly sort?: string,
  ) {}

  // Methods
  private async _formatRevision(wks: LegacyWorkspace): Promise<string> {
    const logger = this._logger.child(withLabel(wks.name));

    // Format revision
    let result = this.format;
    result = result.replace(/(?<!\\)((?:\\\\)*)%name/g, `$1${wks.name}`);
    result = result.replace(/\\(.)/g, '$1');

    // Ask git to complete it
    const sortArgs = this.sort ? ['--sort', this.sort] : [];

    // - search in branches
    if (result.includes('*')) {
      const branches = await this._git.listBranches([...sortArgs, result], { cwd: wks.cwd, logger: logger });

      if (branches.length > 0) {
        result = branches[branches.length - 1];
      }
    }

    // - search in tags
    if (result.includes('*')) {
      const tags = await this._git.listTags([...sortArgs, result], { cwd: wks.cwd, logger: logger });

      if (tags.length > 0) {
        result = tags[tags.length - 1];
      }
    }

    if (result !== this.format) {
      logger.verbose`Resolved ${this.format} into ${result}`;
    }

    if (result.includes('*')) {
      logger.warning(`No revision found matching ${result}, using fallback ${this.fallback}`);

      return this.fallback;
    }

    return result;
  }

  async test(workspace: LegacyWorkspace): Promise<boolean> {
    const rev = await this._formatRevision(workspace);
    return await workspace.isAffected(rev);
  }
}

export function isAffected$(opts: IsAffectedOpts): PipeStep<SimpleAsyncIterator<Workspace>, SimpleAsyncIterator<Workspace>> {
  return (origin) => {
    return asyncIterator$((async function* () {
      for await (const wks of origin) {
        const revision = await formatRevision(opts, wks);

        if (await wks.isAffected(revision)) {
          yield wks;
        }
      }
    })());
  };
}

async function formatRevision(opts: IsAffectedOpts, workspace: Workspace) {
  const git = inject$(GitService);
  const logger = inject$(LOGGER).child(withLabel(workspace.name));

  // Format revision
  let result = opts.format;
  result = result.replace(/(?<!\\)((?:\\\\)*)%name/g, `$1${workspace.name}`);
  result = result.replace(/\\(.)/g, '$1');

  // Ask git to complete it
  const sortArgs = opts.sort ? ['--sort', opts.sort] : [];

  // - search in branches
  if (result.includes('*')) {
    const branches = await git.listBranches([...sortArgs, result], { cwd: workspace.root, logger: logger });

    if (branches.length > 0) {
      result = branches[branches.length - 1]!;
    }
  }

  // - search in tags
  if (result.includes('*')) {
    const tags = await git.listTags([...sortArgs, result], { cwd: workspace.root, logger: logger });

    if (tags.length > 0) {
      result = tags[tags.length - 1]!;
    }
  }

  if (result !== opts.format) {
    logger.verbose(`resolved ${opts.format} into ${result}`);
  }

  if (result.includes('*')) {
    logger.warning(`no revision found matching ${result}, using fallback ${opts.fallback}`);

    return opts.fallback;
  }

  return result;
}

// Types
export interface IsAffectedOpts {
  readonly format: string;
  readonly fallback: string;
  readonly sort?: string | undefined;
}