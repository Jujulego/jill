import { token$ } from '@kyrielle/injector';
import { logger$, withTimestamp } from '@kyrielle/logger';

export const Logger = token$('Logger', () => logger$(withTimestamp()));
