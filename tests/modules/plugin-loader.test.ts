import { container } from '@/src/inversify.config';
import { PluginLoaderService } from '@/src/modules/plugin-loader.service';
import { dynamicImport } from '@/src/utils/import';
import { CONFIG } from '@/src/config/config-loader';
import { Command, type ICommand } from '@/src/modules/command';
import { Plugin } from '@/src/modules/plugin';

// Mocks
jest.mock('@/src/utils/import');

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
    jest.mocked(dynamicImport).mockResolvedValue({
      default: TestPlugin,
    });

    // Call
    await expect(service.loadPlugins())
      .resolves.toBeUndefined();

    // TestCommand should now be loaded
    expect(container.isBound(TestCommand)).toBe(true);
  });

  it('should fail to import plugin (no default export)', async () => {
    jest.mocked(dynamicImport).mockResolvedValue({
      default: null,
    });

    // Call
    await expect(service.loadPlugins())
      .rejects.toEqual(new Error('Invalid plugin ./plugin.js: no plugin class found'));

    // TestCommand should now be loaded
    expect(container.isBound(TestCommand)).toBe(false);
  });

  it('should fail to import plugin (invalid plugin)', async () => {
    jest.mocked(dynamicImport).mockResolvedValue({
      default: class Test {},
    });

    // Call
    await expect(service.loadPlugins())
      .rejects.toEqual(new Error('Invalid plugin ./plugin.js: invalid plugin class'));

    // TestCommand should now be loaded
    expect(container.isBound(TestCommand)).toBe(false);
  });
});
