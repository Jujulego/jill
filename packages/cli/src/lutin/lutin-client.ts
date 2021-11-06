import { Project } from '@jujulego/jill-core';
import { ISpawnArgs, ITask, TaskFragment } from '@jujulego/jill-lutin';
import { fork } from 'child_process';
import { GraphQLClient } from 'graphql-request';
import { gql } from 'graphql.macro';
import path from 'path';

import { logger } from '../logger';

// Types
type ILog = Record<string, unknown> & {
  // Attributes
  level: string;
  message: string;
};

// Class
export class LutinClient {
  // Attributes
  private readonly _endpoint = 'http://localhost:5001/graphql';
  private readonly _qclient = new GraphQLClient(this._endpoint);

  // Methods
  start(project: Project): Promise<boolean> {
    const child = fork(path.resolve(__dirname, './lutin.process'), [], {
      cwd: project.root,
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
    return new Promise<boolean>((resolve, reject) => {
      child.on('message', (msg: 'started' | Error) => {
        if (msg === 'started') {
          resolve(true);
        } else {
          reject(msg);
        }
      });

      child.on('close', (code) => {
        resolve(code === 0);
      });

      child.send('start');
    });
  }

  async tasks(): Promise<ITask[]> {
    const { tasks } = await this._qclient.request<{ tasks: ITask[] }>(gql`
      query Tasks {
          tasks {
              ...Task
          }
      }
      
      ${TaskFragment}
    `);

    return tasks;
  }

  async spawn(cwd: string, cmd: string, args: string[] = []): Promise<ITask> {
    const { spawn } = await this._qclient.request<{ spawn: ITask }, ISpawnArgs>(gql`
      mutation Spawn($cwd: String!, $cmd: String!, $args: [String!]!) {
          spawn(cwd: $cwd, cmd: $cmd, args: $args) {
              ...Task
          }
      }

      ${TaskFragment}
    `, { cwd, cmd, args });

    return spawn;
  }

  async kill(id: string): Promise<ITask | undefined> {
    const { kill } = await this._qclient.request<{ kill: ITask | undefined }>(gql`
      mutation Spawn($id: ID!) {
          kill(id: $id) {
              ...Task
          }
      }

      ${TaskFragment}
    `, { id });

    return kill;
  }
}