import { SpawnTask } from '@jujulego/tasks';
import { vi } from 'vitest';

import '@/src/commons/logger.service.js';
import { ContextService } from '@/src/commons/context.service.ts';
import { CONFIG } from '@/src/config/config-loader.js';
import { CURRENT } from '@/src/constants.ts';
import { CorePlugin } from '@/src/core.plugin.ts';
import { container } from '@/src/inversify.config.ts';
import { JillApplication } from '@/src/jill.application.ts';
import { getModule } from '@/src/modules/module.ts';
import { PluginLoaderService } from '@/src/modules/plugin-loader.service.ts';

import { MockCommand } from '@/tools/mocks/mock.command.ts';
import { MockTaskCommand } from '@/tools/mocks/mock-task.command.ts';

// Mocks
vi.mock('@/src/modules/module', async (importOriginal) => {
  const mod: typeof import('@/src/modules/module.ts') = await importOriginal();

  return {
    ...mod,
    getModule: vi.fn(mod.getModule),
  };
});

// Setup global config
container.rebind(CONFIG).toConstantValue({ jobs: 1 });

// Setup
let application: JillApplication;
let context: ContextService;
let plugins: PluginLoaderService;

beforeAll(() => {
  container.snapshot();
});

beforeEach(async () => {
  container.restore();
  container.snapshot();

  application = container.get(JillApplication);
  context = container.get(ContextService);
  plugins = container.get(PluginLoaderService);

  vi.clearAllMocks();

  vi.spyOn(plugins, 'loadPlugins').mockResolvedValue();
});

// Tests
describe('JillApplication.run', () => {
  beforeEach(() => {
    vi.spyOn(application.parser, 'parseAsync');
  });

  it('should load plugins and run command', async () => {
    await application.run('jill --help');

    expect(getModule).toHaveBeenCalledWith(CorePlugin, true);
    expect(plugins.loadPlugins).toHaveBeenCalledWith(application.container);

    expect(application.parser.parseAsync).toHaveBeenCalledWith('jill --help');
  });

  it('should set application in context', async () => {
    await application.run('jill --help');

    expect(context.application).toBe(application);
  });
});

describe('JillApplication.taskOf', () => {
  let mockCommand: MockCommand;
  let taskCommand: MockTaskCommand;

  beforeEach(() => {
    mockCommand = new MockCommand();
    taskCommand = new MockTaskCommand();

    vi.spyOn(application.container, 'getAllAsync')
      .mockResolvedValue([
        mockCommand,
        taskCommand,
      ]);
  });

  it('should return an empty array for non task command', async () => {
    await expect(application.tasksOf(['mock']))
      .resolves.toEqual([]);

    expect(mockCommand.handler).not.toHaveBeenCalled();
  });

  it('should return tasks from command\'s prepare method', async () => {
    const task = new SpawnTask('test', [], {});
    vi.spyOn(taskCommand, 'prepare').mockImplementation(function *prepare() {
      yield task;
    });

    await expect(application.tasksOf(['task']))
      .resolves.toEqual([task]);

    expect(taskCommand.handler).not.toHaveBeenCalled();
    expect(taskCommand.prepare).toHaveBeenCalledWith({
      $0: 'jill',
      _: ['task'],
      plan: true,
    });
  });
});

describe('JillApplication CURRENT binding', () => {
  it('should return application from context', () => {
    // Set project in context
    const application = container.get(JillApplication);
    context.reset({ application });

    // Use binding
    expect(container.getNamed(JillApplication, CURRENT)).toBe(application);
  });

  it('should throw if application miss in context', () => {
    // Set project in context
    context.reset();

    // Use binding
    expect(() => container.getNamed(JillApplication, CURRENT))
      .toThrow(new Error('Cannot inject current application, it not yet defined'));
  });
});
