import { Project as JProject, Workspace as JWorkspace } from '@jujulego/jill-core';
import { CommandContext, Configuration, Project as YProject, Workspace as YWorkspace } from '@yarnpkg/core';
import { npath } from '@yarnpkg/fslib';
import { Command } from 'clipanion';

// Class
export abstract class JillCommand extends Command<CommandContext> {
  // Attributes
  private _yarnCfg?: Configuration;
  private _yarnPrj?: YProject;
  private _yarnWks?: YWorkspace;

  private _jillPrj?: JProject;
  private _jillWks?: JWorkspace | null;

  // Methods
  async yarnConfig(): Promise<Configuration> {
    if (!this._yarnCfg) {
      this._yarnCfg = await Configuration.find(this.context.cwd, this.context.plugins);
    }

    return this._yarnCfg;
  }

  async yarnCtx(): Promise<{ project: YProject, workspace: YWorkspace }> {
    if (!this._yarnPrj || this._yarnWks === undefined) {
      const { project, workspace } = await YProject.find(await this.yarnConfig(), this.context.cwd);

      this._yarnPrj = project;
      this._yarnWks = workspace || project.topLevelWorkspace;
    }

    return { project: this._yarnPrj, workspace: this._yarnWks };
  }

  async yarnPrj(): Promise<YProject> {
    return (await this.yarnCtx()).project;
  }

  async yarnWks(): Promise<YWorkspace> {
    return (await this.yarnCtx()).workspace;
  }

  async jillPrj(): Promise<JProject> {
    if (!this._jillPrj) {
      const prj = await this.yarnPrj();
      this._jillPrj = new JProject(npath.fromPortablePath(prj.cwd));
    }

    return this._jillPrj;
  }

  async jillWks(): Promise<JWorkspace | null> {
    if (this._jillWks === undefined) {
      const [prj, wks] = await Promise.all([this.jillPrj(), this.yarnWks()]);
      this._jillWks = wks && await prj.workspace(wks.manifest.name!.name);
    }

    return this._jillWks;
  }
}