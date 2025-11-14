import { inject$ } from '@kyrielle/injector';
import type { LogLevelKey } from '@kyrielle/logger';
import { logDelay$, LogGateway, LogLevel, toStderr } from '@kyrielle/logger';
import { startSpan } from '@sentry/node';
import { filter$, flow$ } from 'kyrielle';
import type { Argv } from 'yargs';
import { LOGGER } from '../tokens.js';
import { logFormat } from '../utils/logger.js';

/**
 * Adds logger related arguments.
 */
export function withLogger<T>(parser: Argv<T>) {
  return parser
    .option('verbose', {
      alias: 'v',
      default: 'info',
      type: 'count',
      description: 'Set verbosity level',
      coerce: (cnt: number) => VERBOSITY_LEVEL[Math.min(cnt, 2)]
    })
    .middleware((args) => startSpan({ name: 'logger', op: 'cli.middleware' }, () => {
      const logLevel = args.verbose ? LogLevel[args.verbose] : LogLevel.info;
      const logGateway = inject$(LogGateway);

      flow$(
        inject$(LOGGER),
        filter$((log) => log.level >= logLevel),
        logDelay$(),
        logGateway,
      );

      logGateway.connect('console', toStderr(logFormat));
    }));
}

// Utils
const VERBOSITY_LEVEL: Record<number, LogLevelKey> = {
  1: 'verbose',
  2: 'debug',
};

// Types
export interface LoggerArgs {
  readonly verbose: LogLevelKey;
}
