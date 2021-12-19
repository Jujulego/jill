import { Workspace } from '@jujulego/jill-core';

import { Arguments, Builder, Exit } from './command';
import { ProjectArgs, ProjectCommand } from './project.command';

// Types
export interface WorkspaceArgs extends ProjectArgs {
  workspace: string | undefined;
}

// Command
export abstract class WorkspaceCommand<A extends WorkspaceArgs = WorkspaceArgs> extends ProjectCommand<WorkspaceArgs> {
  // Attributes
  private _workspace?: Workspace | null;

  // Methods
  protected define<T, U>(builder: Builder<T, U>): Builder<T, U & WorkspaceArgs> {
    return super.define(y => builder(y)
      .option('workspace', {
        alias: 'w',
        type: 'string',
        desc: 'Workspace to use'
      })
    );
  }

  protected async run(args: Arguments<A>): Promise<number | void> {
    await super.run(args);

    // Load workspace
    this.spinner.start(`Loading "${args.workspace || '.'}" workspace`);
    this._workspace = await (args.workspace ? this.project.workspace(args.workspace) : this.project.currentWorkspace());

    if (!this._workspace) {
      this.spinner.fail(`Workspace "${args.workspace || '.'}" not found`);
      throw new Exit(1);
    }
  }

  // Properties
  get workspace(): Workspace {
    if (!this._workspace) {
      throw new Error('Workspace not yet loaded !');
    }

    return this._workspace;
  }
}