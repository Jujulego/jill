import { inject$ } from '@kyrielle/injector';
import { type Logger, withLabel } from '@kyrielle/logger';
import path from 'node:path';
import type { Package } from 'normalize-package-data';
import { satisfies } from 'semver';
import { GitService } from '../commons/git.service.js';
import { LOGGER } from '../tokens.js';
import { combine } from '../utils/streams.js';
import type { Project } from './project.js';

export class Workspace {
  // Attributes
  private readonly _affectedCache = new Map<string, Promise<boolean>>();
  private readonly _logger: Logger;
  private readonly _git = inject$(GitService);
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

  // Methods
  private async* _loadDependencies(dependencies: Record<string, string>, kind: string): AsyncGenerator<Workspace, void> {
    for (const [dep, range] of Object.entries(dependencies)) {
      const ws = await this.project.workspace(dep);

      if (ws) {
        if (ws._satisfies(this, range)) {
          yield ws;
        } else {
          this._logger.warning(`ignoring ${kind} ${ws.reference} as it does not match requirement ${range}`);
        }
      }
    }
  }

  private async _isAffected(reference: string): Promise<boolean> {
    const isAffected = await this._git.isAffected(reference, [this.root], {
      cwd: this.project.root,
      logger: this._logger,
    });

    if (isAffected) {
      return true;
    }

    // Test dependencies
    const proms: Promise<boolean>[] = [];

    for await (const dep of combine(this.dependencies(), this.devDependencies())) {
      proms.push(dep.isAffected(reference));
    }

    const results = await Promise.all(proms);
    return results.some(r => r);
  }

  private _satisfies(from: Workspace, range: string): boolean {
    if (range.startsWith('file:')) {
      return path.resolve(from.root, range.substring(5)) === this.root;
    }

    if (range.startsWith('workspace:')) {
      range = range.substring(10);
    }

    return !this.version || satisfies(this.version, range);
  }

  async isAffected(reference: string): Promise<boolean> {
    let isAffected = this._affectedCache.get(reference);

    if (!isAffected) {
      isAffected = this._isAffected(reference);
      this._affectedCache.set(reference, isAffected);
    }

    return await isAffected;
  }

  async* dependencies(): AsyncGenerator<Workspace, void> {
    if (!this.manifest.dependencies) return;

    for await (const ws of this._loadDependencies(this.manifest.dependencies, 'dependency')) {
      yield ws;
    }
  }

  async* devDependencies(): AsyncGenerator<Workspace, void> {
    if (!this.manifest.devDependencies) return;

    for await (const ws of this._loadDependencies(this.manifest.devDependencies, 'devDependency')) {
      yield ws;
    }
  }

  getScript(script: string): string | null {
    const { scripts = {} } = this.manifest;
    return scripts[script] || null;
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
