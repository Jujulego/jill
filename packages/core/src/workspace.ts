import path from 'path';
import { satisfies } from 'semver';
import { Logger } from 'winston';

import { git } from './git';
import { logger } from './logger';
import type { Manifest } from './manifest';
import { Project } from './project';
import { SpawnTask, SpawnTaskOption } from './tasks';
import { combine } from './utils';

// Types
export type WorkspaceDepsMode = 'all' | 'prod' | 'none';

export interface WorkspaceRunOptions extends Omit<SpawnTaskOption, 'cwd'> {
  buildDeps?: WorkspaceDepsMode;
}

// Class
export class Workspace {
  // Attributes
  private readonly _logger: Logger;
  private readonly _isAffected = new Map<string, boolean | SpawnTask>();
  private readonly _tasks = new Map<string, SpawnTask>();

  // Constructor
  constructor(
    private readonly _cwd: string,
    readonly manifest: Manifest,
    readonly project: Project
  ) {
    this._logger = logger.child({ label: manifest.name });
  }

  // Methods
  private _satisfies(from: Workspace, range: string): boolean {
    if (range.startsWith('file:')) {
      return path.resolve(from.cwd, range.substr(5)) === this.cwd;
    }

    if (range.startsWith('workspace:')) {
      range = range.substr(10);
    }

    return !this.version || satisfies(this.version, range);
  }

  private async _buildDependencies(task: SpawnTask, deps: WorkspaceDepsMode = 'all') {
    // Generators
    const generators: AsyncGenerator<Workspace, void>[] = [];

    switch (deps) {
      case 'all':
        generators.unshift(this.devDependencies());

      // eslint-disable-next no-fallthrough
      case 'prod':
        generators.unshift(this.dependencies());
    }

    // Build deps
    for await (const dep of combine(...generators)) {
      const build = await dep.build();

      if (build) {
        task.dependsOn(build);
      }
    }
  }

  async isAffected(base: string): Promise<boolean> {
    let isAffected = this._isAffected.get(base);

    if (typeof isAffected !== 'boolean') {
      // Run git diff
      if (!(isAffected instanceof SpawnTask)) {
        isAffected = git.diff(['--quiet', base, '--', this.cwd], {
          cwd: this.project.root,
          logger: this._logger,
          streamLogLevel: 'debug'
        });

        this._isAffected.set(base, isAffected);
      }

      // Wait for git diff to end and parse exit code
      if (!['done', 'failed'].includes(isAffected.status)) {
        await isAffected.waitFor('done', 'failed');
      }

      isAffected = isAffected.exitCode !== 0;

      // If not affected check for workspaces
      if (!isAffected) {
        // Test it's dependencies
        const proms: Promise<boolean>[] = [];

        for await (const dep of combine(this.dependencies(), this.devDependencies())) {
          proms.push(dep.isAffected(base));
        }

        const results = await Promise.all(proms);
        isAffected = results.some(r => r);
      }

      this._isAffected.set(base, isAffected);
    }

    return isAffected;
  }

  private async* _loadDependencies(dependencies: Record<string, string>, kind: string): AsyncGenerator<Workspace, void> {
    for (const [dep, range] of Object.entries(dependencies)) {
      const ws = await this.project.workspace(dep);

      if (ws) {
        if (ws._satisfies(this, range)) {
          yield ws;
        } else {
          this._logger.verbose(`Ignoring ${kind} ${ws.reference} as it does not match requirement ${range}`);
        }
      }
    }
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

  async run(script: string, args: string[] = [], opts: WorkspaceRunOptions = {}): Promise<SpawnTask> {
    let task = this._tasks.get(script);

    if (!task) {
      const pm = await this.project.packageManager();

      task = new SpawnTask(pm, ['run', script, ...args], {
        ...opts,
        cwd: this.cwd,
        logger: this._logger,
        context: { workspace: this }
      });
      await this._buildDependencies(task, opts.buildDeps);

      this._tasks.set(script, task);
    }

    return task;
  }

  async build(opts?: WorkspaceRunOptions): Promise<SpawnTask | null> {
    const { scripts = {} } = this.manifest;

    if (!scripts.build) {
      this._logger.warn('Will not be built (no build script)');
      return null;
    }

    return await this.run('build', [], opts);
  }

  // Properties
  get name(): string {
    return this.manifest.name;
  }

  get version(): string | undefined {
    return this.manifest.version;
  }

  get reference(): string {
    return this.version ? `${this.name}@${this.version}` : this.name;
  }

  get cwd(): string {
    return path.resolve(this.project.root, this._cwd);
  }
}
