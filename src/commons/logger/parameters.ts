import { type interfaces as int } from 'inversify';

import { container } from '@/src/inversify.config.js';

// Constants
export const LOG_BROADCAST_CHANNEL: int.ServiceIdentifier<string> = Symbol.for('jujulego:jill:log-broadcast-channel');

// Parameters
container.bind(LOG_BROADCAST_CHANNEL).toConstantValue('jujulego:jill:logger');
