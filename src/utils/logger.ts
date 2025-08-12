import { defineQuickFormat, q$, qarg, qerror, qprop, qwrap } from '@jujulego/quick-tag';
import { type Log, LogLevel, qLogDelay, type WithDelay } from '@kyrielle/logger';
import type { ColorName, ModifierName } from 'chalk';
import { chalkTemplateStderr } from 'chalk-template';
import os from 'node:os';

const LEVEL_COLORS = {
  [LogLevel.debug]: 'grey',
  [LogLevel.verbose]: 'blue',
  [LogLevel.info]: 'reset',
  [LogLevel.warning]: 'yellow',
  [LogLevel.error]: 'red',
} satisfies Record<LogLevel, ColorName | ModifierName>;

const logColor = defineQuickFormat((level: LogLevel) => LEVEL_COLORS[level])(qprop<Log, 'level'>('level'));
export const logFormat = qwrap(chalkTemplateStderr)
  .fun`#?:${qprop('label')}{grey [${q$}]} ?#{${logColor} ${qprop('message')} {grey +${qLogDelay(qarg<WithDelay>())}}#?:${qerror(qprop<Log>('error'))}${os.EOL}${q$}?#}`;
