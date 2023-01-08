import { SpawnTask } from '@jujulego/tasks';
import { cleanup, render } from 'ink-testing-library';
import symbols from 'log-symbols';
import yargs, { type CommandModule } from 'yargs';

import '@/src/commands/run';
import { COMMAND } from '@/src/bases/command';
import { INK_APP } from '@/src/ink.config';
import { container } from '@/src/inversify.config';
import { LoadProject } from '@/src/middlewares/load-project';
import { LoadWorkspace } from '@/src/middlewares/load-workspace';
import { CURRENT } from '@/src/project/constants';
import { Project } from '@/src/project/project';
import { Workspace, type WorkspaceContext } from '@/src/project/workspace';
import { TASK_MANAGER } from '@/src/tasks/task-manager.config';
import Layout from '@/src/ui/layout';

import { TestBed } from '@/tools/test-bed';
import { flushPromises, spyLogger, wrapInkTestApp } from '@/tools/utils';

// Setup
let app: ReturnType<typeof render>;
let command: CommandModule;

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

  command = await container.getNamedAsync(COMMAND, 'run');

  // Mocks
  jest.resetAllMocks();
  jest.restoreAllMocks();

  jest.spyOn(wks, 'run').mockResolvedValue(task);

  jest.spyOn(LoadProject.prototype, 'handler').mockImplementation(async () => {
    container.bind(Project).toConstantValue(bed.project).whenTargetNamed(CURRENT);
  });
  jest.spyOn(LoadWorkspace.prototype, 'handler').mockImplementation(async () => {
    container.bind(Workspace).toConstantValue(wks).whenTargetNamed(CURRENT);
  });
});

afterEach(() => {
  container.restore();
  cleanup();
});

// Tests
describe('jill run', () => {
  it('should run command in current workspace', async () => {
    const manager = container.get(TASK_MANAGER);

    jest.spyOn(manager, 'add').mockImplementation();
    jest.spyOn(manager, 'tasks', 'get').mockReturnValue([task]);

    // Run command
    const prom = yargs.command(command)
      .parse('run -w wks cmd -- --arg');

    await flushPromises();

    // should create script task than add it to manager
    expect(wks.run).toHaveBeenCalledWith('cmd', ['--arg'], { buildDeps: 'all' });
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
    const manager = container.get(TASK_MANAGER);

    jest.spyOn(manager, 'add').mockImplementation();
    jest.spyOn(manager, 'tasks', 'get').mockReturnValue([task]);

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

  it('should exit 1 if script fails', async () => {
    const manager = container.get(TASK_MANAGER);

    jest.spyOn(manager, 'add').mockImplementation();
    jest.spyOn(manager, 'tasks', 'get').mockReturnValue([task]);

    jest.spyOn(process, 'exit').mockImplementation();

    // Run command
    const prom = yargs.command(command)
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
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
