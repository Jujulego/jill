import { logger, Project, Workspace } from '@jujulego/jill-core';
import { Repeater } from '@repeaterjs/repeater';
import { fork } from 'child_process';
import { DocumentNode, print } from 'graphql';
import { GraphQLClient } from 'graphql-request';
import { createClient } from 'graphql-ws';
import gql from 'graphql-tag';
import path from 'path';
import WebSocket from 'ws';

import { ISpawnTaskArgs, IWatchTask, WatchTaskFragment } from './common';

// Types
type ILog = Record<string, unknown> & {
  // Attributes
  level: string;
  message: string;
};

// Class
export class MyrClient {
  // Attributes
  private readonly _logger = logger.child({ context: MyrClient.name });
  private readonly _endpoint = 'http://localhost:5001/graphql';
  private readonly _qclient = new GraphQLClient(this._endpoint);
  private readonly _sclient = createClient({
    url: this._endpoint.replace(/^http/, 'ws'),
    webSocketImpl: WebSocket,
    lazy: true
  });

  // Constructor
  constructor(
    readonly project: Project,
  ) {}

  // Methods
  protected async _autoStart<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (error.code !== 'ECONNREFUSED') throw error;

      // Start myr if connection impossible
      this._logger.verbose('Unable to connect to myr server, trying to start it');
      await this.start();

      // Retry
      return await fn();
    }
  }

  protected _subscription<T>(query: DocumentNode, variables: Record<string, unknown>): Repeater<T> {
    return new Repeater<T>((push, stop) => {
      this._sclient.subscribe<T>({ query: print(query), variables }, {
        next(value) {
          push(value.data!).then();
        },
        error(error) {
          stop(error);
        },
        complete() {
          stop();
        }
      });
    });
  }

  start(): Promise<void> {
    const child = fork(path.resolve(__dirname, './myr.process'), [], {
      cwd: this.project.root,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    });

    // Transmit logs to logger
    child.stdout?.on('data', (msg: Buffer) => {
      for (const line of msg.toString('utf-8').split('\n')) {
        if (!line) continue;

        const { level, message, ...meta } = JSON.parse(line) as ILog;
        logger.log(level, message, meta);
      }
    });

    child.stderr?.on('data', (msg: Buffer) => {
      logger.error(msg.toString('utf-8'));
    });

    // Start server
    return new Promise<void>((resolve, reject) => {
      child.on('message', (msg: 'started' | Error) => {
        if (msg === 'started') {
          resolve();
        } else {
          reject(msg);
        }
      });

      child.on('close', (code, signal) => {
        reject(new Error(`Myr process ended with code ${code} by signal ${signal}`));
      });

      child.send('start');
    });
  }

  async stop(): Promise<boolean> {
    try {
      await this._qclient.request(gql`
        mutation Shutdown {
            shutdown
        }
    `);

      return true;
    } catch (error) {
      if (error.code !== 'ECONNREFUSED') throw error;

      return false;
    }
  }

  async tasks(): Promise<IWatchTask[]> {
    return await this._autoStart(async () => {
      const { tasks } = await this._qclient.request<{ tasks: IWatchTask[] }>(gql`
          query Tasks {
              tasks {
                  ...WatchTask
              }
          }

          ${WatchTaskFragment}
      `);

      return tasks;
    });
  }

  async spawn(cwd: string, cmd: string, args: string[] = [], opts?: Omit<ISpawnTaskArgs, 'cwd' | 'cmd' | 'args'>): Promise<Omit<IWatchTask, 'watchOn'>> {
    return await this._autoStart(async () => {
      const { spawn } = await this._qclient.request<{ spawn: Omit<IWatchTask, 'watchOn'> }, ISpawnTaskArgs>(gql`
          mutation Spawn($cwd: String!, $cmd: String!, $args: [String!]!, $mode: SpawnTaskMode, $watchOn: [ID!]) {
              spawn(cwd: $cwd, cmd: $cmd, args: $args, mode: $mode, watchOn: $watchOn) {
                  ...WatchTask
              }
          }

          ${WatchTaskFragment}
      `, { cwd, cmd, args, ...opts });

      return spawn;
    });
  }

  async spawnScript(wks: Workspace, script: string, args: string[] = [], opts?: Omit<ISpawnTaskArgs, 'cwd' | 'cmd' | 'args'>): Promise<Omit<IWatchTask, 'watchOn'>> {
    return await this.spawn(wks.cwd, await wks.project.packageManager(), ['run', script, ...args], opts);
  }

  async logs(): Promise<any[]> {
    try {
      const res = await this._qclient.request<{ logs: any[] }>(gql`
          query Logs {
              logs
          }
      `);

      return res.logs;
    } catch (error) {
      if (error.code !== 'ECONNREFUSED') throw error;

      return [];
    }
  }

  async* logs$(): AsyncGenerator<any> {
    try {
      for await (const { log } of this._subscription<{ log: any }>(gql`subscription Logs { log }`, {})) {
        yield log;
      }
    } catch (error) {
      if (error.code !== 'ECONNREFUSED') throw error;

      return;
    }
  }

  async kill(id: string): Promise<IWatchTask | undefined> {
    return await this._autoStart(async () => {
      const { kill } = await this._qclient.request<{ kill: IWatchTask | undefined }>(gql`
          mutation Kill($id: ID!) {
              kill(id: $id) {
                  ...WatchTask
              }
          }

          ${WatchTaskFragment}
      `, { id });

      return kill;
    });
  }
}
