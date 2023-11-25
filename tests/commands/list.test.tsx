import { Logger } from '@jujulego/logger';
import { cleanup, render } from 'ink-testing-library';
import path from 'node:path';
import { vi } from 'vitest';
import yargs, { type CommandModule } from 'yargs';

import { ListCommand } from '@/src/commands/list.js';
import { INK_APP } from '@/src/ink.config.js';
import { container } from '@/src/inversify.config.js';
import Layout from '@/src/ui/layout.js';

import { TestBed } from '@/tools/test-bed.js';
import { wrapInkTestApp } from '@/tools/utils.js';
import { ContextService } from '@/src/commons/context.service.js';
import { ExitException } from '@/src/utils/exit.js';

// Setup
let app: ReturnType<typeof render>;
let command: CommandModule;
let context: ContextService;
let logger: Logger;

let bed: TestBed;

beforeAll(() => {
  container.snapshot();
});

beforeEach(async () => {
  container.restore();
  container.snapshot();

  vi.restoreAllMocks();

  // Project
  bed = new TestBed();
  context = container.get(ContextService);
  logger = container.get(Logger);

  app = render(<Layout />);
  container.rebind(INK_APP).toConstantValue(wrapInkTestApp(app));

  command = await bed.prepareCommand(ListCommand);
});

afterEach(() => {
  cleanup();
});

