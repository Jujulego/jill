import { Project, Workspace } from '@jujulego/jill-core';
import chalk from 'chalk';

import { logger } from '../../src/logger';
import { commandHandler } from '../../src/wrapper';

import { defaultOptions } from './defaults';

// Setup
jest.mock('../../src/logger');
jest.mock('../../src/wrapper');

chalk.level = 1;

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
describe('jill list', () => {
  // Setup
  let workspaces: Workspace[];

  beforeEach(() => {
    workspaces = [
      new Workspace('./wks-1', { name: 'wks-1', private: true, version: '1.0.0' }, project),
      new Workspace('./wks-2', { name: 'wks-2', version: '1.0.0' }, project),
      new Workspace('./wks-3', { name: 'wks-3', version: '1.0.0' }, project),
    ];

    jest.spyOn(project, 'workspaces').mockImplementation(async function* () {
      for (const wks of workspaces) yield wks;
    });

    for (const wks of workspaces) {
      jest.spyOn(wks, 'isAffected').mockResolvedValue(wks.name === 'wks-2');
    }
  });

  // Defaults
  it('should print list of all workspaces', async () => {
    // Call
    const { handler } = await import('../../src/commands/list');
    await expect(handler({ long: false, json: false, ...defaultOptions }))
      .resolves.toBeUndefined();

    // Checks
    expect(logger.spin).toBeCalledWith('Loading project');
    expect(project.workspaces).toBeCalled();
    expect(logger.stop).toBeCalled();
    expect(screen).toEqual('wks-1\nwks-2\nwks-3\n');
    expect(process.exit).toBeCalledWith(0);
  });

  // Filters
  it('should print only private workspaces (--private)', async () => {
    // Call
    const { handler } = await import('../../src/commands/list');
    await expect(handler({ long: false, json: false, private: true, ...defaultOptions }))
      .resolves.toBeUndefined();

    // Checks
    expect(screen).toEqual('wks-1\n');
    expect(process.exit).toBeCalledWith(0);
  });

  it('should print only public workspaces (--no-private)', async () => {
    // Call
    const { handler } = await import('../../src/commands/list');
    await expect(handler({ long: false, json: false, private: false, ...defaultOptions }))
      .resolves.toBeUndefined();

    // Checks
    expect(screen).toEqual('wks-2\nwks-3\n');
    expect(process.exit).toBeCalledWith(0);
  });

  it('should print only affected workspaces (--affected test)', async () => {
    // Call
    const { handler } = await import('../../src/commands/list');
    await expect(handler({ long: false, json: false, affected: 'test', ...defaultOptions }))
      .resolves.toBeUndefined();

    // Checks
    for (const wks of workspaces) {
      expect(wks.isAffected).toBeCalledWith('test');
    }

    expect(screen).toEqual('wks-2\n');
    expect(process.exit).toBeCalledWith(0);
  });

  // Formats
  it('should print list with headers (--headers)', async () => {
    // Call
    const { handler } = await import('../../src/commands/list');
    await expect(handler({ long: false, json: false, headers: true, ...defaultOptions }))
      .resolves.toBeUndefined();

    // Checks
    expect(screen).toMatchSnapshot();
    expect(process.exit).toBeCalledWith(0);
  });

  it('should print long list of all workspaces (--long)', async () => {
    // Call
    const { handler } = await import('../../src/commands/list');
    await expect(handler({ long: true, json: false, ...defaultOptions }))
      .resolves.toBeUndefined();

    // Checks
    expect(screen).toMatchSnapshot();
    expect(process.exit).toBeCalledWith(0);
  });

  it('should print json array of all workspaces (--json)', async () => {
    for (const wks of workspaces) {
      jest.spyOn(wks, 'cwd', 'get').mockReturnValue(`/full/path/to/${wks.name}`);
    }

    // Call
    const { handler } = await import('../../src/commands/list');
    await expect(handler({ long: false, json: true, ...defaultOptions }))
      .resolves.toBeUndefined();

    // Checks
    expect(screen).toMatchSnapshot();
    expect(process.exit).toBeCalledWith(0);
  });
});
