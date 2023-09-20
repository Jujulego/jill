import { vi } from 'vitest';

import { GitService } from '@/src/commons/git.service.js';
import { AffectedFilter } from '@/src/filters/affected.filter.js';
import { container } from '@/src/inversify.config.js';
import { type Workspace } from '@/src/project/workspace.js';
import { TestBed } from '@/tools/test-bed.js';

// Setup
let bed: TestBed;
let wks: Workspace;
let git: GitService;

beforeEach(() => {
  container.snapshot();

  // Workspaces
  bed = new TestBed();
  wks = bed.addWorkspace('wks');

  // Mocks
  vi.restoreAllMocks();

  git = container.get(GitService);
  vi.spyOn(git, 'listBranches');
  vi.spyOn(git, 'listTags');

  vi.spyOn(wks, 'isAffected').mockResolvedValue(true);
});

afterEach(() => {
  container.restore();
});

// Test suites
describe('AffectedFilter', () => {
  it('should test against format', async () => {
    const filter = new AffectedFilter('format', 'fallback');

    await expect(filter.test(wks))
      .resolves.toBe(true);

    // Check
    expect(wks.isAffected).toHaveBeenCalledWith('format');
    expect(git.listBranches).not.toHaveBeenCalled();
    expect(git.listTags).not.toHaveBeenCalled();
  });

  it('should test against env-wks', async () => {
    const filter = new AffectedFilter('env-%name', 'fallback');

    await expect(filter.test(wks))
      .resolves.toBe(true);

    // Check
    expect(wks.isAffected).toHaveBeenCalledWith('env-wks');
    expect(git.listBranches).not.toHaveBeenCalled();
    expect(git.listTags).not.toHaveBeenCalled();
  });

  it('should test against env-%name', async () => {
    const filter = new AffectedFilter('env-\\%name', 'fallback');

    await expect(filter.test(wks))
      .resolves.toBe(true);

    // Check
    expect(wks.isAffected).toHaveBeenCalledWith('env-%name');
    expect(git.listBranches).not.toHaveBeenCalled();
    expect(git.listTags).not.toHaveBeenCalled();
  });

  it('should test against env-\\wks', async () => {
    const filter = new AffectedFilter('env-\\\\%name', 'fallback');

    await expect(filter.test(wks))
      .resolves.toBe(true);

    // Check
    expect(wks.isAffected).toHaveBeenCalledWith('env-\\wks');
    expect(git.listBranches).not.toHaveBeenCalled();
    expect(git.listTags).not.toHaveBeenCalled();
  });

  it('should test against branch-2', async () => {
    const filter = new AffectedFilter('branch-*', 'fallback');

    vi.mocked(git.listBranches).mockResolvedValue(['branch-1', 'branch-2']);

    await expect(filter.test(wks))
      .resolves.toBe(true);

    // Check
    expect(wks.isAffected).toHaveBeenCalledWith('branch-2');
    expect(git.listBranches).toHaveBeenCalledWith(['branch-*'], expect.objectContaining({ cwd: wks.cwd }));
    expect(git.listTags).not.toHaveBeenCalled();
  });

  it('should test against tag-2', async () => {
    const filter = new AffectedFilter('tag-*', 'fallback');

    vi.mocked(git.listBranches).mockResolvedValue([]);
    vi.mocked(git.listTags).mockResolvedValue(['tag-1', 'tag-2']);

    await expect(filter.test(wks))
      .resolves.toBe(true);

    // Check
    expect(wks.isAffected).toHaveBeenCalledWith('tag-2');
    expect(git.listBranches).toHaveBeenCalledWith(['tag-*'], expect.objectContaining({ cwd: wks.cwd }));
    expect(git.listTags).toHaveBeenCalledWith(['tag-*'], expect.objectContaining({ cwd: wks.cwd }));
  });

  it('should test against fallback', async () => {
    const filter = new AffectedFilter('tag-*', 'fallback');

    vi.mocked(git.listBranches).mockResolvedValue([]);
    vi.mocked(git.listTags).mockResolvedValue([]);

    await expect(filter.test(wks))
      .resolves.toBe(true);

    // Check
    expect(wks.isAffected).toHaveBeenCalledWith('fallback');
    expect(git.listBranches).toHaveBeenCalledWith(['tag-*'], expect.objectContaining({ cwd: wks.cwd }));
    expect(git.listTags).toHaveBeenCalledWith(['tag-*'], expect.objectContaining({ cwd: wks.cwd }));
  });

  it('should use sort arguments', async () => {
    const filter = new AffectedFilter('tag-*', 'fallback', 'v:refname');

    vi.mocked(git.listBranches).mockResolvedValue([]);
    vi.mocked(git.listTags).mockResolvedValue(['tag-1', 'tag-2']);

    await expect(filter.test(wks))
      .resolves.toBe(true);

    // Check
    expect(wks.isAffected).toHaveBeenCalledWith('tag-2');
    expect(git.listBranches).toHaveBeenCalledWith(['--sort', 'v:refname', 'tag-*'], expect.objectContaining({ cwd: wks.cwd }));
    expect(git.listTags).toHaveBeenCalledWith(['--sort', 'v:refname', 'tag-*'], expect.objectContaining({ cwd: wks.cwd }));
  });
});
