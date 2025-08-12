import { list } from '@/src/cli/commands.js';
import ListInk from '@/src/cli/commands/list.ink.js';
import { loadProject, type ProjectArgs, withProject } from '@/src/cli/middlewares/project.middleware.js';
import { isAffected$ } from '@/src/filters/affected.filter.js';
import { isPrivate$ } from '@/src/filters/private.filter.js';
import { hasSomeScript$ } from '@/src/filters/scripts.filter.js';
import { TestBed } from '@/tools/test-bed.js';
import { globalScope$ } from '@kyrielle/injector';
import { filter$ } from 'kyrielle';
import path from 'node:path';
import process from 'node:process';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import yargs, { type Argv } from 'yargs';

// Mocks
vi.mock('@/src/cli/commands/list.ink.jsx');
vi.mock('@/src/cli/middlewares/project.middleware.js');
vi.mock('@/src/filters/affected.filter.js');
vi.mock('@/src/filters/private.filter.js');
vi.mock('@/src/filters/scripts.filter.js');

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
describe('jill list', () => {
  it('should print list of all workspaces', async () => {
    bed.addWorkspace('wks-1');
    bed.addWorkspace('wks-2');
    bed.addWorkspace('wks-3');

    await yargs().command(list).parseAsync('list');

    expect(ListInk).toHaveBeenCalledWith({
      attributes: ['name'],
      headers: false,
      workspaces: [
        { name: 'wks-1' },
        { name: 'wks-2' },
        { name: 'wks-3' },
      ]
    });
  });

  describe('affected filter', () => {
    it('should print only affected workspaces (--affected test)', async () => {
      vi.mocked(isAffected$).mockReturnValue(filter$((wks) => wks.name === 'wks-1'));

      bed.addWorkspace('wks-1');
      bed.addWorkspace('wks-2');
      bed.addWorkspace('wks-3');

      await yargs().command(list).parseAsync('list --affected test');

      expect(ListInk).toHaveBeenCalledWith({
        attributes: ['name'],
        headers: false,
        workspaces: [
          { name: 'wks-1' },
        ]
      });

      expect(isAffected$).toHaveBeenCalledWith({
        format: 'test',
        fallback: 'master',
      });
    });

    it('should pass all "affected" options', async () => {
      vi.mocked(isAffected$).mockReturnValue(filter$((wks) => wks.name === 'wks-1'));

      bed.addWorkspace('wks-1');
      bed.addWorkspace('wks-2');
      bed.addWorkspace('wks-3');

      await yargs().command(list).parseAsync('list --affected test --affected-rev-fallback main --affected-rev-sort v:refname');

      expect(ListInk).toHaveBeenCalledWith({
        attributes: ['name'],
        headers: false,
        workspaces: [
          { name: 'wks-1' },
        ]
      });

      expect(isAffected$).toHaveBeenCalledWith({
        format: 'test',
        fallback: 'main',
        sort: 'v:refname',
      });
    });
  });

  describe('private filter', () => {
    it('should print only private workspaces (--private)', async () => {
      vi.mocked(isPrivate$).mockReturnValue(filter$((wks) => wks.name === 'wks-2'));

      bed.addWorkspace('wks-1');
      bed.addWorkspace('wks-2', { private: true });
      bed.addWorkspace('wks-3', { private: false });

      await yargs().command(list).parseAsync('list --private');

      expect(ListInk).toHaveBeenCalledWith({
        attributes: ['name'],
        headers: false,
        workspaces: [
          { name: 'wks-2' },
        ]
      });

      expect(isPrivate$).toHaveBeenCalledWith(true);
    });

    it('should print only public workspaces (--no-private)', async () => {
      vi.mocked(isPrivate$).mockReturnValue(filter$((wks) => wks.name !== 'wks-2'));

      bed.addWorkspace('wks-1');
      bed.addWorkspace('wks-2', { private: true });
      bed.addWorkspace('wks-3', { private: false });

      await yargs().command(list).parseAsync('list --no-private');

      expect(ListInk).toHaveBeenCalledWith({
        attributes: ['name'],
        headers: false,
        workspaces: [
          { name: 'wks-1' },
          { name: 'wks-3' },
        ]
      });

      expect(isPrivate$).toHaveBeenCalledWith(false);
    });
  });

  describe('with-script filter', () => {
    it('should print only workspaces with a \'test\' script (--with-script test)', async () => {
      vi.mocked(hasSomeScript$).mockReturnValue(filter$((wks) => wks.name === 'wks-2'));

      bed.addWorkspace('wks-1');
      bed.addWorkspace('wks-2', { scripts: { test: 'vitest' } });
      bed.addWorkspace('wks-3', { scripts: { lint: 'eslint' } });

      await yargs().command(list).parseAsync('list --with-script test');

      expect(ListInk).toHaveBeenCalledWith({
        attributes: ['name'],
        headers: false,
        workspaces: [
          { name: 'wks-2' },
        ]
      });

      expect(hasSomeScript$).toHaveBeenCalledWith(['test']);
    });

    it('should print only workspaces with a \'test\' OR a \'lint\' script (--with-script test lint)', async () => {
      vi.mocked(hasSomeScript$).mockReturnValue(filter$((wks) => wks.name !== 'wks-1'));

      bed.addWorkspace('wks-1');
      bed.addWorkspace('wks-2', { scripts: { test: 'vitest' } });
      bed.addWorkspace('wks-3', { scripts: { lint: 'eslint' } });

      await yargs().command(list).parseAsync('list --with-script test lint');

      expect(ListInk).toHaveBeenCalledWith({
        attributes: ['name'],
        headers: false,
        workspaces: [
          { name: 'wks-2' },
          { name: 'wks-3' },
        ]
      });

      expect(hasSomeScript$).toHaveBeenCalledWith(['test', 'lint']);
    });
  });

  describe('formatting', () => {
    it('should print with headers (--headers)', async () => {
      bed.addWorkspace('wks-1');
      bed.addWorkspace('wks-2');
      bed.addWorkspace('wks-3');

      await yargs().command(list).parseAsync('list --headers');

      expect(ListInk).toHaveBeenCalledWith({
        attributes: ['name'],
        headers: true,
        workspaces: [
          { name: 'wks-1' },
          { name: 'wks-2' },
          { name: 'wks-3' },
        ]
      });
    });

    it('should print with "long" attributes (--long)', async () => {
      bed.addWorkspace('wks-1');
      bed.addWorkspace('wks-2');
      bed.addWorkspace('wks-3');

      await yargs().command(list).parseAsync('list --long');

      expect(ListInk).toHaveBeenCalledWith({
        attributes: ['name', 'version', 'root'],
        headers: false,
        workspaces: [
          { name: 'wks-1', version: '1.0.0', root: path.join('test', 'wks-1') },
          { name: 'wks-2', version: '1.0.0', root: path.join('test', 'wks-2') },
          { name: 'wks-3', version: '1.0.0', root: path.join('test', 'wks-3') },
        ]
      });
    });

    it('should print as json array (--json)', async () => {
      vi.spyOn(process.stdout, 'write').mockReturnValue(true);

      bed.addWorkspace('wks-1');
      bed.addWorkspace('wks-2');
      bed.addWorkspace('wks-3');

      await yargs().command(list).parseAsync('list --json');

      expect(ListInk).not.toHaveBeenCalled();
      expect(process.stdout.write).toHaveBeenCalledWith(expect.jsonMatching([
        { name: 'wks-1', version: '1.0.0', slug: 'wks-1', root: path.resolve('./test/wks-1'), },
        { name: 'wks-2', version: '1.0.0', slug: 'wks-2', root: path.resolve('./test/wks-2'), },
        { name: 'wks-3', version: '1.0.0', slug: 'wks-3', root: path.resolve('./test/wks-3'), },
      ]));
    });
  });

  describe('sort', () => {
    it('should sort workspaces by version and by name (--sort-by version name)', async () => {
      bed.addWorkspace('wks-1', { version: '1.2.0' });
      bed.addWorkspace('wks-2', { version: '1.0.0' });
      bed.addWorkspace('wks-3', { version: '1.0.0' });

      await yargs()
        .command(list)
        .parseAsync('list --sort-by version name');

      expect(ListInk).toHaveBeenCalledWith({
        attributes: ['version', 'name'],
        headers: false,
        workspaces: [
          { name: 'wks-2', version: '1.0.0' },
          { name: 'wks-3', version: '1.0.0' },
          { name: 'wks-1', version: '1.2.0' },
        ]
      });
    });

    it('should sort workspaces in descendant order (--order desc)', async () => {
      bed.addWorkspace('wks-1');
      bed.addWorkspace('wks-2');
      bed.addWorkspace('wks-3');

      await yargs()
        .command(list)
        .parseAsync('list --order desc');

      expect(ListInk).toHaveBeenCalledWith({
        attributes: ['name'],
        headers: false,
        workspaces: [
          { name: 'wks-3' },
          { name: 'wks-2' },
          { name: 'wks-1' },
        ]
      });
    });

    it('should fail to sort by non printed attribute', async () => {
      bed.addWorkspace('wks-1');
      bed.addWorkspace('wks-2');
      bed.addWorkspace('wks-3');

      await expect((async () =>
        yargs()
          .command(list)
          .exitProcess(false)
          .showHelpOnFail(false)
          .parseAsync('list --attribute name --sort-by version name')
      )()).rejects.toEqual(new Error('Cannot sort by non printed attributes. Missing version.'));

      expect(ListInk).not.toHaveBeenCalled();
    });
  });
});
