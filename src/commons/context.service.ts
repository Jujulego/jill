import { inject } from 'inversify';
import { AsyncLocalStorage } from 'node:async_hooks';

import { Logger } from '@/src/commons/logger.service';
import { Service } from '@/src/modules/service';
import { type Project } from '@/src/project/project';
import { type Workspace } from '@/src/project/workspace';

// Types
export interface Context {
  project?: Project;
  workspace?: Workspace;
}

// Service
@Service()
export class ContextService implements Context {
  // Attributes
  private readonly _logger: Logger;
  private readonly _storage = new AsyncLocalStorage<Context>();

  // Constructor
  constructor(
    @inject(Logger) logger: Logger,
  ) {
    this._logger = logger.child({ label: 'context' });
  }

  // Methods
  reset(context: Context = {}): void {
    this._storage.enterWith(context);
  }

  private _getContext(): Context {
    const ctx = this._storage.getStore();

    if (!ctx) {
      this._logger.warn('Trying to access uninitialized context');
      return {};
    }

    return ctx;
  }

  private _updateContext(update: Partial<Context>): void {
    Object.assign(this._getContext(), update);
  }

  // Properties
  get project(): Project | undefined {
    return this._getContext().project;
  }

  set project(project: Project | undefined) {
    this._updateContext({ project });
  }

  get workspace(): Workspace | undefined {
    return this._getContext().workspace;
  }

  set workspace(workspace: Workspace | undefined) {
    this._updateContext({ workspace });
  }
}
