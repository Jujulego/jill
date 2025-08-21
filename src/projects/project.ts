import { asyncScope$, inject$ } from '@kyrielle/injector';
import { withLabel } from '@kyrielle/logger';
import { Glob } from 'glob';
import fs from 'node:fs';
import path from 'node:path';
import normalize, { type Package } from 'normalize-package-data';
import { CWD, LOGGER, PATH_SCURRY } from '../tokens.js';
import { mutex$, with$ } from '../utils/kyrielle.js';
import { traceAsyncGenerator, instrument } from '../utils/sentry.js';
import type { PackageManager } from '../utils/types.js';
import { Workspace } from './workspace.js';

export class Project {
  // Attributes
  private _isFullyLoaded = false;
  private _lock = mutex$();
  private _mainWorkspace?: Workspace;
  private _packageManager?: PackageManager;
  private _workspaceGlob?: Glob<{ withFileTypes: true }>;

  private readonly _names = new Map<string, Workspace>();
  private readonly _logger = inject$(LOGGER).child(withLabel('project'));
  private readonly _root: string;
  private readonly _scurry = inject$(PATH_SCURRY);
  private readonly _workspaces = new Map<string, Workspace>();

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

  // Methods
  private async _loadManifest(dir: string): Promise<Package> {
    const file = path.resolve(this.root, dir, 'package.json');

    const relative = path.relative(this.root, path.dirname(file));
    const logger = this._logger.child(withLabel(relative ? `project@${relative}` : 'project'));

    logger.debug('loading package.json ...');

    const data = await fs.promises.readFile(file, 'utf-8');
    const mnf = JSON.parse(data) as Package;
    normalize(mnf, (msg) => logger.verbose(msg));

    return mnf;
  }

  private _loadWorkspace(dir: string): Promise<Workspace> {
    return with$(this._lock, async () => {
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

  @instrument('Project.currentWorkspace')
  async currentWorkspace(cwd = inject$(CWD, asyncScope$())): Promise<Workspace | null> {
    let workspace: Workspace | null = null;
    cwd = path.resolve(cwd);

    for await (const wks of this.workspaces()) {
      if (cwd.startsWith(wks.root)) {
        workspace = wks;

        if (wks.root !== this.root) return wks;
      }
    }

    return workspace;
  }

  @instrument('Project.mainWorkspace')
  async mainWorkspace(): Promise<Workspace> {
    if (!this._mainWorkspace) {
      const manifest = await this._loadManifest('.');
      this._mainWorkspace = new Workspace('.', manifest, this);

      this._names.set(this._mainWorkspace.name, this._mainWorkspace);
    }

    return this._mainWorkspace;
  }

  @instrument('Project.packageManager')
  async packageManager(): Promise<PackageManager> {
    if (!this._packageManager) {
      this._logger.debug`searching lockfile in ${this.root}`;
      const files = await this._scurry.readdir(this.root, { withFileTypes: false });

      if (files.includes('yarn.lock')) {
        this._logger.debug`detected yarn in ${this.root}`;
        this._packageManager = 'yarn';
      } else if (files.includes('package-lock.json')) {
        this._logger.debug`detected npm in ${this.root}`;
        this._packageManager = 'npm';
      } else {
        this._logger.debug`no package manager recognized in ${this.root}, defaults to npm`;
        this._packageManager = 'npm';
      }
    }

    return this._packageManager;
  }

  @instrument('Project.workspace')
  async workspace(name?: string): Promise<Workspace | null> {
    // With current directory
    if (!name) {
      const dir = path.relative(this.root, inject$(CWD, asyncScope$()));
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

  @instrument({ name: 'Project.workspaces', use: traceAsyncGenerator })
  async* workspaces(): AsyncGenerator<Workspace> {
    const main = await this.mainWorkspace();
    yield main;

    if (this._isFullyLoaded) {
      for (const wks of this._names.values()) {
        if (wks.name !== main.name) yield wks;
      }
    } else {
      // Load child workspaces
      const patterns = (main.manifest.workspaces ?? []) as string[];
      this._scurry.chdir(this.root);
      this._workspaceGlob ??= new Glob(patterns, { scurry: this._scurry, withFileTypes: true });

      for await (const dir of this._workspaceGlob) {
        try {
          // Check if dir is a directory
          if (dir.isDirectory()) {
            yield await this._loadWorkspace(dir.fullpath());
          }
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            continue;
          }

          throw error;
        }
      }

      this._isFullyLoaded = true;
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
