import { Logger, withLabel } from '@jujulego/logger';
import { Lock } from '@jujulego/utils';
import { injectable } from 'inversify';
import fs from 'node:fs/promises';
import path from 'node:path';
import normalize, { type Package } from 'normalize-package-data';
import glob from 'tiny-glob';

import { Workspace } from './workspace.ts';
import { type PackageManager } from './types.ts';

// Types
export interface ProjectOptions {
  packageManager?: PackageManager | undefined;
}

// Class
@injectable()
export class Project {
  // Attributes
  private _mainWorkspace?: Workspace;
  private readonly _names = new Map<string, Workspace>();
  private readonly _workspaces = new Map<string, Workspace>();

  private _packageManager?: PackageManager;
  private _isFullyLoaded = false;
  private _lock = new Lock();

  // Constructor
  constructor(
    private readonly _root: string,
    private readonly _logger: Logger,
    opts: ProjectOptions = {}
  ) {
    if (opts.packageManager) {
      this._logger.debug`Forced use of ${opts.packageManager} in #!cwd:${this.root}`;
      this._packageManager = opts.packageManager;
    }
  }

  // Methods
  private async _loadManifest(dir: string): Promise<Package> {
    const file = path.resolve(this.root, dir, 'package.json');

    const relative = path.relative(this.root, path.dirname(file));
    const logger = this._logger.child(withLabel(relative ? `project@${relative}` : 'project'));

    logger.debug('Loading package.json ...');

    const data = await fs.readFile(file, 'utf-8');
    const mnf = JSON.parse(data);
    normalize(mnf, (msg) => logger.verbose(msg));

    return mnf;
  }

  private async _loadWorkspace(dir: string): Promise<Workspace> {
    return await this._lock.with(async () => {
      let wks = this._workspaces.get(dir);

      if (!wks) {
        const manifest = await this._loadManifest(dir);
        wks = new Workspace(dir, manifest, this);

        this._workspaces.set(dir, wks);
        this._names.set(wks.name, wks);
      }

      return wks;
    });
  }

  async packageManager(): Promise<PackageManager> {
    if (!this._packageManager) {
      const files = await fs.readdir(this.root);

      if (files.includes('yarn.lock')) {
        this._logger.debug`Detected yarn in #!cwd:${this.root}`;
        this._packageManager = 'yarn';
      } else if (files.includes('package-lock.json')) {
        this._logger.debug`Detected npm in #!cwd:${this.root}`;
        this._packageManager = 'npm';
      } else {
        this._logger.debug`No package manager recognized in #!cwd:${this.root}, defaults to npm`;
        this._packageManager = 'npm';
      }
    }

    return this._packageManager;
  }

  async mainWorkspace(): Promise<Workspace> {
    if (!this._mainWorkspace) {
      const manifest = await this._loadManifest('.');
      this._mainWorkspace = new Workspace('.', manifest, this);

      this._names.set(this._mainWorkspace.name, this._mainWorkspace);
    }

    return this._mainWorkspace;
  }

  async currentWorkspace(cwd = process.cwd()): Promise<Workspace | null> {
    let workspace: Workspace | null = null;
    cwd = path.resolve(cwd);

    for await (const wks of this.workspaces()) {
      if (cwd.startsWith(wks.cwd)) {
        workspace = wks;

        if (wks.cwd !== this.root) return wks;
      }
    }

    return workspace;
  }

  async* workspaces(): AsyncGenerator<Workspace, void> {
    const main = await this.mainWorkspace();
    yield main;

    if (this._isFullyLoaded) {
      for (const wks of this._names.values()) {
        if (wks.name !== main.name) yield wks;
      }
    } else {
      // Load child workspaces
      const { workspaces = [] } = main.manifest;

      for (const pattern of workspaces) {
        for (const dir of await glob(pattern, { cwd: this.root })) {
          try {
            // Check if dir is a directory exists
            const file = path.resolve(this.root, dir);
            const stat = await fs.stat(file);

            if (stat.isDirectory()) {
              yield await this._loadWorkspace(dir);
            }

          } catch (error) {
            if (error.code === 'ENOENT') {
              continue;
            }

            throw error;
          }
        }
      }

      this._isFullyLoaded = true;
    }
  }

  async workspace(name?: string): Promise<Workspace | null> {
    // With current directory
    if (!name) {
      const dir = path.relative(this.root, process.cwd());
      return this._loadWorkspace(dir);
    }

    // Try name index
    const wks = this._names.get(name);

    if (wks) {
      return wks;
    }

    // Load workspaces
    if (!this._isFullyLoaded) {
      for await (const ws of this.workspaces()) {
        if (ws.name === name) {
          return ws;
        }
      }

      this._isFullyLoaded = true;
    }

    return null;
  }

  // Properties
  get root(): string {
    return path.resolve(this._root);
  }
}
