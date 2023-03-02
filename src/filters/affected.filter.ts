import { GitService } from '@/src/commons/git.service.js';
import { type Workspace } from '@/src/project/workspace.js';
import { lazyInject } from '@/src/inversify.config.js';
import { Logger } from '@/src/commons/logger.service.js';

import { type PipelineFilter } from './pipeline.js';

// Class
export class AffectedFilter implements PipelineFilter {
  // Properties
  @lazyInject(Logger)
  private readonly _logger: Logger;

  @lazyInject(GitService)
  private readonly _git: GitService;

  // Constructor
  constructor(
    readonly format: string,
    readonly fallback: string,
    readonly sort?: string,
  ) {}

  // Methods
  private async _formatRevision(wks: Workspace): Promise<string> {
    const logger = this._logger.child({ label: wks.name });

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
      logger.verbose(`Resolved ${this.format} into ${result}`);
    }

    if (result.includes('*')) {
      logger.warn(`No revision found matching ${result}, using fallback ${this.fallback}`);

      return this.fallback;
    }

    return result;
  }

  async test(workspace: Workspace): Promise<boolean> {
    const rev = await this._formatRevision(workspace);
    return await workspace.isAffected(rev);
  }
}
