import { ContextService } from '@/src/commons/context.service';
import { CURRENT } from '@/src/constants';
import { CorePlugin } from '@/src/core.plugin';
import { container } from '@/src/inversify.config';
import { JillApplication } from '@/src/jill.application';
import { getModule } from '@/src/modules/module';
import { PluginLoaderService } from '@/src/modules/plugin-loader.service';

// Mocks
jest.mock('@/src/modules/module', () => {
  const actual = jest.requireActual('@/src/modules/module');

  return {
    ...actual,
    getModule: jest.fn(actual.getModule),
  };
});

// Setup
let application: JillApplication;
let context: ContextService;
let plugins: PluginLoaderService;

beforeAll(() => {
  container.snapshot();
});

beforeEach(() => {
  container.restore();
  container.snapshot();

  application = container.get(JillApplication);
  context = container.get(ContextService);
  plugins = container.get(PluginLoaderService);

  jest.spyOn(application.parser, 'parse').mockImplementation();
  jest.spyOn(plugins, 'loadPlugins').mockResolvedValue();
});

// Tests
describe('JillApplication.run', () => {
  it('should load plugins and run command', async () => {
    await application.run('jill --help');

    expect(getModule).toHaveBeenCalledWith(CorePlugin, true);
    expect(plugins.loadPlugins).toHaveBeenCalledWith(application.container);

    expect(application.parser.parse).toHaveBeenCalledWith('jill --help');
  });

  it('should set application in context', async () => {
    await application.run('jill --help');

    expect(context.application).toBe(application);
  });
});

describe('JillApplication CURRENT binding', () => {
  it('should return application from context', () => {
    // Set project in context
    const application = container.get(JillApplication);
    context.reset({ application });

    // Use binding
    expect(container.getNamed(JillApplication, CURRENT)).toBe(application);
  });

  it('should throw if application miss in context', () => {
    // Set project in context
    context.reset();

    // Use binding
    expect(() => container.getNamed(JillApplication, CURRENT))
      .toThrow(new Error('Cannot inject current application, it not yet defined'));
  });
});
