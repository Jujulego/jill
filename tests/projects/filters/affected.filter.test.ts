import { GitService } from '@/src/services/git.service.js';
import { isAffected$ } from '@/src/projects/filters/is-affected.js';
import { type Workspace } from '@/src/projects/workspace.js';
import { CONFIG } from '@/src/tokens.js';
import { TestBed } from '@/tools/test-bed.js';
import { globalScope$, inject$ } from '@kyrielle/injector';
import { asyncIterator$, collect$, pipe$, waitFor$ } from 'kyrielle';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Setup
let bed: TestBed;
let wks: Workspace;
let git: GitService;

beforeEach(() => {
  vi.restoreAllMocks();

  // Setup config
  globalScope$().set(CONFIG, Promise.resolve({ jobs: 1, hooks: true }));

  // Workspaces
  bed = new TestBed();
  wks = bed.addWorkspace('wks');

  // Mocks
  vi.restoreAllMocks();

  git = inject$(GitService);
  vi.spyOn(git, 'listBranches');
  vi.spyOn(git, 'listTags');

  vi.spyOn(wks, 'isAffected').mockResolvedValue(true);
});

afterEach(() => {
  globalScope$().clear();
});

// Test suites
describe('isAffected$', () => {
  it('should test against format', async () => {
    const filtered = pipe$(
      asyncIterator$([wks]),
      isAffected$({ format: 'revision', fallback: 'fallback' }),
      collect$()
    );

    await expect(waitFor$(filtered)).resolves.toStrictEqual([wks]);

    // Check
    expect(wks.isAffected).toHaveBeenCalledWith('revision');
    expect(git.listBranches).not.toHaveBeenCalled();
    expect(git.listTags).not.toHaveBeenCalled();
  });

  it('should test against env-wks', async () => {
    const filtered = pipe$(
      asyncIterator$([wks]),
      isAffected$({ format: 'env-%name', fallback: 'fallback' }),
      collect$()
    );

    await expect(waitFor$(filtered)).resolves.toStrictEqual([wks]);

    // Check
    expect(wks.isAffected).toHaveBeenCalledWith('env-wks');
    expect(git.listBranches).not.toHaveBeenCalled();
    expect(git.listTags).not.toHaveBeenCalled();
  });

  it('should test against env-%name', async () => {
    const filtered = pipe$(
      asyncIterator$([wks]),
      isAffected$({ format: 'env-\\%name', fallback: 'fallback' }),
      collect$()
    );

    await expect(waitFor$(filtered)).resolves.toStrictEqual([wks]);

    // Check
    expect(wks.isAffected).toHaveBeenCalledWith('env-%name');
    expect(git.listBranches).not.toHaveBeenCalled();
    expect(git.listTags).not.toHaveBeenCalled();
  });

  it('should test against env-\\wks', async () => {
    const filtered = pipe$(
      asyncIterator$([wks]),
      isAffected$({ format: 'env-\\\\%name', fallback: 'fallback' }),
      collect$()
    );

    await expect(waitFor$(filtered)).resolves.toStrictEqual([wks]);

    // Check
    expect(wks.isAffected).toHaveBeenCalledWith('env-\\wks');
    expect(git.listBranches).not.toHaveBeenCalled();
    expect(git.listTags).not.toHaveBeenCalled();
  });

  it('should test against branch-2', async () => {
    vi.mocked(git.listBranches).mockResolvedValue(['branch-1', 'branch-2']);

    const filtered = pipe$(
      asyncIterator$([wks]),
      isAffected$({ format: 'branch-*', fallback: 'fallback' }),
      collect$()
    );

    await expect(waitFor$(filtered)).resolves.toStrictEqual([wks]);

    // Check
    expect(wks.isAffected).toHaveBeenCalledWith('branch-2');
    expect(git.listBranches).toHaveBeenCalledWith(['branch-*'], expect.objectContaining({ cwd: wks.root }));
    expect(git.listTags).not.toHaveBeenCalled();
  });

  it('should test against tag-2', async () => {
    vi.mocked(git.listBranches).mockResolvedValue([]);
    vi.mocked(git.listTags).mockResolvedValue(['tag-1', 'tag-2']);

    const filtered = pipe$(
      asyncIterator$([wks]),
      isAffected$({ format: 'tag-*', fallback: 'fallback' }),
      collect$()
    );

    await expect(waitFor$(filtered)).resolves.toStrictEqual([wks]);

    // Check
    expect(wks.isAffected).toHaveBeenCalledWith('tag-2');
    expect(git.listBranches).toHaveBeenCalledWith(['tag-*'], expect.objectContaining({ cwd: wks.root }));
    expect(git.listTags).toHaveBeenCalledWith(['tag-*'], expect.objectContaining({ cwd: wks.root }));
  });

  it('should test against fallback', async () => {
    vi.mocked(git.listBranches).mockResolvedValue([]);
    vi.mocked(git.listTags).mockResolvedValue([]);

    const filtered = pipe$(
      asyncIterator$([wks]),
      isAffected$({ format: 'tag-*', fallback: 'fallback' }),
      collect$()
    );

    await expect(waitFor$(filtered)).resolves.toStrictEqual([wks]);

    // Check
    expect(wks.isAffected).toHaveBeenCalledWith('fallback');
    expect(git.listBranches).toHaveBeenCalledWith(['tag-*'], expect.objectContaining({ cwd: wks.root }));
    expect(git.listTags).toHaveBeenCalledWith(['tag-*'], expect.objectContaining({ cwd: wks.root }));
  });

  it('should use sort arguments', async () => {
    vi.mocked(git.listBranches).mockResolvedValue([]);
    vi.mocked(git.listTags).mockResolvedValue(['tag-1', 'tag-2']);

    const filtered = pipe$(
      asyncIterator$([wks]),
      isAffected$({ format: 'tag-*', fallback: 'fallback', sort: 'v:refname' }),
      collect$()
    );

    await expect(waitFor$(filtered)).resolves.toStrictEqual([wks]);

    // Check
    expect(wks.isAffected).toHaveBeenCalledWith('tag-2');
    expect(git.listBranches).toHaveBeenCalledWith(['--sort', 'v:refname', 'tag-*'], expect.objectContaining({ cwd: wks.root }));
    expect(git.listTags).toHaveBeenCalledWith(['--sort', 'v:refname', 'tag-*'], expect.objectContaining({ cwd: wks.root }));
  });
});
