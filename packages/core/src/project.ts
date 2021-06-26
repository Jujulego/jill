import { promises as fs } from 'fs';
import path from 'path';
import glob from 'tiny-glob';

import { Manifest } from './manifest';
import { logger } from './logger';
import { Workspace } from './workspace';

// Class
export class Project {
  // Attributes
  private _mainWorkspace?: Workspace;
  private readonly _names = new Map<string, Workspace>();
  private readonly _workspaces = new Map<string, Workspace>();

  // Constructor
  constructor(private readonly _root: string) {}

  // Methods
  private async _loadManifest(dir: string): Promise<Manifest> {
    const file = path.resolve(this.root, dir, 'package.json');
    logger.verbose(`Loading ${path.relative(process.cwd(), file)} ...`);

    const data = await fs.readFile(file, 'utf-8');
    return JSON.parse(data) as Manifest;
  }

  private async _loadWorkspace(dir: string): Promise<Workspace> {
    let ws = this._workspaces.get(dir);

    if (!ws) {
      const manifest = await this._loadManifest(dir);
      ws = new Workspace(dir, manifest, this);

      this._workspaces.set(dir, ws);
      this._names.set(ws.name, ws);
    }

    return ws;
  }

  async mainWorkspace(): Promise<Workspace> {
    if (!this._mainWorkspace) {
      const manifest = await this._loadManifest('.');
      this._mainWorkspace = new Workspace('.', manifest, this);

      this._names.set(this._mainWorkspace.name, this._mainWorkspace);
    }

    return this._mainWorkspace;
  }

  async* workspaces(): AsyncGenerator<Workspace, void, unknown> {
    const main = await this.mainWorkspace();
    yield main;

    // Load child workspaces
    const { workspaces = [] } = main.manifest;

    for (const pattern of workspaces) {
      for (const dir of await glob(pattern, { cwd: this.root })) {
        yield this._loadWorkspace(dir);
      }
    }
  }

  async workspace(name?: string): Promise<Workspace | null> {
    // With current directory
    if (!name) {
      const dir = path.relative(this.root, process.cwd());
      return this._loadWorkspace(dir);
    }

    // Try name index
    const ws = this._names.get(name);
    if (ws) return ws;

    // Load workspaces
    for await (const ws of this.workspaces()) {
      if (ws.name === name) {
        return ws;
      }
    }

    return null;
  }

  // Properties
  get root(): string {
    return path.resolve(this._root);
  }
}
