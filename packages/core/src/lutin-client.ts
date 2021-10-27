import { ISpawnArgs, ITask, ITaskArgs, TaskFragment } from '@jujulego/jill-lutin';
import { GraphQLClient } from 'graphql-request';
import gql from 'graphql-tag';

// Class
export class LutinClient {
  // Attributes
  private readonly _client = new GraphQLClient('http://localhost:4000');

  // Methods
  async tasks(): Promise<ITask[]> {
    return this._client.request<ITask[]>(gql`
        query Tasks {
            tasks {
                ...Task
            }
        }
        
        ${TaskFragment}
    `);
  }

  async task(args: ITaskArgs): Promise<ITask | null> {
    return this._client.request<ITask | null, ITaskArgs>(gql`
        query Task($id: ID!) {
            task(id: $id) {
                ...Task
            }
        }
        
        ${TaskFragment}
    `, args);
  }

  async spawn(args: ISpawnArgs): Promise<ITask> {
    return this._client.request<ITask, ISpawnArgs>(gql`
        mutation Spawn($cwd: String!, $cmd: String!, $args: [String!]) {
            spawn(cwd: $cwd, cmd: $cmd, args: $args) {
                ...Task
            }
        }
        
        ${TaskFragment}
    `, args);
  }
}