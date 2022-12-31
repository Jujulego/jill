import { AffectedFilter } from '@/src/filters/affected.filter';
import { Git } from '@/src/git';
import { Workspace } from '@/src/project';

import { TestBed } from '@/tools/test-bed';

// Setup
let bed: TestBed;
let wks: Workspace;

beforeEach(() => {
  bed = new TestBed();
  wks = bed.addWorkspace('wks');

  jest.resetAllMocks();
  jest.restoreAllMocks();

  jest.spyOn(Git, 'listBranches');
  jest.spyOn(Git, 'listTags');

  jest.spyOn(wks, 'isAffected').mockResolvedValue(true);
});

// Test suites
describe('AffectedFilter', () => {
  it('should test against format', async () => {
    const filter = new AffectedFilter('format', 'fallback');

    await expect(filter.test(wks))
      .resolves.toBe(true);

    // Check
    expect(wks.isAffected).toHaveBeenCalledWith('format');
    expect(Git.listBranches).not.toHaveBeenCalled();
    expect(Git.listTags).not.toHaveBeenCalled();
  });

  it('should test against env-wks', async () => {
    const filter = new AffectedFilter('env-%name', 'fallback');

    await expect(filter.test(wks))
      .resolves.toBe(true);

    // Check
    expect(wks.isAffected).toHaveBeenCalledWith('env-wks');
    expect(Git.listBranches).not.toHaveBeenCalled();
    expect(Git.listTags).not.toHaveBeenCalled();
  });

  it('should test against env-%name', async () => {
    const filter = new AffectedFilter('env-\\%name', 'fallback');

    await expect(filter.test(wks))
      .resolves.toBe(true);

    // Check
    expect(wks.isAffected).toHaveBeenCalledWith('env-%name');
    expect(Git.listBranches).not.toHaveBeenCalled();
    expect(Git.listTags).not.toHaveBeenCalled();
  });

  it('should test against env-\\wks', async () => {
    const filter = new AffectedFilter('env-\\\\%name', 'fallback');

    await expect(filter.test(wks))
      .resolves.toBe(true);

    // Check
    expect(wks.isAffected).toHaveBeenCalledWith('env-\\wks');
    expect(Git.listBranches).not.toHaveBeenCalled();
    expect(Git.listTags).not.toHaveBeenCalled();
  });

  it('should test against branch-2', async () => {
    const filter = new AffectedFilter('branch-*', 'fallback');

    jest.mocked(Git.listBranches).mockResolvedValue(['branch-1', 'branch-2']);

    await expect(filter.test(wks))
      .resolves.toBe(true);

    // Check
    expect(wks.isAffected).toHaveBeenCalledWith('branch-2');
    expect(Git.listBranches).toHaveBeenCalledWith(['branch-*'], expect.objectContaining({ cwd: wks.cwd }));
    expect(Git.listTags).not.toHaveBeenCalled();
  });

  it('should test against tag-2', async () => {
    const filter = new AffectedFilter('tag-*', 'fallback');

    jest.mocked(Git.listBranches).mockResolvedValue([]);
    jest.mocked(Git.listTags).mockResolvedValue(['tag-1', 'tag-2']);

    await expect(filter.test(wks))
      .resolves.toBe(true);

    // Check
    expect(wks.isAffected).toHaveBeenCalledWith('tag-2');
    expect(Git.listBranches).toHaveBeenCalledWith(['tag-*'], expect.objectContaining({ cwd: wks.cwd }));
    expect(Git.listTags).toHaveBeenCalledWith(['tag-*'], expect.objectContaining({ cwd: wks.cwd }));
  });

  it('should test against fallback', async () => {
    const filter = new AffectedFilter('tag-*', 'fallback');

    jest.mocked(Git.listBranches).mockResolvedValue([]);
    jest.mocked(Git.listTags).mockResolvedValue([]);

    await expect(filter.test(wks))
      .resolves.toBe(true);

    // Check
    expect(wks.isAffected).toHaveBeenCalledWith('fallback');
    expect(Git.listBranches).toHaveBeenCalledWith(['tag-*'], expect.objectContaining({ cwd: wks.cwd }));
    expect(Git.listTags).toHaveBeenCalledWith(['tag-*'], expect.objectContaining({ cwd: wks.cwd }));
  });

  it('should use sort arguments', async () => {
    const filter = new AffectedFilter('tag-*', 'fallback', 'v:refname');

    jest.mocked(Git.listBranches).mockResolvedValue([]);
    jest.mocked(Git.listTags).mockResolvedValue(['tag-1', 'tag-2']);

    await expect(filter.test(wks))
      .resolves.toBe(true);

    // Check
    expect(wks.isAffected).toHaveBeenCalledWith('tag-2');
    expect(Git.listBranches).toHaveBeenCalledWith(['--sort', 'v:refname', 'tag-*'], expect.objectContaining({ cwd: wks.cwd }));
    expect(Git.listTags).toHaveBeenCalledWith(['--sort', 'v:refname', 'tag-*'], expect.objectContaining({ cwd: wks.cwd }));
  });
});
