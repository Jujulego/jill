import { SpawnTask, TaskManager } from '@jujulego/tasks';
import { cleanup, render } from 'ink-testing-library';
import symbols from 'log-symbols';
import yargs from 'yargs';

import runCommand from '../../src/commands/run';
import { loadProject, loadWorkspace, setupInk } from '../../src/middlewares';
import { Project, Workspace, WorkspaceContext } from '../../src/project';
import { container, CURRENT, INK_APP } from '../../src/services';
import { Layout } from '../../src/ui';

import { TestBed } from '../../tools/test-bed';
import { flushPromises, spyLogger } from '../../tools/utils';

// Setup
let app: ReturnType<typeof render>;

let bed: TestBed;
let wks: Workspace;
let task: SpawnTask<WorkspaceContext>;

beforeEach(() => {
  container.snapshot();

  bed = new TestBed();

  wks = bed.workspace('wks');
  task = new SpawnTask('cmd', [], { workspace: wks, script: 'cmd' }, {
    logger: spyLogger,
  });

  // Mocks
  jest.resetAllMocks();
  jest.restoreAllMocks();

  jest.spyOn(wks, 'run').mockResolvedValue(task);

  jest.spyOn(setupInk, 'handler').mockImplementation(() => {
    app = render(<Layout />);
    container.bind(INK_APP).toConstantValue(app);
  });
  jest.spyOn(loadProject, 'handler').mockImplementation(() => {
    container.bind(Project)
      .toConstantValue(bed.project)
      .whenTargetNamed(CURRENT);
  });
  jest.spyOn(loadWorkspace, 'handler').mockImplementation(() => {
    container.bind(Workspace)
      .toConstantValue(wks)
      .whenTargetNamed(CURRENT);
  });
});

afterEach(() => {
  container.restore();
  cleanup();
});

// Tests
describe('jill run', () => {
  it('should run command in current workspace', async () => {
    const manager = container.get(TaskManager);

    jest.spyOn(manager, 'add').mockImplementation();
    jest.spyOn(manager, 'tasks', 'get').mockReturnValue([task]);

    // Run command
    const prom = yargs.command(runCommand)
      .parse('run -w wks cmd -- --arg');

    // should create script task than add it to manager
    expect(wks.run).toHaveBeenCalledWith('cmd', ['--arg'], { buildDeps: 'all' });

    await flushPromises();
    expect(manager.add).toHaveBeenCalledWith(task);

    // should print task spinner
    expect(app.lastFrame()).toMatch(/^. Running cmd in wks$/);

    // complete task
    jest.spyOn(task, 'status', 'get').mockReturnValue('done');
    task.emit('status.done', { status: 'done', previous: 'running' });
    task.emit('completed', { status: 'done', duration: 100 });

    await prom;

    // should print task completed
    expect(app.lastFrame()).toBe(`${symbols.success} Running cmd in wks (took 100ms)`);
  });

  it('should use given dependency selection mode', async () => {
    const manager = container.get(TaskManager);

    jest.spyOn(manager, 'add').mockImplementation();
    jest.spyOn(manager, 'tasks', 'get').mockReturnValue([task]);

    // Run command
    const prom = yargs.command(runCommand)
      .parse('run -w wks --deps-mode prod cmd -- --arg');

    // should create script task than add it to manager
    expect(wks.run).toHaveBeenCalledWith('cmd', ['--arg'], { buildDeps: 'prod' });

    await flushPromises();

    // complete task
    jest.spyOn(task, 'status', 'get').mockReturnValue('done');
    task.emit('status.done', { status: 'done', previous: 'running' });
    task.emit('completed', { status: 'done', duration: 100 });

    await prom;
  });

  it('should exit 1 if script fails', async () => {
    const manager = container.get(TaskManager);

    jest.spyOn(manager, 'add').mockImplementation();
    jest.spyOn(manager, 'tasks', 'get').mockReturnValue([task]);

    jest.spyOn(yargs, 'exit').mockImplementation();

    // Run command
    const prom = yargs.command(runCommand)
      .parse('run -w wks cmd -- --arg');

    await flushPromises();

    // should print task spinner
    expect(app.lastFrame()).toMatch(/^. Running cmd in wks$/);

    // complete task
    jest.spyOn(task, 'status', 'get').mockReturnValue('failed');
    task.emit('status.failed', { status: 'failed', previous: 'running' });
    task.emit('completed', { status: 'failed', duration: 100 });

    await prom;

    // should print task completed
    expect(app.lastFrame()).toBe(`${symbols.error} Running cmd in wks (took 100ms)`);
    expect(yargs.exit).toHaveBeenCalledWith(1, new Error('Task failed !'));
  });
});
