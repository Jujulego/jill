import chalk from 'chalk';

import { consoleFormat } from '@/src/logger.service';

// Setup
chalk.level = 1;

const LEVEL = Symbol.for('level');
const MESSAGE = Symbol.for('message');

// Types
interface Result extends Exclude<ReturnType<typeof consoleFormat['transform']>, boolean> {
  [MESSAGE]: string;
}

// Utils
function assertLogType(log: ReturnType<typeof consoleFormat['transform']>): asserts log is Result {
  expect(log).not.toEqual(expect.any(Boolean));
}

// Tests
describe('consoleFormat', () => {
  it('should add grey label in bracket before message', () => {
    const log = consoleFormat.transform({ [LEVEL]: 'info', level: 'info', message: 'test', label: 'label' });

    assertLogType(log);
    // eslint-disable-next-line quotes
    expect(log[MESSAGE]).toMatchInlineSnapshot(`"[90m[label][39m [37mtest[39m"`);
  });

  it('should add label only on first line', () => {
    const log = consoleFormat.transform({ [LEVEL]: 'info', level: 'info', message: 'test\nmultiline\nlog', label: 'label' });

    assertLogType(log);
    expect(log[MESSAGE]).toMatchInlineSnapshot(`
"[90m[label][39m [37mtest[39m
        [37mmultiline[39m
        [37mlog[39m"
`);
  });
});
