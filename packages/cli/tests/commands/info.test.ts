import { Project, Workspace } from '@jujulego/jill-core';

import { logger } from '../../src/logger';
import { commandHandler } from '../../src/wrapper';

import { defaultOptions } from './defaults';

// Setup
jest.mock('../../src/logger');
jest.mock('../../src/wrapper');

let project: Project;
let screen: string;

beforeEach(() => {
  project = new Project('.');
  screen = '';

  // Mocks
  jest.restoreAllMocks();

  (commandHandler as jest.MockedFunction<typeof commandHandler>)
    .mockImplementation((handler) => (args) => handler(project, args));

  jest.spyOn(process, 'exit').mockImplementation();
  jest.spyOn(console, 'log').mockImplementation((message) => screen += message + '\n');
});

// Tests
describe('jill info', () => {
  it('should exit 1 if workspace doesn\'t exists', async () => {
    jest.spyOn(project, 'workspace').mockResolvedValue(null);

    // Call
    const { handler } = await import('../../src/commands/info');
    await expect(handler({ workspace: 'does-not-exists', ...defaultOptions }))
      .resolves.toBeUndefined();

    // Checks
    expect(logger.spin).toBeCalledWith('Loading project');
    expect(project.workspace).toBeCalledWith('does-not-exists');
    expect(logger.fail).toBeCalledWith('Workspace does-not-exists not found');
    expect(process.exit).toBeCalledWith(1);
  });

  it('should print workspace basic info', async () => {
    const wks = new Workspace('./wks', { name: 'wks', version: '1.0.0' }, project);

    jest.spyOn(project, 'workspace').mockResolvedValue(wks);

    // Call
    const { handler } = await import('../../src/commands/info');
    await expect(handler({ workspace: 'wks', ...defaultOptions }))
      .resolves.toBeUndefined();

    // Checks
    expect(logger.spin).toBeCalledWith('Loading project');
    expect(project.workspace).toBeCalledWith('wks');
    expect(logger.stop).toBeCalled();
    expect(screen).toMatchSnapshot();
    expect(process.exit).toBeCalledWith(0);
  });

  it('should print workspace basic info with dependencies', async () => {
    jest.spyOn(project, 'workspace')
      .mockImplementation(async (name) => new Workspace('./wks', { name, version: '1.0.0', dependencies: { depA: '1.0.0', depB: '1.0.0' } }, project));

    // Call
    const { handler } = await import('../../src/commands/info');
    await expect(handler({ workspace: 'wks', ...defaultOptions }))
      .resolves.toBeUndefined();

    // Checks
    expect(logger.spin).toBeCalledWith('Loading project');
    expect(project.workspace).toBeCalledWith('wks');
    expect(logger.stop).toBeCalled();
    expect(screen).toMatchSnapshot();
    expect(process.exit).toBeCalledWith(0);
  });

  it('should print workspace basic info with dev-dependencies', async () => {
    jest.spyOn(project, 'workspace')
      .mockImplementation(async (name) => new Workspace('./wks', { name, version: '1.0.0', devDependencies: { depA: '1.0.0', depB: '1.0.0' } }, project));

    // Call
    const { handler } = await import('../../src/commands/info');
    await expect(handler({ workspace: 'wks', ...defaultOptions }))
      .resolves.toBeUndefined();

    // Checks
    expect(logger.spin).toBeCalledWith('Loading project');
    expect(project.workspace).toBeCalledWith('wks');
    expect(logger.stop).toBeCalled();
    expect(screen).toMatchSnapshot();
    expect(process.exit).toBeCalledWith(0);
  });
});
