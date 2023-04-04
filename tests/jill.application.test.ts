import { ContextService } from '@/src/commons/context.service';
import { CURRENT } from '@/src/constants';
import { container } from '@/src/inversify.config';
import { JillApplication } from '@/src/jill.application';

// Setup
let context: ContextService;

beforeAll(() => {
  container.snapshot();
});

beforeEach(() => {
  container.restore();
  container.snapshot();

  context = container.get(ContextService);
});

// Tests
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
