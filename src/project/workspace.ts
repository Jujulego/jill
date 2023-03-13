import { injectable } from 'inversify';
import path from 'node:path';
import { type Package } from 'normalize-package-data';
import { satisfies } from 'semver';

import { GitService } from '@/src/commons/git.service';
import { container, lazyInject, lazyInjectNamed } from '@/src/inversify.config';
import { Logger } from '@/src/commons/logger.service';
import { CommandTask, type CommandOptions } from '@/src/tasks/command-task';
import { combine } from '@/src/utils/streams';

import { CURRENT } from './constants';
import { type Project } from './project';

// Types
export type WorkspaceDepsMode = 'all' | 'prod' | 'none';

export interface WorkspaceRunOptions extends Omit<CommandOptions, 'logger'> {
  buildDeps?: WorkspaceDepsMode;
  loggerLabel?: string;
}

// Class
@injectable()
export class Workspace {
  // Attributes
  private readonly _logger: Logger;
  private readonly _affectedCache = new Map<string, Promise<boolean>>();
  private readonly _tasks = new Map<string, CommandTask>();

  @lazyInject(GitService)
  private readonly _git: GitService;

  // Constructor
  constructor(
    private readonly _cwd: string,
    readonly manifest: Package,
    readonly project: Project
  ) {
    const logger = container.get(Logger);
    this._logger = logger.child({ label: this.manifest.name });
  }

  // Methods
  private _satisfies(from: Workspace, range: string): boolean {
    if (range.startsWith('file:')) {
      return path.resolve(from.cwd, range.substring(5)) === this.cwd;
    }

    if (range.startsWith('workspace:')) {
      range = range.substring(10);
    }

    return !this.version || satisfies(this.version, range);
  }

  private async _buildDependencies(task: CommandTask, deps: WorkspaceDepsMode = 'all') {
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

  private async _isAffected(reference: string): Promise<boolean> {
    const isAffected = await this._git.isAffected(reference, [this.cwd], {
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

  async isAffected(reference: string): Promise<boolean> {
    let isAffected = this._affectedCache.get(reference);

    if (!isAffected) {
      isAffected = this._isAffected(reference);
      this._affectedCache.set(reference, isAffected);
    }

    return await isAffected;
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

  async exec(command: string, args: string[] = [], opts: WorkspaceRunOptions = {}): Promise<CommandTask> {
    const { loggerLabel: label = `${this.name}$${command}` } = opts;

    const task = new CommandTask(this, { command, args }, {
      ...opts,
      logger: this._logger.child({ label }),
    });

    await this._buildDependencies(task, opts.buildDeps);

    return task;
  }

  async run(script: string, args: string[] = [], opts: WorkspaceRunOptions = {}): Promise<CommandTask> {
    let task = this._tasks.get(script);

    if (!task) {
      const pm = await this.project.packageManager();

      task = await this.exec(pm, ['run', script, ...args], {
        ...opts,
        loggerLabel: `${this.name}#${script}`
      });
      task.context.script = script;

      this._tasks.set(script, task);
    }

    return task;
  }

  async build(opts?: WorkspaceRunOptions): Promise<CommandTask | null> {
    const { scripts = {} } = this.manifest;

    if (!scripts.build) {
      this._logger.warn('Will not be built (no build script)');
      return null;
    }

    return await this.run('build', [], opts);
  }

  toJSON() {
    return {
      name: this.name,
      version: this.version,
      cwd: this.cwd,
    };
  }

  // Properties
  get name(): string {
    return this.manifest.name;
  }

  get version(): string {
    return this.manifest.version;
  }

  get reference(): string {
    return this.version ? `${this.name}@${this.version}` : this.name;
  }

  get cwd(): string {
    return path.resolve(this.project.root, this._cwd);
  }
}

// Decorators
export function LazyCurrentWorkspace() {
  return lazyInjectNamed(Workspace, CURRENT);
}
