import { Project, Workspace } from '@jujulego/jill-core';
import chalk from 'chalk';

import { ListCommand } from '../../src';
import { TestBed, TestCommand } from '../test-bed';

// Setup
jest.mock('../../src/logger');

chalk.level = 1;

let project: Project;

const TestListCommand = TestCommand(ListCommand);
const testBed = new TestBed(TestListCommand);
const defaults = {
  '$0': 'jill',
  _: [],
  verbose: 0,
  project: '/project',
  'package-manager': undefined
};

beforeEach(() => {
  testBed.beforeEach();
  project = new Project('.');

  // Mocks
  jest.resetAllMocks();
  jest.restoreAllMocks();

  jest.spyOn(testBed.cmd, 'project', 'get').mockReturnValue(project);
});

// Tests
describe('jill list', () => {
  // Setup
  let workspaces: Workspace[];

  beforeEach(() => {
    workspaces = [
      new Workspace('./wks-1', { name: 'wks-1', private: true, version: '1.0.0' } as any, project),
      new Workspace('./wks-2', { name: 'wks-2', version: '1.0.0', scripts: { test: 'test' } } as any, project),
      new Workspace('./wks-3', { name: 'wks-3', version: '1.0.0', scripts: { lint: 'lint' } } as any, project),
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
    await expect(testBed.run({ ...defaults, long: false, json: false }))
      .resolves.toBeUndefined();

    // Checks
    expect(project.workspaces).toHaveBeenCalled();
    expect(testBed.screen).toBe('wks-1\nwks-2\nwks-3\n');
  });

  // Filters
  it('should print only private workspaces (--private)', async () => {
    // Call
    await expect(testBed.run({ ...defaults, long: false, json: false, private: true }))
      .resolves.toBeUndefined();

    // Checks
    expect(testBed.screen).toBe('wks-1\n');
  });

  it('should print only public workspaces (--no-private)', async () => {
    // Call
    await expect(testBed.run({ ...defaults, long: false, json: false, private: false }))
      .resolves.toBeUndefined();

    // Checks
    expect(testBed.screen).toBe('wks-2\nwks-3\n');
  });

  it('should print only affected workspaces (--affected test)', async () => {
    // Call
    await expect(testBed.run({ ...defaults, long: false, json: false, affected: 'test' }))
      .resolves.toBeUndefined();

    // Checks
    for (const wks of workspaces) {
      expect(wks.isAffected).toHaveBeenCalledWith('test');
    }

    expect(testBed.screen).toBe('wks-2\n');
  });

  it('should print only workspaces with \'test\' script (--with-script test)', async () => {
    // Call
    await expect(testBed.run({ ...defaults, long: false, json: false, 'with-script': ['test'] }))
      .resolves.toBeUndefined();

    // Checks
    expect(testBed.screen).toBe('wks-2\n');
  });

  it('should print only workspaces with \'test\' or \'lint\' scripts (--with-script test lint)', async () => {
    // Call
    await expect(testBed.run({ ...defaults, long: false, json: false, 'with-script': ['test', 'lint'] }))
      .resolves.toBeUndefined();

    // Checks
    expect(testBed.screen).toBe('wks-2\nwks-3\n');
  });

  // Formats
  it('should print list with headers (--headers)', async () => {
    // Call
    await expect(testBed.run({ ...defaults, long: false, json: false, headers: true }))
      .resolves.toBeUndefined();

    // Checks
    expect(testBed.screen).toMatchSnapshot();
  });

  it('should print long list of all workspaces (--long)', async () => {
    // Call
    await expect(testBed.run({ ...defaults, long: true, json: false }))
      .resolves.toBeUndefined();

    // Checks
    expect(testBed.screen).toMatchSnapshot();
  });

  it('should print json array of all workspaces (--json)', async () => {
    for (const wks of workspaces) {
      jest.spyOn(wks, 'cwd', 'get').mockReturnValue(`/full/path/to/${wks.name}`);
    }

    // Call
    await expect(testBed.run({ ...defaults, long: false, json: true }))
      .resolves.toBeUndefined();

    // Checks
    expect(testBed.screen).toMatchSnapshot();
  });
});
