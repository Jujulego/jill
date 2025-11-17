import { loadProject, type ProjectArgs, withProject } from '@/src/middlewares/with-project.js';
import { loadWorkspace, withWorkspace } from '@/src/middlewares/with-workspace.js';
import { CWD } from '@/src/tokens.js';
import { TestBed } from '@/tools/test-bed.js';
import { globalScope$ } from '@kyrielle/injector';
import { pipe$ } from 'kyrielle';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import yargs, { type Argv } from 'yargs';

// Mocks
vi.mock('@/src/middlewares/project.js');

// Setup
let bed: TestBed;

beforeEach(() => {
  vi.resetAllMocks();

  bed = new TestBed();

  vi.mocked(withProject).mockImplementation((argv) => argv as Argv<ProjectArgs>);
  vi.mocked(loadProject).mockReturnValue(bed.project);

  vi.spyOn(bed.project, 'currentWorkspace');
  vi.spyOn(bed.project, 'mainWorkspace');
  vi.spyOn(bed.project, 'workspace');
});

afterEach(() => {
  globalScope$().clear();
});

// Tests
describe('workspace cli middleware', () => {
  it('should load main workspace', async () => {
    const args = await pipe$(yargs(), withWorkspace).parseAsync('');

    expect(withProject).toHaveBeenCalled();

    await expect(loadWorkspace(args))
      .resolves.toBe(bed.project.testMainWorkspace);

    expect(loadProject).toHaveBeenCalledWith(args);

    expect(bed.project.currentWorkspace).not.toHaveBeenCalled();
    expect(bed.project.mainWorkspace).toHaveBeenCalled();
    expect(bed.project.workspace).not.toHaveBeenCalled();
  });

  it('should load current workspace', async () => {
    const workspace = bed.addWorkspace('workspace');
    globalScope$().set(CWD, workspace.root);

    const args = await pipe$(yargs(), withWorkspace).parseAsync('');

    expect(withProject).toHaveBeenCalled();

    await expect(loadWorkspace(args))
      .resolves.toBe(workspace);

    expect(loadProject).toHaveBeenCalledWith(args);

    expect(bed.project.currentWorkspace).toHaveBeenCalledWith(workspace.root);
    expect(bed.project.mainWorkspace).not.toHaveBeenCalled();
    expect(bed.project.workspace).not.toHaveBeenCalled();
  });

  it('should load named workspace', async () => {
    const workspace = bed.addWorkspace('life');
    globalScope$().set(CWD, workspace.root);

    const args = await pipe$(yargs(), withWorkspace).parseAsync('-w life');

    expect(withProject).toHaveBeenCalled();

    await expect(loadWorkspace(args))
      .resolves.toBe(workspace);

    expect(loadProject).toHaveBeenCalledWith(args);

    expect(bed.project.currentWorkspace).not.toHaveBeenCalled();
    expect(bed.project.mainWorkspace).not.toHaveBeenCalled();
    expect(bed.project.workspace).toHaveBeenCalledWith('life');
  });
});