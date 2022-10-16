import { render } from 'ink-testing-library';
import path from 'node:path';
import yargs from 'yargs';

import { TestBed } from '../test-bed';
import { container, CURRENT, INK_APP, Layout, loadProject, Project, setupInk } from '../../src';
import listCommand from '../../src/commands/list';

// Setup
let app: ReturnType<typeof render>;
let bed: TestBed;

beforeEach(() => {
  container.snapshot();

  jest.resetAllMocks();
  jest.restoreAllMocks();

  // Project
  bed = new TestBed();

  // Mocks
  jest.spyOn(console, 'log').mockImplementation();
  jest.spyOn(setupInk, 'handler').mockImplementation(() => {
    app = render(<Layout />);
    container.bind(INK_APP).toConstantValue(app);
  });
  jest.spyOn(loadProject, 'handler').mockImplementation(() => {
    container.bind(Project)
      .toConstantValue(bed.project)
      .whenTargetNamed(CURRENT);
  });
});

afterEach(() => {
  container.restore();
});

// Tests
describe('jill list', () => {
  it('should print list of all workspaces', async () => {
    // Setup workspaces
    const workspaces = [
      bed.workspace('wks-1'),
      bed.workspace('wks-2'),
      bed.workspace('wks-3'),
    ];

    jest.spyOn(bed.project, 'workspaces').mockImplementation(async function* () {
      yield* workspaces;
    });

    // Run command
    await yargs.command(listCommand)
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
      const workspaces = [
        bed.workspace('wks-1', { private: true }),
        bed.workspace('wks-2'),
        bed.workspace('wks-3'),
      ];

      jest.spyOn(bed.project, 'workspaces').mockImplementation(async function* () {
        yield* workspaces;
      });

      // Run command
      await yargs.command(listCommand)
        .parse('list --private');

      expect(app.lastFrame()).toEqualLines([
        'wks-1',
      ]);
    });

    it('should print only public workspaces (--no-private)', async () => {
      // Setup workspaces
      const workspaces = [
        bed.workspace('wks-1', { private: true }),
        bed.workspace('wks-2'),
        bed.workspace('wks-3'),
      ];

      jest.spyOn(bed.project, 'workspaces').mockImplementation(async function* () {
        yield* workspaces;
      });

      // Run command
      await yargs.command(listCommand)
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
        bed.workspace('wks-1'),
        bed.workspace('wks-2'),
        bed.workspace('wks-3'),
      ];

      jest.spyOn(bed.project, 'workspaces').mockImplementation(async function* () {
        yield* workspaces;
      });

      jest.spyOn(workspaces[0], 'isAffected').mockResolvedValue(false);
      jest.spyOn(workspaces[1], 'isAffected').mockResolvedValue(true);
      jest.spyOn(workspaces[2], 'isAffected').mockResolvedValue(false);

      // Run command
      await yargs.command(listCommand)
        .parse('list --affected test');

      expect(app.lastFrame()).toEqualLines([
        'wks-2',
      ]);
    });
  });

  describe('with-script filter', () => {
    it('should print only workspaces with \'test\' script (--with-script test)', async () => {
      // Setup workspaces
      const workspaces = [
        bed.workspace('wks-1'),
        bed.workspace('wks-2', { scripts: { test: 'test' }}),
        bed.workspace('wks-3', { scripts: { lint: 'lint' }}),
      ];

      jest.spyOn(bed.project, 'workspaces').mockImplementation(async function* () {
        yield* workspaces;
      });

      // Run command
      await yargs.command(listCommand)
        .parse('list --with-script test');

      expect(app.lastFrame()).toEqualLines([
        'wks-2',
      ]);
    });

    it('should print only workspaces with \'test\' or \'lint\' scripts (--with-script test lint)', async () => {
      // Setup workspaces
      const workspaces = [
        bed.workspace('wks-1'),
        bed.workspace('wks-2', { scripts: { test: 'test' }}),
        bed.workspace('wks-3', { scripts: { lint: 'lint' }}),
      ];

      jest.spyOn(bed.project, 'workspaces').mockImplementation(async function* () {
        yield* workspaces;
      });

      // Run command
      await yargs.command(listCommand)
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
      const workspaces = [
        bed.workspace('wks-1'),
        bed.workspace('wks-2'),
        bed.workspace('wks-3'),
      ];

      jest.spyOn(bed.project, 'workspaces').mockImplementation(async function* () {
        yield* workspaces;
      });

      // Run command
      await yargs.command(listCommand)
        .parse('list --headers');

      expect(app.lastFrame()).toEqualLines([
        'Name',
        'wks-1',
        'wks-2',
        'wks-3',
      ]);
    });

    it('should print long list of all workspaces (--long)', async () => {
      // Setup workspaces
      const workspaces = [
        bed.workspace('wks-1'),
        bed.workspace('wks-2'),
        bed.workspace('wks-3'),
      ];

      jest.spyOn(bed.project, 'workspaces').mockImplementation(async function* () {
        yield* workspaces;
      });

      // Run command
      await yargs.command(listCommand)
        .parse('list --long');

      expect(app.lastFrame()).toEqualLines([
        'Name   Version  Root',
        `wks-1  1.0.0    ${path.join('test', 'wks-1')}`,
        `wks-2  1.0.0    ${path.join('test', 'wks-2')}`,
        `wks-3  1.0.0    ${path.join('test', 'wks-3')}`,
      ]);
    });

    it('should print json array of all workspaces (--json)', async () => {
      // Setup workspaces
      const workspaces = [
        bed.workspace('wks-1'),
        bed.workspace('wks-2'),
        bed.workspace('wks-3'),
      ];

      jest.spyOn(bed.project, 'workspaces').mockImplementation(async function* () {
        yield* workspaces;
      });

      // Run command
      await yargs.command(listCommand)
        .parse('list --json');

      expect(console.log).toHaveBeenCalledWith(
        expect.jsonMatching([
          { name: 'wks-1', version: '1.0.0', slug: 'wks-1', root: path.resolve('./test/wks-1'), },
          { name: 'wks-2', version: '1.0.0', slug: 'wks-2', root: path.resolve('./test/wks-2'), },
          { name: 'wks-3', version: '1.0.0', slug: 'wks-3', root: path.resolve('./test/wks-3'), },
        ]),
      );
    });
  });
});
