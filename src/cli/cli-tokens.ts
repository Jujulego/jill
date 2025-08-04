import { inject$, token$ } from '@kyrielle/injector';
import { logger$, withTimestamp } from '@kyrielle/logger';
import { ConfigService } from '../config/config.service.js';

export const CliLogger = token$('CliLogger', () => logger$(withTimestamp()));
export const CliConfigService = token$('CliConfigService', () => new ConfigService(inject$(CliLogger)));
