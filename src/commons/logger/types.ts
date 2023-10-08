import { Log as BaseLog, LogLabel, WithTimestamp } from '@jujulego/logger';

// Types
export type JillLog = WithTimestamp<BaseLog> & Partial<LogLabel>;
