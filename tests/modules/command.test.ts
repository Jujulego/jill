import yargs, { type ArgumentsCamelCase, type CommandBuilder } from 'yargs';

import {
  buildCommandModule,
  COMMAND_MODULE,
  Command,
  getCommandOpts,
  type ICommand,
  type ICommandOpts
} from '@/src/modules/command';
import { applyMiddlewares, type IMiddleware, Middleware } from '@/src/modules/middleware';
import { container } from '@/src/inversify.config';
import { getRegistry } from '@/src/modules/module';
import { ContainerModule } from 'inversify';

// Utils
@Command({
  command: 'test',
  describe: 'test',
})
class TestCommand implements ICommand {
  // Methods
  builder = jest.fn((parser) => parser);
  handler = jest.fn();
}

@Middleware()
class TestMiddleware implements IMiddleware {
  // Methods
  handler = jest.fn();
}

// Mocks
jest.mock('@/src/modules/middleware', () => {
  const actual = jest.requireActual('@/src/modules/middleware');

  return {
    ...actual,
    applyMiddlewares: jest.fn((parser) => parser),
  };
});

// Setup
beforeEach(() => {
  container.snapshot();
});

afterEach(() => {
  container.restore();
});

// Tests
describe('getCommandOpts', () => {
  it('should return command options of given class', () => {
    expect(getCommandOpts(TestCommand)).toEqual({
      command: 'test',
      describe: 'test',
    });
  });

  it('should throw if no options found', () => {
    class TestEmpty implements ICommand {
      handler = jest.fn();
    }

    expect(() => getCommandOpts(TestEmpty)).toThrow(new Error('No command options found in TestEmpty'));
  });
});

describe('buildCommandModule', () => {
  it('should return a yargs command module', () => {
    const opts: ICommandOpts = {
      command: 'test',
      describe: 'test',
    };

    const cmd: ICommand = {
      handler: jest.fn(),
    };

    // Build module
    const mdl = buildCommandModule(cmd, opts);

    expect(mdl).toEqual({
      command: opts.command,
      describe: opts.describe,
      builder: expect.any(Function),
      handler: expect.any(Function),
    });

    // Call builder & handler
    const parser = yargs();
    const args: ArgumentsCamelCase = { $0: 'jill', _: [] };

    // eslint-disable-next-line @typescript-eslint/ban-types
    expect((mdl.builder as Extract<CommandBuilder, Function>)(parser))
      .toBe(parser);

    mdl.handler(args);
    expect(cmd.handler).toHaveBeenCalledWith(args);
  });

  it('should call command builder in module builder', () => {
    const opts: ICommandOpts = {
      command: 'test',
      describe: 'test',
    };

    const cmd: ICommand = {
      builder: jest.fn((parser) => parser),
      handler: jest.fn(),
    };

    // Build module
    const mdl = buildCommandModule(cmd, opts);

    // Call builder & handler
    const parser = yargs();

    // eslint-disable-next-line @typescript-eslint/ban-types
    expect((mdl.builder as Extract<CommandBuilder, Function>)(parser))
      .toBe(parser);

    expect(cmd.builder).toHaveBeenCalledWith(parser);
  });

  it('should call middleware builder in module builder', () => {
    const opts: ICommandOpts = {
      command: 'test',
      describe: 'test',
      middlewares: [TestMiddleware],
    };

    const cmd: ICommand = {
      builder: jest.fn((parser) => parser),
      handler: jest.fn(),
    };

    // Build module
    const mdl = buildCommandModule(cmd, opts);

    // Call builder & handler
    const parser = yargs();

    // eslint-disable-next-line @typescript-eslint/ban-types
    expect((mdl.builder as Extract<CommandBuilder, Function>)(parser))
      .toBe(parser);

    expect(cmd.builder).toHaveBeenCalledWith(parser);
    expect(applyMiddlewares).toHaveBeenCalledWith(parser, [TestMiddleware]);
  });
});

describe('@Command', () => {
  it('should create a registry to load Command in container', async () => {
    // Load command
    const registry = getRegistry(TestCommand);
    container.load(new ContainerModule(registry));

    // Get class
    expect(container.get(TestCommand)).toBeInstanceOf(TestCommand);

    // Get module
    await expect(container.getNamedAsync(COMMAND_MODULE, 'test'))
      .resolves.toEqual({
        command: 'test',
        describe: 'test',
        builder: expect.any(Function),
        handler: expect.any(Function),
      });
  });
});
