import { planCommand } from '@/src/cli/bases/task-module.js';
import { each } from '@/src/cli/commands.js';
import { hasEveryScript$ } from '@/src/cli/filters/has-scripts.js';
import { isPrivate$ } from '@/src/cli/filters/is-private.js';
import { withLogger } from '@/src/cli/middlewares/logger.js';
import { loadProject, type ProjectArgs, withProject } from '@/src/cli/middlewares/project.js';
import { isAffected$ } from '@/src/cli/filters/is-affected.js';
import { TestBed } from '@/tools/test-bed.js';
import { TestScriptTask } from '@/tools/test-tasks.js';
import type { TaskSet } from '@jujulego/tasks';
import { globalScope$ } from '@kyrielle/injector';
import { filter$, pipe$, var$ } from 'kyrielle';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import yargs, { type Argv } from 'yargs';

// Mocks
vi.mock('@/src/cli/middlewares/project.js');
vi.mock('@/src/cli/filters/has-scripts.js');
vi.mock('@/src/cli/filters/is-affected.js');
vi.mock('@/src/cli/filters/is-private.js');

// Setup
let bed: TestBed;

beforeEach(() => {
  vi.resetAllMocks();

  bed = new TestBed();

  vi.mocked(withProject).mockImplementation((argv) => argv as Argv<ProjectArgs>);
  vi.mocked(loadProject).mockReturnValue(bed.project);
});

afterEach(() => {
  globalScope$().clear();
});

