import { Project as JProject, Workspace as JWorkspace } from '@jujulego/jill-core';
import { CommandContext, Configuration, Project as YProject, Workspace as YWorkspace } from '@yarnpkg/core';
import { npath } from '@yarnpkg/fslib';
import { Command } from 'clipanion';

// Class
export abstract class JillCommand extends Command<CommandContext> {
  // Methods
  async yarnConfig(): Promise<Configuration> {
    return await Configuration.find(this.context.cwd, this.context.plugins);
  }

  async yarnProject(): Promise<{ project: YProject, workspace: YWorkspace | null }> {
    return await YProject.find(await this.yarnConfig(), this.context.cwd);
  }

  async jillProject(): Promise<{ project: JProject, workspace: JWorkspace | null }> {
    const { project: prj, workspace: wks } = await this.yarnProject();

    const project = new JProject(npath.fromPortablePath(prj.cwd));
    const workspace = wks && await project.workspace((wks || prj.topLevelWorkspace).manifest.name!.name);

    return { project, workspace };
  }
}