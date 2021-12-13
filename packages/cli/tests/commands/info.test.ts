import { Project, Workspace } from '@jujulego/jill-core';
import chalk from 'chalk';
import yargs from 'yargs';

import { InfoCommand } from '../../src';
import { transport } from '../../src/logger';

// Setup
jest.mock('../../src/logger');

chalk.level = 1;

let cmd: InfoCommand;
let project: Project;
let screen: string;

beforeEach(() => {
  cmd = new InfoCommand(yargs);
  project = new Project('.');
  screen = '';

  // Mocks
  jest.resetAllMocks();
  jest.restoreAllMocks();

  jest.spyOn(console, 'log').mockImplementation((message) => screen += message + '\n');
  jest.spyOn(cmd, 'project', 'get').mockReturnValue(project);
});

// Tests
describe('jill info', () => {
  it('should exit 1 if workspace doesn\'t exists', async () => {
    jest.spyOn(project, 'workspace').mockResolvedValue(null);
    jest.spyOn(cmd, 'define').mockResolvedValue({ workspace: 'does-not-exists' });

    // Call
    await expect(cmd.run())
      .resolves.toBe(1);

    // Checks
    expect(transport.spinner.start).toHaveBeenCalledWith('Loading "does-not-exists" workspace');
    expect(project.workspace).toHaveBeenCalledWith('does-not-exists');
    expect(transport.spinner.fail).toHaveBeenCalledWith('Workspace "does-not-exists" not found');
  });

  it('should exit 1 if current workspace not found', async () => {
    jest.spyOn(project, 'workspace');
    jest.spyOn(project, 'currentWorkspace').mockResolvedValue(null);
    jest.spyOn(cmd, 'define').mockResolvedValue({ workspace: undefined });

    // Call
    await expect(cmd.run())
      .resolves.toBe(1);

    // Checks
    expect(transport.spinner.start).toHaveBeenCalledWith('Loading "." workspace');
    expect(project.workspace).not.toHaveBeenCalled();
    expect(project.currentWorkspace).toHaveBeenCalled();
    expect(transport.spinner.fail).toHaveBeenCalledWith('Workspace "." not found');
  });

  it('should print workspace basic info', async () => {
    const wks = new Workspace('./wks', { name: 'wks', version: '1.0.0' }, project);

    jest.spyOn(project, 'workspace').mockResolvedValue(wks);
    jest.spyOn(cmd, 'define').mockResolvedValue({ workspace: 'wks' });

    // Call
    await expect(cmd.run())
      .resolves.toBeUndefined();

    // Checks
    expect(transport.spinner.start).toHaveBeenCalledWith('Loading "wks" workspace');
    expect(project.workspace).toHaveBeenCalledWith('wks');
    expect(transport.spinner.stop).toHaveBeenCalled();
    expect(screen).toMatchSnapshot();
  });

  it('should use current workspace', async () => {
    const wks = new Workspace('./wks', { name: 'wks', version: '1.0.0' }, project);

    jest.spyOn(project, 'workspace');
    jest.spyOn(project, 'currentWorkspace').mockResolvedValue(wks);
    jest.spyOn(cmd, 'define').mockResolvedValue({ workspace: undefined });

    // Call
    await expect(cmd.run())
      .resolves.toBeUndefined();

    // Checks
    expect(transport.spinner.start).toHaveBeenCalledWith('Loading "." workspace');
    expect(project.workspace).not.toHaveBeenCalled();
    expect(project.currentWorkspace).toHaveBeenCalled();
  });

  it('should print workspace basic info with dependencies', async () => {
    jest.spyOn(cmd, 'define').mockResolvedValue({ workspace: 'wks' });
    jest.spyOn(project, 'workspace')
      .mockImplementation(async (name = 'wks') => new Workspace('./wks', { name, version: '1.0.0', dependencies: { depA: '1.0.0', depB: '1.0.0' } }, project));

    // Call
    await expect(cmd.run())
      .resolves.toBeUndefined();

    // Checks
    expect(transport.spinner.start).toHaveBeenCalledWith('Loading "wks" workspace');
    expect(project.workspace).toHaveBeenCalledWith('wks');
    expect(transport.spinner.stop).toHaveBeenCalled();
    expect(screen).toMatchSnapshot();
  });

  it('should print workspace basic info with dev-dependencies', async () => {
    jest.spyOn(cmd, 'define').mockResolvedValue({ workspace: 'wks' });
    jest.spyOn(project, 'workspace')
      .mockImplementation(async (name = 'wks') => new Workspace('./wks', { name, version: '1.0.0', devDependencies: { depA: '1.0.0', depB: '1.0.0' } }, project));

    // Call
    await expect(cmd.run())
      .resolves.toBeUndefined();

    // Checks
    expect(transport.spinner.start).toHaveBeenCalledWith('Loading "wks" workspace');
    expect(project.workspace).toHaveBeenCalledWith('wks');
    expect(transport.spinner.stop).toHaveBeenCalled();
    expect(screen).toMatchSnapshot();
  });
});
