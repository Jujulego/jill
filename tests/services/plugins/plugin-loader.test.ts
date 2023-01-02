import yargs from 'yargs';

import { CONFIG } from '@/src/services/config/loader';
import { container } from '@/src/services/inversify.config';
import { PluginLoaderService } from '@/src/services/plugins/plugin-loader.service';
import { dynamicImport } from '@/src/utils/import';

// Mocks
jest.mock('../../../src/utils/import');

// Setup
let service: PluginLoaderService;

beforeEach(async () => {
  container.snapshot();

  container.rebind(CONFIG).toConstantValue({
    plugins: ['test']
  });
  service = await container.getAsync(PluginLoaderService);
});

afterEach(() => {
  container.restore();
});

// Tests
describe('PluginLoaderService', () => {
  it('should import and build plugins', async () => {
    // Mock plugin import
    const plugin = { builder: jest.fn() };
    jest.mocked(dynamicImport).mockResolvedValue({ default: plugin });

    // Load it !
    await service.loadPlugins(yargs);

    expect(dynamicImport).toHaveBeenCalledWith('test');
    expect(plugin.builder).toHaveBeenCalledWith(yargs);
  });

  it('should import bundled plugin', async () => {
    // Mock plugin import
    const plugin = { builder: jest.fn() };
    jest.mocked(dynamicImport).mockResolvedValue({ default: { default: plugin } });

    // Load it !
    await service.loadPlugins(yargs);

    expect(dynamicImport).toHaveBeenCalledWith('test');
    expect(plugin.builder).toHaveBeenCalledWith(yargs);
  });
});
