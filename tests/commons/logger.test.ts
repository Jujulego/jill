import { Logger } from '@jujulego/logger';
import { vi } from 'vitest';

import { container } from '@/src/inversify.config.js';
import { LogGateway } from '@/src/commons/logger/log.gateway.js';

beforeAll(() => {
  container.snapshot();
});

beforeEach(() => {
  container.restore();
  container.snapshot();
});

// Tests
describe('Logger', () => {
  it('should create logger with Console transport', () => {
    const gateway = container.get(LogGateway);
    vi.spyOn(gateway, 'connect');

    const logger = container.get(Logger);

    expect(gateway.connect).toHaveBeenCalledWith(logger);
  });
});
