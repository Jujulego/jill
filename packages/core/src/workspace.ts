import path from 'path';

import { Manifest } from './manifest';
import { Project } from './project';
// import { logger } from './logger';

// Class
export class Workspace {
  // Constructor
  constructor(
    private readonly _cwd: string,
    readonly manifest: Manifest,
    readonly project: Project
  ) {}

  // Methods
  async* dependencies(): AsyncGenerator<Workspace, void, unknown> {
    if (!this.manifest.dependencies) return;

    for (const dep of Object.keys(this.manifest.dependencies)) {
      const ws = await this.project.workspace(dep);

      if (ws) {
        yield ws;
      }
    }
  }

  async* devDependencies(): AsyncGenerator<Workspace, void, unknown> {
    if (!this.manifest.devDependencies) return;

    for (const dep of Object.keys(this.manifest.devDependencies)) {
      const ws = await this.project.workspace(dep);

      if (ws) {
        yield ws;
      }
    }
  }

  hasScript(name: string): boolean {
    return !!(this.manifest.scripts && this.manifest.scripts[name]);
  }

  // Properties
  get name(): string {
    return this.manifest.name;
  }

  get cwd(): string {
    return path.resolve(this.project.root, this._cwd);
  }
}
