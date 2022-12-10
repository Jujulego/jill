import { ILogger } from '@jujulego/tasks';

// Logger
export const spyLogger: ILogger = {
  debug: jest.fn(),
  verbose: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Utils
export function flushPromises(timeout = 0): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, timeout));
}
