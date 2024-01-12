import { vi } from 'vitest';

import '@/src/commons/logger.service.js';
import { container } from '@/src/inversify.config.js';
import { PluginLoaderService } from '@/src/modules/plugin-loader.service.js';
import { dynamicImport } from '@/src/utils/import.js';
import { CONFIG } from '@/src/config/config-loader.js';
import { Command, type ICommand } from '@/src/modules/command.js';
import { Plugin } from '@/src/modules/plugin.js';

// Mocks
vi.mock('@/src/utils/import', async (importOriginal) => {
  const mod: typeof import('@/src/utils/import.ts') = await importOriginal();

  return {
    ...mod,
    dynamicImport: vi.fn(mod.dynamicImport),
  };
});

// Utils
@Command({
  command: 'test',
  describe: 'test',
})
class TestCommand implements ICommand {
  // Methods
  builder = vi.fn((parser) => parser);
  handler = vi.fn();
}

@Plugin({
  commands: [TestCommand]
})
class TestPlugin {}

// Setup
let service: PluginLoaderService;

beforeEach(() => {
  container.snapshot();
  container.rebind(CONFIG).toConstantValue({
    plugins: ['./plugin.js']
  });

  service = container.get(PluginLoaderService);
});

afterEach(() => {
  container.restore();
});

// Tests
describe('PluginLoaderService.loadPlugins', () => {
  it('should import plugin from config', async () => {
    vi.mocked(dynamicImport).mockResolvedValue({
      default: TestPlugin,
    });

    // Call
    await expect(service.loadPlugins())
      .resolves.toBeUndefined();

    // TestCommand should now be loaded
    expect(container.isBound(TestCommand)).toBe(true);
  });

  it('should fail to import plugin (no default export)', async () => {
    vi.mocked(dynamicImport).mockResolvedValue({
      default: null,
    });

    // Call
    await expect(service.loadPlugins())
      .rejects.toEqual(new Error('Invalid plugin ./plugin.js: no plugin class found'));

    // TestCommand should now be loaded
    expect(container.isBound(TestCommand)).toBe(false);
  });

  it('should fail to import plugin (invalid plugin)', async () => {
    vi.mocked(dynamicImport).mockResolvedValue({
      default: class Test {},
    });

    // Call
    await expect(service.loadPlugins())
      .rejects.toEqual(new Error('Invalid plugin ./plugin.js: invalid plugin class'));

    // TestCommand should now be loaded
    expect(container.isBound(TestCommand)).toBe(false);
  });
});
