import { token$ } from '@kyrielle/injector';
import { logger$, withTimestamp } from '@kyrielle/logger';
import process from 'node:process';
import { PathScurry as _PathScurry } from 'path-scurry';

// Tokens
export const Logger = token$('Logger', () => logger$(withTimestamp()));
export const PathScurry = token$('PathSCurry', () => new _PathScurry(process.cwd()));
