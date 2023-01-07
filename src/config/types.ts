import { cosmiconfig } from 'cosmiconfig';

// Types
export interface IConfig {
  jobs?: number;
  plugins?: string[];
  verbose?: 'info' | 'verbose' | 'debug';
}

export type IConfigExplorer = ReturnType<typeof cosmiconfig>;
