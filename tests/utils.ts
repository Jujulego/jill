import { ILogger } from '@jujulego/tasks';

// Logger
export const spyLogger: ILogger = {
  debug: jest.fn(),
  verbose: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
