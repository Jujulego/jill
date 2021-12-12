import { Project, Workspace } from '@jujulego/jill-core';
import { ExitError } from '@oclif/core/lib/errors';
import chalk from 'chalk';

import InfoCommand from '../../src/_commands/info';
import { logger } from '../../src';

// Setup
jest.mock('../../src/logger');

chalk.level = 1;

let project: Project;
let screen: string;

beforeEach(() => {
  project = new Project('.');
  screen = '';

  // Mocks
  jest.resetAllMocks();
  jest.restoreAllMocks();

  jest.spyOn(InfoCommand.prototype, 'project', 'get').mockReturnValue(project);
  jest.spyOn(console, 'log').mockImplementation((message) => screen += message + '\n');
  jest.spyOn(process, 'emitWarning').mockImplementation((err: string | Error) => process.stdout.write((typeof err === 'string' ? err : err.message) + '\n'));
});

// Tests
describe('jill info', () => {
  it('should exit 1 if workspace doesn\'t exists', async () => {
    jest.spyOn(project, 'workspace').mockResolvedValue(null);

    // Call
    await expect(InfoCommand.run(['-w', 'does-not-exists']))
      .rejects.toEqual(new ExitError(1));

    // Checks
    expect(logger.spin).toHaveBeenCalledWith('Loading project');
    expect(project.workspace).toHaveBeenCalledWith('does-not-exists');
    expect(logger.fail).toHaveBeenCalledWith('Workspace \'does-not-exists\' not found');
  });

  it('should exit 1 if current workspace not found', async () => {
    jest.spyOn(project, 'workspace');
    jest.spyOn(project, 'currentWorkspace').mockResolvedValue(null);

    // Call
    await expect(InfoCommand.run([]))
      .rejects.toEqual(new ExitError(1));

    // Checks
    expect(logger.spin).toHaveBeenCalledWith('Loading project');
    expect(project.workspace).not.toHaveBeenCalled();
    expect(project.currentWorkspace).toHaveBeenCalled();
    expect(logger.fail).toHaveBeenCalledWith('Workspace \'.\' not found');
  });

  it('should print workspace basic info', async () => {
    const wks = new Workspace('./wks', { name: 'wks', version: '1.0.0' } as any, project);

    jest.spyOn(project, 'workspace').mockResolvedValue(wks);

    // Call
    await expect(InfoCommand.run(['-w', 'wks']))
      .resolves.toBeUndefined();

    // Checks
    expect(logger.spin).toHaveBeenCalledWith('Loading project');
    expect(project.workspace).toHaveBeenCalledWith('wks');
    expect(logger.stop).toHaveBeenCalled();
    expect(screen).toMatchSnapshot();
  });

  it('should use current workspace', async () => {
    const wks = new Workspace('./wks', { name: 'wks', version: '1.0.0' } as any, project);

    jest.spyOn(project, 'workspace');
    jest.spyOn(project, 'currentWorkspace').mockResolvedValue(wks);

    // Call
    await expect(InfoCommand.run([]))
      .resolves.toBeUndefined();

    // Checks
    expect(logger.spin).toHaveBeenCalledWith('Loading project');
    expect(project.workspace).not.toHaveBeenCalled();
    expect(project.currentWorkspace).toHaveBeenCalled();
  });

  it('should print workspace basic info with dependencies', async () => {
    jest.spyOn(project, 'workspace')
      .mockImplementation(async (name = 'wks') => new Workspace('./wks', { name, version: '1.0.0', dependencies: { depA: '1.0.0', depB: '1.0.0' } } as any, project));

    // Call
    await expect(InfoCommand.run(['-w', 'wks']))
      .resolves.toBeUndefined();

    // Checks
    expect(logger.spin).toHaveBeenCalledWith('Loading project');
    expect(project.workspace).toHaveBeenCalledWith('wks');
    expect(logger.stop).toHaveBeenCalled();
    expect(screen).toMatchSnapshot();
  });

  it('should print workspace basic info with dev-dependencies', async () => {
    jest.spyOn(project, 'workspace')
      .mockImplementation(async (name = 'wks') => new Workspace('./wks', { name, version: '1.0.0', devDependencies: { depA: '1.0.0', depB: '1.0.0' } } as any, project));

    // Call
    await expect(InfoCommand.run(['-w', 'wks']))
      .resolves.toBeUndefined();

    // Checks
    expect(logger.spin).toHaveBeenCalledWith('Loading project');
    expect(project.workspace).toHaveBeenCalledWith('wks');
    expect(logger.stop).toHaveBeenCalled();
    expect(screen).toMatchSnapshot();
  });
});
