import { token$ } from '@kyrielle/injector';
import { logger$, withTimestamp } from '@kyrielle/logger';
import fs from 'node:fs';
import process from 'node:process';
import { PathScurry } from 'path-scurry';

// Tokens
export const LOGGER = token$('Logger', () => logger$(withTimestamp()));
export const PATH_SCURRY = token$('PathSCurry', () => new PathScurry('/', { fs }));
