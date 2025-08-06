import { inject$ } from '@kyrielle/injector';
import { type Logger, withLabel } from '@kyrielle/logger';
import path from 'node:path';
import type { Package } from 'normalize-package-data';
import { LOGGER } from '../tokens.js';
import type { Project } from './project.js';

export class Workspace {
  // Attributes
  private readonly _logger: Logger;
  private readonly _root: string;

  // Constructor
  constructor(
    root: string,
    readonly manifest: Package,
    readonly project: Project,
  ) {
    this._root = root;
    this._logger = inject$(LOGGER).child(withLabel(manifest.name));
  }

  // Properties
  get name(): string {
    return this.manifest.name;
  }

  get reference(): string {
    return this.version ? `${this.name}@${this.version}` : this.name;
  }

  get root(): string {
    return path.resolve(this.project.root, this._root);
  }

  get version(): string {
    return this.manifest.version;
  }
}