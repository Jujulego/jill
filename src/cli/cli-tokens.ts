import { token$ } from '@kyrielle/injector';
import { logger$, withTimestamp } from '@kyrielle/logger';

export const CliLogger = token$('CliLogger', () => logger$(withTimestamp()));
