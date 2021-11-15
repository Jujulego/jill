import AsyncLock from 'async-lock';
import { promises as fs } from 'fs';
import normalize, { Package } from 'normalize-package-data';
import path from 'path';
import glob from 'tiny-glob';

import { logger } from './logger';
import { Workspace } from './workspace';

// Types
export type PackageManager = 'npm' | 'yarn';
export interface ProjectOptions {
  packageManager?: PackageManager | undefined;
}

// Class
export class Project {
  // Attributes
  private _mainWorkspace?: Workspace;
  private readonly _names = new Map<string, Workspace>();
  private readonly _workspaces = new Map<string, Workspace>();

  private _packageManager?: PackageManager;
  private _isFullyLoaded = false;
  private _lock = new AsyncLock();

  // Constructor
  constructor(
    private readonly _root: string,
    opts: ProjectOptions = {}
  ) {
    if (opts.packageManager) {
      logger.debug(`Forced use of ${opts.packageManager} in ${path.relative(process.cwd(), this.root) || '.'}`);
      this._packageManager = opts.packageManager;
    }
  }

  // Statics
  static async searchProjectRoot(dir: string): Promise<string> {
    // Will process directories from dir to root
    let found = false;
    let last = dir;
    dir = path.resolve(dir);

    do {
      const files = await fs.readdir(dir);

      if (files.includes('package.json')) {
        last = dir;
        found = true;
      }

      if (['package-lock.json', 'yarn.lock'].some(lock => files.includes(lock))) {
        logger.debug(`Project root found at ${path.relative(process.cwd(), dir) || '.'}`);
        return dir;
      }

      dir = path.dirname(dir);
    } while (dir !== path.dirname(dir));

    if (found) {
      logger.debug(`Project root found at ${path.relative(process.cwd(), last) || '.'}`);
    } else {
      logger.debug(`Project root not found, keeping ${path.relative(process.cwd(), last) || '.'}`);
    }

    return last;
  }

  // Methods
  private async _loadManifest(dir: string): Promise<Package> {
    const file = path.resolve(this.root, dir, 'package.json');
    const log = logger.child({ label: path.relative(process.cwd(), path.dirname(file)) });
    log.verbose('Loading package.json ...');

    const data = await fs.readFile(file, 'utf-8');
    const mnf = JSON.parse(data);
    normalize(mnf, (msg) => log.verbose(msg));

    return mnf;
  }

  private async _loadWorkspace(dir: string): Promise<Workspace> {
    return await this._lock.acquire('workspaces', async () => {
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
        logger.debug(`Detected yarn in ${path.relative(process.cwd(), this.root) || '.'}`);
        this._packageManager = 'yarn';
      } else if (files.includes('package-lock.json')) {
        logger.debug(`Detected npm in ${path.relative(process.cwd(), this.root) || '.'}`);
        this._packageManager = 'npm';
      } else {
        logger.debug(`No package manager recognized in ${path.relative(process.cwd(), this.root) || '.'}, defaults to npm`);
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
    cwd = path.normalize(cwd);

    for await (const wks of this.workspaces()) {
      if (cwd.startsWith(path.normalize(wks.cwd))) {
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
    if (wks) return wks;

    if (this._isFullyLoaded) {
      return null;
    }

    // Load workspaces
    for await (const ws of this.workspaces()) {
      if (ws.name === name) {
        return ws;
      }
    }

    this._isFullyLoaded = true;
    return null;
  }

  // Properties
  get root(): string {
    return path.resolve(this._root);
  }
}
