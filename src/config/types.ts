import { type cosmiconfig } from 'cosmiconfig';

// Types
export interface IConfig {
  jobs?: number;
  hooks?: boolean;
  plugins?: string[];
  verbose?: 'info' | 'verbose' | 'debug';
}

export type IConfigExplorer = ReturnType<typeof cosmiconfig>;
