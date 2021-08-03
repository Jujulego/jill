import { Project, Workspace } from '@jujulego/jill-core';
import chalk from 'chalk';

import { infoCommand, logger } from '../../src';

// Setup
jest.mock('../../src/logger');

chalk.level = 1;

let project: Project;
let screen: string;

beforeEach(() => {
  project = new Project('.');
  screen = '';

  // Mocks
  jest.restoreAllMocks();

  jest.spyOn(console, 'log').mockImplementation((message) => screen += message + '\n');
});

// Tests
describe('jill info', () => {
  it('should exit 1 if workspace doesn\'t exists', async () => {
    jest.spyOn(project, 'workspace').mockResolvedValue(null);

    // Call
    await expect(infoCommand(project, { workspace: 'does-not-exists' }))
      .resolves.toBe(1);

    // Checks
    expect(logger.spin).toHaveBeenCalledWith('Loading project');
    expect(project.workspace).toHaveBeenCalledWith('does-not-exists');
    expect(logger.fail).toHaveBeenCalledWith('Workspace does-not-exists not found');
  });

  it('should print workspace basic info', async () => {
    const wks = new Workspace('./wks', { name: 'wks', version: '1.0.0' }, project);

    jest.spyOn(project, 'workspace').mockResolvedValue(wks);

    // Call
    await expect(infoCommand(project, { workspace: 'wks' }))
      .resolves.toBe(0);

    // Checks
    expect(logger.spin).toHaveBeenCalledWith('Loading project');
    expect(project.workspace).toHaveBeenCalledWith('wks');
    expect(logger.stop).toHaveBeenCalled();
    expect(screen).toMatchSnapshot();
  });

  it('should print workspace basic info with dependencies', async () => {
    jest.spyOn(project, 'workspace')
      .mockImplementation(async (name = 'wks') => new Workspace('./wks', { name, version: '1.0.0', dependencies: { depA: '1.0.0', depB: '1.0.0' } }, project));

    // Call
    await expect(infoCommand(project, { workspace: 'wks' }))
      .resolves.toBe(0);

    // Checks
    expect(logger.spin).toHaveBeenCalledWith('Loading project');
    expect(project.workspace).toHaveBeenCalledWith('wks');
    expect(logger.stop).toHaveBeenCalled();
    expect(screen).toMatchSnapshot();
  });

  it('should print workspace basic info with dev-dependencies', async () => {
    jest.spyOn(project, 'workspace')
      .mockImplementation(async (name = 'wks') => new Workspace('./wks', { name, version: '1.0.0', devDependencies: { depA: '1.0.0', depB: '1.0.0' } }, project));

    // Call
    await expect(infoCommand(project, { workspace: 'wks' }))
      .resolves.toBe(0);

    // Checks
    expect(logger.spin).toHaveBeenCalledWith('Loading project');
    expect(project.workspace).toHaveBeenCalledWith('wks');
    expect(logger.stop).toHaveBeenCalled();
    expect(screen).toMatchSnapshot();
  });
});