// Tests
describe('jill list', () => {
  it('should print list of all workspaces', async () => {
    context.reset({});

    // Setup workspaces
    bed.addWorkspace('wks-1');
    bed.addWorkspace('wks-2');
    bed.addWorkspace('wks-3');

    // Run command
    await yargs().command(command)
      .parse('list');

    expect(app.lastFrame()).toEqualLines([
      'wks-1',
      'wks-2',
      'wks-3',
    ]);
  });

  describe('private filter', () => {
    it('should print only private workspaces (--private)', async () => {
      context.reset({});

      // Setup workspaces
      bed.addWorkspace('wks-1', { private: true });
      bed.addWorkspace('wks-2');
      bed.addWorkspace('wks-3');

      // Run command
      await yargs().command(command)
        .parse('list --private');

      expect(app.lastFrame()).toEqualLines([
        'wks-1',
      ]);
    });

    it('should print only public workspaces (--no-private)', async () => {
      context.reset({});

      // Setup workspaces
      bed.addWorkspace('wks-1', { private: true });
      bed.addWorkspace('wks-2');
      bed.addWorkspace('wks-3');

      // Run command
      await yargs().command(command)
        .parse('list --no-private');

      expect(app.lastFrame()).toEqualLines([
        'wks-2',
        'wks-3',
      ]);
    });
  });

  describe('affected filter', () => {
    it('should print only affected workspaces (--affected test)', async () => {
      context.reset({});

      // Setup workspaces
      const workspaces = [
        bed.addWorkspace('wks-1'),
        bed.addWorkspace('wks-2'),
        bed.addWorkspace('wks-3'),
      ];

      vi.spyOn(workspaces[0], 'isAffected').mockResolvedValue(false);
      vi.spyOn(workspaces[1], 'isAffected').mockResolvedValue(true);
      vi.spyOn(workspaces[2], 'isAffected').mockResolvedValue(false);

      // Run command
      await yargs().command(command)
        .parse('list --affected test');

      expect(app.lastFrame()).toEqualLines([
        'wks-2',
      ]);
    });
  });

  describe('with-script filter', () => {
    it('should print only workspaces with \'test\' script (--with-script test)', async () => {
      context.reset({});

      // Setup workspaces
      bed.addWorkspace('wks-1');
      bed.addWorkspace('wks-2', { scripts: { test: 'test' }});
      bed.addWorkspace('wks-3', { scripts: { lint: 'lint' }});

      // Run command
      await yargs().command(command)
        .parse('list --with-script test');

      expect(app.lastFrame()).toEqualLines([
        'wks-2',
      ]);
    });

    it('should print only workspaces with \'test\' or \'lint\' scripts (--with-script test lint)', async () => {
      context.reset({});

      // Setup workspaces
      bed.addWorkspace('wks-1');
      bed.addWorkspace('wks-2', { scripts: { test: 'test' }});
      bed.addWorkspace('wks-3', { scripts: { lint: 'lint' }});

      // Run command
      await yargs().command(command)
        .parse('list --with-script test lint');

      expect(app.lastFrame()).toEqualLines([
        'wks-2',
        'wks-3',
      ]);
    });
  });

  describe('formatting', () => {
    it('should print list with headers (--headers)', async () => {
      context.reset({});

      // Setup workspaces
      bed.addWorkspace('wks-1');
      bed.addWorkspace('wks-2');
      bed.addWorkspace('wks-3');

      // Run command
      await yargs().command(command)
        .parse('list --headers');

      expect(app.lastFrame()).toEqualLines([
        expect.ignoreColor('Name'),
        'wks-1',
        'wks-2',
        'wks-3',
      ]);
    });

    it('should print long list of all workspaces (--long)', async () => {
      context.reset({});

      // Setup workspaces
      bed.addWorkspace('wks-1');
      bed.addWorkspace('wks-2');
      bed.addWorkspace('wks-3');

      // Run command
      await yargs().command(command)
        .parse('list --long');

      expect(app.lastFrame()).toEqualLines([
        expect.ignoreColor('Name   Version  Root'),
        `wks-1  1.0.0    ${path.join('test', 'wks-1')}`,
        `wks-2  1.0.0    ${path.join('test', 'wks-2')}`,
        `wks-3  1.0.0    ${path.join('test', 'wks-3')}`,
      ]);
    });

    it('should print json array of all workspaces (--json)', async () => {
      context.reset({});

      // Setup workspaces
      bed.addWorkspace('wks-1');
      bed.addWorkspace('wks-2');
      bed.addWorkspace('wks-3');

      vi.spyOn(process.stdout, 'write').mockReturnValue(true);

      // Run command
      await yargs().command(command)
        .parse('list --json');

      expect(process.stdout.write).toHaveBeenCalledWith(
        expect.jsonMatching([
          { name: 'wks-1', version: '1.0.0', slug: 'wks-1', root: path.resolve('./test/wks-1'), },
          { name: 'wks-2', version: '1.0.0', slug: 'wks-2', root: path.resolve('./test/wks-2'), },
          { name: 'wks-3', version: '1.0.0', slug: 'wks-3', root: path.resolve('./test/wks-3'), },
        ]),
      );
    });
  });

  describe('sort', () => {
    it('should sort workspaces by version then by name (--sort-by version name)', async () => {
      context.reset({});

      // Setup workspaces
      bed.addWorkspace('wks-1', { version: '1.2.0' });
      bed.addWorkspace('wks-2', { version: '1.0.0' });
      bed.addWorkspace('wks-3', { version: '1.0.0' });

      // Run command
      await yargs().command(command)
        .parse('list --sort-by version name');

      expect(app.lastFrame()).toEqualLines([
        expect.ignoreColor('Version  Name'),
        '1.0.0    wks-2',
        '1.0.0    wks-3',
        '1.2.0    wks-1',
      ]);
    });

    it('should sort workspaces by name in desc order (--order desc)', async () => {
      context.reset({});

      // Setup workspaces
      bed.addWorkspace('wks-1');
      bed.addWorkspace('wks-2');
      bed.addWorkspace('wks-3');

      // Run command
      await yargs().command(command)
        .parse('list --order desc');

      expect(app.lastFrame()).toEqualLines([
        'wks-3',
        'wks-2',
        'wks-1',
      ]);
    });

    it('should throw if trying to sort with a non printed attribute', async () => {
      context.reset({});
      vi.spyOn(logger, 'error');

      // Setup workspaces
      bed.addWorkspace('wks-1');
      bed.addWorkspace('wks-2');
      bed.addWorkspace('wks-3');

      // Run command
      await expect(
        yargs().command(command)
          .fail(false)
          .parse('list --attrs name --sort-by version')
      ).rejects.toEqual(new ExitException(1));

      expect(logger.error).toHaveBeenCalledWith('Cannot sort by non printed attributes. Missing version.');
    });
  });
});
