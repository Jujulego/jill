import { git, logger, Workspace } from '@jujulego/jill-core';

import { Filter } from './filter';

// Class
export class AffectedFilter extends Filter {
  // Constructor
  constructor(
    readonly format: string,
    readonly fallback: string,
    readonly sort?: string,
  ) {
    super();
  }

  // Methods
  private async _formatRevision(wks: Workspace): Promise<string> {
    const log = logger.child({ label: wks.name });

    // Format revision
    let result = this.format;
    result = result.replace(/(?<!\\)((?:\\\\)*)%name/g, `$1${wks.name}`);
    result = result.replace(/\\(.)/g, '$1');

    // Ask git to complete it
    const sortArgs = this.sort ? ['--sort', this.sort] : [];

    // - search in branches
    if (result.includes('*')) {
      const branches = await git.listBranches([...sortArgs, result], { cwd: wks.cwd, logger: log, streamLogLevel: 'debug' });

      if (branches.length > 0) {
        result = branches[branches.length - 1];
      }
    }

    // - search in tags
    if (result.includes('*')) {
      const tags = await git.listTags([...sortArgs, result], { cwd: wks.cwd, logger: log, streamLogLevel: 'debug' });

      if (tags.length > 0) {
        result = tags[tags.length - 1];
      }
    }

    if (result !== this.format) {
      log.verbose(`Resolved ${this.format} into ${result}`);
    }

    if (result.includes('*')) {
      log.warn(`No revision found matching ${result}, using fallback ${this.fallback}`);

      return this.fallback;
    }

    return result;
  }

  async test(workspace: Workspace): Promise<boolean> {
    const rev = await this._formatRevision(workspace);
    return await workspace.isAffected(rev);
  }
}