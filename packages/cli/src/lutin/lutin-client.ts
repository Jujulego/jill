import { ITask, TaskFragment } from '@jujulego/jill-lutin';
import { GraphQLClient } from 'graphql-request';
import { gql } from 'graphql.macro';

// Class
export class LutinClient {
  // Attributes
  private readonly _endpoint = 'http://localhost:4000/graphql';
  private readonly _qclient = new GraphQLClient(this._endpoint);

  // Methods>
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
}