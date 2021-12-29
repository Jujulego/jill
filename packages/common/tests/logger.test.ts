import chalk from 'chalk';

import { mockedOra } from '../mocks/ora';
import { OraTransport } from '../src';

// Setup
chalk.level = 1;

const MESSAGE = Symbol.for('message');

beforeEach(() => {
  jest.restoreAllMocks();

  // Mocks
  jest.spyOn(process.stderr, 'write')
    .mockImplementation(() => true);
});

// Test suites
describe('OraTransport', () => {
  let transport: OraTransport;

  beforeEach(() => {
    transport = new OraTransport();
  });

  // Tests
  describe('OraTransport.log', () => {
    it('should print message to stderr', () => {
      transport.log({ [MESSAGE]: 'test' }, () => undefined);

      // Checks
      expect(process.stderr.write).toHaveBeenCalledWith('test\n');
    });

    it('should keep ora spinning', () => {
      mockedOra.isSpinning = true;
      mockedOra.text = 'testing ...';
      jest.spyOn(mockedOra, 'start');

      transport.log({ [MESSAGE]: 'test' }, () => undefined);

      // Checks
      expect(process.stderr.write).toHaveBeenCalledWith('test\n');

      expect(mockedOra.isSpinning).toBe(true);
      expect(mockedOra.text).toBe('testing ...');
    });
  });
});
