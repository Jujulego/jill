import { cleanup, render } from 'ink-testing-library';
import path from 'node:path';
import yargs, { type CommandModule } from 'yargs';

import '@/src/commands/list';
import { COMMAND } from '@/src/modules/command';
import { INK_APP } from '@/src/ink.config';
import { container } from '@/src/inversify.config';
import { LoadProject } from '@/src/middlewares/load-project';
import { Project } from '@/src/project/project';
import { CURRENT } from '@/src/project/constants';
import Layout from '@/src/ui/layout';

import { TestBed } from '@/tools/test-bed';
import { wrapInkTestApp } from '@/tools/utils';

// Setup
let app: ReturnType<typeof render>;
let command: CommandModule;

let bed: TestBed;

beforeEach(async () => {
  container.snapshot();

  jest.resetAllMocks();
  jest.restoreAllMocks();

  // Project
  bed = new TestBed();

  app = render(<Layout />);
  container.rebind(INK_APP).toConstantValue(wrapInkTestApp(app));

  command = await container.getNamedAsync(COMMAND, 'list');

  // Mocks
  jest.spyOn(console, 'log').mockImplementation();

  jest.spyOn(LoadProject.prototype, 'handler').mockImplementation(async () => {
    container.bind(Project).toConstantValue(bed.project).whenTargetNamed(CURRENT);
  });
});

afterEach(() => {
  container.restore();
  cleanup();
});

// Tests
describe('jill list', () => {
  it('should print list of all workspaces', async () => {
    // Setup workspaces
    bed.addWorkspace('wks-1');
    bed.addWorkspace('wks-2');
    bed.addWorkspace('wks-3');

    // Run command
    await yargs.command(command)
      .parse('list');

    expect(app.lastFrame()).toEqualLines([
      'wks-1',
      'wks-2',
      'wks-3',
    ]);
  });

  describe('private filter', () => {
    it('should print only private workspaces (--private)', async () => {
      // Setup workspaces
      bed.addWorkspace('wks-1', { private: true });
      bed.addWorkspace('wks-2');
      bed.addWorkspace('wks-3');

      // Run command
      await yargs.command(command)
        .parse('list --private');

      expect(app.lastFrame()).toEqualLines([
        'wks-1',
      ]);
    });

    it('should print only public workspaces (--no-private)', async () => {
      // Setup workspaces
      bed.addWorkspace('wks-1', { private: true });
      bed.addWorkspace('wks-2');
      bed.addWorkspace('wks-3');

      // Run command
      await yargs.command(command)
        .parse('list --no-private');

      expect(app.lastFrame()).toEqualLines([
        'wks-2',
        'wks-3',
      ]);
    });
  });

  describe('affected filter', () => {
    it('should print only affected workspaces (--affected test)', async () => {
      // Setup workspaces
      const workspaces = [
        bed.addWorkspace('wks-1'),
        bed.addWorkspace('wks-2'),
        bed.addWorkspace('wks-3'),
      ];

      jest.spyOn(workspaces[0], 'isAffected').mockResolvedValue(false);
      jest.spyOn(workspaces[1], 'isAffected').mockResolvedValue(true);
      jest.spyOn(workspaces[2], 'isAffected').mockResolvedValue(false);

      // Run command
      await yargs.command(command)
        .parse('list --affected test');

      expect(app.lastFrame()).toEqualLines([
        'wks-2',
      ]);
    });
  });

  describe('with-script filter', () => {
    it('should print only workspaces with \'test\' script (--with-script test)', async () => {
      // Setup workspaces
      bed.addWorkspace('wks-1');
      bed.addWorkspace('wks-2', { scripts: { test: 'test' }});
      bed.addWorkspace('wks-3', { scripts: { lint: 'lint' }});

      // Run command
      await yargs.command(command)
        .parse('list --with-script test');

      expect(app.lastFrame()).toEqualLines([
        'wks-2',
      ]);
    });

    it('should print only workspaces with \'test\' or \'lint\' scripts (--with-script test lint)', async () => {
      // Setup workspaces
      bed.addWorkspace('wks-1');
      bed.addWorkspace('wks-2', { scripts: { test: 'test' }});
      bed.addWorkspace('wks-3', { scripts: { lint: 'lint' }});

      // Run command
      await yargs.command(command)
        .parse('list --with-script test lint');

      expect(app.lastFrame()).toEqualLines([
        'wks-2',
        'wks-3',
      ]);
    });
  });

  describe('formatting', () => {
    it('should print list with headers (--headers)', async () => {
      // Setup workspaces
      bed.addWorkspace('wks-1');
      bed.addWorkspace('wks-2');
      bed.addWorkspace('wks-3');

      // Run command
      await yargs.command(command)
        .parse('list --headers');

      expect(app.lastFrame()).toEqualLines([
        expect.ignoreColor('Name'),
        'wks-1',
        'wks-2',
        'wks-3',
      ]);
    });

    it('should print long list of all workspaces (--long)', async () => {
      // Setup workspaces
      bed.addWorkspace('wks-1');
      bed.addWorkspace('wks-2');
      bed.addWorkspace('wks-3');

      // Run command
      await yargs.command(command)
        .parse('list --long');

      expect(app.lastFrame()).toEqualLines([
        expect.ignoreColor('Name   Version  Root'),
        `wks-1  1.0.0    ${path.join('test', 'wks-1')}`,
        `wks-2  1.0.0    ${path.join('test', 'wks-2')}`,
        `wks-3  1.0.0    ${path.join('test', 'wks-3')}`,
      ]);
    });

    it('should print json array of all workspaces (--json)', async () => {
      // Setup workspaces
      bed.addWorkspace('wks-1');
      bed.addWorkspace('wks-2');
      bed.addWorkspace('wks-3');

      jest.spyOn(process.stdout, 'write').mockImplementation();

      // Run command
      await yargs.command(command)
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
});
