import { SpawnTask, type TaskManager } from '@jujulego/tasks';
import { cleanup, render } from 'ink-testing-library';
import symbols from 'log-symbols';
import yargs, { type CommandModule } from 'yargs';

import { RunCommand } from '@/src/commands/run';
import { INK_APP } from '@/src/ink.config';
import { container } from '@/src/inversify.config';
import { type Workspace, type WorkspaceContext } from '@/src/project/workspace';
import { TASK_MANAGER } from '@/src/tasks/task-manager.config';
import Layout from '@/src/ui/layout';

import { TestBed } from '@/tools/test-bed';
import { flushPromises, spyLogger, wrapInkTestApp } from '@/tools/utils';

// Setup
let app: ReturnType<typeof render>;
let command: CommandModule;
let manager: TaskManager;

let bed: TestBed;
let wks: Workspace;
let task: SpawnTask<WorkspaceContext>;

beforeEach(async () => {
  container.snapshot();

  bed = new TestBed();
  wks = bed.addWorkspace('wks');
  task = new SpawnTask('cmd', [], { workspace: wks, script: 'cmd' }, {
    logger: spyLogger,
  });

  app = render(<Layout />);
  container.rebind(INK_APP).toConstantValue(wrapInkTestApp(app));

  command = await bed.prepareCommand(RunCommand, wks);
  manager = container.get(TASK_MANAGER);

  // Mocks
  jest.resetAllMocks();
  jest.restoreAllMocks();

  jest.spyOn(wks, 'run').mockResolvedValue(task);

  jest.spyOn(manager, 'add').mockImplementation();
  jest.spyOn(manager, 'tasks', 'get').mockReturnValue([task]);
});

afterEach(() => {
  container.restore();
  cleanup();
});

// Tests
describe('jill run', () => {
  it('should run command in current workspace', async () => {
    // Run command
    const prom = yargs.command(command)
      .parse('run -w wks cmd -- --arg');

    await flushPromises();

    // should create script task
    expect(wks.run).toHaveBeenCalledWith('cmd', ['--arg'], { buildDeps: 'all' });

    // should print task spinner
    expect(app.lastFrame()).toEqual(expect.ignoreColor(/^. Running cmd in wks$/));

    // complete task
    jest.spyOn(task, 'status', 'get').mockReturnValue('done');
    task.emit('status.done', { status: 'done', previous: 'running' });
    task.emit('completed', { status: 'done', duration: 100 });

    await prom;

    // should print task completed
    expect(app.lastFrame()).toEqual(expect.ignoreColor(`${symbols.success} Running cmd in wks (took 100ms)`));
  });

  it('should use given dependency selection mode', async () => {
    // Run command
    const prom = yargs.command(command)
      .parse('run -w wks --deps-mode prod cmd -- --arg');

    await flushPromises();

    // should create script task than add it to manager
    expect(wks.run).toHaveBeenCalledWith('cmd', ['--arg'], { buildDeps: 'prod' });

    // complete task
    jest.spyOn(task, 'status', 'get').mockReturnValue('done');
    task.emit('status.done', { status: 'done', previous: 'running' });
    task.emit('completed', { status: 'done', duration: 100 });

    await prom;
  });
});
