import path from 'path';

import { Project, Workspace } from '../src';

// Setup
const root = path.resolve(__dirname, '../mock');
let project: Project;
let workspace: Workspace;

beforeEach(async () => {
  project = new Project(root);
  workspace = (await project.workspace('mock-test-a'))!;

  // Mocks
  jest.restoreAllMocks();
  jest.spyOn(project, 'workspace');
});

// Test suites
describe('Workspace.dependencies', () => {
  // Tests
  it('should return all workspace\'s dependencies', async () => {
    const gen = workspace.dependencies();

    await expect(gen.next())
      .resolves.toEqual({
        done: false,
        value: expect.objectContaining({ name: 'mock-test-b' })
      });

    await expect(gen.next())
      .resolves.toEqual({
        done: true
      });

    expect(project.workspace).toBeCalledTimes(1);
    expect(project.workspace).toBeCalledWith('mock-test-b');
  });
});

describe('Workspace.devDependencies', () => {
  // Tests
  it('should return all workspace\'s devDependencies', async () => {
    const gen = workspace.devDependencies();

    await expect(gen.next())
      .resolves.toEqual({
        done: false,
        value: expect.objectContaining({ name: 'mock-test-c' })
      });

    await expect(gen.next())
      .resolves.toEqual({
        done: true
      });

    expect(project.workspace).toBeCalledTimes(1);
    expect(project.workspace).toBeCalledWith('mock-test-c');
  });
});
