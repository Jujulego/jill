import { Project, Workspace } from '@jujulego/jill-core';
import chalk from 'chalk';

import { ListArgs, listCommand, logger } from '../../src';

// Setup
jest.mock('../../src/logger');

chalk.level = 1;

const defaults: ListArgs = {
  affected: undefined,
  private: undefined,
  'with-script': undefined,

  attrs: undefined,
  headers: undefined,
  long: false,
  json: false,
};

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
describe('jill list', () => {
  // Setup
  let workspaces: Workspace[];

  beforeEach(() => {
    workspaces = [
      new Workspace('./wks-1', { name: 'wks-1', private: true, version: '1.0.0' }, project),
      new Workspace('./wks-2', { name: 'wks-2', version: '1.0.0', scripts: { test: 'test' } }, project),
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
    await expect(listCommand(project, { ...defaults, long: false, json: false }))
      .resolves.toBe(0);

    // Checks
    expect(logger.spin).toHaveBeenCalledWith('Loading project');
    expect(project.workspaces).toHaveBeenCalled();
    expect(logger.stop).toHaveBeenCalled();
    expect(screen).toEqual('wks-1\nwks-2\nwks-3\n');
  });

  // Filters
  it('should print only private workspaces (--private)', async () => {
    // Call
    await expect(listCommand(project, { ...defaults, long: false, json: false, private: true }))
      .resolves.toBeUndefined();

    // Checks
    expect(screen).toEqual('wks-1\n');
    expect(process.exit).toHaveBeenCalledWith(0);
  });

  it('should print only public workspaces (--no-private)', async () => {
    // Call
    await expect(listCommand(project, { ...defaults, long: false, json: false, private: false }))
      .resolves.toBeUndefined();

    // Checks
    expect(screen).toEqual('wks-2\nwks-3\n');
    expect(process.exit).toHaveBeenCalledWith(0);
  });

  it('should print only affected workspaces (--affected test)', async () => {
    // Call
    await expect(listCommand(project, { ...defaults, long: false, json: false, affected: 'test' }))
      .resolves.toBeUndefined();

    // Checks
    for (const wks of workspaces) {
      expect(wks.isAffected).toHaveBeenCalledWith('test');
    }

    expect(screen).toEqual('wks-2\n');
    expect(process.exit).toHaveBeenCalledWith(0);
  });

  it('should print only workspaces with \'test\' script (--with-script test)', async () => {
    // Call
    await expect(listCommand(project, { ...defaults, long: false, json: false, 'with-script': 'test' }))
      .resolves.toBeUndefined();

    // Checks
    expect(screen).toEqual('wks-2\n');
    expect(process.exit).toHaveBeenCalledWith(0);
  });

  // Formats
  it('should print list with headers (--headers)', async () => {
    // Call
    await expect(listCommand(project, { ...defaults, long: false, json: false, headers: true }))
      .resolves.toBeUndefined();

    // Checks
    expect(screen).toMatchSnapshot();
    expect(process.exit).toHaveBeenCalledWith(0);
  });

  it('should print long list of all workspaces (--long)', async () => {
    // Call
    await expect(listCommand(project, { ...defaults, long: true, json: false }))
      .resolves.toBeUndefined();

    // Checks
    expect(screen).toMatchSnapshot();
    expect(process.exit).toHaveBeenCalledWith(0);
  });

  it('should print json array of all workspaces (--json)', async () => {
    for (const wks of workspaces) {
      jest.spyOn(wks, 'cwd', 'get').mockReturnValue(`/full/path/to/${wks.name}`);
    }

    // Call
    await expect(listCommand(project, { ...defaults, long: false, json: true }))
      .resolves.toBeUndefined();

    // Checks
    expect(screen).toMatchSnapshot();
    expect(process.exit).toHaveBeenCalledWith(0);
  });
});
