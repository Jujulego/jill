import { withLabel } from '@jujulego/logger';
import { inject$ } from '@kyrielle/injector';
import path from 'node:path';
import { Logger } from '../tokens.js';
import type { PackageManager } from '../utils/types.js';

export class Project {
  // Attributes
  private _packageManager?: PackageManager;
  private readonly _logger = inject$(Logger).child(withLabel('project'));
  private readonly _root: string;

  // Constructor
  constructor(
    root: string,
    opts: ProjectOptions = {}
  ) {
    this._root = root;

    if (opts.packageManager) {
      this._logger.verbose`Forced use of ${opts.packageManager} in ${root}`;
      this._packageManager = opts.packageManager;
    }
  }

  // Properties
  get root(): string {
    return path.resolve(this._root);
  }
}

// Types
export interface ProjectOptions {
  packageManager?: PackageManager | undefined;
}
