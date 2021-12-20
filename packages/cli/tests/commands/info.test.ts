import { Project, Workspace } from '@jujulego/jill-core';
import chalk from 'chalk';

import { InfoCommand } from '../../src/commands/info.command';
import { WorkspaceArgs } from '../../src/workspace.command';
import { TestArgs, TestBed } from '../test-bed';

// Setup
chalk.level = 1;

let project: Project;
let testBed: TestBed<WorkspaceArgs, InfoCommand>;

const defaults: TestArgs<WorkspaceArgs> = {
  verbose: 0,
  project: '/project',
  'package-manager': undefined,
  workspace: undefined
};

beforeEach(() => {
  project = new Project('.');
  testBed = new TestBed(new InfoCommand());

  // Mocks
  jest.resetAllMocks();
  jest.restoreAllMocks();

  jest.spyOn(testBed.command, 'project', 'get').mockReturnValue(project);
});

// Tests
describe('jill info', () => {
  it('should exit 1 if workspace doesn\'t exists', async () => {
    jest.spyOn(project, 'workspace').mockResolvedValue(null);

    // Call
    await expect(testBed.run({ ...defaults, workspace: 'does-not-exists' }))
      .resolves.toBe(1);

    // Checks
    expect(testBed.spinner.start).toHaveBeenCalledWith('Loading "does-not-exists" workspace');
    expect(project.workspace).toHaveBeenCalledWith('does-not-exists');
    expect(testBed.spinner.fail).toHaveBeenCalledWith('Workspace "does-not-exists" not found');
  });

  it('should exit 1 if current workspace not found', async () => {
    jest.spyOn(project, 'workspace');
    jest.spyOn(project, 'currentWorkspace').mockResolvedValue(null);

    // Call
    await expect(testBed.run({ ...defaults, workspace: undefined }))
      .resolves.toBe(1);

    // Checks
    expect(testBed.spinner.start).toHaveBeenCalledWith('Loading "." workspace');
    expect(project.workspace).not.toHaveBeenCalled();
    expect(project.currentWorkspace).toHaveBeenCalled();
    expect(testBed.spinner.fail).toHaveBeenCalledWith('Workspace "." not found');
  });

  it('should print workspace basic info', async () => {
    const wks = new Workspace('./wks', { name: 'wks', version: '1.0.0' } as any, project);
    jest.spyOn(project, 'workspace').mockResolvedValue(wks);

    // Call
    await expect(testBed.run({ ...defaults, workspace: 'wks' }))
      .resolves.toBeUndefined();

    // Checks
    expect(testBed.spinner.start).toHaveBeenCalledWith('Loading "wks" workspace');
    expect(project.workspace).toHaveBeenCalledWith('wks');
    expect(testBed.spinner.stop).toHaveBeenCalled();
    expect(testBed.screen).toMatchSnapshot();
  });

  it('should use current workspace', async () => {
    const wks = new Workspace('./wks', { name: 'wks', version: '1.0.0' } as any, project);

    jest.spyOn(project, 'workspace');
    jest.spyOn(project, 'currentWorkspace').mockResolvedValue(wks);

    // Call
    await expect(testBed.run({ ...defaults, workspace: undefined }))
      .resolves.toBeUndefined();

    // Checks
    expect(testBed.spinner.start).toHaveBeenCalledWith('Loading "." workspace');
    expect(project.workspace).not.toHaveBeenCalled();
    expect(project.currentWorkspace).toHaveBeenCalled();
  });

  it('should print workspace basic info with dependencies', async () => {
    jest.spyOn(project, 'workspace')
      .mockImplementation(async (name = 'wks') => new Workspace('./wks', { name, version: '1.0.0', dependencies: { depA: '1.0.0', depB: '1.0.0' } } as any, project));

    // Call
    await expect(testBed.run({ ...defaults, workspace: 'wks' }))
      .resolves.toBeUndefined();

    // Checks
    expect(testBed.spinner.start).toHaveBeenCalledWith('Loading "wks" workspace');
    expect(project.workspace).toHaveBeenCalledWith('wks');
    expect(testBed.spinner.stop).toHaveBeenCalled();
    expect(testBed.screen).toMatchSnapshot();
  });

  it('should print workspace basic info with dev-dependencies', async () => {
    jest.spyOn(project, 'workspace')
      .mockImplementation(async (name = 'wks') => new Workspace('./wks', { name, version: '1.0.0', devDependencies: { depA: '1.0.0', depB: '1.0.0' } } as any, project));

    // Call
    await expect(testBed.run({ ...defaults, workspace: 'wks' }))
      .resolves.toBeUndefined();

    // Checks
    expect(testBed.spinner.start).toHaveBeenCalledWith('Loading "wks" workspace');
    expect(project.workspace).toHaveBeenCalledWith('wks');
    expect(testBed.spinner.stop).toHaveBeenCalled();
    expect(testBed.screen).toMatchSnapshot();
  });
});