// Tests
describe('jill each', () => {
  it('should run script in each workspace having that script', async () => {
    // Prepare workspaces
    const wksA = bed.addWorkspace('wksA', { scripts: { test: 'vitest' }});
    const wksB = bed.addWorkspace('wksB', { scripts: { test: 'vitest' }});
    const wksC = bed.addWorkspace('wksC');

    const tskA = new TestScriptTask(wksA, 'test', []);
    const tskB = new TestScriptTask(wksB, 'test', []);

    vi.spyOn(wksA, 'run').mockResolvedValue(tskA);
    vi.spyOn(wksB, 'run').mockResolvedValue(tskB);
    vi.spyOn(wksC, 'run').mockResolvedValue(null);

    // Run command
    vi.mocked(hasEveryScript$).mockReturnValue(filter$((wks) => wks !== wksC));

    const tasks$ = var$<TaskSet>();
    await pipe$(yargs(), withLogger, planCommand(each, tasks$)).parseAsync('each test');

    expect(tasks$.defer()?.tasks).toStrictEqual([tskA, tskB]);

    expect(wksA.run).toHaveBeenCalledWith('test', [], { buildDeps: 'all', buildScript: 'build' });
    expect(wksB.run).toHaveBeenCalledWith('test', [], { buildDeps: 'all', buildScript: 'build' });
    expect(wksC.run).not.toHaveBeenCalled();
  });

  it('should use given dependency selection mode', async () => {
    // Prepare workspaces
    const wksA = bed.addWorkspace('wksA', { scripts: { test: 'vitest' }});
    const wksB = bed.addWorkspace('wksB', { scripts: { test: 'vitest' }});
    const wksC = bed.addWorkspace('wksC');

    const tskA = new TestScriptTask(wksA, 'test', []);
    const tskB = new TestScriptTask(wksB, 'test', []);

    vi.spyOn(wksA, 'run').mockResolvedValue(tskA);
    vi.spyOn(wksB, 'run').mockResolvedValue(tskB);
    vi.spyOn(wksC, 'run').mockResolvedValue(null);

    // Run command
    vi.mocked(hasEveryScript$).mockReturnValue(filter$((wks) => wks !== wksC));

    await pipe$(yargs(), withLogger, planCommand(each, var$())).parseAsync('each test -d prod');

    expect(wksA.run).toHaveBeenCalledWith('test', [], { buildDeps: 'prod', buildScript: 'build' });
    expect(wksB.run).toHaveBeenCalledWith('test', [], { buildDeps: 'prod', buildScript: 'build' });
    expect(wksC.run).not.toHaveBeenCalled();
  });

  it('should pass down unknown arguments', async () => {
    // Prepare workspaces
    const wksA = bed.addWorkspace('wksA', { scripts: { test: 'vitest' }});
    const wksB = bed.addWorkspace('wksB', { scripts: { test: 'vitest' }});
    const wksC = bed.addWorkspace('wksC');

    const tskA = new TestScriptTask(wksA, 'test', []);
    const tskB = new TestScriptTask(wksB, 'test', []);

    vi.spyOn(wksA, 'run').mockResolvedValue(tskA);
    vi.spyOn(wksB, 'run').mockResolvedValue(tskB);
    vi.spyOn(wksC, 'run').mockResolvedValue(null);

    // Run command
    vi.mocked(hasEveryScript$).mockReturnValue(filter$((wks) => wks !== wksC));

    await pipe$(yargs(), withLogger, planCommand(each, var$())).parseAsync('each test --arg');

    expect(wksA.run).toHaveBeenCalledWith('test', ['--arg'], { buildDeps: 'all', buildScript: 'build' });
    expect(wksB.run).toHaveBeenCalledWith('test', ['--arg'], { buildDeps: 'all', buildScript: 'build' });
    expect(wksC.run).not.toHaveBeenCalled();
  });

  it('should pass down unparsed arguments', async () => {
    // Prepare workspaces
    const wksA = bed.addWorkspace('wksA', { scripts: { test: 'vitest' }});
    const wksB = bed.addWorkspace('wksB', { scripts: { test: 'vitest' }});
    const wksC = bed.addWorkspace('wksC');

    const tskA = new TestScriptTask(wksA, 'test', []);
    const tskB = new TestScriptTask(wksB, 'test', []);

    vi.spyOn(wksA, 'run').mockResolvedValue(tskA);
    vi.spyOn(wksB, 'run').mockResolvedValue(tskB);
    vi.spyOn(wksC, 'run').mockResolvedValue(null);

    // Run command
    vi.mocked(hasEveryScript$).mockReturnValue(filter$((wks) => wks !== wksC));

    await pipe$(yargs(), withLogger, planCommand(each, var$())).parseAsync('each test -- -d toto');

    expect(wksA.run).toHaveBeenCalledWith('test', ['-d', 'toto'], { buildDeps: 'all', buildScript: 'build' });
    expect(wksB.run).toHaveBeenCalledWith('test', ['-d', 'toto'], { buildDeps: 'all', buildScript: 'build' });
    expect(wksC.run).not.toHaveBeenCalled();
  });

  describe('affected filter', ()  => {
    it('should only run on affected workspaces', async () => {
      // Prepare workspaces
      const wksA = bed.addWorkspace('wksA', { scripts: { test: 'vitest' } });
      const wksB = bed.addWorkspace('wksB', { scripts: { test: 'vitest' } });
      const wksC = bed.addWorkspace('wksC');

      const tskA = new TestScriptTask(wksA, 'test', []);
      const tskB = new TestScriptTask(wksB, 'test', []);

      vi.spyOn(wksA, 'run').mockResolvedValue(tskA);
      vi.spyOn(wksB, 'run').mockResolvedValue(tskB);
      vi.spyOn(wksC, 'run').mockResolvedValue(null);

      // Run command
      vi.mocked(isAffected$).mockReturnValue(filter$((wks) => wks !== wksA)); // <= wksA is NOT affected
      vi.mocked(hasEveryScript$).mockReturnValue(filter$((wks) => wks !== wksC));

      const tasks$ = var$<TaskSet>();
      await pipe$(yargs(), withLogger, planCommand(each, tasks$)).parseAsync('each test --affected test');

      expect(tasks$.defer()?.tasks).toStrictEqual([tskB]);

      expect(wksA.run).not.toHaveBeenCalled();
      expect(wksB.run).toHaveBeenCalledWith('test', [], { buildDeps: 'all', buildScript: 'build' });
      expect(wksC.run).not.toHaveBeenCalled();

      expect(isAffected$).toHaveBeenCalledWith({
        format: 'test',
        fallback: 'master',
      });
    });

    it('should pass all "affected" options', async () => {
      // Prepare workspaces
      const wksA = bed.addWorkspace('wksA', { scripts: { test: 'vitest' } });
      const wksB = bed.addWorkspace('wksB', { scripts: { test: 'vitest' } });
      const wksC = bed.addWorkspace('wksC');

      const tskA = new TestScriptTask(wksA, 'test', []);
      const tskB = new TestScriptTask(wksB, 'test', []);

      vi.spyOn(wksA, 'run').mockResolvedValue(tskA);
      vi.spyOn(wksB, 'run').mockResolvedValue(tskB);
      vi.spyOn(wksC, 'run').mockResolvedValue(null);

      // Run command
      vi.mocked(isAffected$).mockReturnValue(filter$((wks) => wks !== wksA)); // <= wksA is NOT affected
      vi.mocked(hasEveryScript$).mockReturnValue(filter$((wks) => wks !== wksC));

      const tasks$ = var$<TaskSet>();
      await pipe$(yargs(), withLogger, planCommand(each, tasks$)).parseAsync('each test --affected test --affected-rev-fallback main --affected-rev-sort v:refname');

      expect(tasks$.defer()?.tasks).toStrictEqual([tskB]);

      expect(wksA.run).not.toHaveBeenCalled();
      expect(wksB.run).toHaveBeenCalledWith('test', [], { buildDeps: 'all', buildScript: 'build' });
      expect(wksC.run).not.toHaveBeenCalled();

      expect(isAffected$).toHaveBeenCalledWith({
        format: 'test',
        fallback: 'main',
        sort: 'v:refname',
      });
    });
  });

  describe('private filter', ()  => {
    it('should only run on private workspaces', async () => {
      // Prepare workspaces
      const wksA = bed.addWorkspace('wksA', { scripts: { test: 'vitest' } });
      const wksB = bed.addWorkspace('wksB', { private: true, scripts: { test: 'vitest' } });
      const wksC = bed.addWorkspace('wksC', { private: true });

      const tskA = new TestScriptTask(wksA, 'test', []);
      const tskB = new TestScriptTask(wksB, 'test', []);

      vi.spyOn(wksA, 'run').mockResolvedValue(tskA);
      vi.spyOn(wksB, 'run').mockResolvedValue(tskB);
      vi.spyOn(wksC, 'run').mockResolvedValue(null);

      // Run command
      vi.mocked(isPrivate$).mockReturnValue(filter$((wks) => wks !== wksA));
      vi.mocked(hasEveryScript$).mockReturnValue(filter$((wks) => wks !== wksC));

      const tasks$ = var$<TaskSet>();
      await pipe$(yargs(), withLogger, planCommand(each, tasks$)).parseAsync('each test --private');

      expect(tasks$.defer()?.tasks).toStrictEqual([tskB]);

      expect(wksA.run).not.toHaveBeenCalled();
      expect(wksB.run).toHaveBeenCalledWith('test', [], { buildDeps: 'all', buildScript: 'build' });
      expect(wksC.run).not.toHaveBeenCalled();

      expect(isPrivate$).toHaveBeenCalledWith(true);
    });

    it('should only run on public workspaces', async () => {
      // Prepare workspaces
      const wksA = bed.addWorkspace('wksA', { scripts: { test: 'vitest' } });
      const wksB = bed.addWorkspace('wksB', { private: true, scripts: { test: 'vitest' } });
      const wksC = bed.addWorkspace('wksC', { private: false });

      const tskA = new TestScriptTask(wksA, 'test', []);
      const tskB = new TestScriptTask(wksB, 'test', []);

      vi.spyOn(wksA, 'run').mockResolvedValue(tskA);
      vi.spyOn(wksB, 'run').mockResolvedValue(tskB);
      vi.spyOn(wksC, 'run').mockResolvedValue(null);

      // Run command
      vi.mocked(isPrivate$).mockReturnValue(filter$((wks) => wks !== wksB));
      vi.mocked(hasEveryScript$).mockReturnValue(filter$((wks) => wks !== wksC));

      const tasks$ = var$<TaskSet>();
      await pipe$(yargs(), withLogger, planCommand(each, tasks$)).parseAsync('each test --no-private');

      expect(tasks$.defer()?.tasks).toStrictEqual([tskA]);

      expect(wksA.run).toHaveBeenCalledWith('test', [], { buildDeps: 'all', buildScript: 'build' });
      expect(wksB.run).not.toHaveBeenCalled();
      expect(wksC.run).not.toHaveBeenCalled();

      expect(isPrivate$).toHaveBeenCalledWith(false);
    });
  });
});
